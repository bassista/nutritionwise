'use strict';

const WATER_REMINDER_TAG = 'water-reminder';
const TRANSLATIONS_CACHE_NAME = 'translations-cache-v1';
const translationFiles = ['/locales/en.json', '/locales/it.json'];

// 1. Install: Cache translation files
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(TRANSLATIONS_CACHE_NAME);
      await cache.addAll(translationFiles);
      await self.skipWaiting();
    })()
  );
});

// 2. Activate: Take control of pages immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Utility to get a value from localStorage via a client
const getLocalStorageValue = async (key) => {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  if (clients && clients.length) {
    const client = clients[0];
    const channel = new MessageChannel();
    client.postMessage({ type: 'GET_LOCALSTORAGE', key }, [channel.port2]);

    return new Promise(resolve => {
      channel.port1.onmessage = (e) => {
        resolve(e.data.value ? JSON.parse(e.data.value) : null);
      };
    });
  }
  // If no client is open, we cannot access localStorage.
  // This is a limitation, but for periodic sync, the user often has the app open in the background.
  return null;
};


const showNotification = async () => {
    try {
        const settings = await getLocalStorageValue('settings');
        const locale = (await getLocalStorageValue('locale')) || 'en';

        if (!settings || !settings.hydrationSettings || !settings.hydrationSettings.remindersEnabled) {
            console.log('Hydration reminders are disabled in settings.');
            return;
        }

        const { reminderStartTime, reminderEndTime } = settings.hydrationSettings;
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        if (currentTime < reminderStartTime || currentTime > reminderEndTime) {
            console.log('Outside of reminder time window.');
            return;
        }
        
        // Fetch translations from cache
        const cache = await caches.open(TRANSLATIONS_CACHE_NAME);
        const response = await cache.match(`/locales/${locale}.json`);
        
        if (!response) {
            console.error(`Translation file for locale "${locale}" not found in cache.`);
            return;
        }

        const translations = await response.json();
        
        const title = translations['Time to Hydrate!'] || 'Time to Hydrate!';
        const body = translations["Don't forget to drink a glass of water."] || "Don't forget to drink a glass of water.";

        await self.registration.showNotification(title, {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
        });
    } catch (error) {
        console.error('Error showing notification:', error);
    }
};


// 3. Periodic Sync: Handle the reminder
self.addEventListener('periodicsync', (event) => {
  if (event.tag === WATER_REMINDER_TAG) {
    console.log('Periodic sync event for water reminder received.');
    event.waitUntil(showNotification());
  }
});
