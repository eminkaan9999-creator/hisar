# HİSAR TETİK – T2 Arayüz

- **Tarih:** 20–21 Kasım 2026
- **Dal:** `tetik-next` (T1'in üstünde, Pull Request #40)
- **Uygulama sürümü:** 29 (önceki 28)
- **Kapsam:** Talimattaki T2: profesyonel karanlık tema, büyük dokunma alanları, tamamen Türkçe arayüz, telefon, tablet ve geniş ekran, dikey ve yatay kullanım, erişilebilir yazı boyutu, çevrimdışı göstergesi, 7 ana menü.
- **Kullanıcı kararı:** Kullanıcı 20 Kasım'da "Durmadan sorma, hepsine onayım var" dedi, 21 Kasım'da yineledi. Bu yüzden taslak ekranlar (7 çizim) onay beklenmeden uygulamaya geçirildi.

## 1. Özet

| | Sonuç |
|---|---|
| Tema | Antrasit zemin `#14171B`, koyu lacivert paneller `#111C2B`, turkuaz vurgu `#2CC9BA` (yalnız ana düğme ve seçili öğe). Durum renkleri her zaman simge ve yazıyla. Grafik ve rapor görseli de aynı renklerde |
| Ana menü | Telefonda altta 5 düğme: Merkez, Eğitim, Analiz, Cihazlar, Menü. 900 px ve üstünde (yatay tablet, bilgisayar) solda 7 ana menü |
| Yeni ekranlar | Kontrol Merkezi (açılış görünümü), Cihaz Yönetimi, Kamera, Menü |
| Yazı boyutu | 14 px'ten küçük 68 yazı kuralı 14 px'e çıkarıldı. Ölçüm: 8 ana ekran, 12 ayar sayfası ve oturum sekmelerinde 14 px'ten küçük yazı yok (grafiklerin içi hariç, bölüm 6) |
| Dokunma alanı | Alt menü düğmeleri 60 px; yeni ekranlardaki bütün düğmeler en az 44 px; ana düğmeler 56 px; Dur düğmesi 44 → 52 px |
| Çevrimdışı | İnternet yokken telefonda menünün üstünde, geniş ekranda sol menünün altında "Çevrimdışı" göstergesi; Menü ekranında bağlantı ve yedek durumu |
| Türkçe | "Safe Space" → "Kaygısız Deneme", "(Shot Timer)" kaldırıldı, "Drill" → "Ayar" |
| Eski kayıtlar | Sürüm 28'in kaydettiği gerçek veri (2 oturum, sol el, profil adı) yeni sürümde aynen yükleniyor (otomatik test) |
| Testler | 618 (+ sensör yazılımı testi) denetim geçti, 0 başarısız (bölüm 4) |

## 2. Ekranların yeni yeri

Hiçbir ekran silinmedi. Eski yolların hepsi de çalışıyor.

| Eski yer | Yeni yer |
|---|---|
| Alıştırma sekmesi | Eğitim Oturumları (altta "Eğitim") |
| Analiz sekmesi | Analiz ve Raporlar (altta "Analiz") |
| Sensör sekmesi | Sensörler (Menü'de, geniş ekranda sol menüde; ayrıca Cihaz Yönetimi › Sensör ayrıntıları) |
| Ayarlar sekmesi | Ayarlar (Menü'de, geniş ekranda sol menüde; Kontrol Merkezi'ndeki silah satırından) |
| Lazer ve kamerayla puan sayfası | Kamera ekranından ve Cihaz Yönetimi › Lazer ayarları'ndan |
| Sensörü bul, Kalibrasyon ve yön, Atış algılama, Akıllı saat | Cihaz Yönetimi'nden de açılıyor (eski yerleri duruyor) |
| – | **Yeni:** Kontrol Merkezi (sensör, lazer, kamera durumu; hızlı başlat; son oturumun özeti), Menü (7 ana menü, bağlantı ve yedek) |

## 3. Değişmeyenler

Veri biçimi ve kayıt anahtarları (`hisarTetik.v2`), sensör protokolü ve sensör yazılımı, atış algılama ve analiz, alıştırmaların işleyişi, yerel kabuklar (iPhone, Android, PC) ve köprü. Adres kısayolları (`#alistirma`, `#ayarlar/…`) çalışıyor; yeni kısayollar: `#merkez`, `#cihaz`, `#kamera`, `#menu`.

## 4. Testler (simülasyon ve masaüstü Chromium; gerçek donanım yok)

Test takımı T2'de üç kez baştan sona çalıştırıldı. Birincide 1 başarısız vardı (kararsız lazer testi, aşağıda B-20); ikinci ve üçüncüde hepsi geçti. Tablodaki sayılar üçüncü çalıştırmadandır (`cb70c1f`, `808f9d5`).

**G1 – Kod ve mantık doğrulaması**

| Test | Geçen | Başarısız |
|---|---|---|
| Sensör yazılımı akış testi (C++, masaüstü; veri akışı, komutlar, OTA, lazer) | Geçti (0 hata; kaynakta 87 CHECK denetimi) | 0 |
| PageStore testi | 17 | 0 |
| Teşhis testi | 23 | 0 |
| Nişan doğruluk testi | 37 | 0 |
| Montaj testi | 15 | 0 |
| Dayanıklılık testi | 6 | 0 |
| Analiz testi | 20 | 0 |
| Protokol testi | 24 | 0 |

**G2 – Entegrasyon doğrulaması (Playwright + sahte sensör, kamera, yerel köprü)**

| Test | Geçen | Başarısız |
|---|---|---|
| Ses testi | 18 | 0 |
| Sensörü bul testi | 17 | 0 |
| Akıllı saat testi | 16 | 0 |
| Nişan dışı sarsıntı testi | 18 | 0 |
| Ekran testi | 12 | 0 |
| Arayüz testi | 38 | 0 |
| Uygulama güncelleme testi | 18 | 0 |
| Bağlantı testi | 87 | 0 |
| Mikrofon ve ham kayıt testi | 59 | 0 |
| Bütün özellikler testi | 76 | 0 |
| Lazer hedef testi | 53 | 0 |
| Güncelleme testi | 39 | 0 |
| Köprü testi | 25 | 0 |

**Yeni: Arayüz testi (`tetik/test/arayuz_testi.js`)**: açılış görünümü; alt menüdeki 5 düğme ve boyutları; Menü'deki 7 satırın her birinin doğru ekranı açması; sensör bağlanınca ve ayrılınca Kontrol Merkezi ile Cihaz Yönetimi'nin kendiliğinden güncellenmesi; hızlı başlat ve geri tuşu; Kamera › puanlama ayarları; bilgisayar (1280×800), yatay tablet (1180×820), dikey tablet (820×1180), yatay telefon (844×390) ve küçük telefonda (360×640) menü yerleşimi ve 8 ana ekranda yana taşma; çevrimdışı göstergesi; 14 px altı yazı; 44 px altı düğme; ekranda İngilizce ad; sürüm 28 kayıtlarının yüklenmesi.

**Değiştirilen eski testler** (davranış bilerek değişti):

- `alistirma_testi.js`: açılış artık Kontrol Merkezi, liste için önce Eğitim açılıyor; alt menü adları; "Atış Zamanlayıcısı"; "Kaygısız deneme" etiketi; 360 px taşma denetimine 4 yeni ekran eklendi.
- `kopru_testi.js`: Android geri tuşu zinciri artık Kontrol Merkezi'nde bitiyor.
- `ekran_testi.js`: 4 yeni ekran da taranıyor (ekran sayısı 4 arttı).

**Ekran görüntüsüyle bakılanlar:** açılış ekranı, Kontrol Merkezi, Eğitim, Analiz, Cihaz Yönetimi, Kamera, Menü, çevrimdışı durumu, oturum (skor ve özet), alıştırma hazırlığı, Ayarlar ve Eğitim Programı sayfası; telefon (390×844), dikey tablet (820×1180) ve bilgisayarda (1280×800).

**Yeni bulgu B-20 (Düşük): kararsız lazer testi.** `lazer_testi.js` içindeki "Kamera gürültüsünde (kanal başına σ=3) yanlış nokta yok" denetimi, T2'nin ilk tam çalıştırmasında 86 karenin 1'inde yanlış nokta buldu. Aynı test ardından 3 kez daha çalıştırıldı ve geçti. Sahte kameranın gürültüsü her çalıştırmada rastgele; nadiren algılama eşiğini aşıyor. T2 lazer ve kamera koduna dokunmadı (değişen satırlar o bölümün dışında). Gerçek kamerada da nadir bir yanlış isabet olabileceği için T3'te (kamera aşaması) incelenecek; test bu aşamada değiştirilmedi.

## 5. Henüz doğrulanamayanlar

- Gerçek iPhone (WKWebView), Android WebView ve PC tarayıcısında görünüm. Testler masaüstü Chromium'da yapıldı; çentik ve alt çubuk (safe area) davranışı gerçek telefonda bakılmalı.
- Gerçek sensör, gerçek lazer ve gerçek kamerayla Kontrol Merkezi ve Cihaz Yönetimi durumları (sahte sensörle test edildi).
- Ekran okuyucuyla (VoiceOver, TalkBack) kullanım.

## 6. Bilinen sınırlamalar

- Grafiklerin içindeki yazılar (SVG) yazı ölçümüne dahil değil; telefonda 8,5–12 px görünebiliyor. Analiz ve raporlar aşamasında (T6) büyütülecek.
- Eski ekranların iç düzeni korunuyor; yalnız renk, yazı boyutu ve köşeler değişti. Geniş ekranda bu ekranlar 720 px genişlikte ortalanıyor; yeni ekranlar ve Analiz 980 px.
- Kamera ekranı şimdilik mevcut "Lazer" ayar sayfasını açıyor. CamS3 desteği yok (T3).
- Gövde yazı tipi sistem yazı tipi olarak kaldı (internetsiz çalışma için); başlıklar Chakra Petch.

## 7. Geri dönüş

Dal birleştirilmeden `main` ve telefonlardaki sürüm 28 değişmez. Birleştirmeden sonra sorun olursa birleştirme commit'i `git revert` ile geri alınır; uygulama sürüm 28'e döner. Veri biçimi değişmediği için kayıtlar etkilenmez.

## 8. Sonraki adımlar

1. Android imza anahtarının yenilenmesi (B-01; kullanıcı onay verdi).
2. T3: Unit CamS3 kamera.
