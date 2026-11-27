const CACHE = 'poligon-v27';
const PHOTOS = CACHE + '-foto';
const shell = [
  './', './index.html', './salon.css?v=27', './salon.js?v=27', './arcade.mjs?v=27',
  './arena-cover.webp','./arena-mark.webp', './manifest.webmanifest', './version.json',
  './klasik.html', './arena.css', './arena-ui.js', '../three.min.js', '../shared/kurulus.css?v=1',
  '../shared/kurulus-core.js?v=1', '../shared/kurulus-runtime.js?v=1',
  './icon-192.png?v=26','./icon-512.png?v=26','./icon-maskable-512.png?v=26',
  './apple-touch-icon.png?v=26','./favicon-32.png?v=26'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(shell.map(path => new Request(new URL(path,self.location.href), {cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('poligon-') && k !== CACHE && !k.endsWith('-foto')).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const photo = ['upload.wikimedia.org','dl.polyhaven.org'].includes(url.hostname);
  const font = /(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname) && url.hostname.startsWith('fonts.');
  if(url.origin !== self.location.origin && !photo && !font) return;
  const root = new URL('./',self.location.href);
  const nav = event.request.mode === 'navigate' && [root.pathname,root.pathname+'index.html',root.pathname+'klasik.html'].includes(url.pathname);
  const version = url.pathname === root.pathname+'version.json';
  event.respondWith((async () => {
    const cache = await caches.open(photo?PHOTOS:CACHE);
    if(nav || version){
      const key = version?'./version.json':url.pathname.endsWith('/klasik.html')?'./klasik.html':'./index.html';
      try {
        const res = await fetch(event.request,{cache:'no-cache'});
        if(res.ok){await cache.put(key,res.clone());return res;}
        return (await cache.match(key)) || res;
      } catch {
        return (await cache.match(key)) || Response.error();
      }
    }
    const hit = (await cache.match(event.request)) || (photo && await caches.match(event.request));
    if(hit) return hit;
    const res=await fetch(event.request);
    if(res.ok || res.type==='opaque') {
      try { await cache.put(event.request,res.clone()); } catch {}
    }
    return res;
  })());
});
