# HİSAR TETİK: Nişan hataları, sensörün ölçebildikleri, teşhis yöntemi ve ölçüm uyarıları (sürüm 36–37, T8)

Kullanıcı isteği (22 Kasım 2026): "Nişan hatalarını internetten araştır; sensörün ölçebileceği bütün gerçekçi nişan hataları olsun.
Hep aynı hataları vermesin. Hassasiyetleri cihazın özelliklerine göre ayarla, uyarıları geliştir." ve "İşlevsellik de çok önemli olsun."

## 1. Araştırmadan çıkanlar

| Kaynak | Ne söylüyor | Uygulamaya etkisi |
|---|---|---|
| NRA / 4-H "Pistol Groups Analyzed" | Sağ elli tabancacıda kaymanın saat yönü olası nedeni gösterir. Saat 7'de iki olasılık var: tetiğe ani basma YA DA bütün eli sıkma. Saat 6'da bilek düşmesi ya da tepmeyi bekleme | Yön tek başına yetmez. Aynı yönde ani hareket ile yavaş hareket farklı nedene bağlanır |
| Rehn, "Updating the Pie Chart Target" (Shooting Illustrated) | Klasik pasta şeması yanıltıcı; hatalar birleşir. En yaygınları: tetikle birlikte öbür parmakların kapanması, kolların itmesi, nişanın durmasını bekleyip tetiğe saldırma. Acemide tutarsızlık olağandır | Oturum özetinde "Hatalar her atışta başka yönde" gözlemi. Bu durumda tek bir hataya değil temele odaklanılması söylenir |
| SCATT (atış simülatörü) | Son 1 sn'deki ortalama nişan hızı ile son 0,25 sn'dekini karşılaştırır. Son anda hız artıyorsa hata tetikte, iki hız yakınsa nişanda (tutuşta) | Teşhiste aynı iki hız (v1, v25) ve tetik penceresindeki hareketin zamanı kullanılır |
| MantisX | Atışı evrelere ayırır: tutuş, tetik, takip (atış sonrası) | Uygulamada da üç evre var: −1000..−150 ms tutuş, −150..0 ms tetik, 0..+600 ms takip |
| AimTracer (416 Hz atalet sensörü) | Tutuş: −167 ms'ye kadar, tetik: −150..+80 ms, takip: 0..+250 ms | Tetik penceresinin 150 ms olması bu ölçümlerle uyumlu |
| "Flinch ile trigger jerk farkı" (Shooting Illustrated) | İrkilme (flinch): patlamayı bekleyip istemsiz itme, çoğunlukla aşağı. Tetiğe ani basma (jerk): parmağın hızlı hareketi, sağ elde sol aşağı | Ani hareket aşağıdaysa "Tepmeyi bekleyip irkilme", sol aşağıdaysa "Tetiğe ani basma" |
| Pistol shooting accuracy… viewing time (PubMed 18992872) | Deneyimli atıcı en iyi sonuca ≈2 sn, acemi ≈3 sn görme süresiyle ulaşıyor. Fark duruş dengesinden geliyor | Nişan süresi ölçülür. Uzun beklemek isabeti artırmaz |
| Antrenör görüşü (Pistol Coach Masud, kaynak göstermiyor) | Atışı nişana geldikten 6–8 sn içinde bitir. 10 sn'de bitmediyse silahı indir | Sınır tabancada 8, tüfekte 10 sn. Bilimsel bir eşik değil, eğitim önerisi |
| MPU-6886 veri sayfası (sensörün içindeki çip) | Jiroskop gürültüsü 0,004 °/sn/√Hz (en çok 0,01). Sıfır sapması ±1 °/sn (uygulama ölçer). Sıcaklıkla ±0,01 °/sn/°C | En küçük güvenilir tetik hareketi 0,02° (aşağıda) |

## 2. Sensörün ölçebildiği ve ölçemediği

HİSAR sensörü namluya takılı. İçindeki ivmeölçer ve jiroskop saniyede 200 ölçüm yapar. Darbe kanalı 1 kHz'tir.

**Ölçebildiği:**

| Hata | Nasıl |
|---|---|
| Tetik anında namlu kayması (yön + büyüklük) | Jiroskop, tetik penceresi |
| Kaymanın zamanı (son anda / baskı boyunca / önceden) | İz, 10 ms ızgara |
| Silahı yana yatırma (kanting) | İvmeölçer |
| Tetik çekerken silahı döndürme | Jiroskopta namlu ekseni |
| Nişanın sallanması | Tutuşta titreme |
| Düzgün aşağı-yukarı kayma (nefes, kol yorgunluğu) | Tutuşta eğim |
| Nişan süresi | Son büyük hareketten (silahı kaldırma, sürgü) atışa |
| Takibi bırakma | Atıştan sonraki 150 ms |
| Tepme ve toparlanma | Gerçek atışta |
| Yorulma | Oturum boyunca titremenin artması |

**Kamera ve lazerle ek olarak:** gerçek isabet yeri. Sensörün ölçtüğü tetik hareketi çıkarılınca silahın baskıdan önce nereye baktığı
kalır. Bu sapma büyükse hata tetikte değil nişandadır: gez-arpacık hizası, nişan noktası ya da lazer sıfırı.

**Ölçemediği:** gözün arpacıkta olup olmadığı, baskın göz, tutuşun sıkılığı, parmağın tetikteki yeri. Bunları doğrudan
ölçemez, yalnız yol açtıkları hareketten tahmin eder. Bu yüzden her neden "olası neden"dir. Neden sayfası, tahminin neye dayandığını söyler.

## 3. Teşhis yöntemi (sürüm 36)

**Tetik penceresi:** atıştan önceki 150 ms. Burada önce hareketin titremeden ayırt edilip edilemediğine bakılır:
- Hareket, tutuştaki 150 ms'lik tipik titremenin 1,75 katından küçükse hata nişandadır, yönünden tetik hatası çıkarılmaz.
- Ayrıca hareket en az ölçeğin %10'u ve en az 0,02° olmalıdır.

**Zamanlama (izden):**

| Sınıf | Ölçü | Anlamı | Örnek (sağ el, saat 7) |
|---|---|---|---|
| Son anda ani | Hareketin en az %60'ı son 50 ms'de | Parmak ya da irkilme | Tetiğe ani basma (ya da irkilme) |
| Baskı boyunca | Yayılmış | Tutuş baskısı | Bütün parmakları kapatma (ya da bilek) |
| Önceden | Aynı yöndeki hareket pencereden önce (−300..−150 ms) en az %60 kadar | Nişan kayarken atış (kovalama) | Nişan kayarken tetiği bitirme |

- Yönler için tablolar: `TMAP_P` (tabanca) ve `TMAP_R` (tüfek). "Baskı boyunca" klasik şemadır; yalnız saat 7–8'de "ani basma"
  yerine "bütün parmakları kapatma" gelir, çünkü yavaş bir hareketin ani basma olması beklenmez.
- Önceden başlayan hareket tutuştaki düzgün dikey kaymanın devamıysa "Nişanın aşağı-yukarı kayması" söylenir.
- Oturum genelinde her atışta aynı yöne önceden başlayan hareket kovalama değil, sistemli itmedir. Bu durumda yöne özgü neden
  söylenir (ör. saat 6: silahı öne itme).

**Yeni hatalar:**

| Hata | Ne zaman söylenir |
|---|---|
| Nişan kayarken tetiği bitirme | Önceden başlayan hareket |
| Nişanın aşağı-yukarı kayması | Son saniyede en az 0,1 °/sn (tabancada 0,15 °/sn) düzgün dikey kayma. Doğrudan sapmanın en az 8 katı, yataydan en az 2 kat büyük olmalı |
| Nişanı uzatma | Nişan süresi tabancada 8, tüfekte 10 sn'den uzun ve atış 85'in altında. Deneme modunda ve hızlı alıştırmalarda aranmaz |
| Gez-arpacık hizası bozuk | Kamera ve lazerle. Tetik hareketi çıkarılınca kalan sapma ölçeğin yarısından, titremenin 2,5 katından ve 0,1°'den büyük. Ayrıca tetik hareketinin en az 2 katı olmalı. Bu durumda en başta söylenir |

**Ölçüm satırı:** her atış kartında teşhisin dayandığı ölçüm yazar. Örnek: "Tetik düşmeden önceki 150 ms'de namlu saat 7 yönüne 0,20°
(25 m'de 8,7 cm) kaydı. Hareketin %100 kadarı son 50 ms'de oldu: ani." Aynı neden tekrarlarsa "bu oturumda 3. kez" yazar.

**Oturum gözlemleri:**
- Hatalar her atışta başka yönde: en az 6 hatalı atış, yönlerin bileşkesi 0,35'ten küçük, en az 3 farklı neden, sistematik hata yok.
- Yorulma: son üçte birde titreme ilk üçte birden en az %40 ve ölçeğin %15'i kadar fazla.
- Grup nişan noktasından kayık: lazerle, en az 4 atış. Tetik hareketi çıkarılınca ortalama sapma standart hatanın 2,5 katı ve ölçeğin %30'u.
- Nişan uzun sürüyor: atışların yarısı ya da fazlası sınırdan uzun.
- Oturum geneli hata ile en sık hata aynıysa bir kez gösterilir.

**Eski kayıtlar:** teşhis yönteminin sürümü (`TESHIS_V` = 2) oturuma yazılır. Daha eski oturumlar açılışta bir kez yeni yöntemle
değerlendirilir. Dışa aktarmadan alınan oturumlar da aynı şekilde değerlendirilir. İzi olmayan çok eski kayıtlarda klasik şema kullanılır.

## 4. Cihaza göre duyarlılık

- **Jiroskop gürültüsü:** 150 ms'de açıya etkisi ≈ 0,004 °/sn/√Hz × √0,15 sn ≈ 0,002° (en kötü durumda 0,004°).
- **Isınmayla kalan sapma:** birkaç °C × 0,01 °/sn/°C ≈ 0,05 °/sn. 150 ms'de ≈ 0,008°.
- **Taban:** 0,02° (25 m'de ≈ 0,9 cm). Bu, yukarıdaki iki etkinin 2–5 katı pay bırakır. Tabancada ölçeğin %10'u (0,03°) zaten
  daha büyüktür. Taban tüfekte ve "zor" ayarında etkilidir.
- **Hız ölçüsü:** 10 ms adımlı hızda gürültü ≈ 0,05 °/sn, oranlarda taban 0,1 °/sn.
- **Sabit hızlı kayma:** işlemcinin sapma izleyicisi 10 sn'lik zaman sabitiyle sabit hızlı kaymayı süzer. Bu yüzden saatlerce aynı
  yöne giden bir kayma "her atışta aynı hata" üretmez.
- **Nişan süresi:** 20 °/sn üstü hareket "büyük hareket" sayılır (silahı kaldırma 50–200 °/sn, tutuş titremesi 0,5–3 °/sn).
  Tetikten önceki son 200 ms sayılmaz; ani basma da birkaç °/sn'lik bir hareket olduğu için nişanı sıfırlamaz.

## 5. Benzetimle doğrulama (`nisan_dogruluk_testi.js`)

Gerçekçi silah hareketi ve sensör ham verisi (sapma ve gürültüyle) uygulamanın kendi işlemcisinden geçirildi:

| Ölçü | Sonuç |
|---|---|
| Yön (8 montaj × 12 saat × 3 büyüklük) | Saat tam %96, bir saat içinde %100 |
| Karışık atıcılar (24 oturum, 480 atış): doğru teşhis | %71 (klasik şemaya göre %22) |
| Karışık atıcılar: tetik hatasını bulma | %67 |
| Karışık atıcılar: titremeyi tetik sanmama | %89 |
| Zamanlama sınıfı (ani / baskı boyunca / pencerede erken / önceden; titreme 0,01° ve 0,03°) | Ayırt edilen atışlarda en az %90 doğru |
| Nefes (0,2° ve 0,4° salınım) | Düşük skorlu atışların en az %80'inde nişan hatası (yarıya yakınında "aşağı-yukarı kayma"), en çok %15'inde yanlış tetik hatası |
| Rastgele titremede yanlış "aşağı-yukarı kayma" | En çok %8 |
| Nişan süresi (3 / 6 / 9 / 12 sn) | ±0,2 sn. 9 ve 12 sn'de "Nişanı uzatma" söylendi, 3 ve 6 sn'de söylenmedi |

Birim testleri (`teshis_testi.js`): 21 hatanın her biri en az bir durumda teşhis ediliyor. Ayrıca şunlar test edildi: aynı yönde farklı
zamanlama, ölçüm satırı, oturum gözlemleri, lazerle nişan noktası (şekilli hedefte iç bölgenin ortası) ve eski kayıtların yeniden değerlendirilmesi.

## 6. "Hep aynı hata" için yapılanlar

1. Aynı yön artık hareketin zamanına göre farklı nedene gidiyor (önceden her saat yönü tek bir nedene bağlıydı).
2. Titreme düzeyindeki hareketten tetik hatası çıkarılmıyor. Tabanı sensör gürültüsüne göre ayarlı.
3. Nişandan gelen hatalar ayrıldı: sallanma, düzgün dikey kayma, uzun nişan, nişan kayarken atış.
4. Tekrar eden neden kartta sayıyla gösteriliyor ("bu oturumda 3. kez"). Oturum geneli hata ile en sık hata aynıysa bir kez gösteriliyor.
5. Deneme modundaki sanal atıcı artık farklı zamanlamalarla hata yapıyor (son anda, baskı boyunca, önceden).

## 7. Donanımla doğrulanacaklar

- **Kuru tetikte iğne ya da horoz düşmesi:** gerçek sensörde darbenin tetik penceresine sızıp sızmadığı. Sızarsa her atışta
  aynı yöne küçük bir kayma görülür.
- **Gerçek nefes ve kol yorgunluğu:** benzetimdeki eşiklerin (dikey kayma oranı 8) gerçek kayıtta tutup tutmadığı.
- **Nişan süresi:** sürgü çekme ve silahı indirme hareketlerinin 20 °/sn eşiğini her zaman aştığı.
- **Kamera ve lazerle nişan noktası:** gerçek lazer sıfırıyla.

## 8. Ölçüm uyarıları (sürüm 37)

Teşhisin güvenilirliğini bozan cihaz durumları oturum sırasında söylenir. Her biri bir oturumda bir kez söylenir ve bir atışta en çok bir uyarı çıkar.
Hepsi oturum özetinde "Ölçüm notları" kartında sayılarıyla toplanır.

| Uyarı | Ne zaman | Neden önemli |
|---|---|---|
| Ölçüm hızı düşük | Tetikten önceki 1 sn'de 120'den az ölçüm (HİSAR sensörü 200/sn, telefon sensörü ≈60/sn) | Son 50 ms'de 6'dan az ölçüm kalır; zamanlama ayrımı yapılmaz, yalnız yön kullanılır |
| Bluetooth veri kaybı | Son 10 sn'de kayıp %3 ve üstü | Kayıp olan atışlarda iz ve değerler yaklaşık olur |
| Sensörün sıfırı kaymış olabilir | Art arda 4 atışta, tutuşta aynı yöne (kosinüs > 0,9) düzgün ve en az 0,3 °/sn kayma | İnsan kolu her atıştan önce aynı yöne aynı hızda kaymaz; bu çoğunlukla jiroskop sıfırının (ısınma) kaymasıdır ve her atışta aynı sahte hatayı üretir |
| Sıfır ölçülmeden başlama | Kayıtlı sıfır yok ve sensör bağlandıktan sonra 1,5 sn hiç durmadı | MPU-6886'nın sıfır sapması ±1 °/sn'ye kadar çıkar; 150 ms'de 0,15°'lik sahte hareket |
| Lazer görülmüyor | Lazerli oturumda art arda 3 atışta nokta kamerada yok | Kamera hedefi görmüyor ya da lazer yanmıyor |

Oturum özetindeki ölçüm notları ayrıca şunları sayar: veri boşluğu olan atışlar, tepmenin sensör sınırını (±16 g, ±2000 °/sn) aştığı atışlar
ve sensörün yön testindeki gibi takılı görünmediği oturumlar.

## Kaynaklar

- [4-H Shooting Sports: Pistol Groups Analyzed](https://4-hshootingsports.org/wp-content/uploads/2025/01/Pistol-Groups-Analyzed.pdf)
- [Shooting Illustrated: Updating the Pie Chart Target](https://shootingillustrated.com/content/updating-the-pie-chart-target)
- [SCATT: Using the SCATT training system to identify technical errors](https://www.scatt.com/blogs/articles/using-the-scatt-training-system-to-identify-technical-errors)
- [MantisX: Reading firearm training data](https://mantisx.com/blogs/news/reading-firearm-training-data-on-the-mantisx-open-training-drill)
- [AimTracer: every trigger pull tells a story (Hackaday.io)](https://hackaday.io/project/206314-aimtracer-every-trigger-pull-tells-a-story/details)
- [Shooting Illustrated: What's the difference between a flinch and trigger jerk](https://www.shootingillustrated.com/content/what-s-the-difference-between-a-flinch-and-trigger-jerk)
- [Pistol shooting accuracy as dependent on experience, eyes being opened and available viewing time (PubMed 18992872)](https://pubmed.ncbi.nlm.nih.gov/18992872/)
- [Pistol Coach Masud: science of holding time (antrenör görüşü, kaynak göstermiyor)](https://pistolcoachmasud.blogspot.com/2026/05/science-of-holding-time-trigger-freeze-shooting.html)
- [TDK InvenSense MPU-6886 veri sayfası](https://stg.robu.in/wp-content/uploads/2021/11/1126241-MPU-6886-000193v1.1_GHIC_en.pdf)
