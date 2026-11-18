# ÇELİK BÖRÜ v118 — geniş arazi ve hareketin korunması

Oynanabilir tek harita 1,6 × 1,6 km’den 2 × 2 km’ye çıktı: kenar uzunluğu %25, toplam alan %56,25 büyüdü. Eve Dönüş aynı harekât olarak kalır; görev noktaları değiştirilmedi. Kuzey ve güney manevra yolları yeni dış şeritte mevcut ana yollarla birleşir. Bu yollar nehri kestirmeden geçmez; kara geçişleri mevcut kuru geçitlerdedir.

## Mevcut dünyanın korunması

- Eski ana kaya/ağaç üretim sınırı ve tohum akışı 800 m olarak korunur. Yerleşim ve çiftlik üretimi eski alanı kullanır; mezra ve trafik üretimi, eski yol uçlarına göre devam eder. Yeni yollar bu üretime ayrıca sokulmaz.
- 14 eski görev/kayıt konumunda arazi yüksekliği v117 örnekleriyle birebir karşılaştırılır. Eski kayıt anahtarları ve kontrol noktası şemaları değiştirilmez.
- Eski alanın 5 m arazi ağı korunur. Yeni şeritte 10 m, uzakta 30 m örnekleme kullanılır. Görünen zemin parçalarının mevcut uzaklık sınırı korunur. Harita büyümesiyle ayrıntılı bütün dünya her karede çizilmez.
- Nehir geometrisi iki yeni kenarı da kaplar. Navigasyon ızgarası, dünya sınırı ve büyük harita aynı 2 km ölçüsünü kullanır.

## Somut düzeltmeler

v117’de rota ızgarası her istendiğinde nehir suyu için bütün harita yeniden yükseklik sorgusundan geçiriliyordu. Sabit su hücreleri artık bir kez hesaplanıp yeniden kullanılır. Bina ve siper ızgarası ise her istekte güncel alınır: yıkılan veya eklenen engel eski birleşik bir önbellekte kalmaz. Arazi yüksekliği işlevi ya da boyut değişirse su bilgisi yeniden kurulur; açık geçersizleştirme de vardır.

Hareket denetimi, kabul ettiği her hareketten sonra modeli yeniden ham arazi yüksekliğine koyuyordu. Bu, motorun verdiği gövde/saha mevzisi yüksekliğini silebiliyordu. Model artık yalnızca gerçekten geri alınan veya sınırlandırılan hareketten sonra yeniden zemine oturtulur. Kabul edilen hareketin mevcut gövde pozu korunur.

## Doğrulama

609 yerel regresyon testi, İTİ kontrolü ve dört inline betiğin sözdizimi kontrolü başarılıdır. Su önbelleği testleri tekrar isteklerde yükseklik sorgularının artmadığını, yeni/yıkılmış bina maliyetlerinin yine değiştiğini sınar. Poz testi kabul edilen gövde yüksekliğinin korunmasını ve sınırlandırılan piyadenin doğru noktaya çizilmesini kontrol eder.

`world-browser-checks.cjs` gerçek Chromium/WebGL’de dünya/ızgara ölçülerini, yeni şeritte rota bulunmasını ve canlı engel değişikliğini kontrol eder. Dış şerit sürüşü kontrollü bir başlangıç konumundan sonra gerçek W girdisiyle yapılır. Eski görev, konvoy, kayıt/Devam, gece/gündüz, menü ve telefon görünümü kontrolleri korunur. Sonuçlar ilgili GitHub Actions çalışmasındaki raporda bulunur.

Bu ölçümler fiziksel iPhone FPS sonucu değildir. Su taraması işinin azalması, tek başına her cihazdaki kasmanın giderildiğini kanıtlamaz. Tam harekâtın normal oyuncu kontrolüyle baştan sona bitirilmesi hâlâ ayrı bir oynanış doğrulamasıdır. Harekâtın ileri aşamalarındaki mevcut otomatik test kurulumu oyuncu konumunu, düşmanları ve görev saatini kontrollü değiştirir.
