# HİSAR oyunları

Çelik Börü ve HİSAR KOMUTA, Türk ordusunun gelecekteki muharebe sahasını konu alan kurgusal oyunlardır. Günümüz (2026), yakın gelecek (2045) ve uzak gelecek (2186) dönemleri aynı görev menüsünden seçilir. Araçlar, sistemler ve oyun değerleri temsilidir.

| Dönem | Çelik Börü | HİSAR KOMUTA |
| --- | --- | --- |
| Günümüz · 2026 | Anadolu Hattı, 3 dalga | Sayısal Karargâh, 8 dalga |
| Yakın gelecek · 2045 | Ufuk 2045, 4 dalga | Birleşik Ufuk, 10 dalga |
| Uzak gelecek · 2186 | Neon Kuşatma, 3 dalga / Tutulma Hattı, 4 dalga | Yörünge Kalkanı, 8 dalga / İyon Fırtınası, 10 dalga |

**Çelik Börü** farklı dönemlerde paletli veya hover zırhlı araç kullanır. W A S D / ok tuşları ile sürüş, Boşluk ile darbe, Q ile geçici koruma ve E ile hedef değişimi yapılır. Telefonda ekran düğmeleri kullanılır. Canlı çevre görünümü araç ve robot konumlarını gösterir. Gösterilen FPS, çalışan sahnenin ölçülen kare hızıdır.

**HİSAR KOMUTA** üç bağlantı merkezinin savunulduğu filo oyunudur. Birleşik ağ, arazi ve birimler katmanları seçilebilir. Öncü ve Koruyucu filoların görev aralığı ile onarım sürülerinin enerji maliyeti oyun sonucunu etkiler. Durum özeti, görevdeki gerçek oyun değerlerinden hesaplanır.

## Performans ve kayıtlar

Statik 3B yapılar malzemelerine göre instancing ile birleştirilir. Haritanın sabit zemini yalnızca boyut veya katman değiştiğinde yeniden çizilir. Sektör ve filo seçimleri mevcut harita tuvalini korur. Otomatik görüntü ayarı, sürdürülen kare yükünde çözünürlüğü azaltır ve yeterli kapasite oluştuğunda yavaşça artırır. Akıcılık ve yüksek görüntü seçenekleri elle seçilebilir.

Araç fiziği sabit 60 Hz adımlarla ilerler. Böylece ekranın 30, 60 veya 120 Hz çalışması oyun zamanını değiştirmez. Sekmeden çıkış görevi duraklatır. Hareket azaltma ayarında harita animasyonu durur, karar ve boyut değişiklikleri yine çizilir.

İlk başarılı çevrimiçi yüklemeden sonra iki oyun çevrimdışı açılır. İlerleme ve son 18 sonuç cihazda saklanır. v124 / 3.0 görev kayıtları korunur. WebGL kaybında araç görevi aynı durumla üstten harita görünümünde sürer.

## Çalıştırma ve doğrulama

Depo kökünde `python3 -m http.server 8080` çalıştırın. Çelik Börü için `/`, KOMUTA için `/komuta/` adresini açın.

`node --test oyun/*.test.mjs experience/model.test.cjs` sekiz görevin kurallarını, kayıtları, zaman adımlarını, kalite geçişlerini ve yayın dosyalarını denetler. Playwright kurulu olduğunda `node oyun/gelecek-tarayici.cjs` sekiz görevi normal girişlerinden oynar, harita katmanlarını ve tuval sürekliliğini, mobil yerleşimi, kayıtları ve çevrimdışı kullanımı kontrol eder. `node oyun/tarayici.cjs` önceki görevlerin kayıt ve çevrimdışı uyumluluğunu sınar.

## Önceki görevler

Kayıtlar bölümündeki arşiv bağlantısı `?arsiv=1` parametresini açar. Beyaz Geçit, Yağmur Hattı, Gece Sevki, Gece Nöbeti, İlk Işık Vardiyası ve Dağıtım Günü eski kayıtlarıyla buradan kullanılabilir.
