// This is a basic service worker for PWA functionality.

const CACHE_NAME = 'nutrition-wise-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/locales/en.json',
  '/locales/it.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event: fires when the service worker is first installed.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate new service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache resources during install:', err);
      })
  );
});

// Activate event: fires when the service worker becomes active.
self.addEventListener('activate', (event) => {
  self.clients.claim(); // Take control of all open clients
  console.log('Service worker activated.');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
});


// Fetch event: fires for every network request.
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // 1. Try to get the response from the network
    fetch(event.request)
      .then(networkResponse => {
        // If we got a valid response, cache it and return it
        if (networkResponse && networkResponse.status === 200) {
          const cacheToPut = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cacheToPut);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 2. If the network request fails, try to get it from the cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If the request is for a page navigation, show a generic offline page.
            if (event.request.mode === 'navigate') {
              return caches.match('/') || new Response("You are offline. Please check your internet connection.", { headers: { 'Content-Type': 'text/html' }});
            }
            // For other resources (images, etc.), just fail.
            return new Response('', {status: 404, statusText: 'Not Found'});
          });
      })
  );
});


// periodicSync event for notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'water-reminder') {
    event.waitUntil(
       new Promise((resolve, reject) => {
        // This is a workaround to get access to localStorage from a service worker.
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (messageEvent) => {
            if (messageEvent.data.error) {
                console.error(messageEvent.data.error);
                reject(messageEvent.data.error);
            } else {
                try {
                    const settings = JSON.parse(messageEvent.data.value);
                    const localeData = JSON.parse(messageEvent.data.locale);
                    const locale = localeData || 'en';
                    if (settings && settings.hydrationSettings.remindersEnabled) {
                        const { reminderStartTime, reminderEndTime } = settings.hydrationSettings;
                        const now = new Date();
                        const currentTime = now.getHours() * 60 + now.getMinutes();
                        const startTime = parseInt(reminderStartTime.split(':')[0]) * 60 + parseInt(reminderStartTime.split(':')[1]);
                        const endTime = parseInt(reminderEndTime.split(':')[0]) * 60 + parseInt(reminderEndTime.split(':')[1]);

                        if (currentTime >= startTime && currentTime <= endTime) {
                            caches.open(CACHE_NAME).then(cache => {
                                return cache.match(`/locales/${locale}.json`).then(response => {
                                    if (response) {
                                        return response.json();
                                    }
                                    return fetch(`/locales/${locale}.json`).then(res => res.json());
                                }).then(translations => {
                                    const title = translations['Time to Hydrate!'] || 'Time to Hydrate!';
                                    const body = translations["Don't forget to drink a glass of water."] || "Don't forget to drink a glass of water.";
                                    self.registration.showNotification(title, { body });
                                    resolve();
                                });
                            });
                        } else {
                           resolve();
                        }
                    } else {
                        resolve();
                    }
                } catch(e) {
                   console.error("Error processing settings in service worker", e);
                   reject(e);
                }
            }
        };
        
        self.clients.get(event.clientId).then((client) => {
             if (!client) {
                // If the client is not available (e.g., app is closed), we can't get localStorage.
                // For this app, we'll just skip the notification.
                // A more advanced app might store settings in IndexedDB for SW access.
                console.log("Client not available, skipping notification.");
                resolve();
                return;
            }
            // Send a message to the client to get localStorage data
            client.postMessage({ type: 'GET_LOCALSTORAGE', key: 'settings' }, [messageChannel.port2]);
        }).catch(err => {
             console.error("Error getting client:", err);
             reject(err);
        });

       })
    );
  }
});
