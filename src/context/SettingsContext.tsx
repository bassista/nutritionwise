
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppSettings, NutritionalGoals, HydrationSettings } from '@/lib/types';
import { defaultSettings } from '@/lib/settings';
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

    const updateSettings = useCallback((newSettings: Partial<Omit<AppSettings, 'nutritionalGoals' | 'hydrationSettings'>>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, [setSettings]);

    const updateNutritionalGoals = useCallback((goals: NutritionalGoals) => {
        setSettings(prev => ({ ...prev, nutritionalGoals: goals }));
    }, [setSettings]);

    const updateHydrationSettings = useCallback((hydrationSettings: Partial<HydrationSettings>) => {
        const newHydrationSettings = { ...settings.hydrationSettings, ...hydrationSettings };
        
        if (newHydrationSettings.remindersEnabled) {
            toast({
                variant: 'destructive',
                title: t('Feature not available'),
                description: t('Notifications are temporarily disabled.'),
            });
            setSettings(prev => ({ ...prev, hydrationSettings: { ...prev.hydrationSettings, remindersEnabled: false }}));
        } else {
            setSettings(prev => ({ ...prev, hydrationSettings: newHydrationSettings }));
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
