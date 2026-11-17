# ÇELİK BÖRÜ v116 — Modern komuta merkezi

HİSAR 360'ın sade bölüm düzeni, açık kartları, lacivert başlıkları ve sıcak vurgu rengi oyun menüsüne uyarlandı. Savaş ekranı, arazi üzerinde okunabilir kalması için koyu yüzeyler kullanıyor. Görevler, modeller, sürüş, silah kuralları ve kayıt anahtarları korunuyor.

## Oyuncunun gördüğü değişiklikler

- Harekât, Birlik, Garaj ve Kontroller aynı dört bölümde; çizgi simgeler, ortak yazı tipi, yuvarlatılmış yüzeyler ve belirgin seçili durumları kullanılıyor.
- Ana ekranda seçilen görev adı öne çıkıyor. Başlatma düğmesi, önce görev emrine gidildiğini açıkça belirtiyor. Kontrol noktasından devam ve önceki harekâtlar korunuyor.
- Üst çubuktan kayıtlar ve başarılar açılıyor. XP, kredi, madalyalar ve mevcut yedek kodu işlevleri aynı yerel verilere bağlı. Yedek kodu alanı kaydı yüklemeden kapatılabiliyor.
- Ayarlar, görev emri, telsiz, sonuç ekranı ve dokunmatik tuşlar ortak simge ve yüzey düzeni kullanıyor. Savaşın üzerinde kalan görev ve telsiz bilgileri yatay telefonda daha az yer kaplıyor.
- Görev emrinin ve sonuç ekranının ayrı kapatma düğmeleri var. Tab odağı açık görev/sonuç/kayıt penceresinin dışına çıkmıyor; kapanınca menüdeki önceki düğmeye dönüyor.
- Sekmeler ok tuşları, Home ve End ile gezilebiliyor. Escape önce en üstteki ayar penceresini, ardından alttaki görev/kayıt ekranını kapatıyor.
- Ayar penceresinin dışına tıklamak pencereyi kapatıp mevcut savaşa döndürüyor. Basma olayı duraklatılmış pencerede kalıyor; altta ateş veya sürüşe aktarılmıyor.

Yeni arayüz modülü ilerleme yazmıyor, yeni bir çizim döngüsü oluşturmuyor, dokunmatik işlevlerin olay bağlantılarını değiştirmiyor. Menüde arka plan 3B çizimi kapalı kalıyor. Hareket azaltma tercihi geçişlerde korunuyor; arka plan bulanıklığı kullanılmıyor.

## Doğrulama

586 otomatik regresyon testi, İTİ kontrolleri ve dört gömülü betiğin sözdizimi denetimi yerelde geçti. Eklenen Escape testleri iç içe pencereleri ve eski profil katmanının yeniden başlatmada kapanmasını kapsıyor. Menüde Tab tuşunu yakalayan eski çark girdisi düzeltildi; altı yerel regresyon menüde gezinmeyi, oyun içindeki kısa/uzun basmayı, duraklatmayı ve boşa gelen tuş bırakma olayını ayrı ayrı doğruluyor. Yedek koduna yazılan harfler oyun komutuna dönüşmüyor; menü düğmeleri Boşluk ile de etkinleştirilebiliyor.

`scripts/interface-browser-checks.cjs`, mevcut Chromium/3B doğrulamasına gerçek menü tıklamaları, klavye odağı, dört bölümün 320×568, 390×844, 844×390 ve masaüstü ölçülerine sığması, görev seçimi, iç içe pencere kapatma, yedek işlemini iptal etme ve tekrar kurulum kontrolleri ekliyor. Sonuç ekranı yerel `endGame` çağrısıyla kontrollü olarak açılıyor; bu, tam görev oynanışı değildir. Görüntüler iş akışının test çıktılarında tutuluyor.

v115'in normal ilk mevzi sürüşü, gerçek ateş girdisi, sayfa yenileyip kontrol noktasından devam, kontrollü konvoy rotaları ve gece/gündüz geri dönüş kontrolleri çalışmaya devam ediyor. Dalga/konvoy kurulumunda zaman ilerletme ve düşman kaldırma bulunduğundan bunlar dört tam normal oynanış sayılmaz. Fiziksel iPhone performansı, ısınma ve uzun oturum kararlılığı henüz ölçülmedi.

## Geri dönüş

Gerekirse v115 dosyaları yeniden yayımlanabilir. v116 bir kayıt geçişi yapmadığı için mevcut XP, kredi, görev yıldızları, araç geliştirmeleri ve İlk Işık kontrol noktası aynı anahtarlarda kalır. Güncelleme, mevcut sürüm damgası ve hizmet işçisi mekanizmasıyla birlikte yapılmalıdır; farklı sürümlerin HTML/CSS/JS dosyaları karıştırılmamalıdır.
