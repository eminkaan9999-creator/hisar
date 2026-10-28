// =====================================================================
//  HISAR TETIK - sensor ile uygulama arasindaki veri protokolu (surum 2)
// ---------------------------------------------------------------------
//  Donanimdan bagimsizdir: hem sensor yazilimi hem de bilgisayardaki
//  testler (test/akis_testi.cpp) bu dosyayi kullanir.
//
//  Veri paketi:   0x55 0x66 n seq32(LE) + n x 13 bayt olcum
//      olcum:     ax ay az gx gy gz (int16 LE) + darbe(u8, encodeJerk)
//  Durum paketi:  0x55 0x65 24 + 24 bayt (buildStatus'a bakin)
//  Komutlar:      parseCommand'a bakin
// =====================================================================
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>

namespace hisar {

static constexpr int      SAMPLE_BYTES = 13;
static constexpr int      HDR_BYTES    = 7;       // 0x55 0x66 n seq32
static constexpr int      MAX_K        = 13;      // MTU 185 -> 13 olcum/paket
static constexpr uint32_t RING         = 2048;    // 200 Hz'de 10,24 sn
static constexpr uint32_t RING_SAFE    = RING - 64;
static constexpr int      STATUS_LEN   = 24;
static constexpr uint32_t START_VALID_MS = 5000;  // "devam et" isteginin gecerlilik suresi

struct Sample {
  int16_t v[6];   // ax ay az gx gy gz
  uint8_t jerk;   // encodeJerk ile kodlanmis darbe
};

// Tek ureticili (olcum gorevi), tek tuketicili (gonderim) halka tampon.
struct Ring {
  Sample buf[RING];
  volatile uint32_t head = 0;   // uretilen olcum sayisi = sonraki sira numarasi
  void push(const Sample& s) {
    uint32_t h = head;
    buf[h % RING] = s;
    __sync_synchronize();        // olcum tamamen yazilmadan sira numarasi yayinlanmaz
    head = h + 1;
  }
  const Sample& at(uint32_t seq) const { return buf[seq % RING]; }
};

// Darbe (ani ivme degisimi) bayti: 0-8 g arasi 0,04 g adimli (0-200),
// 8 g ustu 0,9 g adimli (201-255, en cok ~57 g). Gercek atis tepmesi icin genis aralik.
inline uint8_t encodeJerk(float g) {
  if (g <= 0) return 0;
  if (g <= 8.0f) { int v = (int)(g / 0.04f + 0.5f); return (uint8_t)(v > 200 ? 200 : v); }
  int v = 200 + (int)((g - 8.0f) / 0.9f + 0.5f);
  return (uint8_t)(v > 255 ? 255 : v);
}
inline float decodeJerk(uint8_t v) { return v <= 200 ? v * 0.04f : 8.0f + (v - 200) * 0.9f; }

inline void putSample(uint8_t* p, const Sample& s) {
  for (int i = 0; i < 6; i++) {
    p[i * 2] = (uint8_t)(s.v[i] & 0xFF);
    p[i * 2 + 1] = (uint8_t)((s.v[i] >> 8) & 0xFF);
  }
  p[12] = s.jerk;
}

inline void putU32(uint8_t* p, uint32_t v) {
  p[0] = (uint8_t)(v & 0xFF); p[1] = (uint8_t)((v >> 8) & 0xFF);
  p[2] = (uint8_t)((v >> 16) & 0xFF); p[3] = (uint8_t)((v >> 24) & 0xFF);
}
inline void putU16(uint8_t* p, uint16_t v) { p[0] = (uint8_t)(v & 0xFF); p[1] = (uint8_t)(v >> 8); }

inline size_t buildData(uint8_t* pkt, const Ring& r, uint32_t seq, int k) {
  pkt[0] = 0x55; pkt[1] = 0x66; pkt[2] = (uint8_t)k;
  putU32(pkt + 3, seq);
  for (int j = 0; j < k; j++) putSample(pkt + HDR_BYTES + j * SAMPLE_BYTES, r.at(seq + j));
  return (size_t)(HDR_BYTES + k * SAMPLE_BYTES);
}

inline int maxSamplesFor(int mtu) {
  int k = (mtu - 3 - HDR_BYTES) / SAMPLE_BYTES;
  if (k < 1) k = 1;
  if (k > MAX_K) k = MAX_K;
  return k;
}

// Gonderim durumu: kayipsiz akis, geri basinc, kopmadan sonra devam.
struct Stream {
  bool     streaming = false;
  uint32_t sendSeq = 0;
  uint32_t overflow = 0;     // tampon tastigi icin gonderilemeyen olcum sayisi
  uint32_t sent = 0;
  volatile bool     startReq = false;
  volatile uint8_t  startMode = 0;
  volatile uint32_t startSeq = 0;
  volatile uint32_t startReqAt = 0;

  // Uygulama "0x07 kip seq32" yazinca (bildirimleri acmadan once)
  void request(uint8_t mode, uint32_t seq, uint32_t nowMs) {
    startMode = mode; startSeq = seq; startReqAt = nowMs;
    __sync_synchronize();
    startReq = true;
  }
  void onDisconnect() { streaming = false; startReq = false; }

  // send(pkt, len) -> true: yigin kabul etti; false: tampon dolu, sonra tekrar dene
  template <typename SendFn>
  void service(const Ring& r, bool linkUp, int mtu, uint32_t nowMs, SendFn send) {
    if (!linkUp) { streaming = false; return; }
    uint32_t head = r.head;
    if (!streaming) {
      sendSeq = head;                                     // varsayilan: canli
      if (startReq && nowMs - startReqAt < START_VALID_MS) applyStart(head);
      startReq = false;
      streaming = true;
    } else if (startReq) {                                // akis sirasinda gelen istek
      startReq = false;
      applyStart(head);
    }
    if (head - sendSeq > RING_SAFE) {                     // uzun kopma: en eskiler kaybolur
      overflow += (head - sendSeq) - RING_SAFE;
      sendSeq = head - RING_SAFE;
    }
    const int maxK = maxSamplesFor(mtu);
    const int liveMin = maxK < 4 ? maxK : 4;               // canli akista ~20 ms'de bir paket
    uint8_t pkt[HDR_BYTES + MAX_K * SAMPLE_BYTES];
    for (int packets = 0; packets < 16; packets++) {
      uint32_t avail = head - sendSeq;
      if (avail == 0 || avail < (uint32_t)liveMin) break;
      int k = avail > (uint32_t)maxK ? maxK : (int)avail;
      size_t len = buildData(pkt, r, sendSeq, k);
      if (!send(pkt, len)) break;                          // geri basinc: veri tamponda bekler
      sendSeq += (uint32_t)k;
      sent += (uint32_t)k;
    }
  }

 private:
  void applyStart(uint32_t head) {
    uint32_t want = startSeq;
    if (startMode == 1 && (int32_t)(head - want) >= 0 && head - want <= RING_SAFE) sendSeq = want;
  }
};

struct StatusInfo {
  uint8_t  bat = 0;        // %
  bool     charging = false, imuOk = false, lowBattery = false, streaming = false;
  uint8_t  fw = 2;
  int8_t   rssi = -128;    // dBm, -128 = bilinmiyor
  int8_t   tempC = 0;
  uint16_t mv = 0;         // pil gerilimi (mV)
  uint8_t  bri = 40, scr = 20, vol = 60, off = 10, no = 1;
  uint8_t  imuErr = 0;
  uint32_t head = 0;
  uint16_t bootId = 0, overflow = 0, itv = 0, mtu = 23;
};

// 0x55 0x65 24 + alanlar. Uygulama uzunluk baytina bakar; yeni alanlar sona eklenir.
inline size_t buildStatus(uint8_t* st, const StatusInfo& s) {
  st[0] = 0x55; st[1] = 0x65; st[2] = STATUS_LEN;
  uint8_t* p = st + 3;
  p[0] = s.bat > 100 ? 100 : s.bat;
  p[1] = (uint8_t)((s.charging ? 1 : 0) | (s.imuOk ? 2 : 0) | (s.lowBattery ? 4 : 0) | (s.streaming ? 8 : 0));
  p[2] = s.fw;
  p[3] = (uint8_t)s.rssi;
  p[4] = (uint8_t)s.tempC;
  p[5] = (uint8_t)(s.mv / 20 > 255 ? 255 : s.mv / 20);
  p[6] = s.bri; p[7] = s.scr; p[8] = s.vol; p[9] = s.off; p[10] = s.no;
  p[11] = s.imuErr;
  putU32(p + 12, s.head);
  putU16(p + 16, s.bootId);
  putU16(p + 18, s.overflow);
  putU16(p + 20, s.itv);
  putU16(p + 22, s.mtu);
  return 3 + STATUS_LEN;
}

// MPU6886: 326,8 LSB/derece, 0 = 25 derece
inline int8_t tempFromRaw(int16_t raw) {
  float t = (float)raw / 326.8f + 25.0f;
  int v = (int)(t >= 0 ? t + 0.5f : t - 0.5f);
  return (int8_t)(v < -40 ? -40 : v > 100 ? 100 : v);
}

struct Command {
  enum Type : uint8_t { NONE, TONE, SET, IDENTIFY, RESTART, POWEROFF, STATUS, START } type = NONE;
  uint16_t freq = 0, ms = 0;
  uint8_t  key = 0, val = 0;
  uint8_t  mode = 0;
  uint32_t seq = 0;
};

//  0x01 fH fL sure/10ms   bip
//  0x02 anahtar deger     ayar: 1 parlaklik %, 2 ekran sn (0 = hep acik), 3 ses %,
//                         4 otomatik kapanma dk (0 = kapali), 5 sensor no 1-9
//  0x03 sensoru bul   0x04 yeniden baslat   0x05 kapat   0x06 durumu hemen gonder
//  0x07 kip seq32         akis baslangici (kip 0 canli, kip 1 seq32'den devam)
inline Command parseCommand(const uint8_t* d, size_t n) {
  Command c;
  if (n < 1) return c;
  switch (d[0]) {
    case 0x01: if (n >= 4) { c.type = Command::TONE; c.freq = (uint16_t)((d[1] << 8) | d[2]); c.ms = (uint16_t)(d[3] * 10); } break;
    case 0x02: if (n >= 3) { c.type = Command::SET; c.key = d[1]; c.val = d[2]; } break;
    case 0x03: c.type = Command::IDENTIFY; break;
    case 0x04: c.type = Command::RESTART; break;
    case 0x05: c.type = Command::POWEROFF; break;
    case 0x06: c.type = Command::STATUS; break;
    case 0x07:
      c.type = Command::START;
      c.mode = n >= 2 ? d[1] : 0;
      c.seq = n >= 6 ? ((uint32_t)d[2] | ((uint32_t)d[3] << 8) | ((uint32_t)d[4] << 16) | ((uint32_t)d[5] << 24)) : 0;
      break;
  }
  return c;
}

// Ayar sinirlari (gecersiz deger gelirse duzeltilir)
struct Settings {
  uint8_t bri = 40, scr = 20, vol = 60, off = 10, no = 1;
};
// true donerse sensor adi degisti: yeniden baslatilmali
inline bool applySetting(Settings& s, uint8_t key, uint8_t v) {
  switch (key) {
    case 1: s.bri = v < 5 ? 5 : v > 100 ? 100 : v; return false;
    case 2: s.scr = v; return false;
    case 3: s.vol = v > 100 ? 100 : v; return false;
    case 4: s.off = v; return false;
    case 5: if (v >= 1 && v <= 9 && v != s.no) { s.no = v; return true; } return false;
  }
  return false;
}

// ---------------------------------------------------------------- yazilim guncelleme (Bluetooth)
// Uygulama, yeni yazilimi telefondan parca parca gonderir; sensor flash'a yazar,
// CRC32 ve resim dogrulamasi gecerse yeni yazilimla yeniden baslar. Dogrulama
// gecmezse eski yazilim calismaya devam eder (iki bolumlu OTA).
//   0x10 boyut32 crc32      baslat (sensor ilgili flash alanini hazirlar)
//   0x11 konum32 veri...    parca (konum, beklenen konuma esit olmali)
//   0x12                    bitir: CRC ve resim dogrulanir, yeni yazilim secilir
//   0x13                    vazgec
// Yanitlar (bildirim):  0x55 0x67 tur kod deger32
//   tur 1 hazir (deger = boyut)       tur 2 alindi (deger = alinan bayt)
//   tur 3 tamam, yeniden basliyor     tur 4 hata (kod; deger = beklenen konum)
//   tur 5 vazgecildi
//   hata kodlari: 1 sira disi parca (degerden devam et), 2 eksik/fazla veri,
//                 3 CRC uyusmadi, 4 resim dogrulanamadi, 5 dosya cok buyuk,
//                 6 flash hatasi, 7 guncelleme baslatilmamis
static constexpr uint32_t OTA_ACK_EVERY = 2048;
static constexpr int      OTA_MAX_CHUNK = 240;

inline uint32_t getU32(const uint8_t* p) {
  return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

// CRC-32 (IEEE 802.3, zlib ile ayni). Zincirlenebilir: crc32Update(crc32Update(0,a),b) = crc32(a+b)
inline uint32_t crc32Update(uint32_t crc, const uint8_t* d, size_t n) {
  static uint32_t table[256];
  static bool ready = false;
  if (!ready) {
    for (uint32_t i = 0; i < 256; i++) {
      uint32_t c = i;
      for (int k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320u ^ (c >> 1) : c >> 1;
      table[i] = c;
    }
    ready = true;
  }
  crc = ~crc;
  for (size_t i = 0; i < n; i++) crc = table[(crc ^ d[i]) & 0xFF] ^ (crc >> 8);
  return ~crc;
}

struct OtaRx {
  enum State : uint8_t { IDLE, READY, DONE, FAILED };
  State    state = IDLE;
  uint32_t size = 0, expectCrc = 0, offset = 0, crc = 0, lastAck = 0;
  uint32_t nakAt = 0xFFFFFFFFu;

  static size_t reply(uint8_t* out, uint8_t kind, uint8_t code, uint32_t v) {
    out[0] = 0x55; out[1] = 0x67; out[2] = kind; out[3] = code; putU32(out + 4, v);
    return 8;
  }
  static bool isOta(const uint8_t* d, size_t n) { return n >= 1 && d[0] >= 0x10 && d[0] <= 0x13; }

  // Flash: capacity(), begin(size), write(p,n), finish(), abort()   Send: (p,n)
  template <class Flash, class Send>
  void handle(const uint8_t* d, size_t n, Flash& fl, Send send) {
    uint8_t out[8];
    if (n < 1) return;
    switch (d[0]) {
      case 0x10: {
        if (n < 9) return;
        uint32_t sz = getU32(d + 1), cr = getU32(d + 5);
        if (state == READY) fl.abort();
        state = IDLE;
        if (sz == 0 || sz > fl.capacity()) { state = FAILED; send(out, reply(out, 4, 5, 0)); return; }
        if (!fl.begin(sz)) { state = FAILED; send(out, reply(out, 4, 6, 0)); return; }
        size = sz; expectCrc = cr; offset = 0; crc = 0; lastAck = 0; nakAt = 0xFFFFFFFFu; state = READY;
        send(out, reply(out, 1, 0, size));
        return;
      }
      case 0x11: {
        if (state != READY || n < 6) { send(out, reply(out, 4, 7, offset)); return; }
        uint32_t off = getU32(d + 1);
        const uint8_t* p = d + 5;
        size_t len = n - 5;
        if (off != offset) {                       // sira disi: bir kez bildir, gonderen geri sarar
          if (nakAt != offset) { nakAt = offset; send(out, reply(out, 4, 1, offset)); }
          return;
        }
        nakAt = 0xFFFFFFFFu;
        if (offset + len > size) { send(out, reply(out, 4, 2, offset)); return; }
        if (!fl.write(p, len)) { fl.abort(); state = FAILED; send(out, reply(out, 4, 6, offset)); return; }
        crc = crc32Update(crc, p, len);
        offset += (uint32_t)len;
        if (offset - lastAck >= OTA_ACK_EVERY || offset == size) { lastAck = offset; send(out, reply(out, 2, 0, offset)); }
        return;
      }
      case 0x12: {
        if (state != READY) { send(out, reply(out, 4, 7, offset)); return; }
        if (offset != size) { send(out, reply(out, 4, 2, offset)); return; }
        if (crc != expectCrc) { fl.abort(); state = FAILED; send(out, reply(out, 4, 3, crc)); return; }
        if (!fl.finish()) { state = FAILED; send(out, reply(out, 4, 4, 0)); return; }
        state = DONE;
        send(out, reply(out, 3, 0, size));
        return;
      }
      case 0x13: {
        if (state == READY) fl.abort();
        state = IDLE;
        send(out, reply(out, 5, 0, offset));
        return;
      }
    }
  }
};

}  // namespace hisar
