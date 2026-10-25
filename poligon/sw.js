// POLİGON servis çalışanı: sayfa ve sürüm bilgisi ağdan (yoksa önbellekten), ikonlar ve yazı tipleri önbellekten
const C='poligon-v6';
const STATIC=['../three.min.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png','./manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(STATIC.concat(['./','./index.html'])).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('poligon-')&&k!==C&&k!==C+'-foto'&&!k.endsWith('-foto')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n})));return;
 }
 if(u.hostname==='upload.wikimedia.org'){e.respondWith(caches.open(C+'-foto').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{c.put(e.request,n.clone());return n}))));return;}
 if(u.origin!==location.origin)return;
 const net=/version\.json$/.test(u.pathname)||e.request.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname);
 if(net){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&!/version\.json$/.test(u.pathname)){const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp))}return r}).catch(()=>caches.match('./index.html')))}
 else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n})));
});
