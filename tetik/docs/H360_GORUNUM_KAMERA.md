# HİSAR TETİK: Hisar 360 bağlantısı, görünüm, Kamera ekranı, şekilli hedef, lazer türleri (sürüm 31–35)

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

## 4. Şekilli hedef ve lazer eğitim fişeği (sürüm 34)

Kullanıcı isteği (22 Kasım 2026): hedefler dokunarak, noktaların arası çerçevelenerek tanınsın (bazı hedefler insan silüeti);
namluya takılan lazer eğitim fişeği desteklensin (lazer doğrudan hedefe düşer; altta sensör nişan hatasını verir).

- **Hedef türü:** "Halkalı yuvarlak hedef" (eskisi gibi, üç dokunuş) ya da "Silüet ya da başka şekil".
- **Şekilli hedef:** görüntüde hedefe dokun, sonra kenarı boyunca sırayla noktalar koy (en az 3; "Son noktayı sil", "Çerçeveyi bitir").
  İsteğe bağlı iç bölge (ör. göğüs): ikinci çokgen, hedefin içinde olmalı ("İç bölgeyi bitir" ya da "Atla"). Düğmeler önizlemenin hemen altında.
- **Ölçek:** hedefin gerçek boyu (cm). Noktalar görüntüde ve hedef düzleminde cm olarak (merkez: çokgenin ağırlık merkezi) tutulur.
- **Puan:** lazer çokgenin içine düşerse İSABET (iç bölgeye düşerse İSABET · İÇ BÖLGE), dışına düşerse KARAVANA. İsabet sınaması
  atışın düzeltilmiş yerinde yapılır; kamera hedefe eğik baksa da içerde/dışarda kararı değişmez.
- **Oturum:** hedefin şekli oturuma yazılır (`lzTip`, `lzPoly`, `lzIc`); hedef görünümünde halkalar yerine kağıtta silüet çizilir;
  özet: "Lazer 4/5 atışta görüldü: 3 isabet (1'i iç bölgede), 1 karavana."
- **Lazer eğitim fişeği** (lazer türü "namluda"): iğne vurunca lazer bir an yanar, namlu ekseninden çıkar; sıfırlama gerekmez (eski sıfır
  farkı uygulanmaz). Nokta, sensöre takılı lazerdeki gibi atış anından sonra aranır.
- Tür değişince eski tanıtma silinir (yuvarlakta çap, şekilde boy ayrı hatırlanır).

Test: `hedef_testi.js` 32/0 (sahte kamerada insan silüeti; isabet, iç bölge, baş, karavana, görülmedi; fişek; sayfa hatası yok).

## 5. Raya takılı lazer ve sıfırlama (sürüm 35)

Kullanıcı: "Dışarıdan raya takılan lazer türü de var, onun sıfırlamasını yapacağız."

| Lazer türü | Nasıl yanar | Sıfırlama |
|---|---|---|
| Sensöre takılı (Laser TX, Grove) | Sensör tetik düşünce yakar | Gerekir |
| Raya takılı, kendi anahtarıyla (ör. basınç anahtarlı) | Atıcı anahtara bastıkça | Gerekir; her takışta bir kez |
| Lazer eğitim fişeği (namluda) | İğne vurunca bir an | Gerekmez (namlu ekseni) |

Sıfırlama: sensör bağlıyken nişangahla nişan noktasına nişan alıp 3 kez tetik düşürülür; uygulama lazer ile nişan noktası arasındaki farkı
(cm, o mesafede) saklar ve sonraki her atışta düzeltir. Nişan noktası: yuvarlak hedefte merkez; şekilli hedefte iç bölge çizildiyse onun
ortası, çizilmediyse şeklin ortası; önizlemede sarı artıyla gösterilir. Mesafe değişince uygulama yeniden sıfırlamayı söyler.

Test: `hedef_testi.js` (39/0) — raya takılı lazerle silüette iç bölgenin ortasına nişanla sıfırlama; nişangah iç bölgedeyken lazer
3 cm sağda görünse de düzeltilmiş yer iç bölge.

## Donanımla doğrulanacaklar

- Gerçek telefon kamerasıyla nokta bulma (gün ışığı, kırmızı/yeşil lazer), tripod kıpırdaması.
- Sensöre takılı M5Stack Laser TX'in "Lazeri dene" ile yanması (sensör yazılımı 7).
- Lazer eğitim fişeğinin kısa darbesinin telefon kamerasında görülmesi (kare hızı 30/60).
- Gerçek silüet hedefte çerçeveleme ve isabet kararı.
- Unit CamS3: donanım gelince (T3).
