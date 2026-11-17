# ÇELİK BÖRÜ v115 — İlk Işık kalite paketi

Bu paket v114'ün hız, dokunma, sürüm tutarlılığı, sonuç ekranı ve kayıt düzeltmeleri üzerine kurulur.

## Oyuncunun gördüğü değişiklikler

- İlk Işık'ta mevziye varınca ve bir dalga tamamen temizlenince güvenli kontrol noktası oluşur. Tank kontrolünde olmak ve Uçangözün görevde olmaması gerekir. Çatışma ortasında kayıt alınmaz.
- Oyunu yeniden açınca İlk Işık seçiliyken **Kontrol noktasından devam** görünür. Tamamlanan dalgalar, sağlık oranı, hasarlı parçalar, mühimmat, birlik düzeni ve hayatta kalan dostlar yüklenir. Devam edilen dalga arası bekleme süresi yeniden başlar.
- İlk Işık'taki her saldırganın ilk atış hazırlığı haber verilir; normal atış döngüsü sonraki denemede sürer. Önceki dört görev ve Son Takım bu kolaylaştırmayı kullanmaz.
- Gövde ivmelenmeye ve dönüşe dengeli tepki verir. Yol ve engebeli arazide farklı hareket eder; hareketsizken sarsıntı birikmez. Yerel sürüş hızı, yönlendirme ve silah kuralları korunur.
- Gerçek mermi kaynağından isabet yönü hesaplanır; hasarlı motor, palet ve kule araç göstergesinde görünür.
- İkmal kamyonu zeminin boyuna ve enine eğimine uyum sağlar. Yakın araç modelleri gölge alır; uzak model ayrıntısı ek gölge çizimi üretmez.

Sesli komutan/nişancı sırası korunur. Bekleyen atış; duraklatma, görev yeniden başlatma, Uçangöze geçme, mühimmat değişimi veya uygulamadan ayrılmada iptal edilir. Eski konuşmanın geç bitmesi yeni görevin başında kendiliğinden ateş ettiremez.

Görev süresi ve henüz ödüllendirilmemiş çatışma puanı da taşınır. Önceki yenilgide kalıcı XP/krediye dönüşen kontrol noktası puanı tekrar ödüllendirilmez.

## Kayıt sınırları

Kontrol noktası yalnız **İlk Işık** içindir ve `celik-boru-ilk-isik-v1` anahtarında tutulur. Kalıcı XP, kredi, eski görevler, yıldızlar ve en iyi süreler ayrı kalır. Yedek koduna kontrol noktası da girer; iki kayıt alan alan birleştirilmez, daha yeni tam kayıt seçilir. Görev tamamlanınca eski yedeğin kontrol noktasını yeniden canlandırmaması için zaman damgalı tamamlanma kaydı bırakılır.

Bozuk şema, geçersiz konum, fazla mühimmat, yinelenen dost kimliği ve uyumsuz görev verisi yüklenmez. Eski bir sekme daha yeni oturumun noktasını silemez. Depolama hatası son sağlam noktayı değiştirmez. İleride İlk Işık'ın dalga yapısı değişirse checkpoint `RULES` değeri artırılmalıdır.

## Doğrulama kapsamı

578 otomatik test ve İTİ kontrolleri yerelde geçti. Yeni testler yeniden açma sonrası görev sırası, sağlık/mühimmat/dost kayıpları, kayıt bozulması, depolama hatası, sekmeler arası yazma ve eski yedek dönüşünü kapsar.

Chromium testleri gerçek 3B sahnede atış ve gösterge bağlantısını, normal sürüşle ilk noktanın oluşmasını, gerçek sayfa yenilemesini ve oyuncunun **Devam** düğmesini kullanmasını sınar. Dalga arası kaydı oluşturmak için düşman kaldırma ve oyun zamanını ilerletme kullanılır. Hasar göstergesi için yerel oyun işlevleriyle kontrollü isabet uygulanır. Bunlar dört görevin baştan sona normal oynanışı veya fiziksel iPhone performans ölçümü değildir.

Fiziksel telefonda uzun oturum, ısınma, bellek ve kare süreleri ayrıca ölçülmelidir. v114'e dönüş gerekirse yeni kontrol noktası anahtarı eski oyun tarafından kullanılmaz; mevcut kalıcı başarı anahtarları değiştirilmez.
