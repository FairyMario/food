/* ============================================
   Service Worker — 离线缓存
   ============================================ */

const CACHE_NAME = 'zzfood-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/utils.js',
    '/js/storage.js',
    '/js/map.js',
    '/js/home.js',
    '/js/detail.js',
    '/js/search.js',
    '/js/settings.js',
    '/js/app.js',
    '/data/foods.json',
    '/manifest.json',
];

// 安装
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch((err) => {
            console.warn('SW install cache error:', err);
        })
    );
    self.skipWaiting();
});

// 激活
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求和地图 API 请求
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('amap.com')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            // 缓存命中，返回缓存
            if (cached) return cached;

            // 否则请求网络，并缓存
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200) return response;

                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });

                return response;
            }).catch(() => {
                // 网络失败，返回离线页面
                return caches.match('/index.html');
            });
        })
    );
});
