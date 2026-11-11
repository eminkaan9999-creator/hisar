# HİSAR Deneyim 63.1 — 9 Kasım 2026

Ana oyun build 63 korunur. Bu paket mevcut oyunun üstüne yüklenen kamera, görüntü, arayüz ve kontrol yaşam döngüsü geliştirmesidir; yeni fizik motoru, 3D model, üretken yapay zekâ veya çok oyunculu sistem değildir.

## Uygulanan değişiklikler

- İTİ panelindeki sinematik/kontrast kutuları artık gerçekten olay işleyicilerine bağlı; ayarlar kaydedilir ve diğer tercihler değişince kaybolmaz.
- Dış tank kamerasında kare hızından bağımsız yumuşatma; nişangâh, kabin, sürücü, fotoğraf ve özel kameraların davranışı korunur. İsteğe bağlı darbe sarsıntısı azaltma, fiziksel hasar veya hareket hesabına dokunmaz.
- İsteğe bağlı ACES ton eşleme ve %70–140 parlaklık ayarı; termal görüntüde önceki ton eşleme kullanılır.
- Yüzey dokuları için kalite profiline ve ekran kartı sınırına uygun anisotropik filtreleme (1/4/8, donanımla sınırlandırılmış).
- Menüde gereksiz ana sahne çizimleri azaltılır; aktif oyun döngüsü yavaşlatılmaz. Bu bir FPS artışı garantisi değildir.
- Gerçek pencere odağı kaybında oyun duraklatılır; basılı klavye, dokunmatik kumanda ve sabit hız durumu temizlenir. Desteklenen ses bağlamı arka planda durdurulur.
- Sahte blur olayı kaldırıldı. Paneli oyun sırasında açıp kapatmak doğru devam durumunu korur; gerçekten odak kaybolduğunda kendiliğinden devam etmez.
- Görsel klavye/ekran yüksekliği değişimine uyum; dar ve yatay menüler, büyük metin, dar garaj kategorilerindeki 0/25 göstergesinin taşması düzeltildi.
- Harita/menü/arka plan ve sıfır süreli ısınma kancaları aktif oturum süresine eklenmez.
- Yeni önbellek `hisar-main-v63.1`; yeni modül çevrimdışı pakete dahil. Güncelleme yalnızca ana uygulamanın worker kapsamını ele alır; diğer uygulamaların worker'larını topluca kaldırmaz.
- Kullanıcı başlattığında yerel JSON tanılama raporu oluşturulur. Oyun kayıt anahtarı `m60v2` değiştirilmez.

## Doğrulama ve sınırlar

Yerelde 32 birim/önbellek testi, 68 DOM etkileşim/yerleşim kontrolü ve asıl v63 oyun koduyla 24 GPU'suz bağdaştırıcı kontrolü geçti. Oyun kaynak dosyasının Git blob özeti `b86016b875a5b69afc95d3848890c858df00dda0` ile doğrulandı. Yedi mevcut görevin başlangıcı ve dört kamera modu denendi; bu bütün görevlerin sonuna kadar oynandığı anlamına gelmez.

DOM kontrolleri gerçek Three.js matematiğini ancak taklit çizici/ses/depolama katmanlarını kullanır. İkinci grup gerçek oyun mantığını çalıştırır fakat GPU çizimi taklit edilir. Fiziksel iPhone/Android, gerçek GPU'daki yeni ton eşleme görüntüsü ve uzun süreli performans ayrıca doğrulanmış değildir. Otomatik GitHub sonuçları ayrıca Actions kayıtlarında değerlendirilmelidir; yerel başarı bir kuyruktaki CI çalışmasını başarılı saymaz.

Birim testleri: `node --test experience/*.test.cjs`.
Gerçek WebGL tarayıcı kontrolleri: `node scripts/experience-browser.cjs` (Playwright Chromium kurulumu gerekir).

Kullanım: Ana menü → İTİ · AYARLAR · OTURUM → Ayarlar → Oynanış ve görüntü · 63.1. Yeni filmik görünüm ve sarsıntı azaltma isteğe bağlıdır. Sıfırla yalnızca ilgili tercihleri sıfırlar; XP/kredi silinmez.
