self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting()); // Attiva subito il nuovo Service Worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Prende il controllo delle pagine aperte
});

// Funzione per ottenere le impostazioni dal client
const getSettingsFromClient = async () => {
  const clients = await self.clients.matchAll({ type: 'window' });
  if (clients && clients.length) {
    const client = clients[0];
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          try {
            const settings = JSON.parse(event.data.value);
            resolve(settings);
          } catch (e) {
            // Se il valore è null o non è un JSON valido, risolvi con null
            resolve(null);
          }
        }
      };
      client.postMessage({ type: 'GET_LOCALSTORAGE', key: 'settings' }, [messageChannel.port2]);
    });
  }
  return null; // Nessun client trovato
};

const showNotification = (title, options) => {
  return self.registration.showNotification(title, options);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'water-reminder') {
    event.waitUntil((async () => {
      try {
        const settings = await getSettingsFromClient();
        
        if (settings && settings.hydrationSettings && settings.hydrationSettings.remindersEnabled) {
          const { reminderStartTime, reminderEndTime } = settings.hydrationSettings;
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinute;

          const [startHour, startMinute] = reminderStartTime.split(':').map(Number);
          const startTime = startHour * 60 + startMinute;

          const [endHour, endMinute] = reminderEndTime.split(':').map(Number);
          const endTime = endHour * 60 + endMinute;

          if (currentTime >= startTime && currentTime <= endTime) {
             const translations = {
                en: { title: "Time to Hydrate!", body: "Don't forget to drink a glass of water." },
                it: { title: "È ora di idratarsi!", body: "Non dimenticare di bere un bicchiere d'acqua." }
            };
            const lang = settings.locale || 'en';
            const notificationTitle = translations[lang].title;
            const notificationBody = translations[lang].body;
            
            return showNotification(notificationTitle, {
              body: notificationBody,
              icon: '/icons/icon-192x192.png',
              tag: 'water-reminder-notification'
            });
          }
        }
      } catch (error) {
        console.error('Failed to get settings for notification:', error);
      }
    })());
  }
});
