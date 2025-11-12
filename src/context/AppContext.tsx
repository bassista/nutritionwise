
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult, DailyLog, NutritionalGoals, MealType, LoggedItem, HydrationSettings, ShoppingList, ShoppingListItem, UserAchievement, Badge } from '@/lib/types';
import { useLocale, type Locale } from './LocaleContext';
import { getFoodName } from '@/lib/utils';
import { defaultFoods } from '@/lib/data';
import { scheduleWaterReminders, cancelWaterReminders, requestNotificationPermission } from '@/lib/notifications';
import { evaluateAchievements, allBadges } from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';

type MealBuilderContext = 'all' | 'favorites';

interface AppContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  dailyLogs: DailyLog;
  shoppingLists: ShoppingList[];
  userAchievements: UserAchievement[];
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
  createShoppingList: (name: string) => void;
  deleteShoppingList: (listId: string) => void;
  renameShoppingList: (listId: string, newName: string) => void;
  addShoppingListItem: (listId: string, item: { foodId: string } | { text: string }) => void;
  updateShoppingListItem: (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (listId: string, itemId: string) => void;
  toggleAllShoppingListItems: (listId: string, check: boolean) => void;
  addMealToShoppingList: (mealId: string) => void;
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

const defaultShoppingLists: ShoppingList[] = [
    { id: 'default-meals', name: 'Pasti', items: [], isDeletable: false }
];

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
        let parsedItem = JSON.parse(item);
         if (key === 'settings') {
            if (!parsedItem.nutritionalGoals) parsedItem.nutritionalGoals = defaultGoals;
            if (!parsedItem.hydrationSettings) parsedItem.hydrationSettings = defaultHydrationSettings;
        }
        if (key === 'shoppingLists' && (!Array.isArray(parsedItem) || parsedItem.length === 0 || !parsedItem.find(l => l.id === 'default-meals'))) {
            const mealsList = parsedItem.find(l => l.id === 'default-meals');
            if (!mealsList) {
                parsedItem.unshift(defaultShoppingLists[0]);
            } else if (mealsList.isDeletable !== false) {
                 mealsList.isDeletable = false;
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
  const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('shoppingLists', defaultShoppingLists);
  const [userAchievements, setUserAchievements] = useLocalStorage<UserAchievement[]>('userAchievements', []);
  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [mealBuilderContext, setMealBuilderContext] = useState<MealBuilderContext>('all');
  const { locale, setLocale, t } = useLocale();
  const { toast } = useToast();

  // Gamification check
  useEffect(() => {
    const earnedBadgeIds = new Set(userAchievements.map(a => a.badgeId));
    const newAchievements = evaluateAchievements(
        { dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods },
        allBadges,
        earnedBadgeIds
    );
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...userAchievements, ...newAchievements];
      setUserAchievements(updatedAchievements);
      
      newAchievements.forEach(achievement => {
        const badge = allBadges.find(b => b.id === achievement.badgeId);
        if (badge) {
          toast({
            title: `${t('Achievement Unlocked!')} 🎉`,
            description: t(badge.name),
          });
          // Here you could also send a system notification if permission is granted
        }
      });
    }
  }, [dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods, userAchievements, setUserAchievements, t, toast]);

  const getFoodById = useCallback((id: string) => foods.find(f => f.id === id), [foods]);
  const getMealById = useCallback((id: string) => meals.find(m => m.id === id), [meals]);

  // Shopping List Functions
  const createShoppingList = useCallback((name: string) => {
    const newList: ShoppingList = {
      id: `sl-${Date.now()}`,
      name,
      items: [],
      isDeletable: true,
    };
    setShoppingLists(prev => [...prev, newList]);
  }, [setShoppingLists]);

  const deleteShoppingList = useCallback((listId: string) => {
    setShoppingLists(prev => prev.filter(list => list.id !== listId));
  }, [setShoppingLists]);
  
  const renameShoppingList = useCallback((listId: string, newName: string) => {
    setShoppingLists(prev => prev.map(list => list.id === listId ? { ...list, name: newName } : list));
  }, [setShoppingLists]);

  const addShoppingListItem = useCallback((listId: string, item: { foodId: string } | { text: string }) => {
    const newItem: ShoppingListItem = {
      id: `sli-${Date.now()}`,
      checked: false,
      ...item
    };
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        // Prevent duplicates
        if ('foodId' in item && list.items.some(i => i.foodId === item.foodId)) return list;
        if ('text' in item && list.items.some(i => i.text === item.text)) return list;
        return { ...list, items: [...list.items, newItem] };
      }
      return list;
    }));
  }, [setShoppingLists]);

  const updateShoppingListItem = useCallback((listId: string, itemId: string, updates: Partial<ShoppingListItem>) => {
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) };
      }
      return list;
    }));
  }, [setShoppingLists]);
  
  const removeShoppingListItem = useCallback((listId: string, itemId: string) => {
    setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
            return { ...list, items: list.items.filter(item => item.id !== itemId) };
        }
        return list;
    }));
  }, [setShoppingLists]);

  const toggleAllShoppingListItems = useCallback((listId: string, check: boolean) => {
    setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
            return { ...list, items: list.items.map(item => ({ ...item, checked: check })) };
        }
        return list;
    }));
  }, [setShoppingLists]);

  const addMealToShoppingList = useCallback((mealId: string) => {
    const meal = getMealById(mealId);
    if (!meal) return;
    const listId = 'default-meals';
    
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        const existingFoodIds = new Set(list.items.map(i => i.foodId));
        const newItems = meal.foods
          .filter(mf => !existingFoodIds.has(mf.foodId))
          .map(mf => ({
            id: `sli-${Date.now()}-${mf.foodId}`,
            foodId: mf.foodId,
            checked: false
          }));
        return { ...list, items: [...list.items, ...newItems] };
      }
      return list;
    }));
  }, [getMealById, setShoppingLists]);


  // Log Functions
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
        if (newLogs[date][mealType]!.length === 0) delete newLogs[date][mealType];
        if (Object.keys(newLogs[date]).length === 0) delete newLogs[date];
      }
      return newLogs;
    });
  }, [setDailyLogs]);

  const addWaterIntake = useCallback((date: string, amountMl: number) => {
    setDailyLogs(prevLogs => {
        const newLogs = { ...prevLogs };
        if (!newLogs[date]) newLogs[date] = {};
        newLogs[date].waterIntakeMl = (newLogs[date].waterIntakeMl || 0) + amountMl;
        return newLogs;
    });
  }, [setDailyLogs]);

  // Settings Functions
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
        updateSettings({ hydrationSettings: { ...newHydrationSettings, remindersEnabled: false } });
      }
    } else {
      cancelWaterReminders();
    }
  }, [settings.hydrationSettings, updateSettings, t]);

  const updateNutritionalGoals = useCallback((goals: NutritionalGoals) => {
    updateSettings({ nutritionalGoals: goals });
  }, [updateSettings]);

  // Data Import/Export and Management
  const importFoods = useCallback((csvRows: { [key: string]: string }[]): number => {
    const foodsMap = new Map(foods.map(f => [f.id, f]));
    let newFoodsCount = 0;
    
    for (const row of csvRows) {
      if (!row.id || !row.name_category) continue;

      const name: { [key: string]: string } = {};
      const category: { [key: string]: string } = {};

      row.name_category.split(';').forEach(pair => {
          const [langPart, valuePart] = pair.split('=');
          if (langPart && valuePart) {
              const [foodName, catName] = valuePart.split(':');
              if (foodName) name[langPart.trim()] = foodName.trim();
              if (catName) category[langPart.trim()] = catName.trim();
          }
      });

      const existingFood = foodsMap.get(row.id);
      const newFoodData: Omit<Food, 'id' | 'name' | 'category'> = {
        calories: parseFloat(row.calories) || 0, protein: parseFloat(row.protein) || 0,
        carbohydrates: parseFloat(row.carbohydrates) || 0, fat: parseFloat(row.fat) || 0,
        fiber: parseFloat(row.fiber) || 0, sugar: parseFloat(row.sugar) || 0,
        sodium: parseFloat(row.sodium) || 0, serving_size_g: parseInt(row.serving_size_g, 10) || 100,
      };

      if (existingFood) {
        foodsMap.set(row.id, { ...existingFood, ...newFoodData, name: { ...existingFood.name, ...name }, category: { ...existingFood.category, ...category } });
      } else {
        if (Object.keys(name).length === 0) continue;
        foodsMap.set(row.id, { id: row.id, name, category, ...newFoodData });
        newFoodsCount++;
      }
    }
    setFoods(Array.from(foodsMap.values()));
    return newFoodsCount;
  }, [foods, setFoods]);

  const addFood = useCallback((food: Food) => setFoods(prev => [...prev, food]), [setFoods]);
  const updateFood = useCallback((foodId: string, updates: Partial<Food>) => setFoods(prev => prev.map(f => f.id === foodId ? { ...f, ...updates } : f)), [setFoods]);

  const deleteFood = useCallback((foodId: string): DeleteFoodResult => {
    const conflictingMeals = meals.filter(m => m.foods.some(mf => mf.foodId === foodId)).map(m => m.name);
    if (conflictingMeals.length > 0) return { success: false, conflictingMeals };

    setFoods(prev => prev.filter(f => f.id !== foodId));
    setFavoriteFoodIds(prev => prev.filter(id => id !== foodId));
    setDailyLogs(prev => { /* ... remove food from logs ... */ return prev; });
    return { success: true };
  }, [meals, setFoods, setFavoriteFoodIds, setDailyLogs]);

  const addMeal = useCallback((meal: Meal) => setMeals(prev => [...prev, meal]), [setMeals]);
  const updateMeal = useCallback((updatedMeal: Meal) => setMeals(prev => prev.map(m => m.id === updatedMeal.id ? updatedMeal : m)), [setMeals]);
  const deleteMeal = useCallback((mealId: string) => { /* ... same as before ... */ }, [setMeals, setDailyLogs]);

  const toggleFavoriteFood = useCallback((foodId: string) => setFavoriteFoodIds(prev => prev.includes(foodId) ? prev.filter(id => id !== foodId) : [...prev, foodId]), [setFavoriteFoodIds]);
  
  const clearAllData = useCallback(() => {
    setFoods(defaultFoods); setMeals([]); setFavoriteFoodIds([]);
    setSettings(defaultSettings); setDailyLogs({}); setShoppingLists(defaultShoppingLists);
    setUserAchievements([]);
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings, setDailyLogs, setShoppingLists, setUserAchievements]);

  const exportData = useCallback((): AppData => ({
    foods, meals, favoriteFoodIds, settings, locale, dailyLogs, shoppingLists, userAchievements
  }), [foods, meals, favoriteFoodIds, settings, locale, dailyLogs, shoppingLists, userAchievements]);

  const importData = useCallback((data: AppData) => {
    if (data.foods) setFoods(data.foods); if (data.meals) setMeals(data.meals);
    if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
    if (data.settings) setSettings(data.settings); if (data.locale) setLocale(data.locale);
    if (data.dailyLogs) setDailyLogs(data.dailyLogs);
    if (data.shoppingLists) setShoppingLists(data.shoppingLists);
    if (data.userAchievements) setUserAchievements(data.userAchievements);
  }, [setFoods, setMeals, setFavoriteFoodIds, setSettings, setLocale, setDailyLogs, setShoppingLists, setUserAchievements]);

  const exportFoodsToCsv = useCallback((): string => {
    const headers = ['id','serving_size_g','calories','protein','carbohydrates','fat','fiber','sugar','sodium','name_category'];
    const rows = foods.map(food => {
      const allLangs = new Set([...Object.keys(food.name), ...Object.keys(food.category || {})]);
      const nameCategoryPairs = Array.from(allLangs).map(lang => `${lang}=${food.name[lang] || ''}:${food.category?.[lang] || ''}`).join(';');
      const rowData = [ food.id, food.serving_size_g || 100, food.calories || 0, food.protein || 0, food.carbohydrates || 0, food.fat || 0, food.fiber || 0, food.sugar || 0, food.sodium || 0, `"${nameCategoryPairs}"` ];
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [foods]);

  const handleSetMealBuilderOpen = useCallback((isOpen: boolean, context: MealBuilderContext = 'all') => {
    setIsMealBuilderOpen(isOpen);
    if (isOpen) setMealBuilderContext(context);
    else setTimeout(() => setMealBuilderContext('all'), 300);
  }, []);

  const value: AppContextType = {
    foods, meals, favoriteFoodIds, settings, dailyLogs, shoppingLists, userAchievements,
    isMealBuilderOpen, mealBuilderContext, setMealBuilderOpen: handleSetMealBuilderOpen,
    getFoodById, getMealById, importFoods, addFood, updateFood, deleteFood, addMeal, updateMeal, deleteMeal,
    toggleFavoriteFood, updateSettings, clearAllData, setFavoriteFoodIds, setMeals, exportData, importData,
    addLogEntry, removeLogEntry, updateNutritionalGoals, exportFoodsToCsv, addWaterIntake, updateHydrationSettings,
    createShoppingList, deleteShoppingList, renameShoppingList, addShoppingListItem, updateShoppingListItem, removeShoppingListItem,
    toggleAllShoppingListItems, addMealToShoppingList
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
