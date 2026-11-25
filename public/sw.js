// JalDrishti Service Worker
const CACHE_NAME = 'jaldrishti-v1';
const STATIC_ASSETS = [
  '/',
  '/report',
  '/map',
  '/manifest.json',
  '/demo-images/clean_water.jpg',
  '/demo-images/foam.jpg',
  '/demo-images/sewage_inflow.jpg',
  '/demo-images/solid_waste.jpg',
  '/demo-images/visarjan_debris.jpg',
  '/demo-images/construction_debris.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        });
      })
  );
});
