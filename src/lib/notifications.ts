
import type { HydrationSettings } from './types';

const WATER_REMINDER_TAG = 'water-reminder';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function scheduleWaterReminders(settings: HydrationSettings, t: (key: string) => string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }
  
  const registration = await navigator.serviceWorker.ready;

  if (!('periodicSync' in registration)) {
     console.warn('Periodic Sync is not supported.');
     return false;
  }
  
  try {
    // @ts-ignore
    const status = await navigator.permissions.query({ name: 'periodic-background-sync'});
    if (status.state === 'granted') {
      // Unregister any previous sync
      // @ts-ignore
      await registration.periodicSync.unregister(WATER_REMINDER_TAG);
      
      // Register new sync
      // @ts-ignore
      await registration.periodicSync.register(WATER_REMINDER_TAG, {
        minInterval: settings.reminderIntervalMinutes * 60 * 1000,
      });
      
      console.log('Periodic Sync for water reminders registered.');
      return true;

    } else {
        console.warn('Periodic background sync permission not granted.');
        return false;
    }
  } catch (e) {
    console.error('Periodic Sync could not be registered!', e);
    return false;
  }
}

export async function cancelWaterReminders() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('periodicSync' in ServiceWorkerRegistration.prototype)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    try {
        // @ts-ignore
        await registration.periodicSync.unregister(WATER_REMINDER_TAG);
        console.log('Periodic Sync for water reminders unregistered.');
    } catch (e) {
        console.error('Failed to unregister periodic sync:', e);
    }
}
