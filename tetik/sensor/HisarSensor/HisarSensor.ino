// =====================================================================
//  HISAR TETIK - M5StickC Plus2 sensor yazilimi (surum 1)
// ---------------------------------------------------------------------
//  Ne yapar:
//   * MPU6886 hareket sensorunu (ivme + jiroskop) saniyede 1000 kez okur.
//   * 5 olcumun ortalamasini alip saniyede 200 olcum uretir.
//   * Her olcumde, o 5 ms icindeki en buyuk ani sarsintiyi (tetik "tik"i,
//     geri tepme) ayrica kaydeder; boylece kisa darbeler kacmaz.
//   * Olcumleri Bluetooth (BLE) ile HISAR TETIK uygulamasina gonderir.
//   * Ekranda baglanti, olcum hizi ve pil durumunu gosterir.
//
//  Dugmeler:
//   * On dugme (A): ekrani 20 saniye aydinlatir.
//   * Yan dugme (B) 2 saniye basili: cihazi kapatir.
//
//  Paketler (uygulamadaki ayristirici ile ayni):
//   0x55 0x62 n seqL seqH + n x [ax ay az gx gy gz (int16 LE) + darbe(u8)]
//        ivme: deger/2048 g (+-16 g)   jiroskop: deger/16.384 derece/sn
//        darbe: deger*0.04 g (1 kHz ardisik ivme farkinin 5 ms'deki en buyugu)
//   0x55 0x64 seqL seqH + 1 olcum (MTU kucukse, 17 bayt)
//   0x55 0x63 pil% sarj surum imu   (durum, 2 saniyede bir)
//  Uygulamadan gelen komut (yazma ozelligi):
//   0x01 frekansH frekansL sure/10ms  -> sensorun buzzerinda bip
// =====================================================================

#include <Wire.h>        // M5GFX icin gerekli (I2C)
#include <M5Unified.h>
#include <NimBLEDevice.h>

#define FW_VERSION 1
#define DEVICE_NAME "HISAR-SENSOR"
#define SVC_UUID    "0000ffe5-0000-1000-8000-00805f9a34fb"
#define NOTIFY_UUID "0000ffe4-0000-1000-8000-00805f9a34fb"
#define WRITE_UUID  "0000ffe9-0000-1000-8000-00805f9a34fb"

static constexpr uint8_t  IMU_ADDR     = 0x68;
static constexpr uint32_t I2C_FREQ     = 400000;
static constexpr int      SUB          = 5;    // 1 kHz -> 200 Hz
static constexpr int      BATCH        = 4;    // bir pakette 4 olcum
static constexpr int      SAMPLE_BYTES = 13;
static constexpr int      BATCH_BYTES  = 5 + BATCH * SAMPLE_BYTES;  // 57

struct Sample {
  int16_t  v[6];
  uint8_t  jerk;
  uint16_t seq;
};

static QueueHandle_t sampleQ = nullptr;
static NimBLECharacteristic* notifyChr = nullptr;
static volatile bool     bleConnected = false;
static volatile uint16_t peerMtu = 23;
static volatile bool     imuOk = false;
static volatile uint32_t imuErrors = 0;
static volatile uint16_t toneFreq = 0;
static volatile uint16_t toneMs = 0;

// ---------------------------------------------------------------- BLE
class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, ble_gap_conn_desc* desc) override {
    bleConnected = true;
    // iOS kurallarina uygun aralik: 15-30 ms, gecikme 0, zaman asimi 4 sn
    s->updateConnParams(desc->conn_handle, 12, 24, 0, 400);
  }
  void onDisconnect(NimBLEServer* s, ble_gap_conn_desc* desc) override {
    bleConnected = false;
    peerMtu = 23;
  }
  void onMTUChange(uint16_t mtu, ble_gap_conn_desc* desc) override { peerMtu = mtu; }
};

class WriteCB : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    NimBLEAttValue val = c->getValue();
    const uint8_t* d = val.data();
    if (val.length() >= 4 && d[0] == 0x01) {
      toneFreq = (uint16_t)((d[1] << 8) | d[2]);
      toneMs = (uint16_t)(d[3] * 10);
    }
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
  static const uint8_t cfg[][2] = {
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
  for (auto& c : cfg) {
    int retry = 8;
    do { imuWrite(c[0], c[1]); delay(2); } while (imuRead8(c[0]) != c[1] && --retry);
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
  uint16_t seq = 0;
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    vTaskDelayUntil(&last, 1);  // 1 ms (FreeRTOS 1000 Hz)
    if (!M5.In_I2C.readRegister(IMU_ADDR, 0x3B, b, 14, I2C_FREQ)) {
      imuErrors++;
      continue;
    }
    int16_t a[3] = {(int16_t)((b[0] << 8) | b[1]), (int16_t)((b[2] << 8) | b[3]), (int16_t)((b[4] << 8) | b[5])};
    int16_t g[3] = {(int16_t)((b[8] << 8) | b[9]), (int16_t)((b[10] << 8) | b[11]), (int16_t)((b[12] << 8) | b[13])};
    if (havePrev) {
      int32_t dx = a[0] - prev[0], dy = a[1] - prev[1], dz = a[2] - prev[2];
      int32_t j = (int32_t)sqrtf((float)(dx * dx + dy * dy + dz * dz));
      if (j > maxJerkRaw) maxJerkRaw = j;
    }
    prev[0] = a[0]; prev[1] = a[1]; prev[2] = a[2];
    havePrev = true;
    for (int i = 0; i < 3; i++) { sum[i] += a[i]; sum[3 + i] += g[i]; }
    if (++sub >= SUB) {
      Sample s;
      for (int i = 0; i < 6; i++) { s.v[i] = (int16_t)(sum[i] / SUB); sum[i] = 0; }
      // 0.04 g birim: ham/2048/0.04 = ham/81.92
      int32_t jb = (int32_t)((float)maxJerkRaw / 81.92f + 0.5f);
      s.jerk = (uint8_t)(jb > 255 ? 255 : jb);
      s.seq = seq++;
      maxJerkRaw = 0;
      sub = 0;
      xQueueSend(sampleQ, &s, 0);  // kuyruk doluysa olcum atlanir, seq boslugu uygulamaca gorulur
    }
  }
}

// ---------------------------------------------------------------- Ekran
static M5Canvas canvas(&M5.Display);
static uint32_t rateShown = 0;
static uint32_t screenOnUntil = 0;
static bool screenDim = false;

static void drawScreen(int battery, bool charging) {
  canvas.fillSprite(0x0000);
  canvas.setTextDatum(top_left);
  canvas.setFont(&fonts::FreeSansBold9pt7b);
  canvas.setTextColor(0x2EB9);  // turkuaz
  canvas.drawString("HISAR TETIK", 8, 6);
  canvas.setFont(&fonts::Font0);
  canvas.setTextColor(0x8C71);
  canvas.drawString("SENSOR v" + String(FW_VERSION), 168, 11);

  canvas.setFont(&fonts::FreeSansBold12pt7b);
  if (!imuOk) {
    canvas.setTextColor(0xF8A6);
    canvas.drawString("SENSOR HATASI", 8, 40);
  } else if (bleConnected) {
    canvas.setTextColor(0x3FE8);
    canvas.drawString("BAGLI", 8, 40);
  } else {
    canvas.setTextColor(0xFE60);
    canvas.drawString("BEKLIYOR", 8, 40);
  }
  canvas.setFont(&fonts::FreeSans9pt7b);
  canvas.setTextColor(0xDEFB);
  if (bleConnected) {
    canvas.drawString(String(rateShown) + " olcum/sn", 8, 74);
  } else {
    canvas.drawString("Uygulamada Sensor'e bas", 8, 74);
  }
  // pil
  int bx = 8, by = 106, bw = 60, bh = 18;
  canvas.drawRect(bx, by, bw, bh, 0xDEFB);
  canvas.fillRect(bx + bw, by + 5, 3, bh - 10, 0xDEFB);
  int fill = (bw - 4) * (battery < 0 ? 0 : battery > 100 ? 100 : battery) / 100;
  uint16_t col = battery > 30 ? 0x3FE8 : battery > 15 ? 0xFE60 : 0xF8A6;
  canvas.fillRect(bx + 2, by + 2, fill, bh - 4, col);
  canvas.setFont(&fonts::FreeSans9pt7b);
  canvas.setTextColor(0xDEFB);
  canvas.drawString(String("%") + String(battery) + (charging ? " sarj" : ""), bx + bw + 10, by);
  canvas.pushSprite(0, 0);
}

// ---------------------------------------------------------------- Kurulum
void setup() {
  auto cfg = M5.config();
  cfg.internal_imu = true;
  cfg.internal_spk = true;
  M5.begin(cfg);
  M5.Display.setRotation(1);
  M5.Display.setBrightness(90);
  canvas.setColorDepth(16);
  canvas.createSprite(M5.Display.width(), M5.Display.height());
  M5.Speaker.setVolume(160);

  imuOk = imuSetup();
  sampleQ = xQueueCreate(64, sizeof(Sample));
  xTaskCreatePinnedToCore(imuTask, "imu", 4096, nullptr, 5, nullptr, 1);

  NimBLEDevice::init(DEVICE_NAME);
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
  NimBLEDevice::setMTU(185);
  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  server->advertiseOnDisconnect(true);
  NimBLEService* svc = server->createService(SVC_UUID);
  notifyChr = svc->createCharacteristic(NOTIFY_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  NimBLECharacteristic* wr = svc->createCharacteristic(WRITE_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  wr->setCallbacks(new WriteCB());
  svc->start();
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  adv->start();

  screenOnUntil = millis() + 20000;
  M5.Speaker.tone(2200, 80);
}

// ---------------------------------------------------------------- Dongu
static uint8_t  batchBuf[BATCH_BYTES];
static int      batchN = 0;
static uint16_t batchSeq = 0;
static uint32_t sentCount = 0;
static uint32_t lastRateT = 0, lastDrawT = 0, lastStatusT = 0;
static uint32_t btnBDown = 0;
static bool     wasConnected = false;

static inline void putSample(uint8_t* p, const Sample& s) {
  for (int i = 0; i < 6; i++) {
    p[i * 2] = (uint8_t)(s.v[i] & 0xFF);
    p[i * 2 + 1] = (uint8_t)((s.v[i] >> 8) & 0xFF);
  }
  p[12] = s.jerk;
}

void loop() {
  Sample s;
  while (xQueueReceive(sampleQ, &s, 0) == pdTRUE) {
    if (!bleConnected || !notifyChr) { batchN = 0; continue; }
    if (peerMtu >= BATCH_BYTES + 3) {
      if (batchN == 0) batchSeq = s.seq;
      putSample(batchBuf + 5 + batchN * SAMPLE_BYTES, s);
      if (++batchN == BATCH) {
        batchBuf[0] = 0x55; batchBuf[1] = 0x62; batchBuf[2] = BATCH;
        batchBuf[3] = (uint8_t)(batchSeq & 0xFF); batchBuf[4] = (uint8_t)(batchSeq >> 8);
        notifyChr->setValue(batchBuf, BATCH_BYTES);
        notifyChr->notify();
        sentCount += BATCH;
        batchN = 0;
      }
    } else {
      uint8_t p[17];
      p[0] = 0x55; p[1] = 0x64;
      p[2] = (uint8_t)(s.seq & 0xFF); p[3] = (uint8_t)(s.seq >> 8);
      putSample(p + 4, s);
      notifyChr->setValue(p, sizeof(p));
      notifyChr->notify();
      sentCount++;
    }
  }

  uint32_t now = millis();
  M5.update();

  if (bleConnected != wasConnected) {
    wasConnected = bleConnected;
    screenOnUntil = now + 20000;
    M5.Speaker.tone(bleConnected ? 2600 : 1200, 90);
  }

  if (now - lastRateT >= 1000) {
    rateShown = sentCount;
    sentCount = 0;
    lastRateT = now;
  }

  int battery = M5.Power.getBatteryLevel();
  bool charging = M5.Power.isCharging() == m5::Power_Class::is_charging;

  if (bleConnected && notifyChr && now - lastStatusT >= 2000) {
    lastStatusT = now;
    uint8_t st[6] = {0x55, 0x63, (uint8_t)(battery < 0 ? 0 : battery > 100 ? 100 : battery), (uint8_t)(charging ? 1 : 0), FW_VERSION, (uint8_t)(imuOk ? 1 : 0)};
    notifyChr->setValue(st, sizeof(st));
    notifyChr->notify();
  }

  if (toneMs) {
    M5.Speaker.tone(toneFreq, toneMs);
    toneMs = 0;
  }

  // On dugme: ekrani aydinlat
  if (M5.BtnA.wasPressed()) screenOnUntil = now + 20000;
  // Yan dugme 2 sn: kapat
  if (M5.BtnB.isPressed()) {
    if (!btnBDown) btnBDown = now;
    if (now - btnBDown > 2000) {
      canvas.fillSprite(0x0000);
      canvas.setFont(&fonts::FreeSansBold12pt7b);
      canvas.setTextColor(0xDEFB);
      canvas.drawString("KAPANIYOR", 8, 50);
      canvas.pushSprite(0, 0);
      M5.Speaker.tone(900, 200);
      delay(600);
      M5.Power.powerOff();
    }
  } else {
    btnBDown = 0;
  }

  bool wantDim = (int32_t)(now - screenOnUntil) > 0;
  if (wantDim != screenDim) {
    screenDim = wantDim;
    M5.Display.setBrightness(screenDim ? 12 : 90);
  }

  if (now - lastDrawT >= 500) {
    lastDrawT = now;
    drawScreen(battery, charging);
  }
  delay(2);
}
