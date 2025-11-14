
const WATER_REMINDER_TAG = 'water-reminder';

// Helper function to get data from localStorage via the main thread
async function getLocalStorage(key) {
    const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
    });

    if (clients && clients.length) {
        const messageChannel = new MessageChannel();
        clients[0].postMessage({ type: 'GET_LOCALSTORAGE', key }, [messageChannel.port2]);

        return new Promise(resolve => {
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.value);
            };
        });
    }
    return null;
}

self.addEventListener('periodicsync', (event) => {
    if (event.tag === WATER_REMINDER_TAG) {
        event.waitUntil(
            (async () => {
                const settingsStr = await getLocalStorage('settings');
                const localeStr = await getLocalStorage('locale');
                
                if (!settingsStr) return;

                const settings = JSON.parse(settingsStr);
                const locale = localeStr ? JSON.parse(localeStr) : 'en';

                const { hydrationSettings } = settings;

                if (!hydrationSettings.remindersEnabled) {
                    return;
                }

                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const [startHour, startMinute] = hydrationSettings.reminderStartTime.split(':').map(Number);
                const [endHour, endMinute] = hydrationSettings.reminderEndTime.split(':').map(Number);
                const startTime = startHour * 60 + startMinute;
                const endTime = endHour * 60 + endMinute;

                if (currentTime >= startTime && currentTime <= endTime) {
                    const title = locale === 'it' ? 'È ora di idratarsi!' : 'Time to Hydrate!';
                    const body = locale === 'it' ? 'Non dimenticare di bere un bicchiere d\'acqua.' : 'Don\'t forget to drink a glass of water.';
                    
                    self.registration.showNotification(title, {
                        body: body,
                        icon: '/icons/icon-192x192.png',
                        tag: WATER_REMINDER_TAG,
                    });
                }
            })()
        );
    }
});

// Optional: listen for notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Focus or open a window when the notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/diary');
            }
        })
    );
});
