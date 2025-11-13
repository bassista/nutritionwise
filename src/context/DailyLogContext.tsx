
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DailyLog, LoggedItem, MealType } from '@/lib/types';

interface DailyLogContextType {
    dailyLogs: DailyLog;
    setDailyLogs: (logs: DailyLog) => void;
    addLogEntry: (date: string, mealType: MealType, item: { type: 'food' | 'meal', itemId: string, grams?: number }) => void;
    removeLogEntry: (date: string, mealType: MealType, logId: string) => void;
    addWaterIntake: (date: string, amountMl: number) => void;
    updateWeight: (date: string, weight?: number) => void;
}

const DailyLogContext = createContext<DailyLogContextType | undefined>(undefined);

export const DailyLogProvider = ({ children }: { children: ReactNode }) => {
    const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog>('dailyLogs', {});

    const addLogEntry = useCallback((date: string, mealType: MealType, item: {type: 'food' | 'meal', itemId: string, grams?: number}) => {
        const newLogItem: LoggedItem = { ...item, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() };
        setDailyLogs(prev => {
            const newLogs = { ...prev };
            const dayLog = newLogs[date] || {};
            const mealLog = dayLog[mealType] || [];
            newLogs[date] = { ...dayLog, [mealType]: [...mealLog, newLogItem] };
            return newLogs;
        });
    }, [setDailyLogs]);

    const removeLogEntry = useCallback((date: string, mealType: MealType, logId: string) => {
        setDailyLogs(prev => {
            const newLogs = { ...prev };
            if (newLogs[date]?.[mealType]) {
                newLogs[date][mealType] = newLogs[date][mealType]!.filter(item => item.id !== logId);
                if (newLogs[date][mealType]!.length === 0) delete newLogs[date][mealType];
                if (Object.keys(newLogs[date]).length === 0) delete newLogs[date];
            }
            return newLogs;
        });
    }, [setDailyLogs]);

    const addWaterIntake = useCallback((date: string, amountMl: number) => {
        setDailyLogs(prev => {
            const newLogs = { ...prev };
            const dayLog = newLogs[date] || {};
            newLogs[date] = { ...dayLog, waterIntakeMl: (dayLog.waterIntakeMl || 0) + amountMl };
            return newLogs;
        });
    }, [setDailyLogs]);

    const updateWeight = useCallback((date: string, weight?: number) => {
        setDailyLogs(prev => {
            const newLogs = { ...prev };
            const dayLog = newLogs[date] || {};
            if (weight === undefined || weight <= 0) {
                delete dayLog.weight;
            } else {
                dayLog.weight = weight;
            }
            newLogs[date] = { ...dayLog };
            
            if (Object.keys(newLogs[date]).length === 0) {
                delete newLogs[date];
            }
            return newLogs;
        });
    }, [setDailyLogs]);

    return (
        <DailyLogContext.Provider value={{ dailyLogs, setDailyLogs, addLogEntry, removeLogEntry, addWaterIntake, updateWeight }}>
            {children}
        </DailyLogContext.Provider>
    );
};

export const useDailyLogs = () => {
    const context = useContext(DailyLogContext);
    if (context === undefined) {
        throw new Error('useDailyLogs must be used within a DailyLogProvider');
    }
    return context;
};
