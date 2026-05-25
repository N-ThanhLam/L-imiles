// ============================================================
// L-imiles 8×8  — Service Worker
// ============================================================
const CACHE_NAME = 'limiles-v2';

// オフラインでも動くようにキャッシュするリソース
const PRECACHE = [
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  // PeerJS CDN（オンライン対戦用。失敗しても起動は止めない）
  'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
];

// ============================================================
// Install: 必須リソースを先読みキャッシュ
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // CDN は失敗しても install を止めない
      const mustHave = PRECACHE.filter(u => !u.startsWith('http'));
      const optional = PRECACHE.filter(u => u.startsWith('http'));

      return cache.addAll(mustHave).then(() => {
        return Promise.allSettled(optional.map(u => cache.add(u)));
      });
    }).then(() => self.skipWaiting())
  );
});

// ============================================================
// Activate: 古いキャッシュを削除
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================================
// Fetch: Cache-first（キャッシュになければネット取得 → キャッシュに追加）
// ============================================================
self.addEventListener('fetch', event => {
  // chrome-extension など HTTP(S) 以外は無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // 正常レスポンスのみキャッシュ（opaque は容量消費に注意）
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // オフラインで index.html へのナビゲーション → キャッシュ版を返す
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
