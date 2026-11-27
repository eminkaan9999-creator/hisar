# HİSAR oyunları

Aktif oyunlar **Çelik Börü** ve **HİSAR Şantiye**. İkisi de HİSAR Akademi ile uyumlu koyu, turkuaz arayüz kullanır. Senaryolar ve araç davranışları kurgusal oyun kurallarıdır.

| Uygulama | Giriş | İçerik |
| --- | --- | --- |
| Çelik Börü | `/` | 2026, 2045 ve 2186 dönemlerinde dört araç görevi |
| HİSAR Şantiye | `/santiye-250888c5/` | Günümüz ve 2045: saha taraması, yol hazırlığı, sayısal ikmal, bakım parkına araç teslimi; mevcut serbest şantiye |

`/komuta/` eski girişi Şantiye'ye yönlenir. Bağımsız KOMUTA oyunu sunulmaz. Bu dizindeki ortak modüller Çelik Börü tarafından kullanıldığı için korunur. Eski cihaz kayıtları silinmez.

## Şantiye

Ana menü 3B motoru veya saha varlıklarını yüklemez. Göreve girişte `simulator.html` içindeki mevcut dünya açılır. Yeni görevler mevcut araç, greyder ve ortak uçangöz denetleyicisini kullanır. Görev tamamlama, sahadaki hareket ve teslim koşullarına bağlıdır.

29.0 kayıtları `hisar-santiye-29` anahtarında tutulur. Önceki `hs-*` dünya kayıtları korunur. Duraklatma, sekme gizlenmesi ve menüye dönüş ilerlemeyi saklar. Kalite seçimi kalıcıdır; otomatik kip gerçek kare aralığını ölçerek yükü azaltır. 2045 araç konum halkaları kapatılabilir. Serbest alanda Araçlar menüsü bütün araçlara, kameralara ve eski şantiye projelerine erişir.

Şantiye kabuğu önbelleğe alınır; 3B dosyalar yalnızca istendiğinde indirilip saklanır. Tamamen yüklenen saha sonraki açılışta çevrimdışı kullanılabilir. Tarayıcının depolama alanını silmesi bu kayıtları kaldırabilir.

## Çalıştırma ve doğrulama

Depo kökünde `python3 -m http.server 8080` çalıştırın.

- `node --test oyun/*.test.mjs santiye-250888c5/*.test.mjs experience/model.test.cjs`
- `node santiye-250888c5/tarayici.cjs`: Şantiye menüsü, gerçek 3B uçuş, görev kaydı, duraklatma, cihaz kayıtları, mobil yerleşim ve çevrimdışı devam.
- `node oyun/ufuk-uyumluluk.cjs`: eski girişin yönlendirilmesi, Çelik Börü kalite seçimi ve WebGL kaybından devam.
- `node oyun/gelecek-tarayici.cjs`: Çelik Börü'nün dört görevinin oynanması, kayıtlı devam ve çevrimdışı raporlar.
- `node oyun/tarayici.cjs`: önceki Çelik Börü görevleri ve kayıt uyumluluğu.

Tarayıcı testleri Playwright / Chromium kullanır. Şantiye testinde yazılımsal GPU nedeniyle simülasyon saati deterministik adımlarla ilerletilir; klavye/düğme girdileri ve görev koşulları gerçek motor üzerinden sınanır. Bunlar fiziksel iPhone testi değildir. `komuta/` altındaki eski saf model testleri, Çelik Börü'nün ortak kaynakları için geriye uyumluluk kontrolü olarak saklanır.
