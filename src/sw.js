// Service Worker for Push Notifications and Caching
const CACHE_NAME = 'story-catalog-v1';
const STATIC_CACHE = 'story-catalog-static-v1';
const DYNAMIC_CACHE = 'story-catalog-dynamic-v1';

// Static assets to cache (pastikan path sesuai subfolder hosting)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/scripts/index.js',
  '/styles/styles.css',
  '/manifest.json',
  '/images/icon-192x192.svg',
  '/images/icon-512x512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached response when offline
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached response or fetch from network
        return response || fetch(request)
          .then((response) => {
            // Cache dynamic content
            if (request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
      })
      .catch(() => {
        // Return offline fallback page if available
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Push event - handle incoming push notifications (sesuai instruksi reviewer)
self.addEventListener('push', (event) => {
  console.log('Service worker pushing...');
  async function chainPromise() {
    let data = { title: 'Notifikasi Baru', options: { body: 'Ada data baru ditambahkan.' } };
    if (event.data) {
      try {
        data = await event.data.json();
      } catch (e) {
        // fallback ke default
      }
    }
    await self.registration.showNotification(data.title, {
      body: data.options?.body || 'Ada data baru ditambahkan.',
      icon: data.options?.icon || '/favicon.png',
      badge: data.options?.badge || '/favicon.png',
      data: data.options?.data || {},
      tag: data.options?.tag || 'story-notification',
      vibrate: [200, 100, 200],
      requireInteraction: true
    });
  }
  event.waitUntil(chainPromise());
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'close') {
    return;
  }

  // Default action or 'view' action
  let urlToOpen = data?.url || '/#/stories';
  
  if (action === 'view' && data?.storyId) {
    urlToOpen = `/#/stories/${data.storyId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url.includes(urlToOpen.split('#')[1]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          const baseUrl = self.location.origin;
          return clients.openWindow(baseUrl + urlToOpen);
        }
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync - will be implemented with IndexedDB
      Promise.resolve()
    );
  }
});