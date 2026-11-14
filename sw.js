/* ÇELİK BÖRÜ (hisar) game 63 / experience 63.1. Independent app caches stay isolated. */
'use strict';
const CACHE='hisar-main-v86-celik-boru';
const BASE=new URL('./',self.location.href);
const url=p=>new URL(p,BASE).href;
const CORE=['assets/radio/tr/manifest.json','assets/radio/tr/drone-camera.mp3','assets/radio/tr/contact-rear.mp3','assets/radio/tr/contact-left.mp3','assets/radio/tr/contact-right.mp3','assets/radio/tr/contact-front.mp3','assets/radio/tr/point-needed.mp3','assets/radio/tr/unclear.mp3','assets/radio/tr/blocked.mp3','assets/radio/tr/arrived.mp3','assets/radio/tr/move.mp3','assets/radio/tr/address-convoy.mp3','assets/radio/tr/address-four.mp3','assets/radio/tr/address-three.mp3','assets/radio/tr/address-two.mp3','assets/radio/tr/address-all.mp3','assets/radio/tr/cmd-move.mp3','assets/radio/tr/cmd-regroup.mp3','assets/radio/tr/cmd-status.mp3','assets/radio/tr/cmd-back.mp3','assets/radio/tr/cmd-spread.mp3','assets/radio/tr/cmd-cease.mp3','assets/radio/tr/cmd-free.mp3','assets/radio/tr/cmd-target.mp3','assets/radio/tr/cmd-hold.mp3','assets/radio/tr/cmd-follow.mp3','assets/radio/tr/return.mp3','assets/radio/tr/record.mp3','assets/radio/tr/fog.mp3','assets/radio/tr/relay.mp3','assets/radio/tr/convoy.mp3','assets/radio/tr/rescue.mp3','assets/radio/tr/damage.mp3','assets/radio/tr/failure.mp3','assets/radio/tr/success.mp3','assets/radio/tr/hit.mp3','assets/radio/tr/reload.mp3','assets/radio/tr/drone.mp3','assets/radio/tr/air.mp3','assets/radio/tr/ground.mp3','assets/radio/tr/rest.mp3','assets/radio/tr/phase.mp3','assets/radio/tr/ready.mp3','assets/radio/tr/status.mp3','assets/radio/tr/convoy-go.mp3','assets/radio/tr/convoy-wait.mp3','assets/radio/tr/regroup.mp3','assets/radio/tr/back.mp3','assets/radio/tr/spread.mp3','assets/radio/tr/cease.mp3','assets/radio/tr/free.mp3','assets/radio/tr/target.mp3','assets/radio/tr/hold.mp3','assets/radio/tr/follow.mp3','assets/radio/tr/ack.mp3','index.html','three.min.js','manifest.webmanifest','iti/index.html','iti/iti-assistant.js','experience/guard.js','experience/core.js','experience/bridge.js','experience/ui.js','experience/ui.css','experience/polish.js','experience/controls.js','experience/immersive.js','experience/gameplay.js','experience/radio-sound.js','experience/radio-missions.js','experience/crew-orders.js','experience/field.js','experience/simple-settings.js','experience/skin.css','experience/fonts/hisar-dar-700.woff','experience/fonts/hisar-dar-400.woff','assets/brand/celik-boru.jpg','assets/radio/ack.mp3'];
const OPTIONAL=['icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png'];
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
