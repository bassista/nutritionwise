
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult, DailyLog, NutritionalGoals, MealType, LoggedItem, HydrationSettings } from '@/lib/types';
import { useLocale, type Locale } from './LocaleContext';
import { getFoodName } from '@/lib/utils';
import { defaultFoods } from '@/lib/data';
import { scheduleWaterReminders, cancelWaterReminders, requestNotificationPermission } from '@/lib/notifications';

type MealBuilderContext = 'all' | 'favorites';

interface AppContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  dailyLogs: DailyLog;
  isMealBuilderOpen: boolean;
  mealBuilderContext: MealBuilderContext;
  setMealBuilderOpen: (isOpen: boolean, context?: MealBuilderContext) => void;
  getFoodById: (id: string) => Food | undefined;
  getMealById: (id: string) => Meal | undefined;
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
  addLogEntry: (date: string, mealType: MealType, item: { type: 'food' | 'meal', itemId: string, grams?: number }) => void;
  removeLogEntry: (date: string, mealType: MealType, logId: string) => void;
  updateNutritionalGoals: (goals: NutritionalGoals) => void;
  exportFoodsToCsv: () => string;
  addWaterIntake: (date: string, amountMl: number) => void;
  updateHydrationSettings: (hydrationSettings: Partial<HydrationSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultGoals: NutritionalGoals = {
  calories: 2000,
  protein: 100,
  carbohydrates: 250,
  fat: 65,
  fiber: 30,
  sugar: 50,
  sodium: 2300,
};

const defaultHydrationSettings: HydrationSettings = {
  goalLiters: 2,
  glassSizeMl: 200,
  remindersEnabled: false,
  reminderIntervalMinutes: 120,
  reminderStartTime: '08:00',
  reminderEndTime: '20:00',
};

const defaultSettings: AppSettings = {
  foodsPerPage: 8,
  nutritionalGoals: defaultGoals,
  hydrationSettings: defaultHydrationSettings,
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        if (key === 'settings') {
            if (!parsedItem.nutritionalGoals) {
                parsedItem.nutritionalGoals = defaultGoals;
            }
            if (!parsedItem.hydrationSettings) {
                parsedItem.hydrationSettings = defaultHydrationSettings;
            }
        }
        setStoredValue(parsedItem);
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

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
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog>('dailyLogs', {});
  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [mealBuilderContext, setMealBuilderContext] = useState<MealBuilderContext>('all');
  const { locale, setLocale, t } = useLocale();

  const getFoodById = useCallback((id: string) => foods.find(f => f.id === id), [foods]);
  const getMealById = useCallback((id: string) => meals.find(m => m.id === id), [meals]);

  const addLogEntry = useCallback((date: string, mealType: MealType, item: { type: 'food' | 'meal', itemId: string, grams?: number }) => {
    const newLogItem: LoggedItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setDailyLogs(prevLogs => {
      const newLogs = { ...prevLogs };
      if (!newLogs[date]) {
        newLogs[date] = {};
      }
      if (!newLogs[date][mealType]) {
        newLogs[date][mealType] = [];
      }
      newLogs[date][mealType]!.push(newLogItem);
      return newLogs;
    });
  }, [setDailyLogs]);

  const removeLogEntry = useCallback((date: string, mealType: MealType, logId: string) => {
    setDailyLogs(prevLogs => {
      const newLogs = { ...prevLogs };
      if (newLogs[date] && newLogs[date][mealType]) {
        newLogs[date][mealType] = newLogs[date][mealType]!.filter(item => item.id !== logId);
        // Clean up empty arrays/objects
        if (newLogs[date][mealType]!.length === 0) {
          delete newLogs[date][mealType];
        }
        if (Object.keys(newLogs[date]).length === 0) {
          delete newLogs[date];
        }
      }
      return newLogs;
    });
  }, [setDailyLogs]);

  const addWaterIntake = useCallback((date: string, amountMl: number) => {
    setDailyLogs(prevLogs => {
        const newLogs = { ...prevLogs };
        if (!newLogs[date]) {
            newLogs[date] = {};
        }
        newLogs[date].waterIntakeMl = (newLogs[date].waterIntakeMl || 0) + amountMl;
        return newLogs;
    });
  }, [setDailyLogs]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);
  
  const updateHydrationSettings = useCallback(async (hydrationSettings: Partial<HydrationSettings>) => {
    const newHydrationSettings = { ...settings.hydrationSettings, ...hydrationSettings };
    updateSettings({ hydrationSettings: newHydrationSettings });

    if (newHydrationSettings.remindersEnabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        scheduleWaterReminders(newHydrationSettings, t);
      } else {
        // If permission denied, update the state to reflect that reminders are off
        updateSettings({ hydrationSettings: { ...newHydrationSettings, remindersEnabled: false } });
      }
    } else {
      cancelWaterReminders();
    }
  }, [settings.hydrationSettings, updateSettings, t]);

  const updateNutritionalGoals = useCallback((goals: NutritionalGoals) => {
    updateSettings({ nutritionalGoals: goals });
  }, [updateSettings]);

  const importFoods = useCallback((csvRows: { [key: string]: string }[]): number => {
    const foodsMap = new Map(foods.map(f => [f.id, f]));
    let newFoodsCount = 0;
    
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
    setFoods(Array.from(foodsMap.values()));
    return newFoodsCount;
  }, [foods, setFoods]);


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
    
    // Also remove from any diary logs
    setDailyLogs(prevLogs => {
      const newLogs = JSON.parse(JSON.stringify(prevLogs));
      Object.keys(newLogs).forEach(date => {
        Object.keys(newLogs[date]).forEach(mealType => {
          if (mealType !== 'waterIntakeMl') {
            newLogs[date][mealType as MealType] = newLogs[date][mealType as MealType]!.filter(
              (item: LoggedItem) => !(item.type === 'food' && item.itemId === foodId)
            );
            if (newLogs[date][mealType as MealType]!.length === 0) {
              delete newLogs[date][mealType as MealType];
            }
          }
        });
        if (Object.keys(newLogs[date]).length === 0) {
          delete newLogs[date];
        }
      });
      return newLogs;
    });

    return { success: true };
  }, [meals, setFoods, setFavoriteFoodIds, setDailyLogs]);

  const addMeal = useCallback((meal: Meal) => {
    setMeals(prev => [...prev, meal]);
  }, [setMeals]);

  const updateMeal = useCallback((updatedMeal: Meal) => {
    setMeals(prev => prev.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
  }, [setMeals]);

  const deleteMeal = useCallback((mealId: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
    // Also remove from any diary logs
     setDailyLogs(prevLogs => {
      const newLogs = JSON.parse(JSON.stringify(prevLogs));
      Object.keys(newLogs).forEach(date => {
        Object.keys(newLogs[date]).forEach(mealType => {
           if (mealType !== 'waterIntakeMl') {
            newLogs[date][mealType as MealType] = newLogs[date][mealType as MealType]!.filter(
              (item: LoggedItem) => !(item.type === 'meal' && item.itemId === mealId)
            );
            if (newLogs[date][mealType as MealType]!.length === 0) {
              delete newLogs[date][mealType as MealType];
            }
          }
        });
         if (Object.keys(newLogs[date]).length === 0) {
          delete newLogs[date];
        }
      });
      return newLogs;
    });
  }, [setMeals, setDailyLogs]);

  const toggleFavoriteFood = useCallback((foodId: string) => {
    setFavoriteFoodIds(prev =>
      prev.includes(foodId) ? prev.filter(id => id !== foodId) : [...prev, foodId]
    );
  }, [setFavoriteFoodIds]);
  
  const clearAllData = useCallback(() => {
    setFoods(defaultFoods);
    setMeals([]);
    setFavoriteFoodIds([]);
    setSettings(defaultSettings);
    setDailyLogs({});
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings, setDailyLogs]);

  const exportData = useCallback((): AppData => {
    return {
      foods,
      meals,
      favoriteFoodIds,
      settings,
      locale,
      dailyLogs,
    };
  }, [foods, meals, favoriteFoodIds, settings, locale, dailyLogs]);

  const importData = useCallback((data: AppData) => {
    if (data.foods) setFoods(data.foods);
    if (data.meals) setMeals(data.meals);
    if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
    if (data.settings) setSettings(data.settings);
    if (data.locale) setLocale(data.locale);
    if (data.dailyLogs) setDailyLogs(data.dailyLogs);
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings, setLocale, setDailyLogs]);

  const exportFoodsToCsv = useCallback((): string => {
    const headers = [
      'id','serving_size_g','calories','protein','carbohydrates','fat','fiber','sugar','sodium','name_category'
    ];

    const rows = foods.map(food => {
      const allLangs = new Set([...Object.keys(food.name), ...Object.keys(food.category || {})]);
      
      const nameCategoryPairs = Array.from(allLangs).map(lang => {
        const name = food.name[lang] || '';
        const category = food.category?.[lang] || '';
        return `${lang}=${name}:${category}`;
      }).join(';');
      
      const rowData = [
        food.id,
        food.serving_size_g || 100,
        food.calories || 0,
        food.protein || 0,
        food.carbohydrates || 0,
        food.fat || 0,
        food.fiber || 0,
        food.sugar || 0,
        food.sodium || 0,
        `"${nameCategoryPairs}"`
      ];
      return rowData.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }, [foods]);

  const handleSetMealBuilderOpen = useCallback((isOpen: boolean, context: MealBuilderContext = 'all') => {
    setIsMealBuilderOpen(isOpen);
    if (isOpen) {
      setMealBuilderContext(context);
    } else {
      // Reset context when closing
      setTimeout(() => setMealBuilderContext('all'), 300);
    }
  }, []);

  const value: AppContextType = {
    foods,
    meals,
    favoriteFoodIds,
    settings,
    dailyLogs,
    isMealBuilderOpen,
    mealBuilderContext,
    setMealBuilderOpen: handleSetMealBuilderOpen,
    getFoodById,
    getMealById,
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
    addLogEntry,
    removeLogEntry,
    updateNutritionalGoals,
    exportFoodsToCsv,
    addWaterIntake,
    updateHydrationSettings,
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
