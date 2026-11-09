# HİSAR oyun deneyimi v1 — oyun sürümü 63

Ana menüde **İTİ · AYARLAR · OTURUM**. Masaüstünde F2 ile açılır; Escape ile kapanır. Oyun oynanırken açılan panel oyunu duraklatır; zaten menüdeyse kendiliğinden başlatmaz.

## Çalışan kapsam
- Mevcut Three.js motoruna bağlanan Akıcı / Dengeli / Yüksek kalite profilleri.
- Oyunun mevcut otomatik kalite denetimini aç/kapat; elle profil seçilince eski çözünürlük azaltma katsayısını sıfırla.
- Gerçek oyun döngüsünden FPS ve aktif süre; XP/kredi mevcut SV kaydından okunur.
- Türkçe kural tabanlı İTİ yardımı, tarayıcıda mevcutsa Türkçe seslendirme.
- Panel yazı boyutu, isteğe bağlı FPS göstergesi, cihazda son 30 oturum, JSON dışa aktarım.
- Oyuna gitmeyen sohbet tuşları; yerel HTML enjeksiyonuna karşı textContent.
- Ana oyun/İTİ için ayrı çevrimdışı gezinme anahtarları; başka alt uygulamalara müdahale edilmez.
- FPS denetiminde simülasyonun 50 ms zaman sınırı yerine gerçek kare süresi kullanılır. Fizik zaman adımı değişmez.

Bu paket üretken yapay zekâ, yeni 3D modeller, çok oyunculu sunucu veya yeni fizik motoru içermez. Sorular sunucuya gönderilmez. İşletim sistemi/tarayıcı Türkçe ses sağlamazsa yalnızca metin gösterilir. Başarı/atış puanı uydurulmaz. `m60v2` kaydı değiştirilmez.

## Testler ve entegrasyon
`node --test experience/*.test.cjs`

`node scripts/experience-integrate.cjs` asıl index.html içine tek seferlik yükleyicileri ekler, etkin FPS hesabını düzeltir, uygulama etiketini ve version.json dosyasını 63 yapar. Beklenen kaynak sözleşmesi değişirse durur; bütün gömülü oyun betiklerini sözdizimi bakımından kontrol eder.

`npm install --no-save --ignore-scripts playwright@1.56.1`

`npx playwright install --with-deps chromium`

`node scripts/experience-browser.cjs` gerçek index.html üzerinde masaüstü/mobil görünüm, oyun motoru, ayarların kalıcılığı, sohbet güvenliği, duraklat/devam, yerel oturum ve çevrimdışı geçişleri denetler. Mobil görünüm emülasyondur; gerçek iPhone donanım testi değildir.

Grafik yükseltmesi zorunlu tutulmaz. İlk açılışta mevcut profil korunur. Panel tercihleri `hisar-experience-v1`, raporlar `hisar-session-history-v1` anahtarındadır. Sıfırla yalnızca panel tercihlerini etkiler.
