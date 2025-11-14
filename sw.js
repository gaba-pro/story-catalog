// Service Worker for Story Catalog PWA - FIXED VERSION
const CACHE_NAME = 'story-catalog-v2';
const STATIC_CACHE = 'story-catalog-static-v2';

// Static assets to cache - TAMBAHKAN CSS & JS
const STATIC_ASSETS = [
  '/story-catalog/',
  '/story-catalog/index.html',
  '/story-catalog/manifest.json',
  '/story-catalog/favicon.svg',
  '/story-catalog/assets/index.js',      // File JS utama
  '/story-catalog/assets/styles.css'     // File CSS utama
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache, adding assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('All assets cached, skipping wait');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - FIXED VERSION (no empty responses)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  
  // Handle navigation requests - serve index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/story-catalog/index.html')
        .then((cached) => {
          return cached || fetch(request);
        })
        .catch(() => {
          return caches.match('/story-catalog/index.html');
        })
    );
    return;
  }

  // Handle API requests - Network First
  if (url.href.includes('story-api.dicoding.dev')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For static assets - Cache First dengan error handling
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        // Return cached version jika ada
        if (cached) {
          return cached;
        }
        
        // Kalau tidak ada di cache, fetch dari network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            console.log('Fetch failed for:', request.url);
            // JANGAN return empty response - biarkan fail naturally
            // Browser akan handle failure sendiri
            return Promise.reject(error);
          });
      })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'Ada cerita baru ditambahkan!',
    icon: '/story-catalog/favicon.svg',
    tag: 'story-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Story Catalog', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
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