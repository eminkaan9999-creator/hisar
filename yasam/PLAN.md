# HİSAR SİMÜLATÖR · Yaşam (yasam/)

Tek sahne, tek döngü, tek dünya. Yükleme sırası (index.html):
`core → world → player → tank-model → tank → rifle-data → rifle → main`
Sıra önemli: önce kayıt olan modül öncelikli (istem, E tuşu tüketimi).

## Modüller
- **core.js**: sahne, kamera, döngü, girdi (klavye, fare kilidi, dokunmatik çubuk, düğmeler), `H.pushOut` (çarpışma), `H.prompt` (ilk kayıt kazanır), `H.toast`, `H.key`, `H.consume`, `H.pressed`.
- **world.js**: Üs, Şantiye (çit, kapı açıklığı, garaj, kasalar, Uçangöz rampası), Poligon (ateş hattı, silah rafı, 5 hedef 100–300 m), yollar, ağaçlar, dağlar. Veriler: `H.colliders`, `H.zones`, `H.anchors`, `H.targets`.
- **player.js**: isimsiz asker, üçüncü şahıs kamera, yürüme/koşma.
- **tank-model.js**: M60A3 modeli. Kaynak: kök `index.html` `mkM60` ve yardımcıları (satır satır taşındı).
- **tank.js**: garajdan çıkarma (E), binme/inme, sürüş, kule ve namlu, ana top, poligon hedeflerine isabet.
- **rifle-data.js**: poligon tüfek kataloğu (10 silah). Kaynak: `poligon/index.html` `RIFLES`.
- **rifle.js**: silah rafı menüsü, nişan (ADS), otomatik ateş, şarjör, balistik düşüş.
- **main.js**: bölge adı, E etkileşimleri (`H.actions`).

## Durum
- [x] Üs, Şantiye, Poligon, yollar, yürüme, çarpışma
- [x] M60A3: garajdan çıkar, bin, sür, ateş et, in
- [x] Poligon tüfekleri (10 silah), nişan, otomatik ateş, şarjör
- [ ] Uçangöz (drone): `yasam/kumanda-testi.html` içindeki DJI tarzı kontrol dünyaya bağlanacak
- [ ] Şantiye iş makineleri ve drone parkuru (kaynak: `santiye-250888c5/index.html`)
- [ ] Diğer tanklar ve garaj menüsü (kaynak: kök `index.html` `TK` ve `BUILD`)
- [ ] Tank iç görünümü: diğer sohbetteki güncellemeler bekleniyor
- [ ] Savaş: düşman birlikleri ve görev akışı
- [ ] Telefonda test (kullanıcı)

## Kurallar
- Kuruluş kabuğu (`kurulus/`, `shared/` iframe) bu uygulamanın tabanı değil.
- Ana dala ya da Pages'e çıkmadan önce kullanıcı onayı alınır. Şimdilik yalnız `yasam-simulatoru` dalında çalışılır.

## Test
Headless Chromium ile (`scratchpad/yasam-*.js`): açılış, yürüme, çarpışma, tank akışı, tüfek akışı. Sayfa hatası yok.
Kamera notu: `getWorldDirection` bu sürümde kameranın ileri yönünü veriyor; ışın için `quaternion` ile `(0,0,-1)` kullanılır.
