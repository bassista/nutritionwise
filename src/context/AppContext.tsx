
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult } from '@/lib/types';
import { useLocale, type Locale } from './LocaleContext';
import { getFoodName } from '@/lib/utils';
import { defaultFoods } from '@/lib/data';

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
  importFoods: (foodsFromCsv: { [key: string]: string }[]) => number;
  addFood: (food: Food) => void;
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

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

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

  return [storedValue, setValue];
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [foods, setFoods] = useLocalStorage<Food[]>('foods', defaultFoods);
  const [meals, setMeals] = useLocalStorage<Meal[]>('meals', []);
  const [favoriteFoodIds, setFavoriteFoodIds] = useLocalStorage<string[]>('favoriteFoodIds', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [mealBuilderContext, setMealBuilderContext] = useState<MealBuilderContext>('all');
  const { locale, setLocale } = useLocale();

  const getFoodById = useCallback((id: string) => foods.find(f => f.id === id), [foods]);

  const importFoods = useCallback((csvRows: { [key: string]: string }[]): number => {
    let newFoodsCount = 0;
    setFoods(currentFoods => {
      const foodsMap = new Map(currentFoods.map(f => [f.id, f]));
      
      for (const row of csvRows) {
        if (!row.id) continue;

        const name: { [key: string]: string } = {};
        const category: { [key: string]: string } = {};

        if (row.name_category) {
          row.name_category.split(';').forEach(pair => {
            const [langPart, valuePart] = pair.split('=');
            if (langPart && valuePart) {
              const [foodName, catName] = valuePart.split(':');
              if (foodName) name[langPart.trim()] = foodName.trim();
              if (catName) category[langPart.trim()] = catName.trim();
            }
          });
        }

        const existingFood = foodsMap.get(row.id);

        const newFoodData: Omit<Food, 'id' | 'name' | 'category'> = {
          calories: parseFloat(row.calories) || 0,
          protein: parseFloat(row.protein) || 0,
          carbohydrates: parseFloat(row.carbohydrates) || 0,
          fat: parseFloat(row.fat) || 0,
          fiber: parseFloat(row.fiber) || 0,
          sugar: parseFloat(row.sugar) || 0,
          sodium: parseFloat(row.sodium) || 0,
          serving_size_g: parseInt(row.serving_size_g, 10) || 100,
        };

        if (existingFood) {
          const updatedFood: Food = {
            ...existingFood,
            ...newFoodData,
            name: { ...existingFood.name, ...name },
            category: { ...existingFood.category, ...category },
          };
          foodsMap.set(row.id, updatedFood);
        } else {
          if (Object.keys(name).length === 0) continue;
          const newFood: Food = {
            id: row.id,
            name,
            category,
            ...newFoodData,
          };
          foodsMap.set(row.id, newFood);
          newFoodsCount++;
        }
      }
      return Array.from(foodsMap.values());
    });
    return newFoodsCount;
  }, [setFoods]);


  const addFood = useCallback((food: Food) => {
    setFoods(prevFoods => [...prevFoods, food]);
  }, [setFoods]);
  
  const updateFood = useCallback((foodId: string, updates: Partial<Food>) => {
    setFoods(prevFoods =>
      prevFoods.map(food =>
        food.id === foodId ? { ...food, ...updates } : food
      )
    );
  }, [setFoods]);

  const deleteFood = useCallback((foodId: string): DeleteFoodResult => {
    const conflictingMeals = meals.filter(meal => meal.foods.some(mf => mf.foodId === foodId)).map(meal => meal.name);
    
    if (conflictingMeals.length > 0) {
      return { success: false, conflictingMeals };
    }

    setFoods(prev => prev.filter(f => f.id !== foodId));
    setFavoriteFoodIds(prev => prev.filter(id => id !== foodId));
    
    return { success: true };
  }, [meals, setFoods, setFavoriteFoodIds]);

  const addMeal = useCallback((meal: Meal) => {
    setMeals(prev => [...prev, meal]);
  }, [setMeals]);

  const updateMeal = useCallback((updatedMeal: Meal) => {
    setMeals(prev => prev.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
  }, [setMeals]);

  const deleteMeal = useCallback((mealId: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
  }, [setMeals]);

  const toggleFavoriteFood = useCallback((foodId: string) => {
    setFavoriteFoodIds(prev =>
      prev.includes(foodId) ? prev.filter(id => id !== foodId) : [...prev, foodId]
    );
  }, [setFavoriteFoodIds]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);
  
  const clearAllData = useCallback(() => {
    setFoods(defaultFoods);
    setMeals([]);
    setFavoriteFoodIds([]);
    setSettings(defaultSettings);
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings]);

  const exportData = useCallback((): AppData => {
    return {
      foods,
      meals,
      favoriteFoodIds,
      settings,
      locale,
    };
  }, [foods, meals, favoriteFoodIds, settings, locale]);

  const importData = useCallback((data: AppData) => {
    if (data.foods) setFoods(data.foods);
    if (data.meals) setMeals(data.meals);
    if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
    if (data.settings) setSettings(data.settings);
    if (data.locale) setLocale(data.locale);
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings, setLocale]);

  const handleSetMealBuilderOpen = useCallback((isOpen: boolean, context: MealBuilderContext = 'all') => {
    setIsMealBuilderOpen(isOpen);
    if (isOpen) {
      setMealBuilderContext(context);
    } else {
      // Reset context when closing
      setTimeout(() => setMealBuilderContext('all'), 300);
    }
  }, []);

  const value = {
    foods,
    meals,
    favoriteFoodIds,
    settings,
    isMealBuilderOpen,
    mealBuilderContext,
    setMealBuilderOpen: handleSetMealBuilderOpen,
    getFoodById,
    importFoods,
    addFood,
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

    
