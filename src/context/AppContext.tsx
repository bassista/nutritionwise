
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAppData } from '@/hooks/useAppData';

type AppContextType = ReturnType<typeof useAppData>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const data = useAppData();
  return <AppContext.Provider value={data}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

    