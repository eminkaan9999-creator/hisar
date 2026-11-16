const CACHE = "kk-v14";
const CORE = ["./", "./index.html", "./manifest.json"];
const OPTIONAL = ["./ikon-192.png?v=2", "./ikon-512.png?v=2", "./apple-touch-icon.png?v=2", "../three.min.js"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // A failed release must leave the previous offline story available.
      for (const path of CORE) {
        const response = await fetch(path, { cache: "reload" });
        if (!response.ok) throw new Error('Story shell is unavailable');
        await cache.put(path, response);
      }
      await Promise.allSettled(OPTIONAL.map(async path => {
        const response = await fetch(path, { cache: "reload" });
        if (response.ok) await cache.put(path, response);
      }));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("kk-") && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isPage = request.mode === "navigate";
  if (isPage) {
    const home = new URL('./', self.location.href);
    if (url.pathname !== home.pathname && url.pathname !== home.pathname + 'index.html') return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok) {
          await cache.put("./index.html", response.clone()).catch(() => undefined);
        }
        return response.ok ? response : (await cache.match("./index.html")) || response;
      } catch {
        return (await cache.match("./index.html")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && /\/(model|lib|ses)\//.test(url.pathname)) {
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  })());
});
