
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'water-reminder') {
        event.waitUntil(sendWaterReminder());
    }
});

async function sendWaterReminder() {
    const hydrationSettingsString = await getFromLocalStorage('hydrationSettings');
    const hydrationTranslationsString = await getFromLocalStorage('hydrationTranslations');

    if (!hydrationSettingsString || !hydrationTranslationsString) {
        return;
    }
    
    const settings = JSON.parse(hydrationSettingsString);
    const translations = JSON.parse(hydrationTranslationsString);
    
    if (!settings.remindersEnabled) {
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    if (currentTime >= settings.reminderStartTime && currentTime <= settings.reminderEndTime) {
        const title = translations.title || 'Time to Hydrate!';
        const options = {
            body: translations.body || "Don't forget to drink a glass of water.",
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png'
        };

        return self.registration.showNotification(title, options);
    }
}

// Helper to get items from localStorage, as SW can't access it directly
function getFromLocalStorage(key) {
    return new Promise((resolve, reject) => {
        const client = self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clients => {
            if (clients && clients.length) {
                // Find a visible client
                const visibleClient = clients.find(c => c.visibilityState === 'visible');
                const clientToMessage = visibleClient || clients[0];

                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    if (event.data.error) {
                        reject(event.data.error);
                    } else {
                        resolve(event.data.value);
                    }
                };
                clientToMessage.postMessage({ type: 'GET_LOCALSTORAGE', key: key }, [messageChannel.port2]);
            } else {
                resolve(null); // No clients available
            }
        });
    });
}

// Listen for messages from the main app to get localStorage data
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_LOCALSTORAGE') {
        const value = localStorage.getItem(event.data.key);
        event.ports[0].postMessage({ value });
    }
});
