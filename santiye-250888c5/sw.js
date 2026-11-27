const VERSION='29.0',CACHE='hisar-santiye-'+VERSION;
const SHELL=['./','index.html','tema.css','oyun.mjs','model.mjs','manifest.webmanifest','version.json','sahne.css','../shared/kurulus-core.js','../komuta/ortak/fonts/inter-latin-tr.4.001.woff2','../komuta/favicon-32.png','../komuta/icon-192.png','../komuta/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hisar-santiye-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;const base=new URL('./',self.registration.scope),repo=new URL('../',base);if(!u.href.startsWith(base.href)&&!u.pathname.startsWith(repo.pathname+'shared/')&&!u.pathname.startsWith(repo.pathname+'komuta/')&&u.pathname!==repo.pathname+'three.min.js')return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);const key=new Request(u.origin+u.pathname);const cached=await cache.match(key);if(cached)return cached;const response=await fetch(e.request);if(response.ok){try{await cache.put(key,response.clone());}catch{}}return response;})());
});
