
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FavoriteContextType {
    favoriteFoodIds: string[];
    setFavoriteFoodIds: (ids: string[]) => void;
    toggleFavorite: (foodId: string) => void;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
    const [favoriteFoodIds, setFavoriteFoodIds] = useLocalStorage<string[]>('favoriteFoodIds', []);

    const toggleFavorite = useCallback((foodId: string) => {
        setFavoriteFoodIds(prev =>
            prev.includes(foodId) ? prev.filter(id => id !== foodId) : [foodId, ...prev]
        );
    }, [setFavoriteFoodIds]);

    return (
        <FavoriteContext.Provider value={{ favoriteFoodIds, setFavoriteFoodIds, toggleFavorite }}>
            {children}
        </FavoriteContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoriteContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoriteProvider');
    }
    return context;
};
