// Service Worker - Kauppisen perhekalenteri v2.3.1
// HUOM: pidä versionumero synkassa script.js:n VERSIO-vakion kanssa!
const CACHE_NAME = 'kalenteri-v2.3.1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './logo.png',
  './manifest.json'
];
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap';

// Asennus - välimuistiin tallennus (fontti erikseen: sen epäonnistuminen ei saa kaataa asennusta)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache)
        .then(() => cache.add(FONT_CSS_URL).catch(() => {})))
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

// Fetch - strategiat:
// - Firebase/auth-pyynnöt: ohitetaan aina (reaaliaikainen data ei saa välimuistittua)
// - Fontit (gstatic/googleapis): cache-first (muuttumattomat fonttitiedostot)
// - Muut (omat tiedostot): network-first, välimuisti varalla
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  if (url.includes('firebasedatabase.app') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('securetoken.googleapis.com')) {
    return;
  }

  if (url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
