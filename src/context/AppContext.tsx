"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultFoods } from '@/lib/data';
import type { Food, Meal, AppSettings, MealFood } from '@/lib/types';

interface AppContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  isMealBuilderOpen: boolean;
  setMealBuilderOpen: (isOpen: boolean) => void;
  getFoodById: (id: string) => Food | undefined;
  importFoods: (newFoods: Food[]) => void;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  toggleFavoriteFood: (foodId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  clearAllData: () => void;
  setFavoriteFoodIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  foodsPerPage: 8,
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
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

  return [storedValue, setValue];
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [foods, setFoods] = useLocalStorage<Food[]>('foods', defaultFoods);
  const [meals, setMeals] = useLocalStorage<Meal[]>('meals', []);
  const [favoriteFoodIds, setFavoriteFoodIds] = useLocalStorage<string[]>('favoriteFoodIds', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [isMealBuilderOpen, setMealBuilderOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const getFoodById = (id: string) => foods.find(f => f.id === id);

  const importFoods = (newFoods: Food[]) => {
    const existingIds = new Set(foods.map(f => f.id));
    const uniqueNewFoods = newFoods.filter(f => !existingIds.has(f.id));
    setFoods(prev => [...prev, ...uniqueNewFoods]);
  };

  const addMeal = (meal: Meal) => {
    setMeals(prev => [...prev, meal]);
  };

  const updateMeal = (updatedMeal: Meal) => {
    setMeals(prev => prev.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
  };

  const deleteMeal = (mealId: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
  };

  const toggleFavoriteFood = (foodId: string) => {
    setFavoriteFoodIds(prev =>
      prev.includes(foodId) ? prev.filter(id => id !== foodId) : [...prev, foodId]
    );
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const clearAllData = () => {
    setFoods(defaultFoods);
    setMeals([]);
    setFavoriteFoodIds([]);
    setSettings(defaultSettings);
    // Also clear from localStorage directly
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('foods');
        window.localStorage.removeItem('meals');
        window.localStorage.removeItem('favoriteFoodIds');
        window.localStorage.removeItem('settings');
    }
  };

  // Prevent hydration mismatch by returning default/empty values on server
  // and on the initial client render.
  const value = {
    foods: isMounted ? foods : defaultFoods,
    meals: isMounted ? meals : [],
    favoriteFoodIds: isMounted ? favoriteFoodIds : [],
    settings: isMounted ? settings : defaultSettings,
    isMealBuilderOpen,
    setMealBuilderOpen,
    getFoodById,
    importFoods,
    addMeal,
    updateMeal,
    deleteMeal,
    toggleFavoriteFood,
    updateSettings,
    clearAllData,
    setFavoriteFoodIds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
