"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultFoods } from '@/lib/data';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult } from '@/lib/types';
import { useLocale } from './LocaleContext';

interface AppContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  isMealBuilderOpen: boolean;
  setMealBuilderOpen: (isOpen: boolean) => void;
  getFoodById: (id: string) => Food | undefined;
  importFoods: (newFoods: Food[]) => void;
  deleteFood: (foodId: string) => DeleteFoodResult;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  toggleFavoriteFood: (foodId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  clearAllData: () => void;
  setFavoriteFoodIds: React.Dispatch<React.SetStateAction<string[]>>;
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  exportData: () => AppData;
  importData: (data: AppData) => void;
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
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
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
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const getFoodById = (id: string) => foods.find(f => f.id === id);

  const importFoods = (newFoods: Food[]) => {
    const existingIds = new Set(foods.map(f => f.id));
    const uniqueNewFoods = newFoods.filter(f => !existingIds.has(f.id));
    setFoods(prev => [...prev, ...uniqueNewFoods]);
  };
  
  const deleteFood = (foodId: string): DeleteFoodResult => {
    const conflictingMeals = meals.filter(meal => meal.foods.some(mf => mf.foodId === foodId)).map(meal => meal.name);
    
    if (conflictingMeals.length > 0) {
      return { success: false, conflictingMeals };
    }

    setFoods(prev => prev.filter(f => f.id !== foodId));
    setFavoriteFoodIds(prev => prev.filter(id => id !== foodId));
    
    return { success: true };
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
        window.localStorage.setItem('foods', JSON.stringify(defaultFoods));
        window.localStorage.setItem('meals', JSON.stringify([]));
        window.localStorage.setItem('favoriteFoodIds', JSON.stringify([]));
        window.localStorage.setItem('settings', JSON.stringify(defaultSettings));
    }
  };

  const exportData = (): AppData => {
    return {
      foods,
      meals,
      favoriteFoodIds,
      settings,
      locale,
    };
  };

  const importData = (data: AppData) => {
    if (data.foods) setFoods(data.foods);
    if (data.meals) setMeals(data.meals);
    if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
    if (data.settings) setSettings(data.settings);
    if (data.locale) setLocale(data.locale);
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
    deleteFood,
    addMeal,
    updateMeal,
    deleteMeal,
    toggleFavoriteFood,
    updateSettings,
    clearAllData,
    setFavoriteFoodIds,
    setMeals,
    exportData,
    importData,
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
