# HİSAR TETİK – T1 Kaynak Kod Denetimi

- **Tarih:** 20 Kasım 2026
- **Dal:** `tetik-next` (temel: `main` @ `fa14316`; HİSAR TETİK kodu en son `eb51cf9` = sürüm 28)
- **Kapsam:** Talimattaki T1 maddeleri. Bu aşamada **uygulama koduna dokunulmadı**. Eklenenler: test takımını her push ve Pull Request'te çalıştıran CI iş akışı (bulgu B-05) ve rastgele sonuç veren bir testin düzeltmesi (bulgu B-19).
- **Önem ölçeği:** Kritik · Yüksek · Orta · Düşük · Bilgi

## 1. Özet

| | Sonuç |
|---|---|
| Kritik bulgu | Yok |
| Yüksek | 2 (Android imza anahtarı depoda açık; iPhone uygulaması 7 günde bir açılmaz oluyor) |
| Orta | 7 |
| Düşük | 8 (biri T1'de bulunup düzeltilen kararsız test: B-19) |
| Bilgi | 2 (incelenip sorun bulunmayan alanlar: XSS, WebView ayarları) |
| Test takımı | 580 (+ sensör yazılımı testi) denetim geçti, 0 başarısız (ayrıntı: bölüm 5). İlk tam çalıştırmada 1 başarısız vardı: uygulama değil test hatası (B-19), düzeltildi |
| Sensör yazılımı | Yeniden derlendi; yayımlanan sürüm 7 ile **bayt bayt aynı** |
| Açılış taraması | Telefon, yatay tablet ve bilgisayar görünümünde 13 ayar sayfası açıldı: 0 JavaScript hatası, yatay taşma yok |
| Statik inceleme (ESLint) | 11 kullanılmayan değişken veya işlev; 2 yanlış alarm; başka hata yok |
| Talimatın 12. kuralı | Uygulamanın ana işleviyle çelişiyordu; kullanıcı mevcut işlevlerin korunmasına karar verdi (bölüm 6) |

## 2. Gerçek mimari

### 2.1 Bileşenler

| Bileşen | Dosyalar | Görev |
|---|---|---|
| Uygulama (tek dosya) | `tetik/src/app.html` (4030 satır, 425 KB; HTML + CSS + JS; 403 üst düzey işlev: 346 `function` bildirimi + 57 işlev değişkeni) | Bütün ekranlar, sensör protokolü, atış algılama, analiz, kayıt, raporlar |
| Derleme | `tetik/build.py` | `app.html`'den `tetik/index.html` (web, iPhone) ve `tetik/apk/index.html` (Android) üretir |
| iPhone kabuğu | `tetik/ios/HisarTetik/WebViewController.swift`, `Ble.swift`, `PageStore.swift` | WKWebView, CoreBluetooth köprüsü, sayfa güncellemesi |
| Android kabuğu | `tetik/android/app/src/main/java/com/hisar/tetik/MainActivity.java`, `Ble.java`, `PageStore.java`, `SaatAlici.java`, `ShareProvider.java`; ortak köprü `assets/www/bridge.js` | WebView (WebViewAssetLoader), BLE köprüsü, sayfa güncellemesi, saat, paylaşım |
| Sensör yazılımı | `tetik/sensor/HisarSensor/HisarSensor.ino`, `HisarProtocol.h` | M5StickC Plus2: 1 kHz IMU, NimBLE, iki bölümlü OTA, Grove lazer |
| Sensör ikili dosyaları | `tetik/firmware/` (`ota.json`, `manifest.json`, v6–v7) | Telefondan ve PC'den güncelleme |
| PC aracı | `tetik/pc/hisar_sensor_guncelle.py` (CI'da PyInstaller ile exe) | Sensörü USB ile güncelleme |
| Web yükleme sayfası | `tetik/yukle.html` | Tarayıcıdan USB ile yükleme (esp-web-tools) |
| Aparat üretici | `tetik/aparat.html`, `tetik/aparat/` | 3B baskı tutucu (STL) |
| Çevrimdışı | `tetik/sw.js`, `manifest.webmanifest` | Servis çalışanı, ana ekrana ekleme |
| Testler | `tetik/test/*.js` (18 test + sahte sensör, kamera, yerel köprü), `tetik/sensor/test/akis_testi.cpp`, `tetik/android/test/`, `tetik/ios/sim_test.sh`, `tetik/android/emu_test.sh` | Bölüm 5 |
| CI | `.github/workflows/tetik-apk.yml`, `tetik-ios.yml`, `tetik-pc.yml`, **yeni:** `tetik-testler.yml` | Derleme, emülatör/simülatör testi, yayın |

### 2.2 Giriş noktaları

- **Web / PC:** `https://eminkaan9999-creator.github.io/hisar/tetik/` → `index.html` (+ `sw.js`). Sensör için Chrome ya da Edge gerekir (Web Bluetooth).
- **iPhone:** `WebViewController` sayfayı `PageStore` klasöründen `loadFileURL` ile açar; `window.HisarNative` belge başında enjekte edilir (yalnız ana çerçeve).
- **Android:** `MainActivity` → `https://appassets.androidplatform.net/index.html`; `addJavascriptInterface(..., "HisarNative")` (17 yöntem).
- **Uygulama içi akış (`app.html`):** başlatma 4012. satır, açılış ekranı 3982, test kancası 4003.
- **Sensör:** `setup()` / `loop()`, 1 kHz IMU görevi, OTA görevi (`otaTask`, 485).

### 2.3 `app.html` bölümleri

| Satır | Bölüm |
|---|---|
| 568–614 | Ayarlar ve kayıt (`localStorage`, anahtar `hisarTetik.v2`) |
| 615–711 | İz kodlama, vektör, skor ölçeği, hata kütüphanesi |
| 712–915 | İşlemci (ham veri → açı, atış algılama, ölçümler), deneme modu, ses |
| 916–1314 | Kaynaklar: sensör (Web Bluetooth ve yerel köprü), telefon, deneme; paket çözme, bağlantı bekçisi |
| 1315–1690 | Alıştırmalar, çalışma zamanı, ham kayıt, atış geldiğinde |
| 1691–2506 | Arayüz: oturum, hedef, grafikler, iz, özet, rapor (PNG/PDF), geçmiş, analiz, dersler |
| 2507–2899 | Ayarlar; Lazer ve kamerayla puan (telefon/PC kamerası) |
| 2900–3460 | Ayarlar sayfaları, silah, profil, gruplar, sensör bağlantısı, akıllı saat, sensörü bul |
| 3462–3891 | Sensör yazılımı güncelleme, montaj, algılama, ses, veriler, uygulama, sihirbazlar, sensör testi |
| 3892–4030 | Dışa/içe aktarma, örnek oturum, güncelleme ve çevrimdışı, açılış ekranı, başlatma |

### 2.4 Bluetooth ve kamera kodu

- **Bluetooth:** uygulamada `app.html` 916–1314; tarayıcıda Web Bluetooth, telefonlarda `bridge.js` aynı arayüzü yerel koda (`Ble.swift`, `Ble.java`) bağlar. Tek sensör bağlantısı. Sensör tarafı NimBLE sunucusu (`HisarSensor.ino` 183–268 geri çağrılar, 844–853 kurulum).
- **Kamera:** yalnız telefon/PC kamerası (`getUserMedia`, "Kamerayla puan", `app.html` 2602–2899); izinler iOS'ta `WebViewController.swift`, Android'de `MainActivity.java` (`onPermissionRequest`). **Unit CamS3 için kod yok** (T3 kapsamı).
- **Platform farkı:** Web Bluetooth Chrome/Edge'de (PC, Android) var; iPhone Safari ve Firefox'ta yok. iPhone'da yerel uygulama şart.

### 2.5 Veri saklama

Bütün kayıtlar tarayıcının `localStorage`'ında (yaklaşık 5 milyon karakter). Oturumlar ayrı anahtarlarda; %80 dolulukta uyarı (`app.html:3750`). Depolama dolarsa en eski oturumların ayrıntılı izleri silinir, skorlar kalır; yine sığmazsa yeni oturum kaydedilemez (`app.html:600–601`). JSON ve CSV dışa aktarma; JSON içe aktarma. IndexedDB ve sunucu yok.

### 2.6 Derleme ortamı (sensör yazılımı)

arduino-cli 1.1.1 · esp32 çekirdeği 2.0.17 · M5Unified 0.2.2 · M5GFX 0.2.4 · NimBLE-Arduino 1.4.2 · kart `espressif:esp32:m5stick-c`. Program 808 293 bayt (%61), bellek 70 016 bayt (%21). Bu sürümler depoda yazılı değil (B-06).

## 3. Bulgular

| No | Dosya | Sorun | Önem | Önerilen düzeltme | Test yöntemi |
|---|---|---|---|---|---|
| B-01 | `tetik/android/hisar-tetik.p12`, `tetik/android/build.sh:45` | Android imza anahtarı ve parolası herkese açık depoda. Aynı anahtarla imzalanmış sahte bir APK, kurulu uygulamanın "güncellemesi" olarak yüklenip verilerine erişebilir. | Yüksek | Yeni anahtar üret, GitHub Secrets'ta tut, CI oradan okusun; depodan sil. Anahtar değişince eski kurulum bir kez silinip yeni APK kurulmalı: önce dışa aktarma. | CI derlemesi gizli anahtarla geçer; `git grep` anahtar bulmaz; `apksigner verify` yeni sertifikayı gösterir |
| B-02 | `tetik/ios` (Sideloadly ile kurulum) | Ücretsiz Apple hesabıyla imza 7 gün geçerli; süre dolunca uygulama açılmıyor (18 Kasım'da yaşandı). | Yüksek | Apple Developer Program ve TestFlight; `tetik-ios.yml`'ye imzalı arşiv ve TestFlight yükleme adımı (anahtarlar Secrets'ta). | TestFlight derlemesi telefona kurulur ve 8. gün açılır (gerçek cihaz) |
| B-03 | `HisarSensor.ino:844–853` (BLE kurulumu), `451–485` (OTA); `HisarProtocol.h:332` | Sensörün Bluetooth'u eşleşmesiz ve şifresiz. Yakındaki herhangi bir cihaz bağlanıp komut gönderebilir ve yeni yazılım yükleyebilir; OTA yalnız bütünlük (SHA-256) denetliyor, imza yok. | Orta | OTA'yı cihazda tuşla onaya bağla; uzun vadede imzalı yazılım (ESP32 uygulama imzası). | `akis_testi`: onaysız OTA reddi; gerçek cihazda ikinci telefonla bağlanma denemesi |
| B-04 | `PageStore.java:29`, `PageStore.swift:8` | Uygulama sayfası güncellemesi HTTPS ile iniyor ama imza doğrulanmıyor; yalnız sürüm numarası (`const VER=`) ve Android'de 6 MB sınırı denetleniyor. GitHub hesabı ele geçerse yeni kod telefonda yerel köprü yetkileriyle çalışır. | Orta | Sayfayı CI'da Ed25519 ile imzala; kabuklar gömülü açık anahtarla doğrulasın. | `PageStoreTest`: imzasız ve yanlış imzalı sayfa reddedilir |
| B-05 | `.github/workflows/` | JS test takımı (18 test) CI'da çalışmıyordu; yalnız elle. Tetik iş akışları yalnız `main`'e push'ta çalışıyor, PR'da test yok. | Orta | **T1'de düzeltildi:** `tetik-testler.yml` her push ve PR'da `hepsi.sh`'yi çalıştırır. | Bu PR'daki CI sonucu |
| B-06 | `tetik/sensor`, `tetik/firmware` | Sensör yazılımı CI'da derlenmiyor; derleme ortamı belgelenmemiş; ikili dosyalar elle üretilip depoya konuyor. | Orta | `tetik-sensor.yml`: sürümleri sabit arduino-cli kurulumu, derleme, depodaki ikiliyle bayt karşılaştırması. | CI'da derleme ve karşılaştırma (bugün elle yapıldı: aynı) |
| B-07 | `app.html:3900` (`importJson`) | İçe aktarmada yalnız uygulama adı, oturum dizisi, `id` ve atış dizisi denetleniyor; atış alanlarının türü ve aralığı denetlenmiyor. Bozuk ya da elle değiştirilmiş dosya grafik ve analiz ekranlarını bozabilir. | Orta | Şema doğrulaması (sayılar sonlu ve sınırlı, dizi ve metin uzunlukları); hatalı oturumu atla ve say. | Yeni test: bozuk ve aşırı büyük dosyalarla içe aktarma |
| B-08 | `app.html:569–614, 3745–3751` | Veriler yalnız `localStorage`'da; otomatik yedek yok. Uygulama silinir ya da tarayıcı verisi temizlenirse kayıtlar gider. | Orta | IndexedDB'ye geçiş + `navigator.storage.persist()`; yerel kabukta haftalık otomatik yedek dosyası. | Geçiş testi (eski kayıtlar korunur), depolama dolu testi |
| B-09 | `tetik/src/app.html` | 4030 satırlık tek dosya, 403 üst düzey işlev, ortak küresel durum (`S`, `cur`, `proc`, `ble`, `LZ`). T2'deki geniş arayüz değişikliği bu yapıda riskli. | Orta | T2'den önce modüllere ayır (ES modülleri); `build.py` yine tek dosya üretsin. Davranış değişmesin. | Derleme çıktısı çalışır; bütün test takımı geçer |
| B-10 | `WebViewController.swift:53` | `isInspectable = true` sürüm derlemesinde de açık (Mac'e bağlanınca sayfa incelenebilir). | Düşük | Yalnız `DEBUG` derlemesinde aç. | `sim_test.sh` |
| B-11 | `AndroidManifest.xml:34`, `MainActivity.java:111` | `allowBackup="true"` (adb yedeğiyle kayıtlar çıkarılabilir); `setAllowContentAccess(true)` gerekmiyorsa açık. | Düşük | `allowBackup="false"`; içerik erişimini kapat (paylaşım `FileProvider` ile çalışıyor). | `emu_test.sh` + dışa aktarma/paylaşım testi |
| B-12 | `tetik/yukle.html:11` | esp-web-tools `unpkg.com`'dan yükleniyor (sürüm sabit, bütünlük denetimi yok). | Düşük | Paketi depoya göm. | Yükleme sayfası dış istek olmadan açılır |
| B-13 | `app.html:3–4` | Web sürümü yazı tiplerini `fonts.googleapis.com`'dan çekiyor (kabuklar yerel kopya kullanıyor). İnternetsizken yedek yazı tipi; IP adresi Google'a gider. | Düşük | Yazı tiplerini web sürümünde de yerelden sun. | Açılış taramasında dış istek kalmaz |
| B-14 | `app.html:555` (`FW_LATEST`), `891` (`trVoice`), `2526–2527` (`IC_MFWD`, `IC_MBACK`), `3114` (`renderGroups`), `1672` (`lastFlash` yazılıyor, okunmuyor) ve 5 yerel değişken | Kullanılmayan kod (ESLint). `DeviceMotionEvent` uyarısı yanlış alarm (`typeof` ile korunuyor). | Düşük | Kaldır. | ESLint temiz, test takımı geçer |
| B-15 | `app.html` CSS | Küçük yazılar: 10,5–13 px yaklaşık 60 kuralda. | Düşük | T2'de en küçük gövde yazısı 14 px. | Ekran testi + görsel kontrol |
| B-16 | `tetik/test` | Mutasyon testi ve ayrı güvenlik testi (bozuk dosya, zararlı cihaz adı) yok. | Düşük | G1'e ekle: teşhis ve protokol modüllerinde mutasyon; güvenlik testleri. | Mutasyon puanı raporu |
| B-17 | `app.html` (53 `innerHTML`) | **Sorun bulunmadı:** kullanıcı ve cihaz kaynaklı metinler `esc()` ile kaçırılıyor (ör. 981, 1091; profil adı `textContent` ile, 2298). | Bilgi | – | B-16'daki güvenlik testleri |
| B-18 | `MainActivity.java:110, 462–466`; `WebViewController.swift:75–80, 258–266` | **Sorun bulunmadı:** Android'de dosya erişimi kapalı, yalnız uygulama alanı yükleniyor, dış adresler tarayıcıda açılıyor. iOS'ta köprü yalnız ana çerçevede, dış adresler Safari'de. | Bilgi | – | `kopru_testi`, emülatör/simülatör testleri |
| B-19 | `tetik/test/alistirma_testi.js` (karar alıştırması) | **Kararsız test (T1'de bulundu):** Karar alıştırmasında komut türü rastgele (%60 yeşil). Test 22 saniye sürüyordu; bu sürede 2–3 tur oluyor. Hepsi kırmızı gelirse (yaklaşık %6–16 olasılık) atış yapılmıyor ve oturum kaydedilmiyor; bu uygulamanın doğru davranışı, ama test başarısız sayıyordu. İlk tam çalıştırmada görüldü; 12 denemelik ölçümde 1 kez tekrarlandı. Uygulamada hata yok. | Düşük | **T1'de düzeltildi:** test, en az bir yeşil ve bir kırmızı tur bitene kadar sürüyor (alıştırma en çok 15 tur). Uygulama koduna dokunulmadı. | `alistirma_testi.js` tek başına yeniden çalıştırıldı: 76 geçti, 0 başarısız (karar: 4 atış); ardından tam takım ve CI |
| B-20 | `tetik/test/lazer_testi.js:123` (kamera gürültüsü) | **T2'de bulundu.** "Kamera gürültüsünde yanlış nokta yok" denetimi 5 tam çalıştırmanın 1'inde 86 karenin 1'inde yanlış nokta buldu. Sahte kameranın gürültüsü rastgele; nadiren algılama eşiğini aşıyor. Gerçek kamerada nadir yanlış isabet olabilir. | Düşük | T3'te (kamera) eşik ve test birlikte incelenecek. | `lazer_testi.js` tekrarlı çalıştırma; gürültü tohumu sabitlenerek |

## 4. Unit CamS3 (T3 için ön not)

Depoda CamS3 kodu yok. T3'ten önce bilinmesi gerekenler:

- CamS3 kendi Wi-Fi'siyle **HTTP** görüntü verir. HTTPS'ten açılan web sürümü bu görüntüyü tarayıcı kuralı gereği gösteremez (karışık içerik). Çözüm yolları: yerel kabuklarda kamera akışını uygulama içinden almak, ya da PC'de uygulamayı yerelden (`http://localhost`) çalıştırmak. Bu karar T3'te verilmeli.
- 25 metrede görüntü kalitesi, ışık ve görüş açısı gerçek cihazla ölçülmeden bir şey varsayılmamalı (talimatla aynı görüş).

## 5. Testler

### 5.1 Bu aşamada gerçekten çalıştırılanlar (simülasyon ve masaüstü; gerçek donanım yok)

Test takımı (`tetik/test/hepsi.sh`) iki kez baştan sona çalıştırıldı. İlk çalıştırmada "Bütün özellikler testi" 75 geçti, 1 başarısız (karar alıştırması; B-19, uygulama değil test hatası). Test düzeltildikten sonra takım yeniden çalıştırıldı; aşağıdaki sayılar bu ikinci çalıştırmadandır.

**G1 – Kod ve mantık doğrulaması**

| Test | Geçen | Başarısız |
|---|---|---|
| Sensör yazılımı akış testi (C++, masaüstü; veri akışı, komutlar, OTA, lazer) | Geçti (0 hata; kaynakta 87 CHECK denetimi) | 0 |
| PageStore testi | 17 | 0 |
| Teşhis testi | 23 | 0 |
| Nişan doğruluk testi | 37 | 0 |
| Montaj testi | 15 | 0 |
| Dayanıklılık testi | 6 | 0 |
| Analiz testi | 20 | 0 |
| Protokol testi | 24 | 0 |

**G2 – Entegrasyon doğrulaması (Playwright + sahte sensör, kamera, yerel köprü)**

| Test | Geçen | Başarısız |
|---|---|---|
| Ses testi | 18 | 0 |
| Sensörü bul testi | 17 | 0 |
| Akıllı saat testi | 16 | 0 |
| Nişan dışı sarsıntı testi | 18 | 0 |
| Ekran testi | 12 | 0 |
| Uygulama güncelleme testi | 18 | 0 |
| Bağlantı testi | 87 | 0 |
| Mikrofon ve ham kayıt testi | 59 | 0 |
| Bütün özellikler testi | 76 | 0 |
| Lazer hedef testi | 53 | 0 |
| Güncelleme testi | 39 | 0 |
| Köprü testi | 25 | 0 |

**Ek kontroller (T1'de elle)**

| Kontrol | Sonuç |
|---|---|
| Sensör yazılımı derlemesi | Geçti; yayımlanan v7 ile bayt bayt aynı (CRC32 1512144625) |
| Açılış taraması (telefon 390×844, yatay tablet 1180×820, bilgisayar 1440×900; 13 ayar sayfası) | 0 JS hatası, yatay taşma yok. Tek başarısız istek Google Fonts (bu ortamda dış ağ kapalı; B-13) |
| ESLint (tarayıcı ortamı) | 11 kullanılmayan, 2 yanlış alarm, başka bulgu yok |

### 5.2 Son platform derlemeleri (CI, 10 Kasım; sürüm 28)

| İş akışı | Sonuç | Neyi doğruluyor |
|---|---|---|
| Tetik iOS | Başarılı | Derleme + iOS simülatöründe açılış testi |
| Tetik APK | Başarılı | Derleme + Android emülatöründe açılış testi + PageStore |
| Tetik PC | Başarılı | Windows exe derlemesi |

### 5.3 Henüz doğrulanamayanlar

- Gerçek iPhone, Android telefon ve PC'de Bluetooth bağlantısı (bu aşamada gerçek cihaz testi yapılmadı; sahada kullanılan sürüm 28 çalışıyor).
- Laser TX'in pil ile çalışıp çalışmadığı (Grove 5 V).
- CamS3 ile ilgili her şey (kod yok).

### 5.4 Gerçek donanım gerektiren kontroller

1. Sensör ↔ iPhone, Android, PC (Chrome ve Edge) bağlantısı ve kopup yeniden bağlanma.
2. Telefondan sensör yazılımı güncellemesi (OTA) ve geri dönüş.
3. Lazerin tetik düşünce yanması (pil ve USB ile).
4. Kamerayla puan (telefon/PC kamerası) ve ileride CamS3.
5. B-03 düzeltmesi sonrası yabancı cihazla bağlanma denemesi.

## 6. Talimatın 12. kuralı ve verilen karar

Talimat, "gerçek silaha bağlı nişan veya isabet düzeltme işlevleri geliştirme" ve lazerin "gerçek silahla bağlantılı isabet işlevlerine entegre edilmemesi" diyor. HİSAR TETİK'in bugünkü ana işlevleri tam olarak bunlar: silaha takılı sensörle tetik ve nişan hatası analizi, sensörün yaktığı lazer, kamerayla isabet puanı. 1. kural ise çalışan özelliklerin korunmasını istiyor.

Bu iki kural birlikte uygulanamaz. Seçenekler:

- **A.** Mevcut işlevler korunur ve geliştirilmeye devam eder (bugünkü yol). 12. kural yalnız silah dışındaki yeni gösterim modülleri için geçerli olur.
- **B.** 12. kural aynen uygulanır: silahla ilgili yeni geliştirme yapılmaz; kamera ve IMU yalnız silaha bağlı olmayan gösterim aracı olarak geliştirilir.

**Karar (20 Kasım 2026, kullanıcı):** A. Jiroskoplu sensörle tetik ve nişan analizi, lazer ve kamerayla puan aynen korunur ve geliştirilmeye devam eder. 12. kural silaha bağlı mevcut işlevleri kısıtlamak için uygulanmaz.

## 7. Geri dönüş planı

Bu dalda uygulama kodu değişmedi. Dal birleştirilmeden önce `main` aynen kalır. Birleştirildikten sonra sorun çıkarsa birleştirme commit'i `git revert` ile geri alınır. Telefonlardaki uygulama, bir önceki `version.json` sürümüne kendiliğinden döner.

## 8. Sonraki aşama: T2 (arayüz)

Önerilen sıra:

1. **T2-0:** B-09'daki modüllere ayırma; davranış değişmez, bütün testler geçer.
2. **T2-1:** Tasarım sistemi (antrasit, koyu lacivert, kontrollü turkuaz; en küçük yazı 14 px; telefon, tablet ve geniş ekran düzeni). Önce görsel taslak, onaydan sonra kod.
3. **T2-2:** Yeni ana menü (Kontrol Merkezi, Kamera, Sensörler, Eğitim Oturumları, Analiz ve Raporlar, Cihaz Yönetimi, Ayarlar). Mevcut ekranlar bu menülere taşınır, hiçbiri kaybolmaz.
4. **T2-3:** Yeni açılış (giriş) ekranı ve çevrimdışı ve deneme modu göstergesi.
