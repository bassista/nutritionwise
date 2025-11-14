const CACHE_NAME = 'nutrition-wise-cache-v1';
const TRANSLATION_FILES = [
  '/locales/en.json',
  '/locales/it.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(TRANSLATION_FILES)
        .catch(error => {
          console.error('Failed to cache translation files during install:', error);
        });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'water-reminder') {
    event.waitUntil(sendWaterReminder());
  }
});

async function getFromLocalStorage(key) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  if (clients && clients.length > 0) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data.value);
        }
      };
      clients[0].postMessage({ type: 'GET_LOCALSTORAGE', key }, [messageChannel.port2]);
    });
  }
  return null;
}

async function sendWaterReminder() {
  try {
    const settingsStr = await getFromLocalStorage('settings');
    const localeStr = await getFromLocalStorage('locale');

    if (!settingsStr || !localeStr) {
      console.log('Could not get settings or locale from localStorage.');
      return;
    }

    const settings = JSON.parse(settingsStr);
    const locale = JSON.parse(localeStr);
    
    const { hydrationSettings } = settings;

    if (hydrationSettings && hydrationSettings.remindersEnabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMinute] = hydrationSettings.reminderStartTime.split(':').map(Number);
      const [endHour, endMinute] = hydrationSettings.reminderEndTime.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (currentTime >= startTime && currentTime <= endTime) {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(`/locales/${locale}.json`);
        let translations = {};
        if (response) {
            translations = await response.json();
        }

        const title = translations['Time to Hydrate!'] || 'Time to Hydrate!';
        const body = translations["Don't forget to drink a glass of water."] || "Don't forget to drink a glass of water.";

        await self.registration.showNotification(title, {
          body: body,
          icon: '/logo.png',
        });
      }
    }
  } catch (error) {
    console.error('Error sending water reminder:', error);
  }
}
