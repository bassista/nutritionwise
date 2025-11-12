
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAppData, AppDataContextType } from '@/hooks/useAppData';
import { defaultFoods } from '@/lib/data';
import { defaultSettings } from '@/lib/settings';
import { ShoppingList } from '@/lib/types';


const defaultShoppingLists: ShoppingList[] = [
    { id: 'default-meals', name: 'Pasti', items: [], isDeletable: false }
];

const AppContext = createContext<AppDataContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const appData = useAppData({
    defaultFoods,
    defaultSettings,
    defaultShoppingLists,
  });

  return <AppContext.Provider value={appData}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
