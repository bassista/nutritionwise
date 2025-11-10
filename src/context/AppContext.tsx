"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultFoods } from '@/lib/data';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult } from '@/lib/types';
import { useLocale, type Locale } from './LocaleContext';
import { getFoodName } from '@/lib/utils';

type MealBuilderContext = 'all' | 'favorites';

interface AppContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  isMealBuilderOpen: boolean;
  mealBuilderContext: MealBuilderContext;
  setMealBuilderOpen: (isOpen: boolean, context?: MealBuilderContext) => void;
  getFoodById: (id: string) => Food | undefined;
  importFoods: (newFoods: Partial<Food>[]) => number;
  updateFood: (foodId: string, updates: Partial<Food>) => void;
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
        const parsed = JSON.parse(item);
        // Basic migration for food names from string to object
        if (key === 'foods' && Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].name === 'string') {
            const migratedFoods = parsed.map((food: any) => {
              if (typeof food.name === 'string') {
                return { ...food, name: { en: food.name } };
              }
              return food;
            });
            setStoredValue(migratedFoods as T);
            window.localStorage.setItem(key, JSON.stringify(migratedFoods));
            return;
        }
        setStoredValue(parsed);
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, initialValue]);

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
  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [mealBuilderContext, setMealBuilderContext] = useState<MealBuilderContext>('all');
  const [isMounted, setIsMounted] = useState(false);
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const getFoodById = (id: string) => foods.find(f => f.id === id);

  const importFoods = (foodsFromCsv: Partial<Food>[]): number => {
    let newFoodsCount = 0;

    setFoods(currentFoods => {
        const currentFoodsMap = new Map(currentFoods.map(f => [f.id, f]));

        foodsFromCsv.forEach(csvFoodRow => {
            const csvFood = csvFoodRow as any;
            if (!csvFood.id) return;

            const nameObject: { [key in Locale]?: string } = {};
            if (csvFood.name_en) nameObject.en = csvFood.name_en;
            if (csvFood.name_it) nameObject.it = csvFood.name_it;
            
            // Fallback to 'name' column for backward compatibility or simple cases
            if (Object.keys(nameObject).length === 0 && csvFood.name) {
                nameObject.en = csvFood.name; // Assume 'name' is English as a default
            }

            if (Object.keys(nameObject).length === 0) return;

            const existingFood = currentFoodsMap.get(csvFood.id);
            
            const newFoodData: Partial<Food> = { ...csvFood };
            delete (newFoodData as any).name_en;
            delete (newFoodData as any).name_it;
            delete (newFoodData as any).name;

            if (existingFood) {
                const mergedName = typeof existingFood.name === 'object'
                    ? { ...existingFood.name, ...nameObject }
                    : nameObject;
                
                const updatedFood: Food = {
                    ...existingFood,
                    ...newFoodData,
                    name: mergedName,
                };
                currentFoodsMap.set(csvFood.id, updatedFood);
            } else {
                const newFood: Food = {
                    id: csvFood.id,
                    name: nameObject,
                    calories: 0,
                    protein: 0,
                    carbohydrates: 0,
                    fat: 0,
                    ...newFoodData,
                };
                currentFoodsMap.set(csvFood.id, newFood);
                newFoodsCount++;
            }
        });

        return Array.from(currentFoodsMap.values());
    });

    return newFoodsCount;
  };
  
  const updateFood = (foodId: string, updates: Partial<Food>) => {
    setFoods(prevFoods =>
      prevFoods.map(food =>
        food.id === foodId ? { ...food, ...updates } : food
      )
    );
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

  const handleSetMealBuilderOpen = (isOpen: boolean, context: MealBuilderContext = 'all') => {
    setIsMealBuilderOpen(isOpen);
    if (isOpen) {
      setMealBuilderContext(context);
    } else {
      // Reset context when closing
      setTimeout(() => setMealBuilderContext('all'), 300);
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
    mealBuilderContext,
    setMealBuilderOpen: handleSetMealBuilderOpen,
    getFoodById,
    importFoods,
    updateFood,
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
