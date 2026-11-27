// Retire the offline installation on its next online update.
'use strict';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cachesToRemove = (await caches.keys()).filter(key => key.startsWith('hisar-komuta-site-'));
    await Promise.all(cachesToRemove.map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({type: 'window'});
    await self.registration.unregister();
    await Promise.all(windows.filter(client => client.url.startsWith(self.registration.scope)).map(client => {
      const url = new URL(client.url);
      url.searchParams.set('retired', '1');
      return client.navigate(url.href).catch(() => {});
    }));
  })());
});
