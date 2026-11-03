// HISAR TETIK servis calisani (kapsam: /tetik/)
// Sayfalar, surum bilgisi, STL ve yazilim dosyalari agdan (yoksa onbellekten); ikonlar ve yazi tipleri onbellekten.
// Her sayfa kendi adresiyle (sorgu kismi olmadan) onbelleklenir; baska bir sayfa index.html'in yerine yazilmaz.
const C='tetik-v11';
const STATIC=['./','./index.html','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png','./manifest.webmanifest'];
// kurulumda HTTP onbellegi atlanir: yeni surum eski sayfayi onbellege almasin
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(STATIC.map(u=>new Request(u,{cache:'reload'})))).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tetik-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n})));return;
 }
 if(u.origin!==location.origin||!u.pathname.includes('/tetik/'))return;
 const net=e.request.mode==='navigate'||/\.(html|json|stl|bin|webmanifest)$/.test(u.pathname)||/\/$/.test(u.pathname);
 if(net){
  const key=u.origin+u.pathname;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&!/version\.json$/.test(u.pathname)){const cp=r.clone();caches.open(C).then(c=>c.put(key,cp))}return r})
   .catch(()=>caches.match(key,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'&&/\/tetik\/(index\.html)?$/.test(u.pathname)?caches.match('./index.html',{ignoreSearch:true}):undefined))));
 } else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp))}return n})));
});
