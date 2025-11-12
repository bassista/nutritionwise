
"use client";

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Food, Meal, AppSettings, MealFood, AppData, DeleteFoodResult, DailyLog, NutritionalGoals, MealType, LoggedItem, HydrationSettings, ShoppingList, ShoppingListItem, UserAchievement, Badge } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import { scheduleWaterReminders, cancelWaterReminders, requestNotificationPermission } from '@/lib/notifications';
import { evaluateAchievements, allBadges } from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';
import { defaultGoals, defaultHydrationSettings } from '@/lib/settings';

// Hook for managing data in localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        let parsedItem = JSON.parse(item);
        // Migration/defaulting logic
        if (key === 'settings') {
            if (!parsedItem.nutritionalGoals) {
                parsedItem.nutritionalGoals = defaultGoals;
            }
             if (!parsedItem.hydrationSettings) {
                parsedItem.hydrationSettings = defaultHydrationSettings;
            }
        }
         if (key === 'shoppingLists' && (!Array.isArray(parsedItem) || parsedItem.length === 0 || !parsedItem.find(l => l.id === 'default-meals'))) {
            const mealsList = parsedItem.find(l => l.id === 'default-meals');
            if (!mealsList) {
                parsedItem.unshift({ id: 'default-meals', name: 'Pasti', items: [], isDeletable: false });
            } else if (mealsList.isDeletable !== false) {
                 mealsList.isDeletable = false;
            }
        }

        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};


export interface AppDataContextType {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  dailyLogs: DailyLog;
  shoppingLists: ShoppingList[];
  userAchievements: UserAchievement[];
  isMealBuilderOpen: boolean;
  mealBuilderContext: 'all' | 'favorites';
  setMealBuilderOpen: (isOpen: boolean, context?: 'all' | 'favorites') => void;
  getFoodById: (id: string) => Food | undefined;
  getMealById: (id: string) => Meal | undefined;
  importFoods: (csvRows: { [key: string]: string }[]) => number;
  addFood: (food: Food) => void;
  updateFood: (foodId: string, updates: Partial<Food>) => void;
  deleteFood: (foodId: string) => DeleteFoodResult;
  addMeal: (meal: Meal) => void;
  updateMeal: (updatedMeal: Meal) => void;
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
};

interface UseAppDataProps {
    defaultFoods: Food[];
    defaultSettings: AppSettings;
    defaultShoppingLists: ShoppingList[];
}

export const useAppData = ({ defaultFoods, defaultSettings, defaultShoppingLists }: UseAppDataProps): AppDataContextType => {
  const [foods, setFoods] = useLocalStorage<Food[]>('foods', defaultFoods);
  const [meals, setMeals] = useLocalStorage<Meal[]>('meals', []);
  const [favoriteFoodIds, setFavoriteFoodIds] = useLocalStorage<string[]>('favoriteFoodIds', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog>('dailyLogs', {});
  const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('shoppingLists', defaultShoppingLists);
  const [userAchievements, setUserAchievements] = useLocalStorage<UserAchievement[]>('userAchievements', []);

  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [mealBuilderContext, setMealBuilderContext] = useState<'all' | 'favorites'>('all');

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
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods]);


  const getFoodById = useCallback((id: string) => {
    return foods.find(f => f.id === id);
  }, [foods]);

  const getMealById = useCallback((id: string) => {
    return meals.find(m => m.id === id);
  }, [meals]);

  const addFood = (food: Food) => {
    setFoods(prev => [...prev, food]);
  };

  const updateFood = (foodId: string, updates: Partial<Food>) => {
    setFoods(prev => prev.map(f => (f.id === foodId ? { ...f, ...updates } : f)));
  };

  const deleteFood = (foodId: string): DeleteFoodResult => {
    const conflictingMeals = meals.filter(m => m.foods.some(mf => mf.foodId === foodId));
    if (conflictingMeals.length > 0) {
      return {
        success: false,
        conflictingMeals: conflictingMeals.map(m => m.name)
      };
    }
    setFoods(prev => prev.filter(f => f.id !== foodId));
    setFavoriteFoodIds(prev => prev.filter(id => id !== foodId));
    return { success: true };
  };

  const addMeal = (meal: Meal) => {
    setMeals(prev => [...prev, meal]);
  };

  const updateMeal = (updatedMeal: Meal) => {
    setMeals(prev => prev.map(m => (m.id === updatedMeal.id ? updatedMeal : m)));
  };

  const deleteMeal = (mealId: string) => {
    setMeals(prev => prev.filter(m => m.id !== mealId));
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
    setDailyLogs({});
    setShoppingLists(defaultShoppingLists);
    setUserAchievements([]);
  };

  const exportData = (): AppData => {
    return { foods, meals, favoriteFoodIds, settings, locale, dailyLogs, shoppingLists, userAchievements };
  };

  const importData = (data: AppData) => {
    if (data.foods) setFoods(data.foods);
    if (data.meals) setMeals(data.meals);
    if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
    if (data.settings) setSettings(data.settings);
    if (data.locale) setLocale(data.locale);
    if (data.dailyLogs) setDailyLogs(data.dailyLogs);
    if (data.shoppingLists) setShoppingLists(data.shoppingLists);
    if (data.userAchievements) setUserAchievements(data.userAchievements);
  };

  const importFoods = (csvRows: { [key: string]: string }[]): number => {
    const foodsMap = new Map(foods.map(f => [f.id, f]));
    let newFoodsCount = 0;
    
    csvRows.forEach(row => {
      if (!row.id || !row.name_category) return;
      
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
      
      const newFoodData = {
        calories: parseFloat(row.calories) || 0,
        protein: parseFloat(row.protein) || 0,
        carbohydrates: parseFloat(row.carbohydrates) || 0,
        fat: parseFloat(row.fat) || 0,
        fiber: parseFloat(row.fiber) || 0,
        sugar: parseFloat(row.sugar) || 0,
        sodium: parseFloat(row.sodium) || 0,
        serving_size_g: parseInt(row.serving_size_g, 10) || 100,
      };

      const existingFood = foodsMap.get(row.id);
      if (existingFood) {
        foodsMap.set(row.id, {
          ...existingFood,
          ...newFoodData,
          name: { ...existingFood.name, ...name },
          category: { ...existingFood.category, ...category },
        });
      } else {
        if(Object.keys(name).length === 0) return;
        foodsMap.set(row.id, {
          id: row.id,
          name,
          category,
          ...newFoodData,
        });
        newFoodsCount++;
      }
    });

    setFoods(Array.from(foodsMap.values()));
    return newFoodsCount;
  };
  
  const addLogEntry = useCallback((date: string, mealType: MealType, item: {type: 'food' | 'meal', itemId: string, grams?: number}) => {
    const newLogItem: LoggedItem = { ...item, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() };
    
    setDailyLogs(prev => {
        const newLogs = { ...prev };
        const dayLog = newLogs[date] || {};
        const mealLog = dayLog[mealType] || [];
        
        newLogs[date] = { ...dayLog, [mealType]: [...mealLog, newLogItem] };
        return newLogs;
    });
  }, [setDailyLogs]);

  const removeLogEntry = useCallback((date: string, mealType: MealType, logId: string) => {
    setDailyLogs(prev => {
      const newLogs = { ...prev };
      if (newLogs[date]?.[mealType]) {
        newLogs[date][mealType] = newLogs[date][mealType]!.filter(item => item.id !== logId);
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

  const updateNutritionalGoals = (goals: NutritionalGoals) => {
    updateSettings({ nutritionalGoals: goals });
  };
  
  const exportFoodsToCsv = (): string => {
    const headers = ['id', 'serving_size_g', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'name_category'];

    const rows = foods.map(food => {
        const allLangs = new Set([...Object.keys(food.name), ...Object.keys(food.category || {})]);
        
        const nameCategoryPairs = Array.from(allLangs).map(lang => {
            const name = food.name[lang] || '';
            const category = food.category?.[lang] || '';
            return `${lang}=${name}:${category}`;
        }).join(';');

        return [
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
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const addWaterIntake = useCallback((date: string, amountMl: number) => {
     setDailyLogs(prev => {
      const newLogs = { ...prev };
      const dayLog = newLogs[date] || {};
      newLogs[date] = { ...dayLog, waterIntakeMl: (dayLog.waterIntakeMl || 0) + amountMl };
      return newLogs;
    });
  }, [setDailyLogs]);
  
  const updateHydrationSettings = async (hydrationSettings: Partial<HydrationSettings>) => {
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
  };

  const createShoppingList = (name: string) => {
    const newList: ShoppingList = { id: `sl-${Date.now()}`, name, items: [], isDeletable: true };
    setShoppingLists(prev => [...prev, newList]);
  };
  
  const deleteShoppingList = (listId: string) => {
    setShoppingLists(prev => prev.filter(list => list.id !== listId));
  };
  
  const renameShoppingList = (listId: string, newName: string) => {
    setShoppingLists(prev => prev.map(list => list.id === listId ? { ...list, name: newName } : list));
  };
  
  const addShoppingListItem = (listId: string, item: { foodId: string } | { text: string }) => {
    const newItem: ShoppingListItem = { id: `sli-${Date.now()}`, checked: false, ...item };
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        if ('foodId' in item && list.items.some(i => i.foodId === item.foodId)) return list;
        if ('text' in item && list.items.some(i => i.text === item.text)) return list;
        return { ...list, items: [...list.items, newItem] };
      }
      return list;
    }));
  };
  
  const updateShoppingListItem = (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => {
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) };
      }
      return list;
    }));
  };

  const removeShoppingListItem = (listId: string, itemId: string) => {
    setShoppingLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.filter(item => item.id !== itemId) };
      }
      return list;
    }));
  };

  const toggleAllShoppingListItems = (listId: string, check: boolean) => {
    setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
            return { ...list, items: list.items.map(item => ({ ...item, checked: check })) };
        }
        return list;
    }));
  };
  
  const addMealToShoppingList = (mealId: string) => {
    const meal = getMealById(mealId);
    if (!meal) return;

    const listId = 'default-meals';
    
    setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
            const existingFoodIds = new Set(list.items.map(i => i.foodId));
            const newItems = meal.foods
                .filter(mf => !existingFoodIds.has(mf.foodId))
                .map(mf => ({ id: `sli-${Date.now()}-${mf.foodId}`, foodId: mf.foodId, checked: false }));
            
            return { ...list, items: [...list.items, ...newItems] };
        }
        return list;
    }));
  };

  const handleSetMealBuilderOpen = (isOpen: boolean, context: 'all' | 'favorites' = 'all') => {
      setIsMealBuilderOpen(isOpen);
      if (isOpen) {
          setMealBuilderContext(context);
      } else {
        setTimeout(() => setMealBuilderContext('all'), 300);
      }
  };

  return {
    foods,
    meals,
    favoriteFoodIds,
    settings,
    dailyLogs,
    shoppingLists,
    userAchievements,
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
    createShoppingList,
    deleteShoppingList,
    renameShoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    removeShoppingListItem,
    toggleAllShoppingListItems,
    addMealToShoppingList,
  };
}
