// HISAR SIMULATOR servis calisani: sayfa ve surum bilgisi agdan (yoksa onbellekten), kutuphane ve ikonlar onbellekten
// ONEMLI: /poligon/, /kk-..., /tetik/ ve /santiye-... klasorleri ayri uygulamalardir, kendi servis calisanlari var.
// fetch icindeki bu dort istisnayi silme ve bu dosyayi yeniden yazarken koru; silinirse o sayfalar bu
// uygulamanin index.html onbellegine yazilir ve HISAR acilisi bozulur (Surum 47'de bir kez silindi).
const C='hisar-v60';
const STATIC=['./three.min.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png','./manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(STATIC.concat(['./','./index.html'])).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('hisar-v')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/poligon/')||u.pathname.includes('/kk-')||u.pathname.includes('/tetik/')||u.pathname.includes('/santiye-'))return;
 const net=/version\.json$/.test(u.pathname)||e.request.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname);
 if(net){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&!/version\.json$/.test(u.pathname)){const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp))}return r}).catch(()=>caches.match('./index.html')))}
 else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n})))});
