/* HİSAR game 63 / experience 63.1. Independent app caches stay isolated. */
'use strict';
const CACHE='hisar-main-v64-av-1';
const BASE=new URL('./',self.location.href);
const url=p=>new URL(p,BASE).href;
const CORE=['index.html','three.min.js','manifest.webmanifest','iti/index.html','iti/iti-assistant.js','experience/guard.js','experience/core.js','experience/bridge.js','experience/ui.js','experience/ui.css','experience/polish.js','experience/controls.js','experience/av-comfort.js'];
const OPTIONAL=['icon-192.png','icon-512.png'];
const STATIC=new Set([...CORE,...OPTIONAL].map(url));
function pageKey(input){const u=new URL(input);if(u.origin!==BASE.origin)return null;const p=u.pathname;
 if(p===BASE.pathname||p===BASE.pathname+'index.html')return url('index.html');
 if(p===BASE.pathname+'iti'||p===BASE.pathname+'iti/'||p===BASE.pathname+'iti/index.html')return url('iti/index.html');
 return null;
}
function assetKey(input){const u=new URL(input);u.search='';u.hash='';return STATIC.has(u.href)?u.href:null;}
const ignore=promise=>Promise.resolve(promise).catch(()=>undefined);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE.map(p=>new Request(url(p),{cache:'reload'})));
  await Promise.all(OPTIONAL.map(p=>ignore(cache.add(url(p)))));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith('hisar-main-')||k.startsWith('hisar-cache-hisar-m60-ucangoz-'))).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==BASE.origin)return;
 if(u.pathname===BASE.pathname+'version.json'){
  event.respondWith(fetch(r,{cache:'no-store'}).catch(()=>new Response('{"offline":true}',{status:503,headers:{'Content-Type':'application/json'}})));return;
 }
 if(r.mode==='navigate'){
  const key=pageKey(r.url);if(!key)return;
  const operation=(async()=>{
   const cache=await caches.open(CACHE);
   try{const response=await fetch(r);if(response.ok){await ignore(cache.put(key,response.clone()));return response;}return (await cache.match(key))||response;}
   catch{return (await cache.match(key))||new Response('Bu sayfa çevrimdışı kullanım için henüz hazır değil. İnternet bağlantısıyla yeniden aç.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })();event.respondWith(operation);event.waitUntil(ignore(operation));return;
 }
 const key=assetKey(r.url);if(!key)return;
 const operation=(async()=>{const cache=await caches.open(CACHE),hit=await cache.match(key);if(hit)return hit;const response=await fetch(r);if(response.ok)await ignore(cache.put(key,response.clone()));return response;})();
 event.respondWith(operation);event.waitUntil(ignore(operation));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')event.waitUntil(self.skipWaiting());});
