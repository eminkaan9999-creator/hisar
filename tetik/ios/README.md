# HİSAR TETİK – iPhone uygulaması

iPhone'a kurulan uygulama. Sayfa uygulamanın içindedir (internetsiz açılır); sensöre (HISAR-SENSOR)
iPhone'un kendi Bluetooth'uyla bağlanır. **Bluefy gerekmez.** Apple, Safari'de ve uygulama içi
tarayıcılarda Web Bluetooth'a izin vermediği için Bluetooth, Android uygulamasında olduğu gibi yerel kodla yapılır.

**İndir:** https://github.com/eminkaan9999-creator/hisar/releases/download/tetik-ios/HisarTetik.ipa
(imzasız IPA: Windows'ta Sideloadly ile kurulur, aşağıya bak)

## Nasıl çalışır
- `HisarTetik/WebViewController.swift`: Tam ekran sayfa (WKWebView; çentik ve alt çizgi alanına taşmaz).
  Sayfa hep `Documents/www/index.html`'den açılır. Adres hiç değişmediği için antrenman geçmişi (localStorage)
  uygulama ve sayfa güncellemelerinde korunur. Dosya kaydetme ve rapor paylaşma (paylaşım menüsü, "Dosyalar'a Kaydet"),
  dış bağlantıları Safari'de açma, oturum sırasında ekranı açık tutma.
- `HisarTetik/PageStore.swift`: Uygulamayla gelen sayfayı ilk açılışta, ya da uygulamadaki sürüm (`VER`) daha
  yeniyse, `Documents/www`'ye kopyalar. Google Fonts bağlantılarını uygulamadaki yazı tiplerine çevirir
  (`build.py --apk` ile aynı kural): internetli de internetsiz de aynı görünüm.
  **Kendini güncelleme:** sayfa `HisarNative.update()` çağırınca web sürümü GitHub Pages'ten indirilir
  (https://eminkaan9999-creator.github.io/hisar/tetik/index.html), denetlenir (`const VER=` var mı, sürüm yüklü
  olandan eski mi), `index.html` tek adımda değiştirilir ve sayfa yeniden açılır. Olmazsa sayfaya
  `window.__hisarUpdateFailed(mesaj)` döner.
- `HisarTetik/Ble.swift`, `DeviceChooser.swift`: Sensör seçici, bağlanma, servis keşfi, bildirimleri toplu
  olarak sayfaya iletme, yazma (yanıtsız yazmalar tek pakete sığmalı), kopma bildirimi, son sensörü hatırlama.
  Android'deki `Ble.java`'nın karşılığı.
- `Kopru/hisar-native.js`: Android'deki `window.HisarNative` arayüzünün aynısı; çağrılar yerel tarafa gider.
  Hemen ardından Android ile ortak `bridge.js` yüklenir, sayfa Web Bluetooth'u Android'deki gibi kullanır.
  iPhone'da `HisarNative.info()` içinde `platform: "ios"` vardır.

## Güncellemeler
- **Sayfa** (alıştırmalar, menüler): uygulamanın içinden güncellenir, yeni IPA gerekmez.
- **Uygulamanın kendisi** (Bluetooth kodu): yeni IPA'yı Sideloadly ile aynı Apple kimliğiyle yükle; verilerin silinmez.

## Derleme
GitHub Actions (macOS) her değişiklikte: `hazirla.sh` (sayfa, `bridge.js`, yazı tipleri → `build/www`) → XcodeGen →
xcodebuild (imzasız) → `HisarTetik.ipa` → `tetik-ios` sürümüne yükler. Önce iPhone simülatöründe açılış testi
yapılır (`sim_test.sh`: açılış, veri kalıcılığı, sensör isteği, dışa aktarma, internet, kendini güncelleme).
Ekran görüntüleri ve günlükler `tetik-ios-ci` dalına yazılır.

Mac'te elle: `brew install xcodegen`, sonra
`bash tetik/ios/hazirla.sh && cd tetik/ios && xcodegen generate && open HisarTetik.xcodeproj`.

Sürüm numarası sayfanın `VER` değerinden gelir: sürüm 8 → `8.0` (kod 800).

## Windows'ta iPhone'a kurulum (Sideloadly, ücretsiz Apple kimliği)
1. Apple'ın sitesinden iTunes ve iCloud'un **web sürümlerini** kur. Microsoft Store sürümleriyle çalışmaz;
   kuruluysa önce onları kaldır.
   - iTunes (64 bit): https://www.apple.com/itunes/download/win64
   - iCloud: https://updates.cdn-apple.com/2020/windows/001-39935-20200911-1A70AA56-F448-11EA-8CC0-99D41950005E/iCloudSetup.exe
2. Sideloadly'yi https://sideloadly.io adresinden indir ve kur.
3. iPhone'u kabloyla bilgisayara tak. iPhone "Bu bilgisayara güvenilsin mi?" diye sorarsa **Güven**'e bas.
4. `HisarTetik.ipa`'yı indir ve Sideloadly'ye sürükle. Apple ID kutusuna Apple kimliğini yaz (ücretsiz hesap yeter),
   **Start**'a bas. Şifre ve iki adımlı doğrulama kodu sorulur. Sideloadly uygulamayı senin kimliğinle imzalayıp yükler.
5. iPhone'da bir kez:
   - **Geliştirici Modu** (iOS 16 ve sonrası): Ayarlar › Gizlilik ve Güvenlik › Geliştirici Modu → aç.
     iPhone yeniden başlar; açılınca çıkan soruda **Aç**'a bas. (Bu seçenek ilk yan yüklemeden sonra görünür.)
   - **Geliştiriciye güven**: Ayarlar › Genel › VPN ve Aygıt Yönetimi › (Apple kimliğinin e-postası) › **Güven**.
6. HİSAR TETİK'i aç. İlk sensör aramasında Bluetooth iznine **İzin Ver** de.

### 7 gün sınırı ve kendiliğinden yenileme
- Ücretsiz Apple kimliğiyle imza **7 gün** geçerlidir. Süre dolunca uygulama açılmaz, verilerin silinmez:
  IPA'yı aynı Apple kimliğiyle yeniden yükleyince (4. adım) kaldığı yerden çalışır.
- Sideloadly bunu kendisi yapabilir: yüklediği uygulamaları arka plandaki hizmeti (Sideloadly Daemon) süresi
  dolmadan yeniden imzalar. Bunun için bilgisayar açık ve Sideloadly çalışır olmalı; iPhone kabloyla takılı ya da
  aynı Wi-Fi ağında olmalı (iTunes'ta iPhone'u seçip "Bu iPhone ile Wi-Fi üzerinden eşzamanla"yı bir kez aç;
  gerekirse Apple'ın Bonjour hizmetini kur) ve iPhone'un ekranı açık olmalı.
- Ücretsiz hesapta aynı anda en çok 3 yan yüklenmiş uygulama olabilir; 7 günde en çok 10 uygulama kimliği (App ID) açılır.

### Verilerin korunması
- Güncellerken hep **aynı Apple kimliğini** ve **aynı paket kimliğini** (bundle ID, `com.hisar.tetik`) kullan:
  yeni sürüm eskisinin üstüne kurulur, antrenman geçmişi kalır. Sideloadly bu paket kimliğiyle yükleyemezse
  Advanced Options'ta kendine özgü bir kimlik yaz (ör. `com.eminkaan.hisartetik`) ve sonraki her yüklemede aynısını kullan.
- Uygulamayı silersen geçmiş de silinir. Önce Ayarlar › Veri › Dışa aktar ile yedek al.

## Gerçek iPhone'da denenmesi gerekenler
Simülatörde Bluetooth yoktur. Sensörle bağlanma, veri akışı, kopma ve devam, sensör yazılımını telefondan
güncelleme ve son sensöre kendiliğinden bağlanma gerçek iPhone ve sensörle denenmelidir.
