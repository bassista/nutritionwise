
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIStateContextType {
    isMealBuilderOpen: boolean;
    mealBuilderContext: 'all' | 'favorites';
    setMealBuilderOpen: (isOpen: boolean, context?: 'all' | 'favorites') => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider = ({ children }: { children: ReactNode }) => {
    const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
    const [mealBuilderContext, setMealBuilderContext] = useState<'all' | 'favorites'>('all');

    const setMealBuilderOpen = (isOpen: boolean, context: 'all' | 'favorites' = 'all') => {
        setIsMealBuilderOpen(isOpen);
        if (isOpen) {
            setMealBuilderContext(context);
        } else {
            // Delay context reset to prevent UI flicker during closing animation
            setTimeout(() => setMealBuilderContext('all'), 300);
        }
    };
    
    return (
        <UIStateContext.Provider value={{ isMealBuilderOpen, mealBuilderContext, setMealBuilderOpen }}>
            {children}
        </UIStateContext.Provider>
    );
};

export const useUIState = () => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};
