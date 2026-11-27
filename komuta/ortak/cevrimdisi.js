'use strict';
const base=new URL('./',self.location.href);
const urls=new Map(self.gameFiles.map(file=>{const u=new URL(file,base);return [u.pathname,u.href];}));
const cacheName=self.gameCache+'-'+self.gameRevision;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const c=await caches.open(cacheName);
  await c.addAll([...urls.values()].map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name!==cacheName&&name.startsWith(self.gameCache+'-'))await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const r=event.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==base.origin)return;
  const iti=urls.has(base.pathname+'iti/index.html')&&[base.pathname+'iti',base.pathname+'iti/'].includes(u.pathname);
  const file=u.pathname===base.pathname?'index.html':iti?'iti/index.html':null;
  const key=file?new URL(file,base).href:urls.get(u.pathname);if(!key)return;
  event.respondWith((async()=>{const c=await caches.open(cacheName),hit=await c.match(key);return hit||fetch(r);})());
});
self.addEventListener('message',e=>{if(e.data==='VERSION'&&e.ports[0])e.ports[0].postMessage({cache:cacheName});if(e.data==='SKIP_WAITING')e.waitUntil(self.skipWaiting());});
