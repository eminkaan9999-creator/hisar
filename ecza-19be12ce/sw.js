// Kardelen v8.1: navigation network-first, offline fallback, isolated page caches.
// Preserve localStorage/IndexedDB and existing saved medicine notes.
const KABUK='ecza-kabuk-v2', FOTO='ecza-foto-v1', YAZI='ecza-yazi-v1';
const KOK=self.registration.scope;
const HOME=new URL('./',KOK).href;
const ILK=['./','./inventory.html','./manifest.webmanifest','./icon-192.png','./apple-touch-icon.png','./ux-improvements.css?v=1'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(KABUK);
    await Promise.allSettled(ILK.map(async p=>{
      const u=new URL(p,KOK);
      const r=await fetch(u,{cache:'no-store'});
      if(r.ok)await cache.put(u,r);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Only delete old app-shell caches, not photos or other apps' caches.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('ecza-kabuk-')&&k!==KABUK).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
const cached=(name,request)=>caches.open(name).then(async cache=>{
  const hit=await cache.match(request,{ignoreVary:true});
  if(hit)return hit;
  const response=await fetch(request);
  if(response.ok)await cache.put(request,response.clone());
  return response;
});
const navigation=async request=>{
  const cache=await caches.open(KABUK);
  const url=new URL(request.url);
  const canonical=url.pathname.endsWith('/')?HOME:url.origin+url.pathname;
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok&&response.headers.get('content-type')?.includes('text/html')){
      await cache.put(canonical,response.clone());
      return response;
    }
    if(response.ok)return response;
    const offline=await cache.match(canonical);
    return offline||response;
  }catch(error){
    const offline=await cache.match(canonical)||await cache.match(HOME);
    if(offline)return offline;
    return new Response('<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bağlantı yok</title><body style="font:16px system-ui;padding:24px"><h1>İlaç Defteri açılamadı</h1><p>İnternet bağlantısını kontrol edip tekrar deneyin.</p><button onclick="location.reload()">Tekrar dene</button></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  }
};
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.cache==='no-store')return;
  const url=new URL(request.url);
  if(url.origin===location.origin){
    if(!request.url.startsWith(KOK)||/\/surum\.json$/.test(url.pathname))return;
    if(request.mode==='navigate'){event.respondWith(navigation(request));return;}
    if(/\.(?:html)$/.test(url.pathname)){event.respondWith(navigation(request));return;}
    event.respondWith(cached(/\/img\//.test(url.pathname)?FOTO:KABUK,request));
  }else if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    event.respondWith(cached(YAZI,request));
  }
});
