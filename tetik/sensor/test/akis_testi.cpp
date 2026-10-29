// HISAR TETIK - sensor veri akisi testi (bilgisayarda calisir)
//
// Sensor yazilimindaki gercek protokol kodunu (HisarProtocol.h) kullanarak
// zor durumlari dener: zayif baglanti (geri basinc), kisa ve uzun kopmalar,
// kucuk MTU, gec gelen devam istegi, sensorun yeniden baslamasi.
// Her senaryo icin "uygulama" tarafinda kayip / yineleme / sira hatasi sayilir.
// Ayrica paket akislarini dosyaya yazar; uygulamanin ayristiricisi ayni
// dosyalarla ayrica test edilir (tetik/test/protokol_testi.js).
//
// Derleme:  g++ -std=c++17 -O2 -Wall -Wextra -I../HisarSensor akis_testi.cpp -o akis_testi
// Calistir: ./akis_testi [cikti_klasoru]
#include "HisarProtocol.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include <random>
#include <functional>

using namespace hisar;

static int failures = 0;
#define CHECK(cond, ...) do { if (!(cond)) { failures++; std::printf("  HATA: " __VA_ARGS__); std::printf("\n"); } } while (0)

// Sira numarasindan belirlenebilir olcum degerleri (uygulama testi de ayni formulu kullanir)
static Sample sampleFor(uint32_t seq) {
  Sample s;
  for (int i = 0; i < 6; i++) s.v[i] = (int16_t)((int32_t)((seq * 37u + (uint32_t)i * 5003u) % 60000u) - 30000);
  s.jerk = (uint8_t)((seq * 13u) % 251u);
  s.snd = (uint8_t)((seq * 7u) % 254u);
  return s;
}

struct Notif { uint32_t t; std::vector<uint8_t> b; };

struct AppSide {          // uygulamanin gordugu
  int64_t last = -1;
  uint64_t got = 0, lost = 0, dup = 0, badValue = 0, reboots = 0, sndPk = 0, plainPk = 0;
  void onPacket(const uint8_t* p, size_t n) {
    if (n < 7 || p[0] != 0x55 || (p[1] != 0x66 && p[1] != 0x68)) return;
    const bool snd = p[1] == 0x68;
    const int sb = snd ? SAMPLE_BYTES_S : SAMPLE_BYTES;
    if (snd) sndPk++; else plainPk++;
    int k = p[2];
    uint32_t seq = (uint32_t)p[3] | ((uint32_t)p[4] << 8) | ((uint32_t)p[5] << 16) | ((uint32_t)p[6] << 24);
    if (n != (size_t)(HDR_BYTES + k * sb)) { badValue++; return; }
    for (int j = 0; j < k; j++) {
      int64_t s = (int64_t)seq + j;
      const uint8_t* q = p + HDR_BYTES + j * sb;
      Sample e = sampleFor((uint32_t)s);
      for (int i = 0; i < 6; i++) { int16_t v = (int16_t)(q[i * 2] | (q[i * 2 + 1] << 8)); if (v != e.v[i]) badValue++; }
      if (q[12] != e.jerk) badValue++;
      if (snd && q[13] != e.snd) badValue++;
      if (last >= 0 && s + (int64_t)RING < last) { last = -1; reboots++; }   // tampondan buyuk geri sicrama: yeniden baslama
      if (last >= 0 && s <= last) { dup++; continue; }
      if (last >= 0 && s > last + 1) lost += (uint64_t)(s - last - 1);
      last = s; got++;
    }
  }
};

struct Scenario {
  std::string name;
  int mtu = 185;
  uint32_t durationMs = 12000;
  std::function<bool(uint32_t)> linkUp = [](uint32_t) { return true; };
  std::function<bool(uint32_t, std::mt19937&)> canSend = [](uint32_t, std::mt19937&) { return true; };
  bool resumeOnReconnect = true;     // uygulama devam istegini abone olmadan once yazar
  int  lateRequestMs = -1;           // >=0 ise istek abonelikten bu kadar sonra gelir
  bool rebootAt = false;             // kopma sirasinda sensor yeniden baslar
  uint32_t rebootMs = 0;
  bool sound = false;                // uygulama sesli paket ister (surum 3)
  bool oldApp = false;               // eski uygulama: 6 baytlik istek (bayrak yok)
};

struct Result { uint64_t produced = 0; AppSide app; uint64_t overflow = 0; size_t packets = 0; double avgK = 0; int maxK = 0; };

static Result run(const Scenario& sc, const char* outDir) {
  static Ring ring;   // buyuk: statik
  ring.head = 0;
  Stream st;
  Result r;
  std::mt19937 rng(12345);
  std::vector<Notif> log;
  bool wasUp = false;
  uint32_t upSince = 0;
  bool requestPending = false;
  int64_t lastAtDown = -1;
  int bootCounter = 0, appBoot = 0;
  uint64_t sumK = 0;
  uint32_t produced = 0;
  for (uint32_t t = 0; t <= sc.durationMs; t++) {
    if (sc.rebootAt && t == sc.rebootMs) { ring.head = 0; produced = 0; st = Stream(); bootCounter++; }
    if (t % 5 == 0) { ring.push(sampleFor(produced)); produced++; r.produced++; }
    bool up = sc.linkUp(t);
    if (up && !wasUp) {                       // yeniden baglanti: uygulama once istegi yazar
      upSince = t;
      // Sensor, akis baslamadan once durum paketini (acilis numarasi ile) gonderir;
      // uygulama numara degistiyse akisi sifirlar (yeniden baslama)
      if (appBoot != bootCounter) { appBoot = bootCounter; r.app.last = -1; r.app.reboots++; }
      {   // sensor, akistan once durum paketini gonderir (acilis numarasi ile)
        StatusInfo si; si.bat = 80; si.imuOk = true; si.fw = 2; si.rssi = -60; si.tempC = 30; si.mv = 4000;
        si.head = ring.head; si.bootId = (uint16_t)(0x1000 + bootCounter); si.mtu = (uint16_t)sc.mtu; si.itv = 24;
        si.fw = sc.sound ? 3 : 2; si.micOk = sc.sound;
        uint8_t b[3 + STATUS_LEN]; size_t n = buildStatus(b, si);
        log.push_back({t, std::vector<uint8_t>(b, b + n)});
      }
      const uint8_t fl = sc.sound && !sc.oldApp ? 1 : 0;
      if (sc.lateRequestMs < 0) {
        if (sc.resumeOnReconnect && r.app.last >= 0) st.request(1, (uint32_t)(r.app.last + 1), t, fl);
        else st.request(0, 0, t, fl);
      } else requestPending = true;
    }
    if (!up && wasUp) { st.onDisconnect(); lastAtDown = r.app.last; }
    wasUp = up;
    if (up && requestPending && t - upSince >= (uint32_t)sc.lateRequestMs) {
      requestPending = false;
      if (lastAtDown >= 0) st.request(1, (uint32_t)(lastAtDown + 1), t, sc.sound ? 1 : 0);   // kopma anindaki son olcumden devam
    }
    if (t % 2 == 0) {                          // ana dongu ~2 ms
      st.service(ring, up, sc.mtu, t, [&](const uint8_t* p, size_t n) {
        if (!sc.canSend(t, rng)) return false;
        r.app.onPacket(p, n);
        log.push_back({t, std::vector<uint8_t>(p, p + n)});
        int k = p[2]; sumK += (uint64_t)k; if (k > r.maxK) r.maxK = k;
        return true;
      });
    }
  }
  r.overflow = st.overflow;
  r.packets = log.size();
  r.avgK = log.empty() ? 0 : (double)sumK / (double)log.size();
  if (outDir) {
    std::string jp = std::string(outDir) + "/" + sc.name + ".json";
    FILE* jf = std::fopen(jp.c_str(), "w");
    if (jf) {
      std::fprintf(jf, "{\"produced\":%llu,\"got\":%llu,\"lost\":%llu,\"dup\":%llu,\"reboots\":%llu,\"mtu\":%d,\"sndPk\":%llu,\"plainPk\":%llu}\n",
                   (unsigned long long)r.produced, (unsigned long long)r.app.got, (unsigned long long)r.app.lost,
                   (unsigned long long)r.app.dup, (unsigned long long)r.app.reboots, sc.mtu,
                   (unsigned long long)r.app.sndPk, (unsigned long long)r.app.plainPk);
      std::fclose(jf);
    }
    std::string path = std::string(outDir) + "/" + sc.name + ".bin";
    FILE* f = std::fopen(path.c_str(), "wb");
    if (f) {
      for (auto& n : log) {
        uint8_t h[6] = {(uint8_t)(n.t & 255), (uint8_t)((n.t >> 8) & 255), (uint8_t)((n.t >> 16) & 255), (uint8_t)(n.t >> 24),
                        (uint8_t)(n.b.size() & 255), (uint8_t)(n.b.size() >> 8)};
        std::fwrite(h, 1, 6, f);
        std::fwrite(n.b.data(), 1, n.b.size(), f);
      }
      std::fclose(f);
    }
  }
  return r;
}

static void report(const char* name, const Result& r) {
  std::printf("%-12s uretilen %6llu  alinan %6llu  kayip %5llu  yineleme %4llu  hatali %llu  tasma %llu  paket %5zu  ort.olcum/paket %.2f (en cok %d)  sesli %llu\n",
              name, (unsigned long long)r.produced, (unsigned long long)r.app.got, (unsigned long long)r.app.lost,
              (unsigned long long)r.app.dup, (unsigned long long)r.app.badValue, (unsigned long long)r.overflow, r.packets, r.avgK, r.maxK,
              (unsigned long long)r.app.sndPk);
}

static void testCommands() {
  std::printf("komutlar\n");
  { uint8_t d[] = {0x01, 0x09, 0x60, 22}; Command c = parseCommand(d, 4); CHECK(c.type == Command::TONE && c.freq == 2400 && c.ms == 220, "bip"); }
  { uint8_t d[] = {0x01, 0x09}; Command c = parseCommand(d, 2); CHECK(c.type == Command::NONE, "kisa bip reddedilmeli"); }
  { uint8_t d[] = {0x02, 3, 70}; Command c = parseCommand(d, 3); CHECK(c.type == Command::SET && c.key == 3 && c.val == 70, "ayar"); }
  { uint8_t d[] = {0x03}; CHECK(parseCommand(d, 1).type == Command::IDENTIFY, "bul"); }
  { uint8_t d[] = {0x04}; CHECK(parseCommand(d, 1).type == Command::RESTART, "yeniden baslat"); }
  { uint8_t d[] = {0x05}; CHECK(parseCommand(d, 1).type == Command::POWEROFF, "kapat"); }
  { uint8_t d[] = {0x06}; CHECK(parseCommand(d, 1).type == Command::STATUS, "durum"); }
  { uint8_t d[] = {0x07, 1, 0x78, 0x56, 0x34, 0x12}; Command c = parseCommand(d, 6); CHECK(c.type == Command::START && c.mode == 1 && c.seq == 0x12345678u, "devam"); }
  { uint8_t d[] = {0x07, 0}; Command c = parseCommand(d, 2); CHECK(c.type == Command::START && c.mode == 0 && c.flags == 0, "canli"); }
  { uint8_t d[] = {0x07, 1, 0x78, 0x56, 0x34, 0x12, 1}; Command c = parseCommand(d, 7); CHECK(c.type == Command::START && c.mode == 1 && c.seq == 0x12345678u && c.flags == 1, "devam + ses istegi"); }
  { uint8_t d[] = {0x07, 0, 0, 0, 0, 0}; Command c = parseCommand(d, 6); CHECK(c.flags == 0, "eski uygulama: ses istegi yok"); }
  { uint8_t d[] = {0x99}; CHECK(parseCommand(d, 1).type == Command::NONE, "bilinmeyen komut"); }
  CHECK(parseCommand(nullptr, 0).type == Command::NONE, "bos komut");
  Settings s;
  CHECK(!applySetting(s, 1, 2) && s.bri == 5, "parlaklik alt sinir");
  CHECK(!applySetting(s, 1, 250) && s.bri == 100, "parlaklik ust sinir");
  CHECK(!applySetting(s, 3, 180) && s.vol == 100, "ses ust sinir");
  CHECK(!applySetting(s, 2, 0) && s.scr == 0, "ekran hep acik");
  CHECK(!applySetting(s, 4, 30) && s.off == 30, "otomatik kapanma");
  CHECK(applySetting(s, 5, 3) && s.no == 3, "sensor no degisince yeniden baslatma");
  CHECK(!applySetting(s, 5, 3), "ayni sensor no yeniden baslatmamali");
  CHECK(!applySetting(s, 5, 0) && s.no == 3, "gecersiz sensor no");
  CHECK(!applySetting(s, 5, 10) && s.no == 3, "gecersiz sensor no 10");
  CHECK(encodeJerk(0) == 0 && encodeJerk(0.04f) == 1 && encodeJerk(8.0f) == 200 && encodeJerk(8.9f) == 201 && encodeJerk(100.0f) == 255, "darbe kodlama");
  for (int v = 0; v <= 255; v++) { if (encodeJerk(decodeJerk((uint8_t)v)) != v) { CHECK(false, "darbe kodlama gidis-donus %d", v); break; } }
  CHECK(tempFromRaw(0) == 25 && tempFromRaw(3268) == 35 && tempFromRaw(-3268) == 15, "sicaklik");
  CHECK(encodeSnd(0) == 0 && encodeSnd(1) == 0 && encodeSnd(10) == 56 && encodeSnd(1000) == 168 && encodeSnd(32767) == 253 && encodeSnd(100000) == 255, "ses kodlama (%d %d %d)", encodeSnd(10), encodeSnd(1000), encodeSnd(32767));
  { int prev = -1; bool mono = true; for (uint32_t p = 1; p < 70000; p += 37) { int v = encodeSnd(p); if (v < prev) mono = false; prev = v; } CHECK(mono, "ses kodlama tekduze artan"); }
  CHECK(maxSamplesFor(185, true) == 12 && maxSamplesFor(185, false) == 13 && maxSamplesFor(247, true) == 13 && soundFits(24) && !soundFits(23), "sesli paket boyutlari");
  StatusInfo si; si.bat = 77; si.charging = true; si.imuOk = true; si.fw = 2; si.rssi = -61; si.tempC = 31; si.mv = 4012;
  si.bri = 40; si.scr = 20; si.vol = 60; si.off = 10; si.no = 2; si.head = 0xA1B2C3D4u; si.bootId = 0xBEEF; si.overflow = 7; si.itv = 24; si.mtu = 185;
  uint8_t b[3 + STATUS_LEN]; size_t n = buildStatus(b, si);
  CHECK(n == 27 && b[0] == 0x55 && b[1] == 0x65 && b[2] == 24, "durum basligi");
  CHECK(b[3] == 77 && b[4] == 3 && b[5] == 2 && (int8_t)b[6] == -61 && b[7] == 31 && b[8] == 200, "durum alanlari");
  CHECK(b[13] == 2 && b[15] == 0xD4 && b[18] == 0xA1 && b[19] == 0xEF && b[20] == 0xBE && b[21] == 7 && b[23] == 24 && b[25] == 185, "durum alanlari 2");
  si.micOk = true; buildStatus(b, si); CHECK(b[4] == (3 | 16), "durum: mikrofon biti");
}

// ---------------------------------------------------------------- yazilim guncelleme (OTA) testi
struct MemFlash {
  std::vector<uint8_t> data; uint32_t cap = 1310720; bool began = false, finished = false, aborted = false; int failAt = -1; bool finishOk = true;
  uint32_t capacity() { return cap; }
  bool begin(uint32_t) { data.clear(); began = true; finished = false; aborted = false; return true; }
  bool write(const uint8_t* p, size_t n) { if (failAt >= 0 && data.size() >= (size_t)failAt) return false; data.insert(data.end(), p, p + n); return true; }
  bool finish() { finished = finishOk; return finishOk; }
  void abort() { aborted = true; }
};
struct OtaReply { uint8_t kind, code; uint32_t val; };
static void testOta() {
  std::printf("\nyazilim guncelleme (OTA)\n");
  { const char* t = "123456789"; CHECK(crc32Update(0, (const uint8_t*)t, 9) == 0xCBF43926u, "CRC32 bilinen deger");
    CHECK(crc32Update(crc32Update(0, (const uint8_t*)t, 4), (const uint8_t*)t + 4, 5) == 0xCBF43926u, "CRC32 zincirleme"); }
  std::vector<uint8_t> img(800123); std::mt19937 g(7); for (auto& b : img) b = (uint8_t)(g() & 0xFF); img[0] = 0xE9;
  uint32_t crc = crc32Update(0, img.data(), img.size());
  auto u32 = [](std::vector<uint8_t>& v, uint32_t x) { v.push_back(x & 255); v.push_back((x >> 8) & 255); v.push_back((x >> 16) & 255); v.push_back(x >> 24); };
  auto run = [&](MemFlash& fl, OtaRx& rx, uint32_t sz, uint32_t cr, int chunk, std::function<int(int, uint32_t)> mangle, std::vector<OtaReply>& rep, bool doEnd) {
    auto send = [&](const uint8_t* p, size_t n) { if (n == 8 && p[0] == 0x55 && p[1] == 0x67) rep.push_back({p[2], p[3], getU32(p + 4)}); };
    std::vector<uint8_t> b{0x10}; u32(b, sz); u32(b, cr); rx.handle(b.data(), b.size(), fl, send);
    uint32_t off = 0; int i = 0; size_t seen = 0;
    while (off < sz && i < 100000) {
      // gonderen: geri sarma bildirimi geldiyse oradan devam
      for (; seen < rep.size(); seen++) if (rep[seen].kind == 4 && rep[seen].code == 1) off = rep[seen].val;
      int n = (int)std::min<uint32_t>((uint32_t)chunk, sz - off);
      int act = mangle ? mangle(i, off) : 0;   // 0 normal, 1 at (kayboldu), 2 iki kez gonder
      std::vector<uint8_t> c{0x11}; u32(c, off); c.insert(c.end(), img.begin() + off, img.begin() + off + n);
      if (act != 1) rx.handle(c.data(), c.size(), fl, send);
      if (act == 2) rx.handle(c.data(), c.size(), fl, send);
      off += (uint32_t)n; i++;
      if (off >= sz) { for (; seen < rep.size(); seen++) if (rep[seen].kind == 4 && rep[seen].code == 1) off = rep[seen].val; }
    }
    if (doEnd) { uint8_t e = 0x12; rx.handle(&e, 1, fl, send); }
  };
  { MemFlash fl; OtaRx rx; std::vector<OtaReply> rep; run(fl, rx, (uint32_t)img.size(), crc, 177, nullptr, rep, true);
    CHECK(!rep.empty() && rep.front().kind == 1 && rep.front().val == img.size(), "baslat: hazir yaniti");
    CHECK(rx.state == OtaRx::DONE && fl.finished && fl.data == img && rep.back().kind == 3, "177 baytlik parcalarla tam aktarim, resim birebir");
    int acks = 0; for (auto& r : rep) if (r.kind == 2) acks++; CHECK(acks >= 370 && acks <= 392, "yaklasik her 2 KB'de bir onay (%d)", acks); }
  { MemFlash fl; OtaRx rx; std::vector<OtaReply> rep;
    run(fl, rx, (uint32_t)img.size(), crc, 177, [](int i, uint32_t) { return (i % 997 == 500) ? 1 : (i % 1301 == 7 ? 2 : 0); }, rep, true);
    int naks = 0; for (auto& r : rep) if (r.kind == 4 && r.code == 1) naks++;
    CHECK(rx.state == OtaRx::DONE && fl.data == img, "kayip ve yinelenen parcalara ragmen dogru resim (geri sarma %d)", naks); CHECK(naks >= 4, "kayip parcada sira disi uyarisi"); }
  { MemFlash fl; OtaRx rx; std::vector<OtaReply> rep; run(fl, rx, (uint32_t)img.size(), crc ^ 1u, 240, nullptr, rep, true);
    CHECK(rx.state == OtaRx::FAILED && !fl.finished && fl.aborted && rep.back().kind == 4 && rep.back().code == 3, "CRC uyusmazsa yeni yazilim secilmez"); }
  { MemFlash fl; fl.finishOk = false; OtaRx rx; std::vector<OtaReply> rep; run(fl, rx, (uint32_t)img.size(), crc, 240, nullptr, rep, true);
    CHECK(rx.state == OtaRx::FAILED && rep.back().kind == 4 && rep.back().code == 4, "resim dogrulamasi gecmezse hata"); }
  { MemFlash fl; OtaRx rx; std::vector<OtaReply> rep; run(fl, rx, 2000000, crc, 240, nullptr, rep, false);
    CHECK(rep.size() >= 1 && rep[0].kind == 4 && rep[0].code == 5 && !fl.began, "bolumden buyuk dosya reddedilir"); }
  { MemFlash fl; OtaRx rx; std::vector<OtaReply> rep; auto send = [&](const uint8_t* p, size_t n) { if (n == 8) rep.push_back({p[2], p[3], getU32(p + 4)}); };
    std::vector<uint8_t> b{0x10}; u32(b, 1000); u32(b, 0); rx.handle(b.data(), b.size(), fl, send);
    uint8_t e = 0x12; rx.handle(&e, 1, fl, send); CHECK(rep.back().kind == 4 && rep.back().code == 2, "eksik veriyle bitirme reddedilir");
    uint8_t a = 0x13; rx.handle(&a, 1, fl, send); CHECK(rep.back().kind == 5 && fl.aborted && rx.state == OtaRx::IDLE, "vazgec");
    std::vector<uint8_t> c{0x11, 0, 0, 0, 0, 1, 2}; rx.handle(c.data(), c.size(), fl, send); CHECK(rep.back().kind == 4 && rep.back().code == 7, "baslatilmadan parca reddedilir"); }
  { MemFlash fl; fl.failAt = 50000; OtaRx rx; std::vector<OtaReply> rep; run(fl, rx, (uint32_t)img.size(), crc, 240, nullptr, rep, false);
    bool e6 = false; for (auto& r : rep) if (r.kind == 4 && r.code == 6) e6 = true; CHECK(e6 && rx.state == OtaRx::FAILED && fl.aborted, "flash yazma hatasinda durur"); }
}

int main(int argc, char** argv) {
  const char* out = argc > 1 ? argv[1] : nullptr;
  testCommands();
  testOta();
  std::printf("\nsenaryolar (12 sn, 200 olcum/sn)\n");

  std::vector<Scenario> list;
  { Scenario s; s.name = "canli185"; list.push_back(s); }
  { Scenario s; s.name = "canli23"; s.mtu = 23; list.push_back(s); }
  { Scenario s; s.name = "geribasinc"; s.canSend = [](uint32_t t, std::mt19937& g) {
      if (t >= 3000 && t < 3700) return false;               // 0,7 sn hic gonderilemez
      if (t >= 6000 && t < 9000) return (g() % 100) >= 60;    // 3 sn boyunca %60 basarisiz
      return (g() % 100) >= 10; };                            // genelde %10 basarisiz
    list.push_back(s); }
  { Scenario s; s.name = "kopma3sn"; s.linkUp = [](uint32_t t) { return !(t >= 4000 && t < 7000); }; list.push_back(s); }
  { Scenario s; s.name = "kopmalar"; s.linkUp = [](uint32_t t) { return !((t >= 2000 && t < 2400) || (t >= 5000 && t < 8000) || (t >= 9000 && t < 9050)); };
    s.canSend = [](uint32_t, std::mt19937& g) { return (g() % 100) >= 20; }; list.push_back(s); }
  { Scenario s; s.name = "kopma15sn"; s.durationMs = 25000; s.linkUp = [](uint32_t t) { return !(t >= 4000 && t < 19000); }; list.push_back(s); }
  { Scenario s; s.name = "istekyok"; s.resumeOnReconnect = false; s.linkUp = [](uint32_t t) { return !(t >= 4000 && t < 6000); }; list.push_back(s); }
  { Scenario s; s.name = "gecistek"; s.lateRequestMs = 300; s.linkUp = [](uint32_t t) { return !(t >= 4000 && t < 6000); }; list.push_back(s); }
  { Scenario s; s.name = "yenidenbas"; s.rebootAt = true; s.rebootMs = 5000; s.linkUp = [](uint32_t t) { return !(t >= 4000 && t < 6000); }; list.push_back(s); }
  { Scenario s; s.name = "ses185"; s.sound = true; list.push_back(s); }
  { Scenario s; s.name = "ses23"; s.sound = true; s.mtu = 23; list.push_back(s); }
  { Scenario s; s.name = "seskopma"; s.sound = true; s.linkUp = [](uint32_t t) { return !(t >= 3000 && t < 5500); };
    s.canSend = [](uint32_t t, std::mt19937& g) { if (t >= 7000 && t < 7600) return false; return (g() % 100) >= 15; }; list.push_back(s); }
  { Scenario s; s.name = "seseskiapp"; s.sound = true; s.oldApp = true; list.push_back(s); }

  for (auto& sc : list) {
    Result r = run(sc, out);
    report(sc.name.c_str(), r);
    CHECK(r.app.badValue == 0, "%s: bozuk olcum", sc.name.c_str());
    if (sc.name == "canli185") { CHECK(r.app.lost == 0 && r.app.dup == 0, "canli185 kayip/yineleme"); CHECK(r.avgK > 3.9 && r.avgK < 4.6, "canli185 paket basina ~4 olcum (%.2f)", r.avgK); }
    if (sc.name == "canli23") { CHECK(r.app.lost == 0 && r.maxK == 1, "canli23: tek olcumlu paket, kayipsiz"); }
    if (sc.name == "geribasinc") { CHECK(r.app.lost == 0 && r.app.dup == 0 && r.overflow == 0, "geribasinc: kayip olmamali"); CHECK(r.maxK == MAX_K, "geribasinc: birikme 13'luk paketlerle bosaltilmali"); }
    if (sc.name == "kopma3sn" || sc.name == "kopmalar") { CHECK(r.app.lost == 0 && r.app.dup == 0, "%s: devam istegiyle kayip olmamali", sc.name.c_str()); CHECK(r.app.got + 3 >= r.produced, "%s: neredeyse tum olcumler ulasmali", sc.name.c_str()); }
    if (sc.name == "kopma15sn") { CHECK(r.app.lost > 0 && r.app.dup == 0, "kopma15sn: tampondan uzun kopmada bosluk beklenir"); CHECK(r.app.lost >= 2900 && r.app.lost <= 3100, "kopma15sn: canliya gecis (%llu)", (unsigned long long)r.app.lost); }
    if (sc.name == "istekyok") { CHECK(r.app.lost >= 390 && r.app.lost <= 410, "istekyok: kopma suresi kadar bosluk (%llu)", (unsigned long long)r.app.lost); }
    if (sc.name == "gecistek") { CHECK(r.app.dup >= 400 && r.app.dup <= 520 && r.app.reboots == 0, "gecistek: geri sarilan olcumler yineleme sayilip atilmali (%llu)", (unsigned long long)r.app.dup); CHECK(r.app.lost <= 410, "gecistek: kayip kopma suresini asmamali"); }
    if (sc.name == "yenidenbas") { CHECK(r.app.reboots == 1 && r.app.got >= 1990 && r.app.dup == 0, "yenidenbas: yeniden baslama algilanip akis surmeli (alinan %llu)", (unsigned long long)r.app.got); }
    if (sc.name == "ses185") { CHECK(r.app.lost == 0 && r.app.dup == 0 && r.app.plainPk == 0 && r.app.sndPk > 0, "ses185: hepsi sesli paket, kayipsiz"); CHECK(r.avgK > 3.9 && r.avgK < 4.6, "ses185: paket basina ~4 olcum (%.2f)", r.avgK); }
    if (sc.name == "ses23") { CHECK(r.app.lost == 0 && r.app.sndPk == 0 && r.maxK == 1, "ses23: MTU 23'te eski bicime dusuluyor, kayipsiz"); }
    if (sc.name == "seskopma") { CHECK(r.app.lost == 0 && r.app.dup == 0 && r.app.plainPk == 0, "seskopma: kopma ve geri basincta sesli akis kayipsiz surer"); CHECK(r.maxK == 12, "seskopma: birikme 12'lik sesli paketlerle bosaltilir (%d)", r.maxK); }
    if (sc.name == "seseskiapp") { CHECK(r.app.lost == 0 && r.app.sndPk == 0 && r.app.plainPk > 0, "seseskiapp: ses istemeyen eski uygulama eski bicimi alir"); }
  }
  std::printf("\n%s (%d hata)\n", failures ? "BASARISIZ" : "TUM TESTLER GECTI", failures);
  return failures ? 1 : 0;
}
