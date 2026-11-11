# HİSAR: KOMUTA

Bağımsız statik oyun sürümü. Yalnız bu uygulamaya ait dosyalar yayımlanır; eski HİSAR uygulamaları değiştirilmez.

## Kullanım
ÜSSE GİR ile yaya başla. Poligon tabelasına yaklaş ve E / ETKİLEŞ ile ekipmanını seç. Uçangöz parkurunda kumandayı al, sonra Uçangözü kaldır. Özgün iş makinelerine yaklaşınca BİN / E kullan. Tankın yanında TANK İÇ / DIŞ GÖRÜŞ tam tank oyununu açar.

## Çalıştırma
Python 3 ile `python3 build.py`, ardından `python3 -m http.server --directory public 8080`. Node 22 birim testleri: `node --test tests/unit.cjs`. Gerçek tarayıcı testleri: `npm install --no-save --package-lock=false playwright@1.56.1`, `npx playwright install chromium`, `node tests/browser.cjs`.

## Kapsam
Yaya üs, özgün şantiye araçları, fiziksel yakınlıkla açılan poligon, aynı özgün tank Uçangöz modeli, mevcut tank kabinleri korunur. Kişisel portreler, yüz taramaları, kişi seçim kartları yayımlanan dosyalarda bulunmaz.

Aynı anda yalnız bir yerel oyun sahnesi çalışır. Poligon/tank geçişi hâlâ yüklenen sahneler arasındadır; kesintisiz tek arazi iddiası yoktur. Fiziksel iPhone performansı ayrıca ölçülmelidir. Oyundaki ölçekler/işlemler gerçek silah eğitimi veya donanım kontrolü için tasarlanmamıştır.

## Yayın
Bu dal başka uygulamaların menülerine giriş eklemez. Kendi ana sayfası, manifesti, kayıt anahtarı ve önbelleği vardır.
