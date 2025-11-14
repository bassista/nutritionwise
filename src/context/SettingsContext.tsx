
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppSettings, NutritionalGoals, HydrationSettings } from '@/lib/types';
import { defaultSettings } from '@/lib/settings';
import { scheduleWaterReminders, cancelWaterReminders, requestNotificationPermission } from '@/lib/notifications';
import { useLocale } from './LocaleContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsContextType {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
    updateSettings: (newSettings: Partial<Omit<AppSettings, 'nutritionalGoals' | 'hydrationSettings'>>) => void;
    updateNutritionalGoals: (goals: NutritionalGoals) => void;
    updateHydrationSettings: (hydrationSettings: Partial<HydrationSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
    const { t } = useLocale();
    const { toast } = useToast();

    // This effect handles communication between the service worker and the main thread
    // to get localStorage values, since service workers can't access it directly.
    useEffect(() => {
        const messageListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'GET_LOCALSTORAGE') {
                const value = localStorage.getItem(event.data.key);
                if (event.ports[0]) {
                    event.ports[0].postMessage({ value, locale: localStorage.getItem('locale') });
                }
            }
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', messageListener);
        }

        return () => {
            if ('serviceWorker'in navigator) {
              navigator.serviceWorker.removeEventListener('message', messageListener);
            }
        };
    }, []);

    const updateSettings = useCallback((newSettings: Partial<Omit<AppSettings, 'nutritionalGoals' | 'hydrationSettings'>>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, [setSettings]);

    const updateNutritionalGoals = useCallback((goals: NutritionalGoals) => {
        setSettings(prev => ({ ...prev, nutritionalGoals: goals }));
    }, [setSettings]);

    const updateHydrationSettings = useCallback(async (hydrationSettings: Partial<HydrationSettings>) => {
        const newHydrationSettings = { ...settings.hydrationSettings, ...hydrationSettings };

        if (newHydrationSettings.remindersEnabled) {
            const permission = await requestNotificationPermission();
            
            if (permission === 'granted') {
                const syncScheduled = await scheduleWaterReminders(newHydrationSettings, t);
                if (syncScheduled) {
                    setSettings(prev => ({ ...prev, hydrationSettings: newHydrationSettings }));
                    toast({
                        title: t('Hydration Settings Saved'),
                        description: t('Your hydration settings have been updated.'),
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: t('Background Sync Failed'),
                        description: t('Could not schedule reminders. Installing the app on your device might solve the issue.'),
                    });
                    setSettings(prev => ({ ...prev, hydrationSettings: { ...prev.hydrationSettings, remindersEnabled: false }}));
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: t('Notifications Blocked'),
                    description: t('To enable reminders, please allow notifications in your browser settings.'),
                });
                setSettings(prev => ({ ...prev, hydrationSettings: { ...prev.hydrationSettings, remindersEnabled: false }}));
                cancelWaterReminders();
            }
        } else {
            // If reminders are being disabled, just save and cancel
            setSettings(prev => ({ ...prev, hydrationSettings: newHydrationSettings }));
            cancelWaterReminders();
             toast({
                title: t('Hydration Settings Saved'),
                description: t('Your hydration settings have been updated.'),
            });
        }
    }, [settings.hydrationSettings, setSettings, t, toast]);
    
    return (
        <SettingsContext.Provider value={{ settings, setSettings, updateSettings, updateNutritionalGoals, updateHydrationSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
