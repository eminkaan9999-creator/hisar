# HİSAR TETİK: Hisar 360 bağlantısı, görünüm ve Kamera ekranı (sürüm 31–33)

Kullanıcı isteği (21 Kasım 2026): "Bu uygulamayı da Hisar 360 gibi geliştir" (seçilen yol: Hisar 360 hesaplarıyla),
"görüntülerini temasını da değiştir", "lazer ve kamera kullanımını etkin hale getir".

## 1. Hisar 360 hesaplarıyla (sürüm 31, #44)

| Konu | Durum |
|---|---|
| Giriş | Hisar 360'taki telefon ya da kullanıcı adı ve şifre; Hisar 360'ın giriş yöntemiyle aynı (yalnız yayımlanabilir anahtar) |
| Gönderilen | Bitirilen gerçek oturumun özeti (alıştırma, süre, atış sayısı, ortalama/en iyi skor, en sık 3 hata, oturum geneli hata). Ham sensör verisi, not, konum gönderilmez |
| İnternetsiz | Özet cihazda kuyrukta bekler; aynı oturum iki kez kaydedilmez |
| Komutan | "Birlik sonuçları": 7/30/90 gün, kişiye dokununca son oturumlar. Kapsamı Hisar 360 veritabanı belirler |
| Hisar 360 tarafı | eminkaan9999-creator/hisar360#158 (taslak): tablo ve yetkiler, Atış bölümünde komutan sayfası. **Canlıya sahip uygular** |
| Test | `hesap_testi.js` 25/0 (sahte Hisar 360 sunucusu, yalnız sentetik hesaplar) |

Hisar 360'ta tablo kurulana kadar uygulama "Hisar 360'ta Tetik sonuçları henüz kurulmadı" der; özetler cihazda bekler.

## 2. Görünüm (sürüm 32, #45)

- Hisar 360 ile aynı renkler ve yazı tipi (Times New Roman). Aydınlık tema varsayılan; Ayarlar › Görünüm: Aydınlık / Karanlık / Cihaza göre.
- Renkler CSS değişkenlerinde (`:root` aydınlık, `html[data-tema="koyu"]` karanlık). Vurgu yazı/çizgi `--acc`, dolgu `--acc-bg`.
- Grafikler, iz, kanting, eğim göstergesi, Analiz ve paylaşım resmi renklerini `TC()` ile CSS değişkenlerinden alır; tema değişince açık ekran yeniden çizilir.
- Seçim `hisarTetik.v2.tema` anahtarında, yalnız bu cihazda; ilk çizimden önce sayfanın başındaki küçük betikle uygulanır.
- Test: `tema_testi.js` — 31 ekran ve sayfada her görünür yazının kontrastı (normal ≥ 4,5; büyük ≥ 3; devre dışı ögeler hariç), iki temada.

## 3. Kamera ekranı (sürüm 33)

Kamera ekranı artık puanlamanın kendisi: canlı önizleme ve dört adım.

1. **Kamera:** tripodda, hedefe dönük; telefoto kamera seçilebilir.
2. **Hedef:** önizlemeye üç dokunuş (hedef, merkez, dış kenar); çap (cm).
3. **Lazer:** nokta kamerada görülünce tamamlanır; sensöre takılı lazerde "Lazeri dene".
4. **Sıfırlama:** sensörle, nişangah merkezdeyken 3 atış.

Rozet: Kapalı → Ayar gerekli → Sıfırlanmadı → Hazır. Ayrıntılı ayarlar (lazer kaynağı, yanma süresi, hassasiyet) "Lazer ayarları"nda.
Lazer sayfası ile Kamera ekranı aynı kodu kullanır (`lzKameraBagla`). Ekrandan çıkınca kamera kapanır (oturum yoksa).

Test: `kamera_testi.js` 29/0 (sahte sensör ve sahte kamera): açma, önizleme, üç dokunuş, nokta görülmesi, sıfırlama,
rozet, ekrandan çıkınca kapanma, dönünce açılma, ayarlardan dönüş, oturumda kamerayla puan (merkez 10), kapatma, izin reddi.

## Donanımla doğrulanacaklar

- Gerçek telefon kamerasıyla nokta bulma (gün ışığı, kırmızı/yeşil lazer), tripod kıpırdaması.
- Sensöre takılı M5Stack Laser TX'in "Lazeri dene" ile yanması (sensör yazılımı 7).
- Unit CamS3: donanım gelince (T3).
