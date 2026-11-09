// Kardelen'in İlaç Defteri: servis çalışanı.
// Uygulama önbellekten açılır, internet olmasa da çalışır. Yeni sürümü sayfadaki GÜNCELLE tuşu indirir:
// tuş surum.json'a bakar, yeni index.html'i 'ecza-kabuk-v1' önbelleğine yazar ve sayfayı yeniler.
// Raf fotoğrafları ve kutu resimleri ilk açıldıklarında 'ecza-foto-v1' önbelleğine kaydedilir.
// Önbellek adları app.js içindeki KABUK ve FOTO ile aynı olmalı.
const KABUK = 'ecza-kabuk-v1', FOTO = 'ecza-foto-v1', YAZI = 'ecza-yazi-v1';
const KOK = self.registration.scope;
const ILK = ['manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png', 'ux-improvements.css?v=1'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(KABUK).then(c => c.match(KOK).then(hit => hit || fetch(KOK, { cache: 'no-store' }).then(r => { if (r.ok) return c.put(KOK, r); }))
    .then(() => c.addAll(ILK).catch(() => {}))).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
const onceOnbellek = (ad, istek, anahtar) => caches.open(ad).then(c => c.match(anahtar || istek, { ignoreVary: true }).then(hit => hit || fetch(istek).then(res => {
  if (res.ok) c.put(anahtar || istek, res.clone());
  return res;
})));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.cache === 'no-store') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (!r.url.startsWith(KOK) || /surum\.json$/.test(u.pathname)) return;
    if (r.mode === 'navigate' || u.origin + u.pathname === KOK || /\/index\.html$/.test(u.pathname)) { e.respondWith(onceOnbellek(KABUK, r, KOK)); return; }
    e.respondWith(onceOnbellek(/\/img\//.test(u.pathname) ? FOTO : KABUK, r));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(onceOnbellek(YAZI, r));
});
