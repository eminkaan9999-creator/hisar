# HİSAR TETİK – T4 Sensör teşhisi

- **Tarih:** 21 Kasım 2026
- **Dal:** `tetik-t4` (`main` 73e1d71 üstünde)
- **Uygulama sürümü:** 30 (önceki 29)
- **Kapsam:** Talimattaki T4 (sensör ve IMU). Kullanıcının şikâyeti: tabancada hemen her atışta "Nişanın sallanması" çıkıyor; bilek dönmesi gibi hatalar hiç çıkmıyor; boş tabancada sürgüyü çekmek atış sayılıyor.
- **Sıra:** T3 (CamS3 kamera) donanım henüz kullanıcıda olmadığı için T4 önce yapıldı.

## 1. Sorunun kaynağı (kod incelemesi)

| Bulgu | Yer | Etkisi |
|---|---|---|
| Skor 85'in altındaysa ve tetik anındaki hareket titremenin 1,75 katı değilse "Nişanın sallanması" söyleniyor | `diagnose`, `trigClear` | Doğru bir ayrım; ama elde tutulan tabancada titreme büyük olduğu için çoğu atış bu yola düşüyor |
| Skor ne olursa olsun, nişan gezinmesi 0,165°'yi (tabanca) aşınca "Nişanın sallanması" ekleniyor | `diagnose` | İyi atışlarda bile aynı hata; oturum özetinde en sık hata hep bu |
| Her atışta aynı yöne giden küçük tetik hareketi, tek atışta titremenin altında kalınca hiç söylenmiyor | `diagnose` | Asıl tetik hatası gizleniyor |
| Namlu çevresinde dönme (bilek dönmesi) ölçülmüyor; kanting ivmeölçerden yarım saniyelik ortalamayla ölçülüyor | `Proc.feed` | Tetik anındaki dönme görünmüyor |
| Kullanıcının dışa aktardığı kayıtta "Nişan dışı sarsıntıları sayma" kapalıydı | Ayarlar | Sürgü çekme darbeleri atış sayılıyor |

## 2. Yapılanlar

1. **Tetik çekerken silahı döndürme (yeni ölçüm ve 2 yeni hata).** Namlu çevresindeki dönme artık jiroskoptan anlık ölçülüyor (`Proc.roll`). Atıştan önceki son 150 ms'deki dönme (`dr`) tutuştaki dönme titremesinin (`rv`) 1,75 katını ve 1°'yi aşarsa **"Tetik çekerken silahı sağa döndürme"** ya da **"… sola döndürme"** söyleniyor. İşaret kantingle aynı (+ silahın üstü sağa). Hızlı alıştırmalarda aranmıyor.
2. **Oturum geneli tetik hatası.** Tek atışta titremeden ayırt edilemeyen ama her atışta aynı yöne giden küçük tetik hareketi, atışların ortalamasında bulunuyor. Titreme rastgele yönlü olduğu için ortalamada söner, sabit hata kalır. Koşullar: en az 6 atış; ortalama hareket, standart hatasının 2,5 katı ve ölçeğin %10'u üstünde. Yönü saat olarak ve olası nedeni söyleniyor (sol el aynalanır). Oturum özetinde en üstte "Oturum geneli · N atışın ortalaması" kartı, Kontrol Merkezi'nde "Oturum geneli: …" olarak görünüyor.
3. **İyi atışta "Nişanın sallanması" yok.** Skoru 85 ve üzeri olan atışta titreme skoru bozmamıştır; artık bu atışlarda gezinme söylenmiyor. Kanting ve takip uyarıları aynen duruyor.
4. **Kontrol Merkezi uyarısı.** Tabancada "Nişan dışı sarsıntıları sayma" kapalıysa Kontrol Merkezi uyarıyor ("Sürgüyü çekmek ya da silahı indirmek atış sayılabilir") ve tek dokunuşla açıyor.
5. "Atıştan sonra hemen gevşeme" açıklamasına gevşek kabza eklendi (kullanıcının sorduğu "kabzayı sıkı kavramama").

Kullanıcının sorduğu öteki hatalar zaten vardı ve tek atışta tetik hareketi belirginse yönüne göre söyleniyor: namlunun yukarı kalkması (bileği yukarı kaldırma, tepmeyi bekleyip irkilme), aşağı düşmesi (bileği aşağı düşürme, öne itme), sağa ve sola gitmesi (parmak ucuyla basma, parmağı çok sokma, ani basma, başparmak, eli sıkma). Bunlar artık titreme gizlese bile oturum genelinde de bulunuyor.

## 3. Değişmeyenler

Atış algılama ve süzgeç, skor formülü, tek atıştaki tetik teşhisi (saat yönü ve 1,75 eşiği), kanting ölçümü, sensör yazılımı. Veri biçimi geriye uyumlu: yeni atışlara `dr` ve `rv` alanları eklenir; eski kayıtlar aynen okunur, onlarda dönme aranmaz.

## 4. Testler (simülasyon ve masaüstü Chromium; gerçek donanım yok)

**G1 – Kod ve mantık doğrulaması**

| Test | Geçen | Başarısız |
|---|---|---|
| Sensör yazılımı akış testi (C++, masaüstü; veri akışı, komutlar, OTA, lazer) | Geçti (0 hata; kaynakta 87 CHECK denetimi) | 0 |
| PageStore testi | 17 | 0 |
| Teşhis testi | 33 | 0 |
| Nişan doğruluk testi | 44 | 0 |
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
| Arayüz testi | 42 | 0 |
| Uygulama güncelleme testi | 18 | 0 |
| Bağlantı testi | 87 | 0 |
| Mikrofon ve ham kayıt testi | 59 | 0 |
| Bütün özellikler testi | 76 | 0 |
| Lazer hedef testi | 53 | 0 |
| Güncelleme testi | 39 | 0 |
| Köprü testi | 25 | 0 |

**T4'te eklenen denetimler**

- *Nişan doğruluk testi* (uçtan uca: sahte sensörün ham ivme ve jiroskop verisi → uygulamanın kendi işlemcisi): sahte sensöre namlu çevresinde dönme ve dönme titremesi eklendi. 3 montajda (alt/ileri, sağ/ileri, üst/arka) 0, ±1,5, ±2, ±3° dönme ±0,35° içinde ölçülüyor, yönü doğru söyleniyor, dönmeyen atışta söylenmiyor; dönme sahte sağ-sol ya da yukarı-aşağı tetik hareketi yaratmıyor; 0,25° dönme titremesinde 30 atışta yanlış dönme yok.
- *Teşhis testi*: dönme eşikleri (1°, titremenin 1,75 katı, hızlı alıştırma, eski kayıt); iyi atışta gezinme yok; oturum geneli hata: saat 7 yönünde sabit kayma bulunuyor, sol elde aynalanıyor; 6 atıştan azda, hızlı alıştırmada ve önemsiz kaymada söylenmiyor; yalnız titremede 300 oturumun 1'inde yanlış bulma (en çok %3); titremenin altında kalan sabit kayma 10 atışta 1,5σ'da 250/300, 20 atışta 1σ'da 245/300 bulunuyor.
- *Arayüz testi*: Kontrol Merkezi sarsıntı uyarısı ve tek dokunuşla düzeltme; titreme baskınken (tek tek atışta 0/12 tetik hatası) oturum özetinde ve Kontrol Merkezi'nde "Oturum geneli: Tetiğe ani basma, saat 7".

## 5. Henüz doğrulanamayanlar

- Eşikler (dönmede 1° ve titremenin 1,75 katı; oturum genelinde standart hatanın 2,5 katı) sahte sensörle ayarlandı. Gerçek tabancada ve gerçek elde dönme titremesinin büyüklüğü bilinmiyor; kullanıcının gerçek bir oturumu (10+ atış, dışa aktarılan JSON) ile ince ayar gerekebilir.
- Gerçek sensörde dönme ölçümünün işareti (sağa/sola) gerçek bir denemeyle doğrulanmalı: silahı bilerek sağa döndürerek kuru tetik.
- Tüfekte ve destek eli alıştırmasında dönme davranışı.

## 6. Bilinen sınırlamalar

- Oturum geneli hata yalnız hızlı olmayan alıştırmalarda ve en az 6 geçerli atışta.
- Paylaşılan rapor görseline (PNG) henüz eklenmedi (raporlar aşaması, T6).
- Eski kayıtlarda dönme ölçüsü olmadığı için dönme hatası çıkmaz. Eski oturumlardaki atış hataları kaydedildikleri gibi kalır (yeni kurallar yeni atışlara uygulanır); oturum geneli hata ise her açılışta hesaplandığı için eski oturumlarda da görünür.

## 7. Geri dönüş

Birleştirme commit'i `git revert -m 1` ile geri alınır; uygulama sürüm 29'a döner. Veri biçimi geriye uyumlu olduğu için kayıtlar etkilenmez.

## 8. Sonraki adımlar

1. Kullanıcıdan gerçek tabancayla bir oturum ve dışa aktarılan JSON: eşiklerin gerçek veriyle kontrolü.
2. B-01: `TETIK_IMZA` eklenince ilk anahtar döndürmeli APK ve emülatörde güncelleme testi.
3. T3: Unit CamS3 (kamera gelince) ve B-20.
