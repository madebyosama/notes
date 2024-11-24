self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('notes-cache-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/site.webmanifest',
        '/web-app-manifest-192x192.png',
        '/web-app-manifest-512x512.png',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Clone the request because it can only be used once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if response is valid
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic' ||
          event.request.url.includes('.m3u8')
        ) {
          return response;
        }

        // Clone the response because it can only be used once
        const responseToCache = response.clone();

        caches.open('notes-cache-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
