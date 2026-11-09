# Kaan & Kardelen

Kaan ile Kardelen'in anılarından yapılmış, telefonda ana ekrandan açılan 3D hikâye oyunu.

Canlı adres: https://eminkaan9999-creator.github.io/hisar/kk-9b4bc121/

Bu klasör hem yayındaki uygulamayı hem de kaynak kodunu içerir. GitHub Pages deponun `main` dalını yayınlar; bu klasörde yapılan her gönderim birkaç dakika içinde canlı adrese yansır.

## Klasör yapısı

| Yol | Ne işe yarar |
| --- | --- |
| `index.html` | Derlenmiş uygulama (tek dosya). Elle düzenlenmez, `kaynak/derle.js` üretir. |
| `surum.json` | Sürüm numarası. Değişince uygulamada "Güncelle" düğmesi çıkar. |
| `sw.js`, `manifest.json`, `ikon-*.png`, `apple-touch-icon.png` | Ana ekrana ekleme, simge ve çevrimdışı önbellek. |
| `lib/` | three.js r128 ek dosyaları (GLTF yükleyici, su, ışıma efektleri, meshopt). |
| `model/` | Karakter modelleri (`.glb`), kıyafet ve yüz dokuları, animasyon ve ölçü dosyaları. |
| `ses/` | Mezuniyet töreni marşı. |
| `sozler.txt` | Günlük bildirim sözleri listesi (oyun bu dosyayı kullanmıyor). |
| `kaynak/` | Kaynak kodu: HTML, CSS, JavaScript, derleyici. |

three.js'in kendisi (`three.min.js`, r128) deponun kökünde durur ve aynı depodaki başka uygulamalarla ortak kullanılır. Kökteki `sw.js`, bu klasörü kendi önbelleğinin dışında tutar.

## Kaynak kodu (`kaynak/`)

| Yol | İçerik |
| --- | --- |
| `sayfa.html` | HTML iskeleti. `/*@@STIL@@*/` yerine `stil.css`, `<!--@@BETIKLER@@-->` yerine JS parçaları gelir. |
| `stil.css` | Bütün arayüz stilleri (menü, konuşma kutuları, telefon ekranı, mini oyunlar, albüm). |
| `js/` | Oyunun JavaScript kodu, 29 parça. |
| `varlik/su_normal.jpg` | Deniz dalgası dokusu. Derlenirken sayfanın içine gömülür. |
| `derle.js` | Derleyici. Ek paket istemez, yalnızca Node.js gerekir. |

JS parçaları ayrı modüller değildir; hepsi birleşip tek bir `(function(){ … })()` bloğu olur. `cekirdek.js` bloğu açar, `akis.js` kapatır. Bu yüzden sıra önemlidir ve `derle.js` içindeki `SIRA` listesinde tutulur.

| Dosya | İçerik |
| --- | --- |
| `cekirdek.js` | Çizici, sahne kurulumu, ışık, sahne geçişi, ortak yardımcılar |
| `ortam.js`, `bitki.js` | Gökyüzü, deniz, binalar, ağaçlar, çimen |
| `avatar.js`, `giysi.js`, `uniforma.js` | Karakterlerin yüklenmesi, kıyafetler, tören kıyafetleri |
| `kamera.js` | Kamera, yürüme, dokunmatik kumanda |
| `hikaye.js` | Hikâye motoru: konuşmalar, sahneler, mesajlaşma, hatıra fotoğrafı, mini oyun yardımcıları |
| `ozellik.js`, `anilar.js` | Gizli kalpler, sözlük, yarışma, anılar ve albüm |
| `bolum0.js`, `bolum0_kis.js` | İlk Mesaj (2 Ağustos 2021) ve ilk buluşma |
| `bolum1.js` | Kılıçlar Çekildi (Ağustos 2024) |
| `bolum_ankara.js` | Ankaram (Eylül 2024) |
| `bolum_bileklik.js` | Bileklik ve Keman (Aralık 2024 · Ocak 2025) |
| `bolum2.js` | Masal Şatosu (Mart 2025) |
| `bolum_kus.js` | Kuş 46 Numara mı? (21 Mart 2025) |
| `bolum_uzunyol.js` | İlk Uzun Yol (4 Nisan 2025) |
| `bolum3.js`, `bolum3_atv.js` | Balonları Görüyor mu? (Mayıs 2025) ve ATV turu |
| `bolum4.js` | Pembe Elbise (28 Mayıs 2025) |
| `bolum5.js` | Dağdan Sana (Haziran 2025) ve Karlı Yılbaşı (31 Aralık 2025) |
| `bolum_diploma.js` | Diploma Günü (26 Eylül 2025) |
| `bolum_bekleyemedim.js` | Bekleyemedim (26 Ocak 2026) |
| `bolum_nisan.js` | Nişanda Dans (Mayıs 2026) |
| `bolum6.js` | Patara (Ağustos 2026) |
| `bolum_hayat.js`, `hayat_ag.js` | "Bir Gün Birlikte" serbest mod ve iki telefonda birlikte oynama bağlantısı |
| `akis.js` | Menü, bölüm sırası, final mektubu, ana döngü, başlatma |

## Derleme

```
node kaynak/derle.js
```

Komut `kaynak/` içindekileri birleştirir, sözdizimini denetler, `index.html` ile `surum.json` dosyalarını yeni sürüm numarasıyla yazar. Bozuk bir kod varsa hata verir ve hiçbir dosyaya dokunmaz. Windows satır sonları da sorun çıkarmaz.

Yayındaki dosyaya dokunmadan denemek için: `node kaynak/derle.js --cikti deneme.html`

## Bilgisayarda çalıştırma

three.js deponun kökünde durduğu için sunucu depo kökünden açılmalıdır:

```
cd hisar
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000/kk-9b4bc121/` adresi açılır.

## Yayınlama

1. `kaynak/` içinde değişikliği yapın.
2. `node kaynak/derle.js` çalıştırın.
3. `index.html`, `surum.json` ve `kaynak/` değişikliklerini gönderin (commit + push).
4. Pages yayınlandıktan sonra telefonda uygulamayı açıp "Güncelle"ye basın.

## Dış bağlantılar

- Yazı tipleri Google Fonts'tan gelir (Cormorant Garamond, Figtree).
- "Bir Gün Birlikte"nin iki telefonda oynanması açık MQTT sunucuları üzerinden olur (broker.emqx.io, broker.hivemq.com). Bağlantı yalnızca oda koduyla açılan kanaldan oyun içindeki hareketleri, seçimleri ve hazır mesajları taşır.

Sohbet dökümleri, fotoğraflar ve yüzlerin hazırlanmasında kullanılan ara dosyalar bilerek depoya konmadı. Oyunun çalışması için gerekmezler; depo herkese açık olduğu için de burada durmamaları gerekir.
