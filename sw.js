const CACHE = 'ice-machine-v1';
const ASSETS = [
  '/ice-machine-app/',
  '/ice-machine-app/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Apps Script 請求不快取
  if (e.request.url.includes('script.google')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
