// Service Worker for Story Catalog - OFFLINE RELOAD FIX
const CACHE_NAME = 'story-cache-v2';
const OFFLINE_URL = '/story-catalog/index.html';

// Assets to cache for offline
const urlsToCache = [
  OFFLINE_URL,
  '/story-catalog/manifest.json',
  '/story-catalog/favicon.svg'
];

// Install - cache essential files
self.addEventListener('install', (event) => {
  console.log('SW: Installing and caching offline page');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.log('SW: Cache failed but continuing');
        return self.skipWaiting();
      })
  );
});

// Activate - take control
self.addEventListener('activate', (event) => {
  console.log('SW: Activating and claiming clients');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - handle offline reload
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);

  // Always serve index.html for navigation requests (even when offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First try network
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          // If network fails (offline), serve cached index.html
          console.log('SW: Offline - serving cached page');
          const cachedResponse = await caches.match(OFFLINE_URL);
          return cachedResponse || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // For API calls - network first, then cache
  if (url.href.includes('story-api.dicoding.dev')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For all other requests - cache first
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        return cached || fetch(request).catch(() => {
          // Silent fail for other resources
          return undefined;
        });
      })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  const options = {
    body: 'Ada cerita baru di Story Catalog! 📚',
    icon: '/story-catalog/favicon.svg',
    tag: 'story-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Story Catalog', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/story-catalog/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/story-catalog/');
      }
    })
  );
});