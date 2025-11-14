// public/sw.js - SIMPLE WORKING VERSION
const CACHE_NAME = 'story-cache-v1';
const urlsToCache = [
  '/story-catalog/',
  '/story-catalog/index.html',
  '/story-catalog/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/story-catalog/index.html')
        .then((cached) => cached || fetch(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
});