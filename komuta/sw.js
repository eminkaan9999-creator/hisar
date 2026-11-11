/* Only this app's cache is managed; other HİSAR apps remain untouched. */
'use strict';const CACHE='hisar-komuta-site-1.2.0',BASE=new URL('./',self.location.href),CORE=['storage-scope.js','index.html','app.css','core.js','shell.js','manifest.webmanifest','icon-192.png'];
const own=u=>u.origin===BASE.origin&&u.pathname.startsWith(BASE.pathname);
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE.map(p=>new Request(new URL(p,BASE),{cache:'reload'})));await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('hisar-komuta-site-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||!own(u))return;const path=u.pathname.slice(BASE.pathname.length);
 if(path.startsWith('site/')){e.respondWith(Promise.resolve(new Response('Bu bölüm KOMUTA’dan kaldırıldı. Ana menüden tank veya poligonu aç.',{status:410,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;}
 if(path==='version.json')return;
 const key=new Request(new URL(path||'index.html',BASE));
 e.respondWith((async()=>{const c=await caches.open(CACHE);const fresh=e.request.mode==='navigate'||/\.(?:js|css|webmanifest)$/.test(path);if(!fresh){const hit=await c.match(key);if(hit)return hit;}
 try{const r=await fetch(e.request,{cache:fresh?'no-cache':'default'});if(r.ok&&r.type!=='opaque')await c.put(key,r.clone());return r;}catch(err){const hit=await c.match(key);if(hit)return hit;throw err;}
 })().catch(()=>new Response('Bu alan henüz çevrimdışı hazır değil. İnternet bağlantısıyla yeniden aç.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));});
