
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import it from '@/locales/it.json';

export type Locale = 'en' | 'it';

const translations: Record<Locale, Record<string, string>> = { en, it };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState(() => {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    useEffect(() => {
        const valueToStore = storedValue instanceof Function ? storedValue(storedValue) : storedValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }, [key, storedValue]);

    return [storedValue, setValue];
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useLocalStorage<Locale>('locale', 'en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const t = useCallback((key: string, values?: Record<string, string | number>): string => {
    const currentLocale = isMounted ? locale : 'en';
    let translation = translations[currentLocale]?.[key] || key;
    if (values) {
        Object.keys(values).forEach(valueKey => {
            translation = translation.replace(`{${valueKey}}`, String(values[valueKey]));
        });
    }
    return translation;
  }, [isMounted, locale]);
  
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
