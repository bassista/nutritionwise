
const CACHE_NAME = 'nutrition-wise-cache-v1';
const urlsToCache = [
    '/',
    '/locales/en.json',
    '/locales/it.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
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
          }
        );
      })
    );
});


async function getFromLocalStorage(key) {
    const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
    });
    if (clients && clients.length) {
        const client = clients[0];
        const messageChannel = new MessageChannel();
        client.postMessage({ type: 'GET_LOCALSTORAGE', key }, [messageChannel.port2]);

        return new Promise(resolve => {
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };
        });
    }
    return null;
}

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'water-reminder') {
        event.waitUntil(
            (async () => {
                try {
                    const settingsData = await getFromLocalStorage('settings');
                    const localeData = await getFromLocalStorage('locale');

                    if (!settingsData || !localeData) {
                        console.error('Could not get settings or locale from localStorage.');
                        return;
                    }
                    
                    const settings = JSON.parse(settingsData.value);
                    const locale = JSON.parse(localeData.value);

                    const { hydrationSettings } = settings;
                    if (!hydrationSettings.remindersEnabled) return;

                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const [startHour, startMinute] = hydrationSettings.reminderStartTime.split(':').map(Number);
                    const [endHour, endMinute] = hydrationSettings.reminderEndTime.split(':').map(Number);
                    const startTime = startHour * 60 + startMinute;
                    const endTime = endHour * 60 + endMinute;

                    if (currentTime >= startTime && currentTime <= endTime) {
                        const localesRes = await caches.match(`/locales/${locale}.json`);
                        if (localesRes) {
                            const translations = await localesRes.json();
                            const title = translations['Time to Hydrate!'] || 'Time to Hydrate!';
                            const body = translations["Don't forget to drink a glass of water."] || "Don't forget to drink a glass of water.";

                             self.registration.showNotification(title, {
                                body: body,
                                icon: '/icon-192x192.png',
                                tag: 'water-reminder-notification',
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error during periodic sync:', e);
                }
            })()
        );
    }
});
