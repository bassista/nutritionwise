
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

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const item = window.localStorage.getItem('locale');
      if (item && (item === '"en"' || item === '"it"')) {
        setLocaleState(JSON.parse(item));
      }
    } catch (error) {
      console.error('Failed to load locale from localStorage', error);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    try {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('locale', JSON.stringify(newLocale));
      }
    } catch (error) {
      console.error('Failed to save locale to localStorage', error);
    }
  }, []);

  const t = useCallback((key: string, values?: Record<string, string | number>): string => {
    let translation = translations[locale]?.[key] || key;
    if (values) {
        Object.keys(values).forEach(valueKey => {
            translation = translation.replace(`{${valueKey}}`, String(values[valueKey]));
        });
    }
    return translation;
  }, [locale]);
  
  const value = {
    locale,
    setLocale,
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
