// Service Worker - Kauppisen perhekalenteri
const CACHE_NAME = 'kalenteri-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './logo.png'
];

// Asennus - välimuistiin tallennus
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Välimuisti avattu');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivointi - vanhojen välimuistien siivous
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Poistetaan vanha välimuisti:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - verkko ensin, sitten välimuisti (Network First)
self.addEventListener('fetch', (event) => {
  // Ohita Firebase-pyynnöt ja muut API-kutsut
  if (event.request.url.includes('firebasedatabase.app') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Tallenna kopio välimuistiin
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jos verkko ei toimi, käytä välimuistia
        return caches.match(event.request);
      })
  );
});
