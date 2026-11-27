// Existing installations check this URL when the browser comes online.
'use strict';
const scope = new URL(self.registration.scope);
const pages = new Set(['', 'index.html', 'iti', 'iti/', 'iti/index.html']
  .map(path => new URL(path, scope).pathname));

function isRetiredPage(url) {
  const target = new URL(url);
  return target.origin === scope.origin && pages.has(target.pathname);
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const owned = names.filter(name => name.startsWith('hisar-main-') ||
      name.startsWith('hisar-cache-hisar-m60-ucangoz-') || /^hisar-v\d+$/.test(name));
    await Promise.all(owned.map(name => caches.delete(name)));
    // Include pages opened just before our activation. Sibling applications share this origin.
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    await self.registration.unregister();
    await Promise.all(windows.filter(client => isRetiredPage(client.url)).map(client => {
      const url = new URL(client.url);
      url.searchParams.set('retired','1');
      return client.navigate(url.href).catch(() => {});
    }));
  })());
});
