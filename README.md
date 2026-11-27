# HİSAR oyunları

Çelik Börü ve HİSAR Şantiye, `e2eb419` sürümündeki özgün oyunlarına geri döndürüldü. Yeni görev kabukları normal açılıştan çıkarıldı.

| Oyun | Giriş | Geri getirilen içerik |
| --- | --- | --- |
| Çelik Börü | `/` | Özgün tank dünyası, araçlar, menüler ve harekâtlar |
| HİSAR Şantiye | `/santiye-250888c5/` | Özgün şantiye, iş makineleri, projeler, karakterler ve günlük yaşam |

Kayıt anahtarları silinmez veya taşınmaz. Yayın numaraları yalnızca cihazlardaki eski önbelleklerin yenilenmesi için artırıldı. Her uygulama yalnız kendi önbelleğini temizler. Tetik ve diğer uygulamalara dokunulmadı.

`/komuta/`, `/komuta/tank/` ve `/komuta/poligon/` Şantiye'ye yönlenmeye devam eder. Bağımsız KOMUTA oyunu açılmaz. Önceki kabuk dosyaları eski önbelleklerden geçiş uyumluluğu için depoda korunur; aktif girişler bunları kullanmaz.

## Doğrulama

- `node --test experience/*.test.cjs`
- `node iti/iti-assistant.test.cjs`
- `node scripts/restore-games-browser.cjs`: eski çalışan önbellekten özgün oyunlara yükseltme, kayıt koruma, gerçek WebGL açılışı, araç hareketi ve çevrimdışı tekrar açma.
- `node scripts/experience-browser.cjs`: özgün tank oyununun mevcut masaüstü ve mobil regresyon testleri.

Tarayıcı testleri Chromium ve yazılımsal WebGL kullanır; fiziksel iPhone performans ölçümü değildir.
