# HİSAR oyunları

**Çelik Börü — Beyaz Geçit** ana adreste açılır. Araç komutanı çıkış yoklamasını ve yük çizelgesini kontrol eder. Oyuncu vadide iki teslimat yapar, fişleri alır ve üsse döner. Ok tuşları ve ekrandaki kumanda aracı sürer. Yön yardımı ilk açılışta etkindir.

**HİSAR: KOMUTA — Gece Nöbeti** `komuta/` adresinde açılır. Oyuncu taşkın sonrası nöbeti devralır, talepleri doğrular ve iki destek ekibini görevlendirir. Vardiya on dakikalık turlarla ilerler. Ekipten gelen sonucu kayda geçirmek ve devir raporunu tamamlamak oyuncunun sorumluluğundadır.

İki kurgu oyunda görev emri, kayıt ve teslim aşamaları kullanılır. Afet koordinasyonu için genel çerçeve [AFAD Türkiye Afet Müdahale Planı](https://www.afad.gov.tr/turkiye-afet-mudahale-plani), personel ve malzeme nakli için örnek [MSB afet desteği duyurusudur](https://www.msb.gov.tr/SlaytHaber/822023-37583). Yerler, süreler ve karar kuralları oyun için tasarlanmıştır.

## Çalıştırma

Depo kökünde `python3 -m http.server 8080` çalıştırın. Çelik Börü için `/`, KOMUTA için `/komuta/` yolunu açın. İki oyunun çevrimdışı kurulumu ilk başarılı ağ yüklemesinden sonra hazır olur. Güncel görev ve son on iki rapor kullanılan cihazda saklanır.

`node --test oyun/*.test.mjs` görev kurallarını ve yayın dosyalarını doğrular. Playwright Chromium kurulduğunda `node oyun/tarayici.cjs` normal oyun girişlerinden iki senaryoyu oynar, kayıtları ve çevrimdışı dönüşü sınar.
