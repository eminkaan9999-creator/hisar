self.gameCache='hisar-komuta-site';
self.gameRevision='3.2.0';
self.gameFiles=['index.html','manifest.webmanifest','version.json'];
const CACHE=self.gameCache+'-'+self.gameRevision,TARGET=new URL('../santiye-250888c5/',self.location.href).href;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(self.gameFiles)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(self.gameCache+'-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();const clients=await self.clients.matchAll({type:'window'});for(const client of clients)if(new URL(client.url).pathname.startsWith(new URL('./',self.location.href).pathname))await client.navigate(TARGET).catch(()=>{});})()));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate'&&new URL(e.request.url).pathname.startsWith(new URL('./',self.location.href).pathname)){e.respondWith(Promise.resolve(Response.redirect(TARGET,302)));}});
self.addEventListener('message',e=>{if(e.data==='VERSION'&&e.ports[0])e.ports[0].postMessage({cache:CACHE});});
