// Service Worker pentru Povești cu Final Schimbat
const CACHE_NAME = 'povesti-magice-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalarea Service Worker-ului
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activarea Service Worker-ului
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Interceptarea cererilor de rețea
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Returnează din cache dacă există
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Altfel, încearcă să obții de pe rețea
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Verifică dacă răspunsul este valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonează răspunsul pentru cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // În caz de eroare de rețea, încearcă să servești din cache
          console.log('Service Worker: Network failed, trying cache');
          return caches.match('/index.html');
        });
      })
  );
});

// Gestionarea mesajelor de la aplicația principală
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificări push (opțional pentru viitor)
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Ai exerciții noi de rezolvat!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Începe Exercițiile',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Închide',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Povești cu Final Schimbat', options)
  );
});

// Gestionarea click-urilor pe notificări
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronizare în fundal (opțional pentru viitor)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise(function(resolve) {
    console.log('Service Worker: Performing background sync');
    // Aici poți adăuga logica pentru sincronizarea datelor
    resolve();
  });
}

// Gestionarea erorilor
self.addEventListener('error', function(event) {
  console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('Service Worker: Script loaded successfully');

