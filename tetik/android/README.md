# HİSAR TETİK – Android uygulaması

Telefona kurulan uygulama. Sayfanın kendisi APK'nın içindedir (internetsiz çalışır);
sensöre telefonun kendi Bluetooth'uyla bağlanır.

**İndir:** https://github.com/eminkaan9999-creator/hisar/releases/download/tetik-android/HisarTetik.apk
(İndirince dosyayı aç, "Yükle"ye bas. Telefon sorarsa "Bu kaynaktan yüklemeye izin ver"i aç.)

## Nasıl çalışır
- `MainActivity.java`: Sayfayı `https://appassets.androidplatform.net/` adresinden sunar (güvenli bağlam),
  sistem çubuklarına göre kenar boşluğu bırakır, geri tuşunu sayfaya sorar, dosya kaydetme ve rapor paylaşma.
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
`hisar-tetik.p12` (şifre `hisartetik`) bu depodadır: uygulama mağaza dışında, kişisel kullanım için
dağıtılır ve güncellemelerin aynı anahtarla imzalanması gerekir. Google Play'e konacaksa yeni ve gizli
bir anahtar kullanılmalıdır.

## Testler
Sayfa ile köprü, sahte yerel katmanla bilgisayarda denenir: `node tetik/test/kopru_testi.js`.
