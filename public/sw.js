// NexusChat Progressive Web App Service Worker (PWA)
const CACHE_NAME = 'nexuschat-cache-v1';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Event - Precache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('SW Precache error:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for dynamic real-time app
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions/Firebase live streaming
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('generativelanguage.googleapis.com') ||
    event.request.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone valid responses to runtime cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigation fails, return offline fallback root
        if (event.request.mode === 'navigate') {
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;
        }
        return new Response('Offline mode active - Network unreachable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
