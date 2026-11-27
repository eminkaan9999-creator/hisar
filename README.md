# HİSAR oyunları

Çelik Börü ve HİSAR KOMUTA, 2186 yılında geçen bilimkurgu savaş alanında açılır. Ortak koyu arayüz, görev seçimi, sonuç arşivi ve çevrimdışı kullanım bulunur.

**Çelik Börü** enerji darbesi, geçici kalkan ve hedef kilidiyle yönetilen bir hover zırhlı araç oyunudur. Neon Kuşatma üç, Tutulma Hattı dört dalga içerir. W A S D / ok tuşları ile sürüş, Boşluk ile enerji darbesi, Q ile kalkan ve E ile hedef değişimi yapılır. Telefonda ekran düğmeleri kullanılır.

**HİSAR KOMUTA** üç enerji çekirdeğinin savunulduğu filo oyunudur. Yörünge Kalkanı sekiz, İyon Fırtınası on dalga sürer. Öncü ve Koruyucu filoların görev aralığı ile onarım sürülerinin enerji maliyeti oyun sonucunu etkiler.

İlk başarılı ağ yüklemesinin ardından oyunlar çevrimdışı açılır. İlerleme ve son 18 sonuç cihazda saklanır. Görevler ve teknoloji özellikleri kurgu oyun kurallarıdır.

## Çalıştırma

Depo kökünde `python3 -m http.server 8080` çalıştırın. Çelik Börü için `/`, KOMUTA için `/komuta/` adresini açın.

`node --test oyun/*.test.mjs experience/model.test.cjs` kuralları ve yayın dosyalarını denetler. Playwright kurulu olduğunda `node oyun/gelecek-tarayici.cjs` yeni görevleri normal girişlerinden oynar. `node oyun/tarayici.cjs` önceki görevlerin kayıt ve çevrimdışı uyumluluğunu kontrol eder.

## Önceki görevler

Kayıtlar bölümündeki arşiv bağlantısı `?arsiv=1` parametresini açar. Beyaz Geçit, Yağmur Hattı, Gece Sevki, Gece Nöbeti, İlk Işık Vardiyası ve Dağıtım Günü eski kayıtlarıyla buradan kullanılabilir.
