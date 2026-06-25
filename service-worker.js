// Cole.ai Service Worker — network-first so every open with internet = latest version
const CACHE = 'coleai-v22';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './sync.js',
  './data.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // daily_briefings.js intentionally excluded — always fetched fresh
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

// Network first: always try fresh, fall back to cache when offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // daily_briefings.js is regenerated daily — always bypass cache entirely
  if (e.request.url.includes('daily_briefings.js')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
