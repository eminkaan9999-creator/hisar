const C="kk-v3";const F=["./", "index.html", "manifest.json", "ikon-192.png", "ikon-512.png", "apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==location.origin){return;}
 if(e.request.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("index.html")){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put("index.html",k));return r;}).catch(()=>caches.match("index.html")));return;}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
