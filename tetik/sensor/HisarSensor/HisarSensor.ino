// =====================================================================
//  HISAR TETIK - M5StickC Plus2 sensor yazilimi (surum 3)
// ---------------------------------------------------------------------
//  Ne yapar:
//   * MPU6886 hareket sensorunu (ivme + jiroskop) saniyede 1000 kez okur.
//   * 5 olcumun ortalamasini alip saniyede 200 olcum uretir.
//   * Her olcumde, o 5 ms icindeki en buyuk ani sarsintiyi (tetik "tik"i,
//     geri tepme) ayrica kaydeder; boylece kisa darbeler kacmaz.
//   * Olcumleri Bluetooth (BLE) ile HISAR TETIK uygulamasina gonderir.
//
//  Mikrofon (surum 3):
//   * Dahili SPM1423 PDM mikrofonu saniyede 32000 kez okunur (I2S0). Dusuk
//     frekanslar (el, ruzgar ugultusu) suzulur; her 5 ms'lik olcume o arada
//     duyulan en yuksek ses eklenir. Uygulama kuru tetikte tetigin "tik" sesini
//     darbeyle birlikte degerlendirir. Hoparlor (bip) I2S1'e alindi, ikisi
//     birbirini kesmez. Mikrofon okunamazsa durum paketinde bildirilir ve
//     atislar yalniz darbeyle algilanir.
//
//  Kopukluk olmamasi icin (surum 2):
//   * Her olcum 10 saniyelik halka tampona yazilir ve 32 bitlik sira numarasi
//     tasir. Bluetooth yigininin tamponu doluysa olcum atilmaz, beklenir
//     (geri basinc). Baglanti kisa sureli koparsa uygulama yeniden baglaninca
//     son aldigi sira numarasini bildirir, sensor oradan devam eder.
//   * En yuksek verici gucu, 251 baytlik baglanti katmani paketleri (DLE),
//     15-30 ms baglanti araligi, 5 sn kopma toleransi, hizli yeniden yayin.
//   * Hareket sensoru okunamazsa kendini yeniden kurar.
//
//  Ayarlar (uygulamadan, kalici): ekran parlakligi, ekran kapanma suresi,
//  ses seviyesi, otomatik kapanma, sensor numarasi.
//
//  Yazilim guncelleme: sonraki surumler telefondan Bluetooth ile yuklenir
//  (iki bolumlu OTA; dogrulanmayan yazilim secilmez, eski yazilim calisir).
//
//  Dugmeler:
//   * On dugme (A): ekrani aydinlatir.
//   * Yan dugme (B) 2 saniye basili: cihazi kapatir.
//
//  Paket bicimleri ve komutlar: HisarProtocol.h
// =====================================================================

#include <Wire.h>        // M5GFX icin gerekli (I2C)
#include <M5Unified.h>
#include <NimBLEDevice.h>
#include <Preferences.h>
#include <esp_ota_ops.h>
#include <driver/i2s.h>
#include "HisarProtocol.h"

#define FW_VERSION 3
#define SVC_UUID    "0000ffe5-0000-1000-8000-00805f9a34fb"
#define NOTIFY_UUID "0000ffe4-0000-1000-8000-00805f9a34fb"
#define WRITE_UUID  "0000ffe9-0000-1000-8000-00805f9a34fb"

static constexpr uint8_t  IMU_ADDR     = 0x68;
static constexpr uint32_t I2C_FREQ     = 400000;
static constexpr int      SUB          = 5;      // 1 kHz -> 200 Hz
static constexpr int      MIN_FREE_BUF = 4;      // Bluetooth yigininda birakilacak bos tampon

// ---------------------------------------------------------------- durum
static hisar::Ring       ring;
static hisar::Stream     stream;
static hisar::Settings   cfg;
static Preferences       prefs;
static volatile bool     imuOk = false;
static volatile uint32_t imuErrors = 0;
static volatile int16_t  imuTempRaw = 0;

// Mikrofon: micTask her 2 ms'de en yuksek sesi micPeak'e yazar, imuTask her olcumde okuyup sifirlar
static constexpr int      MIC_RATE  = 32000;     // PDM saati 2,048 MHz (SPM1423: 1-3,25 MHz)
static constexpr int      MIC_BLOCK = 64;        // 2 ms
static volatile bool      micOk = false;
static bool               micReady = false;
static portMUX_TYPE       micMux = portMUX_INITIALIZER_UNLOCKED;
static uint32_t           micPeak = 0;

static NimBLEServer*         server = nullptr;
static NimBLECharacteristic* notifyChr = nullptr;
static volatile bool     bleConnected = false;
static volatile bool     subscribed = false;
static volatile uint16_t connHandle = 0xFFFF;
static volatile uint16_t peerMtu = 23;
static QueueHandle_t     cmdQ = nullptr;        // uygulamadan gelen komutlar (dongude islenir)
static uint16_t          bootId = 0;

struct CmdMsg { uint8_t n; uint8_t d[8]; };
struct OtaMsg { uint16_t n; uint8_t d[5 + hisar::OTA_MAX_CHUNK + 3]; };
static QueueHandle_t     otaQ = nullptr;        // yazilim guncelleme parcalari (ayri gorevde islenir)
static hisar::OtaRx      ota;
static volatile bool     otaActive = false;
static volatile uint32_t otaLastMsg = 0;
static volatile uint32_t otaDoneAt = 0;
static volatile bool     otaOverflow = false;

static String deviceName() {
  return cfg.no <= 1 ? String("HISAR-SENSOR") : String("HISAR-SENSOR-") + String((int)cfg.no);
}
static void loadSettings() {
  prefs.begin("hisar", true);
  hisar::applySetting(cfg, 1, prefs.getUChar("bri", 40));
  hisar::applySetting(cfg, 2, prefs.getUChar("scr", 20));
  hisar::applySetting(cfg, 3, prefs.getUChar("vol", 60));
  hisar::applySetting(cfg, 4, prefs.getUChar("off", 10));
  uint8_t no = prefs.getUChar("no", 1);
  cfg.no = (no >= 1 && no <= 9) ? no : 1;
  prefs.end();
}
static void saveSettings() {
  prefs.begin("hisar", false);
  prefs.putUChar("bri", cfg.bri);
  prefs.putUChar("scr", cfg.scr);
  prefs.putUChar("vol", cfg.vol);
  prefs.putUChar("off", cfg.off);
  prefs.putUChar("no", cfg.no);
  prefs.end();
}
static uint8_t briValue(uint8_t pct) { return (uint8_t)(10 + (uint16_t)pct * 245 / 100); }
static uint8_t volValue(uint8_t pct) { return (uint8_t)((uint16_t)pct * 255 / 100); }

// ---------------------------------------------------------------- BLE
class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, ble_gap_conn_desc* desc) override {
    connHandle = desc->conn_handle;
    subscribed = false;
    bleConnected = true;
    // iOS kurallarina uygun: 15-30 ms aralik, gecikme 0, kopma toleransi 5 sn
    s->updateConnParams(desc->conn_handle, 12, 24, 0, 500);
    // Uzun baglanti katmani paketleri: 185 baytlik bildirim tek parca gider
    s->setDataLen(desc->conn_handle, 251);
  }
  void onDisconnect(NimBLEServer* s, ble_gap_conn_desc* desc) override {
    bleConnected = false;
    subscribed = false;
    connHandle = 0xFFFF;
    peerMtu = 23;
  }
  void onMTUChange(uint16_t mtu, ble_gap_conn_desc* desc) override { peerMtu = mtu; }
};

class NotifyCB : public NimBLECharacteristicCallbacks {
  void onSubscribe(NimBLECharacteristic* c, ble_gap_conn_desc* desc, uint16_t subValue) override {
    if (subValue & 0x0001) connHandle = desc->conn_handle;
    subscribed = (subValue & 0x0001) != 0;
  }
};

class WriteCB : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    NimBLEAttValue val = c->getValue();
    if (hisar::OtaRx::isOta(val.data(), val.length())) {   // guncelleme parcasi: ayri kuyruk
      OtaMsg o;
      o.n = (uint16_t)(val.length() > sizeof(o.d) ? sizeof(o.d) : val.length());
      memcpy(o.d, val.data(), o.n);
      if (xQueueSend(otaQ, &o, 0) != pdTRUE) otaOverflow = true;   // gonderen sira disi uyarisiyla geri sarar
      return;
    }
    CmdMsg m;
    m.n = (uint8_t)(val.length() > sizeof(m.d) ? sizeof(m.d) : val.length());
    memcpy(m.d, val.data(), m.n);
    if (m.n) xQueueSend(cmdQ, &m, 0);
  }
};

// ---------------------------------------------------------------- IMU
static bool imuWrite(uint8_t reg, uint8_t val) {
  return M5.In_I2C.writeRegister8(IMU_ADDR, reg, val, I2C_FREQ);
}
static uint8_t imuRead8(uint8_t reg) {
  return M5.In_I2C.readRegister8(IMU_ADDR, reg, I2C_FREQ);
}

static bool imuSetup() {
  uint8_t who = imuRead8(0x75);
  if (who != 0x19 && who != 0x68 && who != 0x71) return false;  // MPU6886 / MPU6050 / MPU9250
  static const uint8_t regs[][2] = {
    {0x6B, 0x01},  // PWR_MGMT_1: otomatik saat
    {0x6C, 0x00},  // PWR_MGMT_2: tum eksenler acik
    {0x6A, 0x00},  // USER_CTRL: FIFO kapali
    {0x23, 0x00},  // FIFO_EN kapali
    {0x38, 0x00},  // INT_ENABLE kapali
    {0x19, 0x00},  // SMPLRT_DIV: 1 kHz
    {0x1A, 0x01},  // CONFIG: jiroskop filtresi 176 Hz
    {0x1B, 0x18},  // GYRO_CONFIG: +-2000 derece/sn
    {0x1C, 0x18},  // ACCEL_CONFIG: +-16 g
    {0x1D, 0x07},  // ACCEL_CONFIG2: ivme filtresi 420 Hz
  };
  bool ok = true;
  for (auto& r : regs) {
    int retry = 8;
    do { imuWrite(r[0], r[1]); delay(2); } while (imuRead8(r[0]) != r[1] && --retry);
    if (retry == 0) ok = false;
  }
  return ok;
}

static void imuTask(void*) {
  uint8_t b[14];
  int32_t sum[6] = {0, 0, 0, 0, 0, 0};
  int16_t prev[3] = {0, 0, 0};
  bool havePrev = false;
  int32_t maxJerkRaw = 0;  // ham birim (1/2048 g)
  int sub = 0;
  int failRun = 0;
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    vTaskDelayUntil(&last, 1);  // 1 ms (FreeRTOS 1000 Hz)
    if (!M5.In_I2C.readRegister(IMU_ADDR, 0x3B, b, 14, I2C_FREQ)) {
      imuErrors++;
      if (++failRun >= 50) {           // 50 ms boyunca okunamadi: yeniden kur
        imuOk = imuSetup();
        failRun = 0;
        havePrev = false; sub = 0; maxJerkRaw = 0;
        for (int i = 0; i < 6; i++) sum[i] = 0;
        last = xTaskGetTickCount();
      }
      continue;
    }
    failRun = 0;
    if (!imuOk) imuOk = true;
    int16_t a[3] = {(int16_t)((b[0] << 8) | b[1]), (int16_t)((b[2] << 8) | b[3]), (int16_t)((b[4] << 8) | b[5])};
    int16_t g[3] = {(int16_t)((b[8] << 8) | b[9]), (int16_t)((b[10] << 8) | b[11]), (int16_t)((b[12] << 8) | b[13])};
    imuTempRaw = (int16_t)((b[6] << 8) | b[7]);
    if (havePrev) {
      int32_t dx = a[0] - prev[0], dy = a[1] - prev[1], dz = a[2] - prev[2];
      int32_t j = (int32_t)sqrtf((float)(dx * dx + dy * dy + dz * dz));
      if (j > maxJerkRaw) maxJerkRaw = j;
    }
    prev[0] = a[0]; prev[1] = a[1]; prev[2] = a[2];
    havePrev = true;
    for (int i = 0; i < 3; i++) { sum[i] += a[i]; sum[3 + i] += g[i]; }
    if (++sub >= SUB) {
      hisar::Sample s;
      for (int i = 0; i < 6; i++) { s.v[i] = (int16_t)(sum[i] / SUB); sum[i] = 0; }
      s.jerk = hisar::encodeJerk((float)maxJerkRaw / 2048.0f);   // ham birim 1/2048 g
      maxJerkRaw = 0;
      uint32_t pk;
      portENTER_CRITICAL(&micMux);
      pk = micPeak; micPeak = 0;
      portEXIT_CRITICAL(&micMux);
      s.snd = micOk ? hisar::encodeSnd(pk) : 0;
      sub = 0;
      ring.push(s);
    }
  }
}

// ---------------------------------------------------------------- mikrofon
static bool micSetup() {
  i2s_config_t c;
  memset(&c, 0, sizeof(c));
  c.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM);
  c.sample_rate = MIC_RATE;
  c.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
  c.channel_format = I2S_CHANNEL_FMT_ALL_RIGHT;
  c.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  c.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
  c.dma_buf_count = 4;
  c.dma_buf_len = MIC_BLOCK;
  if (i2s_driver_install(I2S_NUM_0, &c, 0, nullptr) != ESP_OK) return false;
  i2s_pin_config_t pin;
  memset(&pin, 0, sizeof(pin));
  pin.mck_io_num = I2S_PIN_NO_CHANGE;   // GPIO0 saat cikisi olarak kullanilmamali (PDM saati orada)
  pin.bck_io_num = I2S_PIN_NO_CHANGE;
  pin.ws_io_num = 0;                     // PDM saat (CLK)
  pin.data_out_num = I2S_PIN_NO_CHANGE;
  pin.data_in_num = 34;                  // PDM veri
  if (i2s_set_pin(I2S_NUM_0, &pin) != ESP_OK ||
      i2s_set_clk(I2S_NUM_0, MIC_RATE, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO) != ESP_OK) {
    i2s_driver_uninstall(I2S_NUM_0);
    return false;
  }
  return true;
}

static void micTask(void*) {
  static int16_t buf[MIC_BLOCK];
  const float a = 0.9428f;               // ~300 Hz yuksek geciren (tik sesi yuksek frekanslidir)
  float hp = 0, prev = 0;
  bool first = true;
  int16_t mn = 32767, mx = -32768;       // takili kalma denetimi (hep ayni deger = mikrofon yok)
  uint32_t lastOk = millis(), winStart = lastOk;
  for (;;) {
    size_t got = 0;
    if (i2s_read(I2S_NUM_0, buf, sizeof(buf), &got, pdMS_TO_TICKS(20)) != ESP_OK || got < 2) {
      if (millis() - lastOk > 500) micOk = false;
      continue;
    }
    int n = (int)(got / 2);
    uint32_t pk = 0;
    for (int i = 0; i < n; i++) {
      int16_t x = buf[i];
      if (x < mn) mn = x;
      if (x > mx) mx = x;
      if (first) { prev = x; first = false; }
      hp = a * (hp + (float)x - prev);
      prev = (float)x;
      uint32_t m = (uint32_t)(hp < 0 ? -hp : hp);
      if (m > pk) pk = m;
    }
    lastOk = millis();
    portENTER_CRITICAL(&micMux);
    if (pk > micPeak) micPeak = pk;
    portEXIT_CRITICAL(&micMux);
    if (lastOk - winStart >= 2000) { micOk = mx > mn; mn = 32767; mx = -32768; winStart = lastOk; }
    else if (!micOk && mx > mn && lastOk - winStart >= 200) micOk = true;
  }
}

// ---------------------------------------------------------------- gonderim
// Ham bildirim: yigin tamponu yoksa false doner (veri halka tamponda bekler, kaybolmaz)
static bool notifyRaw(const uint8_t* data, size_t len) {
  uint16_t h = connHandle;
  if (!bleConnected || !subscribed || h == 0xFFFF || !notifyChr) return false;
  if (os_msys_num_free() < MIN_FREE_BUF) return false;
  struct os_mbuf* om = ble_hs_mbuf_from_flat(data, len);
  if (!om) return false;
  return ble_gattc_notify_custom(h, notifyChr->getHandle(), om) == 0;  // om her durumda tuketilir
}

static void serviceStream(uint32_t nowMs) {
  if (otaActive) return;   // guncelleme sirasinda Bluetooth yazilim aktarimina ayrilir
  stream.service(ring, bleConnected && subscribed, peerMtu, nowMs,
                 [](const uint8_t* p, size_t n) { return notifyRaw(p, n); });
}

// ---------------------------------------------------------------- yazilim guncelleme
// Iki bolumlu OTA: yeni yazilim bos bolume yazilir; dogrulanirsa secilir, yoksa eski calisir.
struct EspFlash {
  esp_ota_handle_t h = 0;
  const esp_partition_t* part = nullptr;
  uint32_t capacity() {
    const esp_partition_t* p = esp_ota_get_next_update_partition(nullptr);
    return p ? p->size : 0;
  }
  bool begin(uint32_t size) {
    abort();
    part = esp_ota_get_next_update_partition(nullptr);
    if (!part) return false;
    return esp_ota_begin(part, OTA_WITH_SEQUENTIAL_WRITES, &h) == ESP_OK;   // silme parca parca
  }
  bool write(const uint8_t* d, size_t n) { return h && esp_ota_write(h, d, n) == ESP_OK; }
  bool finish() {
    if (!h) return false;
    esp_err_t e = esp_ota_end(h);   // resim ve SHA-256 dogrulamasi
    h = 0;
    if (e != ESP_OK) return false;
    return esp_ota_set_boot_partition(part) == ESP_OK;
  }
  void abort() { if (h) { esp_ota_abort(h); h = 0; } }
};

static bool notifyReliable(const uint8_t* p, size_t n) {
  for (int i = 0; i < 60; i++) {
    if (notifyRaw(p, n)) return true;
    if (!bleConnected) return false;
    vTaskDelay(pdMS_TO_TICKS(3));
  }
  return false;
}

static void otaTask(void*) {
  static OtaMsg m;
  EspFlash fl;
  for (;;) {
    if (xQueueReceive(otaQ, &m, pdMS_TO_TICKS(500)) == pdTRUE) {
      otaLastMsg = millis();
      if (m.d[0] == 0x10) otaOverflow = false;
      ota.handle(m.d, m.n, fl, [](const uint8_t* p, size_t n) { notifyReliable(p, n); });
      otaActive = ota.state == hisar::OtaRx::READY || ota.state == hisar::OtaRx::DONE;
      if (ota.state == hisar::OtaRx::DONE && !otaDoneAt) otaDoneAt = millis() | 1;
    } else if (ota.state == hisar::OtaRx::READY && (!bleConnected || millis() - otaLastMsg > 30000)) {
      fl.abort();                    // baglanti koptu ya da gonderen sustu: eski yazilim kalir
      ota.state = hisar::OtaRx::IDLE;
      otaActive = false;
    }
  }
}

static int8_t readRssi() {
  int8_t r = 0;
  uint16_t h = connHandle;
  if (!bleConnected || h == 0xFFFF) return -128;
  if (ble_gap_conn_rssi(h, &r) != 0) return -128;
  return r;
}

static uint16_t connIntervalUnits() {
  uint16_t h = connHandle;
  if (!bleConnected || h == 0xFFFF) return 0;
  struct ble_gap_conn_desc d;
  if (ble_gap_conn_find(h, &d) != 0) return 0;
  return d.conn_itvl;
}

static int    lastBattery = 0;
static bool   lastCharging = false;
static int8_t lastRssi = -128;

static void sendStatus() {
  hisar::StatusInfo s;
  s.bat = (uint8_t)(lastBattery < 0 ? 0 : lastBattery > 100 ? 100 : lastBattery);
  s.charging = lastCharging;
  s.imuOk = imuOk;
  s.lowBattery = lastBattery <= 10 && !lastCharging;
  s.streaming = stream.streaming;
  s.micOk = micOk;
  s.fw = FW_VERSION;
  s.rssi = lastRssi;
  s.tempC = hisar::tempFromRaw(imuTempRaw);
  int mv = M5.Power.getBatteryVoltage();
  s.mv = (uint16_t)(mv < 0 ? 0 : mv);
  s.bri = cfg.bri; s.scr = cfg.scr; s.vol = cfg.vol; s.off = cfg.off; s.no = cfg.no;
  uint32_t e = imuErrors;
  s.imuErr = (uint8_t)(e > 255 ? 255 : e);
  s.head = ring.head;
  s.bootId = bootId;
  s.overflow = (uint16_t)(stream.overflow > 65535 ? 65535 : stream.overflow);
  s.itv = connIntervalUnits();
  s.mtu = peerMtu;
  uint8_t st[3 + hisar::STATUS_LEN];
  size_t n = hisar::buildStatus(st, s);
  if (notifyRaw(st, n)) imuErrors = 0;
}

// ---------------------------------------------------------------- Ekran
static M5Canvas canvas(&M5.Display);
static uint32_t rateShown = 0;
static uint32_t screenOnUntil = 0;
static bool     screenDim = false;
static uint32_t identifyUntil = 0;
static uint32_t lastActivity = 0;

static void wakeScreen(uint32_t now) {
  screenOnUntil = cfg.scr == 0 ? 0xFFFFFFFF : now + (uint32_t)cfg.scr * 1000;
}

static void drawBars(int x, int y, int8_t rssi) {
  int lv = rssi == -128 ? 0 : rssi > -60 ? 4 : rssi > -70 ? 3 : rssi > -80 ? 2 : rssi > -90 ? 1 : 0;
  for (int i = 0; i < 4; i++) {
    int h = 4 + i * 4;
    uint16_t c = i < lv ? 0x3FE8 : 0x4208;
    canvas.fillRect(x + i * 6, y + 16 - h, 4, h, c);
  }
}

static void drawScreen(uint32_t now) {
  canvas.fillSprite(0x0000);
  if (otaActive) {
    uint32_t sz = ota.size ? ota.size : 1;
    int pct = (int)((uint64_t)ota.offset * 100 / sz);
    canvas.setTextDatum(top_left);
    canvas.setFont(&fonts::FreeSansBold12pt7b);
    canvas.setTextColor(0x2EB9);
    canvas.drawString(ota.state == hisar::OtaRx::DONE ? "GUNCELLENDI" : "GUNCELLENIYOR", 8, 18);
    canvas.setFont(&fonts::FreeSans9pt7b);
    canvas.setTextColor(0xDEFB);
    canvas.drawString(ota.state == hisar::OtaRx::DONE ? "Yeniden basliyor..." : "Sensoru kapatma", 8, 52);
    canvas.drawRect(8, 86, canvas.width() - 16, 20, 0xDEFB);
    canvas.fillRect(10, 88, (canvas.width() - 20) * pct / 100, 16, 0x2EB9);
    canvas.drawString(String("%") + String(pct), 8, 112);
    canvas.pushSprite(0, 0);
    return;
  }
  if (identifyUntil && (int32_t)(identifyUntil - now) > 0) {
    bool on = ((now / 250) % 2) == 0;
    canvas.fillSprite(on ? 0x2EB9 : 0x0000);
    canvas.setTextDatum(middle_center);
    canvas.setFont(&fonts::FreeSansBold18pt7b);
    canvas.setTextColor(on ? 0x0000 : 0x2EB9);
    canvas.drawString("BURADAYIM", canvas.width() / 2, canvas.height() / 2 - 8);
    canvas.setFont(&fonts::FreeSans9pt7b);
    canvas.drawString(deviceName(), canvas.width() / 2, canvas.height() / 2 + 26);
    canvas.pushSprite(0, 0);
    canvas.setTextDatum(top_left);
    return;
  }
  canvas.setTextDatum(top_left);
  canvas.setFont(&fonts::FreeSansBold9pt7b);
  canvas.setTextColor(0x2EB9);  // turkuaz
  canvas.drawString("HISAR TETIK", 8, 6);
  canvas.setFont(&fonts::Font0);
  canvas.setTextColor(0x8C71);
  canvas.setTextDatum(top_right);
  canvas.drawString(String("No ") + String((int)cfg.no) + "  v" + String(FW_VERSION) + (micOk ? "  MIK" : ""), canvas.width() - 8, 11);
  canvas.setTextDatum(top_left);

  canvas.setFont(&fonts::FreeSansBold12pt7b);
  if (!imuOk) {
    canvas.setTextColor(0xF8A6);
    canvas.drawString("SENSOR HATASI", 8, 36);
  } else if (bleConnected) {
    canvas.setTextColor(0x3FE8);
    canvas.drawString("BAGLI", 8, 36);
    drawBars(canvas.width() - 34, 38, lastRssi);
  } else {
    canvas.setTextColor(0xFE60);
    canvas.drawString("BEKLIYOR", 8, 36);
  }
  canvas.setFont(&fonts::FreeSans9pt7b);
  canvas.setTextColor(0xDEFB);
  if (bleConnected) {
    String l = String(rateShown) + " olcum/sn";
    if (lastRssi != -128) l += "   " + String((int)lastRssi) + " dBm";
    canvas.drawString(l, 8, 70);
  } else if (cfg.off && !lastCharging) {
    uint32_t idle = (now - lastActivity) / 1000;
    uint32_t limit = (uint32_t)cfg.off * 60;
    uint32_t left = idle >= limit ? 0 : limit - idle;
    canvas.drawString(String("Kapanma: ") + String((unsigned long)((left + 59) / 60)) + " dk", 8, 70);
  } else {
    canvas.drawString("Uygulamada Sensor'e bas", 8, 70);
  }
  // pil
  int bx = 8, by = 104, bw = 60, bh = 18;
  canvas.drawRect(bx, by, bw, bh, 0xDEFB);
  canvas.fillRect(bx + bw, by + 5, 3, bh - 10, 0xDEFB);
  int bat = lastBattery < 0 ? 0 : lastBattery > 100 ? 100 : lastBattery;
  int fill = (bw - 4) * bat / 100;
  uint16_t col = bat > 30 ? 0x3FE8 : bat > 15 ? 0xFE60 : 0xF8A6;
  canvas.fillRect(bx + 2, by + 2, fill, bh - 4, col);
  canvas.setTextColor(bat <= 10 && !lastCharging ? 0xF8A6 : 0xDEFB);
  canvas.drawString(String("%") + String(bat) + (lastCharging ? " sarj" : bat <= 10 ? " PIL ZAYIF" : ""), bx + bw + 10, by);
  canvas.pushSprite(0, 0);
}

static void showMessage(const char* msg) {
  M5.Display.setBrightness(briValue(cfg.bri));
  canvas.fillSprite(0x0000);
  canvas.setTextDatum(middle_center);
  canvas.setFont(&fonts::FreeSansBold12pt7b);
  canvas.setTextColor(0xDEFB);
  canvas.drawString(msg, canvas.width() / 2, canvas.height() / 2);
  canvas.pushSprite(0, 0);
  canvas.setTextDatum(top_left);
}

static void powerOffNow() {
  showMessage("KAPANIYOR");
  M5.Speaker.tone(900, 200);
  delay(600);
  M5.Power.powerOff();
}

// ---------------------------------------------------------------- komutlar
static bool wantStatus = false;

static void handleCommand(const CmdMsg& m, uint32_t now) {
  hisar::Command c = hisar::parseCommand(m.d, m.n);
  switch (c.type) {
    case hisar::Command::TONE:
      M5.Speaker.tone(c.freq, c.ms);
      break;
    case hisar::Command::SET: {
      bool rename = hisar::applySetting(cfg, c.key, c.val);
      M5.Display.setBrightness(briValue(cfg.bri));
      screenDim = false;
      M5.Speaker.setVolume(volValue(cfg.vol));
      wakeScreen(now);
      lastActivity = now;
      saveSettings();
      wantStatus = true;
      if (rename) {
        showMessage("YENIDEN BASLIYOR");
        delay(400);
        ESP.restart();
      }
      break;
    }
    case hisar::Command::IDENTIFY:
      identifyUntil = now + 3000;
      wakeScreen(now);
      break;
    case hisar::Command::RESTART:
      showMessage("YENIDEN BASLIYOR");
      delay(300);
      ESP.restart();
      break;
    case hisar::Command::POWEROFF:
      powerOffNow();
      break;
    case hisar::Command::STATUS:
      wantStatus = true;
      break;
    case hisar::Command::START:
      stream.request(c.mode, c.seq, now, c.flags);
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------- Kurulum
void setup() {
  auto mc = M5.config();
  mc.internal_imu = true;
  mc.internal_spk = true;
  mc.internal_mic = false;          // mikrofon dogrudan I2S0 ile okunur
  M5.begin(mc);
  { auto sc = M5.Speaker.config(); sc.i2s_port = I2S_NUM_1; M5.Speaker.config(sc); }   // bip I2S1'de: I2S0 mikrofonun
  loadSettings();
  M5.Display.setRotation(1);
  M5.Display.setBrightness(briValue(cfg.bri));
  canvas.setColorDepth(16);
  canvas.createSprite(M5.Display.width(), M5.Display.height());
  M5.Speaker.setVolume(volValue(cfg.vol));
  bootId = (uint16_t)(esp_random() & 0xFFFF);
  cmdQ = xQueueCreate(16, sizeof(CmdMsg));
  otaQ = xQueueCreate(48, sizeof(OtaMsg));
  // Yeni yazilimla ilk acilis: calisan bolumu gecerli say (geri donus etkinse)
  esp_ota_mark_app_valid_cancel_rollback();

  imuOk = imuSetup();
  micReady = micSetup();
  if (micReady) xTaskCreatePinnedToCore(micTask, "mic", 3072, nullptr, 3, nullptr, 1);
  xTaskCreatePinnedToCore(imuTask, "imu", 4096, nullptr, 5, nullptr, 1);
  xTaskCreatePinnedToCore(otaTask, "ota", 6144, nullptr, 2, nullptr, 1);

  NimBLEDevice::init(deviceName().c_str());
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
  NimBLEDevice::setMTU(185);
  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  server->advertiseOnDisconnect(true);
  NimBLEService* svc = server->createService(SVC_UUID);
  notifyChr = svc->createCharacteristic(NOTIFY_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  notifyChr->setCallbacks(new NotifyCB());
  NimBLECharacteristic* wr = svc->createCharacteristic(WRITE_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  wr->setCallbacks(new WriteCB());
  svc->start();
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  adv->setMinInterval(32);   // 20 ms: telefon sensoru hizli bulur, kopunca hizli baglanir
  adv->setMaxInterval(64);   // 40 ms
  adv->start();

  uint32_t now = millis();
  wakeScreen(now);
  lastActivity = now;
  M5.Speaker.tone(2200, 80);
}

// ---------------------------------------------------------------- Dongu
static uint32_t lastRateT = 0, lastDrawT = 0, lastStatusT = 0, lastPowerT = 0, lastLedT = 0;
static uint32_t btnBDown = 0;
static uint32_t lastSent = 0;
static bool     wasConnected = false;

void loop() {
  uint32_t now = millis();

  CmdMsg m;
  while (xQueueReceive(cmdQ, &m, 0) == pdTRUE) handleCommand(m, now);

  // Akis baslamadan once durum paketi gider: uygulama acilis numarasindan
  // sensorun yeniden basladigini anlar ve sira numaralarini sifirlar.
  if (bleConnected && subscribed && !stream.streaming) {
    lastStatusT = now;
    sendStatus();
  }
  serviceStream(now);
  M5.update();

  if (now - lastPowerT >= 1000 || lastPowerT == 0) {
    lastPowerT = now;
    lastBattery = M5.Power.getBatteryLevel();
    lastCharging = M5.Power.isCharging() == m5::Power_Class::is_charging;
    lastRssi = readRssi();
  }

  if (bleConnected != wasConnected) {
    wasConnected = bleConnected;
    lastActivity = now;
    wakeScreen(now);
    M5.Speaker.tone(bleConnected ? 2600 : 1200, 90);
    if (!bleConnected) stream.onDisconnect();
    if (!bleConnected && otaActive && ota.state == hisar::OtaRx::READY) { OtaMsg a; a.n = 1; a.d[0] = 0x13; xQueueSend(otaQ, &a, 0); }
  }
  if (bleConnected) lastActivity = now;

  if (now - lastRateT >= 1000) {
    rateShown = stream.sent - lastSent;
    lastSent = stream.sent;
    lastRateT = now;
  }

  if (bleConnected && subscribed && (wantStatus || now - lastStatusT >= 1000)) {
    wantStatus = false;
    lastStatusT = now;
    sendStatus();
  }

  // Sensoru bul: ses + isik + yanip sonen ekran
  if (identifyUntil) {
    if ((int32_t)(identifyUntil - now) > 0) {
      if (now - lastLedT >= 250) {
        lastLedT = now;
        bool on = ((now / 250) % 2) == 0;
        M5.Power.setLed(on ? 255 : 0);
        if (on && ((now / 500) % 2) == 0) M5.Speaker.tone(2800, 90);
      }
    } else {
      identifyUntil = 0;
      M5.Power.setLed(0);
    }
  }

  // On dugme: ekrani aydinlat
  if (M5.BtnA.wasPressed()) { wakeScreen(now); lastActivity = now; }
  // Yan dugme 2 sn: kapat
  if (M5.BtnB.isPressed()) {
    if (!btnBDown) btnBDown = now;
    if (now - btnBDown > 2000) powerOffNow();
  } else {
    btnBDown = 0;
  }

  // Otomatik kapanma: bagli degil, sarjda degil ve sure doldu
  if (cfg.off && !bleConnected && !lastCharging && now - lastActivity > (uint32_t)cfg.off * 60000UL) powerOffNow();

  bool wantDim = screenOnUntil != 0xFFFFFFFF && (int32_t)(now - screenOnUntil) > 0 && !identifyUntil;
  if (wantDim != screenDim) {
    screenDim = wantDim;
    M5.Display.setBrightness(screenDim ? 6 : briValue(cfg.bri));
  }

  // Guncelleme tamam: yaniti gonderip yeni yazilimla yeniden basla
  if (otaDoneAt && now - otaDoneAt > 900) {
    showMessage("YENIDEN BASLIYOR");
    delay(200);
    ESP.restart();
  }
  if (otaActive) wakeScreen(now);

  if (now - lastDrawT >= (identifyUntil || otaActive ? 125u : 500u)) {
    lastDrawT = now;
    drawScreen(now);
  }
  serviceStream(millis());
  delay(1);
}
