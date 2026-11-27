'use strict';
const CACHE='hisar-santiye-30-original';
const BASE=new URL('./',self.location.href), REPO=new URL('../',BASE);
const url=p=>new URL(p,BASE).href;
const SHELL=['index.html','manifest.webmanifest','../three.min.js','../shared/kurulus.css','../shared/kurulus-core.js','../shared/kurulus-runtime.js','../shared/radio-tr.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(p=>new Request(url(p),{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('hisar-santiye-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,u=new URL(request.url);
  if(request.method!=='GET'||u.origin!==BASE.origin)return;
  if(u.pathname===BASE.pathname+'version.json'){
    event.respondWith(fetch(request,{cache:'no-store'}));return;
  }
  const page=u.pathname===BASE.pathname||u.pathname===BASE.pathname+'index.html';
  const asset=u.pathname.startsWith(BASE.pathname+'assets/')||u.pathname.startsWith(REPO.pathname+'shared/')||u.pathname===REPO.pathname+'three.min.js'||u.pathname===BASE.pathname+'sohbetler.txt';
  if(!page&&!asset)return;
  const key=page?url('index.html'):u.origin+u.pathname;
  const operation=(async()=>{
    const cache=await caches.open(CACHE);
    if(!page){const hit=await cache.match(key);if(hit)return hit;}
    try{const response=await fetch(request,{cache:page?'reload':'default'});if(response.ok)await cache.put(key,response.clone());return response;}
    catch(error){const hit=await cache.match(key);if(hit)return hit;throw error;}
  })();
  event.respondWith(operation);event.waitUntil(operation.catch(()=>{}));
});
self.addEventListener('message',event=>{if(event.data==='VERSION'&&event.ports?.[0])event.ports[0].postMessage({cache:CACHE});});
