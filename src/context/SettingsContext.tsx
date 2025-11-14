
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppSettings, NutritionalGoals, HydrationSettings } from '@/lib/types';
import { defaultSettings } from '@/lib/settings';

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

    const updateSettings = useCallback((newSettings: Partial<Omit<AppSettings, 'nutritionalGoals' | 'hydrationSettings'>>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, [setSettings]);

    const updateNutritionalGoals = useCallback((goals: NutritionalGoals) => {
        setSettings(prev => ({ ...prev, nutritionalGoals: goals }));
    }, [setSettings]);

    const updateHydrationSettings = useCallback((hydrationSettings: Partial<HydrationSettings>) => {
        setSettings(prev => ({ 
            ...prev, 
            hydrationSettings: { ...prev.hydrationSettings, ...hydrationSettings } 
        }));
    }, [setSettings]);
    
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
