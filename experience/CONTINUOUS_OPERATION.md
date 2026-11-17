# ÇELİK BÖRÜ v117 — Eve Dönüş ve kara hareketleri

Eve Dönüş ana akışta tek bir açılışla başlar. Tankın sağlığı, mühimmatı, yaşayan dost tanklar, aynı konvoy ve harita aşamalar arasında sıfırlanmaz. Önceki Şafak Hattı bölümleri ile dört özgün harekât, görev arşivinde oynanabilir. Kalıcı XP, kredi ve eski yıldız anahtarları korunur.

## Harekâtın sırası

| Aşama | Açılma ve bitme koşulu |
| --- | --- |
| Toplanma | Oyuncu batı yolundaki ilk işarete ulaşır. Uzaktan beklemek ilerletmez. |
| Geçit pususu | Pusu yalnız bu aşama açılınca oluşturulur. Oyuncu bölgeye gelir ve pusunun yaşayan bütün unsurlarını durdurur. Bir unsur işaretin dışına çıkınca öldürülmüş sayılmaz. |
| Konvoy tespiti | Oyuncu 150 m içinde, görüş hattında ve durarak kesintisiz 4 saniye gözetler. |
| Yerinde onarım | Oyuncu konvoyun 65 m yakınına gelmeden taarruz sayacı başlamaz. İki grup durdurulur; yakın tehdit olmadan 12 saniyelik onarım tamamlanır. Konvoy yerinde kalır. Başlangıç noktası köy merkezindeki kapalı alan yerine, gerçek haritanın yol üzerindeki açık alanındadır; bina/engel çakışması ve görüş hattı tarayıcıda kontrol edilir. |
| Dönüş | Aynı kamyon başlangıç konumundan yola çıkar. Oyuncu 110 m içinde olmalı; oyuncu yolu kapatırsa, yakın tehdit veya katı engel varsa bekler. Karşı taarruz dönüş güzergâhına varınca bir kez oluşturulur. Yaşayan takviye teslimi engeller. |
| Teslim | Konvoy teslim edilmiş, kalan tehditler temizlenmiş ve oyuncu karakolda 5 saniye beklemiş olmalıdır. Sadece son hedefe gitmek görevi bitirmez. |

Düşman oluşturulamazsa görev başarısız olur; eksik düşman otomatik başarı sayılmaz. Konvoy devre dışı kalırsa harekât kaybedilir. Harita ve dost piyade yönlendirmesi sıradaki gerçek hedefi izler.

Yıldızlar: görevi tamamlama, bitişte en az %50 tank sağlığı, en az %75 konvoy sağlığı. Eski görevlerin yıldız kuralları korunur.

## Kayıtlar

Yeni kontrol noktası `celik-boru-eve-donus-v1` anahtarındadır. Geçit temizlendikten, konvoy tespit edildikten, onarım bitince ve dönüş tamamlanınca güvenli aşama sınırında yazılır. Oyuncu tankta olmalı ve Uçangöz uçuşta olmamalıdır. Eski İlk Işık kaydı `celik-boru-ilk-isik-v1` olarak ayrı kalır.

Snapshot; aşama, süre, ödenmemiş maç puanı, tank konumu/sağlığı/hasarlı parçalar, mühimmat, yaşayan dost tanklar ve konvoy sağlığını birlikte taşır. Eski aşamaların düşmanları devam ederken yeniden oluşturulmaz. Tamamlanan görevin kontrol noktası silme kaydıyla kapatılır; eski yedek bunu geri getiremez. Daha eski oturum yeni oturumun kaydını ezemez. Kaydedilemeyen yeni nokta önceki güvenli noktayı bozmaz. Kaybedilen maçta kalıcı ödülü ödenen snapshot puanı tekrar verilmez.

## Kara hareketlerindeki somut değişiklikler

- Derin nehir suyu artık sadece hız azaltmaz. Tank, dost/düşman kara araçları, piyade ve konvoy için kara geçiş kontrolü bulunur. Rota ızgarası da derin suyu kapalı sayar; kuru geçitler kullanılabilir.
- Tankın hareketi ivme ve frenle ilerler. Geri kumandası önce frenler. Mevcut yakıt/dozer güç kısıtları korunur; palet kopukken tank hareket etmez ve mevcut saha onarımı tamamlanınca hareket geri gelir. Yüksek hızda dönüş, yanal ivme sınırıyla daralır; yerinde dönüş sınırlıdır.
- Gövdenin merkezi ve dört köşesi hareket boyunca örneklenir. Uzun bir kare su şeridini atlayamaz. Dik basamaklar engellenir; eski kayıtta suda kalan unsur daha sığ zemine çıkabilir.
- Muharebe piyadesi koşu sınırıyla ilerler. Nöbetçi, refakat piyadesi ve köylünün araca yol vermesi tek karede yana itme içermez. Yol verme ve kaçışta da su kontrolü uygulanır.
- Mevzi piyadesi görev yerinden uzaklaşıp oyuncuyu harita boyunca kovalamaz.
- Sonradan mevcut gruba eklenen instanced modellerin renk tamponu eklenme sırasında hazırlanır. Gerçek renk verisi değiştirilmez. Tarayıcı testinde yakalanan `instanceColor` çizim hatası için regresyon eklenmiştir.

Hareket katsayıları bir oyun ayarıdır; belirli bir gerçek tankın sertifikalı fizik modeli değildir. Harita mevcut 1,6 × 1,6 km alandır.

## Doğrulama kapsamı

`node --test experience/*.test.cjs`: 602 yerel regresyon testi başarılı. İTİ testi ve dört inline betiğin sözdizimi kontrolü başarılı.

Tarayıcı senaryoları `scripts/campaign-browser-checks.cjs`, eski kapsam ise `scripts/modern-browser-checks.cjs` ve `scripts/interface-browser-checks.cjs` içindedir. GitHub Actions raporu; gerçek Chromium/WebGL, masaüstü/telefon görünümü, açılıştaki normal W sürüşü, gerçek sayfa yenileme/Devam düğmesi ve kıyıya normal sürüş kontrollerini ayrıca kaydeder.

**Kapsam sınırı:** Harekâtın sonraki aşamalarının otomatik kurulumu oyuncuyu konumlandırır, düşmanları test amacıyla kaldırır ve görev zamanını ilerletir. Konvoy yine gerçek haritanın rota, arazi ve çarpışma kontrollerini kullanır. Bu, baştan sona normal oyuncu sürüşü, çatışma dengesi veya fiziksel iPhone performansı doğrulaması değildir. Eski dört harekâtın insan tarafından tam oynanışı da bu testlerle kanıtlanmaz.

Yayın öncesinde aday commit'in tarayıcı doğrulaması, görselleri ve dağıtımdan sonra dosyaların birebir eşleşmesi kontrol edilir. Önceki sürüm ayrı bir commit olarak geri dönüş için korunur.
