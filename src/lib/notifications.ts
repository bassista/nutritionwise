
import type { HydrationSettings } from './types';

const WATER_REMINDER_TAG = 'water-reminder';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notification');
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function scheduleWaterReminders(settings: HydrationSettings, t: (key: string) => string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('periodicSync' in ServiceWorkerRegistration.prototype)) {
    console.warn('Periodic Sync is not supported.');
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  try {
    // Unregister any previous sync
    await (registration.periodicSync as any).unregister(WATER_REMINDER_TAG);
    
    // Register new sync
    await (registration.periodicSync as any).register(WATER_REMINDER_TAG, {
      minInterval: settings.reminderIntervalMinutes * 60 * 1000,
    });
    
    console.log('Periodic Sync for water reminders registered.');

    // Store settings in localStorage for the service worker to access
    localStorage.setItem('hydrationSettings', JSON.stringify(settings));
    localStorage.setItem('hydrationTranslations', JSON.stringify({
        title: t('Time to Hydrate!'),
        body: t("Don't forget to drink a glass of water."),
    }));

  } catch (e) {
    console.error('Periodic Sync could not be registered!', e);
  }
}

export async function cancelWaterReminders() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('periodicSync' in ServiceWorkerRegistration.prototype)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    try {
        await (registration.periodicSync as any).unregister(WATER_REMINDER_TAG);
        console.log('Periodic Sync for water reminders unregistered.');
        localStorage.removeItem('hydrationSettings');
        localStorage.removeItem('hydrationTranslations');
    } catch (e) {
        console.error('Failed to unregister periodic sync:', e);
    }
}
