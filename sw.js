const CACHE = 'ice-machine-v1';
const ASSETS = [
  '/ice-machine-app/',
  '/ice-machine-app/index.html',
  '/ice-machine-app/icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // 主要檔案一定要快取
      await c.addAll(ASSETS);
      // Google Fonts 嘗試快取，失敗不影響安裝
      try {
        await c.add('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
      } catch(e) {}
    })
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
  // Apps Script 請求不攔截（直接走網路）
  if (e.request.url.includes('script.google.com')) return;
  // 非 GET 不處理
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功時，順便更新快取（same-origin 及 Google Fonts）
        if (res.ok && (
          e.request.url.startsWith(self.location.origin) ||
          e.request.url.includes('fonts.google')
        )) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        // 離線時從快取回應；快取也沒有則回傳錯誤
        caches.match(e.request).then(r => r || Response.error())
      )
  );
});
