// ============================================================
// L-imiles — Service Worker
// ============================================================

// GitHub Actions で置換される
const CACHE_NAME = '__CACHE_NAME__';

// オフライン用の事前キャッシュ
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
];

// ============================================================
// Install
// ============================================================
self.addEventListener('install', event => {

  event.waitUntil(

    caches.open(CACHE_NAME).then(async cache => {

      const localFiles = PRECACHE.filter(url => !url.startsWith('http'));
      const externalFiles = PRECACHE.filter(url => url.startsWith('http'));

      // ローカル必須ファイル
      await cache.addAll(localFiles);

      // CDN系は失敗しても続行
      await Promise.allSettled(
        externalFiles.map(url => cache.add(url))
      );

    })

  );

  // 新SWを即有効化
  self.skipWaiting();

});

// ============================================================
// Activate
// ============================================================
self.addEventListener('activate', event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))

      );

    }).then(() => self.clients.claim())

  );

});

// ============================================================
// Fetch
// ============================================================
self.addEventListener('fetch', event => {

  // HTTP(S) 以外は無視
  if (!event.request.url.startsWith('http')) return;

  // Cache API は GET のみサポート。POST 等はそのまま素通し
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ==========================================================
  // HTML は Network First
  // ==========================================================
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html')
  ) {

    event.respondWith(

      fetch(event.request)

        .then(response => {

          // 最新HTMLを保存
          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return response;

        })

        // オフライン時はキャッシュ
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || caches.match('./index.html'));
        })

    );

    return;
  }

  // ==========================================================
  // その他は Cache First
  // ==========================================================
  event.respondWith(

    caches.match(event.request)

      .then(cached => {

        if (cached) return cached;

        return fetch(event.request)

          .then(response => {

            // 正常レスポンスかつ GET のみ保存（POST 等は Cache API 非対応）
            if (
              response &&
              response.status === 200 &&
              event.request.method === 'GET'
            ) {

              const clone = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clone);
              });

            }

            return response;

          });

      })

  );

});