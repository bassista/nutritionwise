
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import it from '@/locales/it.json';

export type Locale = 'en' | 'it';

const translations = { en, it };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [key, storedValue]);

  const isMounted = typeof window !== 'undefined';

  if (!isMounted) {
    return [initialValue, () => {}];
  }

  return [storedValue, setStoredValue];
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useLocalStorage<Locale>('locale', 'en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const t = (key: string, values?: Record<string, string | number>): string => {
    let translation = translations[locale][key as keyof typeof translations[Locale]] || key;
    if (values) {
        Object.keys(values).forEach(valueKey => {
            translation = translation.replace(`{${valueKey}}`, String(values[valueKey]));
        });
    }
    return translation;
  };
  
  const value = {
    locale: isMounted ? locale : 'en',
    setLocale: setLocale,
    t,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
