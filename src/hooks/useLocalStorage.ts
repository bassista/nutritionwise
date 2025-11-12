
"use client";

import { useState, useEffect } from 'react';
import { defaultSettings } from '@/lib/settings';

// This hook is now more generic and reusable
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // Generic migrations or validations can go here if needed
        // For example, ensuring settings object has all keys
        if (key === 'settings') {
            return { ...defaultSettings, ...parsedItem };
        }
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
