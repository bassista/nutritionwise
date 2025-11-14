
const CACHE_NAME = 'nutrition-wise-cache-v1';
const urlsToCache = [
  '/',
  '/en.json',
  '/it.json'
];

// Install a service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all: app shell and content');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

// Activate the service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});


// Listen for network requests
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
    
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If the network request fails, try to get it from the cache.
        return caches.match(event.request);
      })
  );
});

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'water-reminder') {
        event.waitUntil(sendWaterReminder());
    }
});

async function sendWaterReminder() {
    try {
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        if (clients.length === 0) {
            console.log('[Service Worker] No clients to send message to.');
            return;
        }

        const client = clients[0];

        const { value: settings, locale } = await getLocalStorageData(client, 'settings');
        const parsedSettings = JSON.parse(settings || '{}');
        const hydrationSettings = parsedSettings.hydrationSettings;

        if (!hydrationSettings || !hydrationSettings.remindersEnabled) {
            return;
        }
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMinute] = hydrationSettings.reminderStartTime.split(':').map(Number);
        const [endHour, endMinute] = hydrationSettings.reminderEndTime.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime <= endTime) {
            const translations = await getTranslations(JSON.parse(locale || '"en"'));
            const title = translations['Time to Hydrate!'] || 'Time to Hydrate!';
            const body = translations["Don't forget to drink a glass of water."] || "Don't forget to drink a glass of water.";

            await self.registration.showNotification(title, {
                body: body,
                icon: '/icons/icon-192x192.png',
                tag: 'water-reminder-notification',
            });
        }
    } catch (error) {
        console.error('[Service Worker] Error sending water reminder:', error);
    }
}


function getLocalStorageData(client, key) {
    return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };
        client.postMessage({ type: 'GET_LOCALSTORAGE', key: key }, [messageChannel.port2]);
    });
}

async function getTranslations(locale) {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`/${locale}.json`);
    if (response) {
        return response.json();
    }
    return {};
}
