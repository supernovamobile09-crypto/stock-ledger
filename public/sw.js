const CACHE = 'stock-ledger-v1';
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then(r => r || fetch(e.request)))
  );
});
self.addEventListener('install', () => self.skipWaiting());