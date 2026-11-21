# HİSAR TETİK – Android uygulaması

Telefona kurulan uygulama. Sayfanın kendisi APK'nın içindedir (internetsiz çalışır);
sensöre telefonun kendi Bluetooth'uyla bağlanır. Yeni sürümler (sürüm 12'den itibaren) uygulamanın içinden
internetle iner, APK'yı yeniden kurmak gerekmez.

**İndir:** https://github.com/eminkaan9999-creator/hisar/releases/download/tetik-android/HisarTetik.apk
(İndirince dosyayı aç, "Yükle"ye bas. Telefon sorarsa "Bu kaynaktan yüklemeye izin ver"i aç.)

## Nasıl çalışır
- `MainActivity.java`: Sayfayı `https://appassets.androidplatform.net/` adresinden sunar (güvenli bağlam),
  sistem çubuklarına göre kenar boşluğu bırakır, geri tuşunu sayfaya sorar, dosya kaydetme ve rapor paylaşma.
- `PageStore.java`: Uygulama içi güncelleme. Sayfa `version.json`'da daha yeni bir sürüm görünce `HisarNative.update()`
  çağırır; Android sayfası (`tetik/apk/index.html`, build.py yazar) GitHub Pages'ten indirilir, denetlenir
  (`const VER=`, `bridge.js`, tam dosya, sürüm yüklüden eski olamaz) ve `files/www/index.html`'ye atomik yazılır.
  Adres değişmediği için localStorage'daki geçmiş korunur. Yerel kod değiştiğinde `version.json`'daki `apkMin`
  (sürüm kodu, ör. 1200) artırılır: daha eski uygulamalar sayfa yerine yeni APK'yı indirmeyi önerir.
  Masaüstü testi: `bash tetik/android/test/pagestore_test.sh` (JDK yeter).
- `Ble.java`: Sensör seçici (tarama), bağlanma (MTU 185, yüksek öncelikli bağlantı, Android'in 133 hatasında
  yeniden deneme), sıralı GATT işlemleri, bildirimleri toplu olarak sayfaya iletme, son sensörü hatırlama.
- `assets/www/bridge.js`: Sayfanın kullandığı Web Bluetooth arayüzünü `HisarNative` üzerinden `Ble.java`'ya
  bağlar; ekranı açık tutmayı (wakeLock) da yerel bayrakla yapar.
- `ShareProvider.java`: Paylaşılan raporları diğer uygulamalara (WhatsApp, e-posta) salt okunur verir.

## Derleme
`bash tetik/android/build.sh` (Android SDK: build-tools ve platforms/android-35; JDK 17+).
GitHub Actions her değişiklikte derler, emülatörde açılış testini yapar (`emu_test.sh`) ve
`tetik-android` sürümüne yükler. Test ekran görüntüleri ve günlükler `tetik-ci` dalına yazılır.

Sürüm numarası uygulamanın `VER` değerinden gelir (`src/app.html`): sürüm 3 → `3.0` (kod 300).

## İmza anahtarı
İlk anahtar `hisar-tetik.p12` (şifre `hisartetik`) bu depoda ve herkese açık (T1 bulgusu B-01): onunla
başkası da "güncelleme" imzalayabilir. Bu yüzden yeni, gizli bir anahtara geçilir:

- Yeni anahtar GitHub'daki **`TETIK_IMZA`** gizli değerindedir (Settings › Secrets and variables › Actions).
  Değer: PKCS12 dosyasının base64 hali; anahtar adı `hisar2`, şifre `hisar-tetik-imza` (gizli olan dosyanın
  kendisidir). Depoya konmaz.
- `TETIK_IMZA` varsa `build.sh` APK'yı **anahtar döndürme** ile imzalar (APK imza şeması v3, `apksigner rotate`):
  eski anahtar yeni anahtarı onaylar. Android 9 ve üstü yeni anahtarı kullanır; kurulu uygulama silinmeden
  güncellenir, kayıtlar kalır; eski anahtar tek başına artık güncelleme imzalayamaz. Android 7-8 eski imzaya
  bakmaya devam eder.
- `TETIK_IMZA` yoksa APK eskisi gibi yalnız eski anahtarla imzalanır ve derleme uyarı verir.
- Emülatör testi önce yayındaki önceki APK'yı kurar, sonra yenisini onun üstüne kurar: güncelleme
  reddedilirse yayınlanmaz.

Google Play'e konacaksa Play'in kendi imza düzeni kullanılmalıdır.

## Testler
Sayfa ile köprü, sahte yerel katmanla bilgisayarda denenir: `node tetik/test/kopru_testi.js`.
