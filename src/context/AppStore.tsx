
"use client";

import { create } from 'zustand';
import { AppData, Food, Meal, LoggedItem, MealType, ShoppingList, ShoppingListItem, NutritionalGoals, HydrationSettings, UserAchievement, AppSettings, DeleteFoodResult, Category } from '@/lib/types';
import { IDataAdapter } from '@/lib/adapters/IDataAdapter';
import { LocalStorageAdapter } from '@/lib/adapters/LocalStorageAdapter';
import { defaultFoods } from '@/lib/data';
import { defaultSettings } from '@/lib/settings';

const dataAdapter: IDataAdapter = new LocalStorageAdapter();

export type LogItemInput = { type: 'food' | 'meal', itemId: string, grams?: number };

export interface AppState extends AppData {
  // Actions
  // Food actions
  getFoodById: (id: string) => Food | undefined;
  addFood: (food: Food) => void;
  updateFood: (foodId: string, updates: Partial<Food>) => void;
  deleteFood: (foodId: string) => DeleteFoodResult;
  importFoods: (csvRows: { [key: string]: string }[]) => number;
  exportFoodsToCsv: () => string;
  
  // Category actions
  addCategory: (category: Category) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (categoryName: string, defaultCategoryName: string) => void;

  // Meal actions
  getMealById: (id: string) => Meal | undefined;
  addMeal: (meal: Meal) => void;
  updateMeal: (updatedMeal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  setMeals: (meals: Meal[]) => void;

  // Favorite actions
  toggleFavorite: (foodId: string) => void;
  setFavoriteFoodIds: (ids: string[]) => void;

  // DailyLog actions
  addLogEntry: (date: string, mealType: MealType, items: LogItemInput | LogItemInput[]) => void;
  updateLogEntry: (date: string, logId: string, updates: Partial<LoggedItem>) => void;
  removeLogEntry: (date: string, mealType: MealType, logId: string) => void;
  copyLogFromDate: (sourceDate: string, targetDate: string) => { success: boolean, message: string };
  clearLog: (date: string) => void;
  addWaterIntake: (date: string, amountMl: number) => void;
  updateWeight: (date: string, weight?: number) => void;
  updateGlucose: (date: string, glucose?: number) => void;
  updateInsulin: (date: string, insulin?: number) => void;
  
  // ShoppingList actions
  setShoppingLists: (updater: (lists: ShoppingList[]) => ShoppingList[]) => void;
  renameShoppingList: (listId: string, newName: string) => void;
  addShoppingListItem: (listId: string, item: { foodId: string } | { text: string }) => void;
  updateShoppingListItem: (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (listId: string, itemId: string) => void;
  toggleAllShoppingListItems: (listId: string, check: boolean) => void;
  addMealToShoppingList: (mealId: string) => void;
  addFoodToShoppingList: (foodId: string) => void;

  // Settings actions
  updateNutritionalGoals: (goals: NutritionalGoals) => void;
  updateHydrationSettings: (hydrationSettings: Partial<HydrationSettings>) => void;
  updateSettings: (newSettings: Partial<Omit<AppSettings, 'nutritionalGoals' | 'hydrationSettings'>>) => void;
  
  // Achievement actions
  setAchievements: (achievements: UserAchievement[]) => void;
  
  // AppData actions
  setAppData: (data: AppData) => void;
  load: () => Promise<void>;
  reset: () => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => {
    
    // Debounce saving
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = (data: AppData) => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            dataAdapter.saveData(data);
        }, 500); // Save 500ms after the last change
    };

    const setStateAndSave = (updater: (state: AppState) => Partial<AppState>) => {
        set((state) => {
            const changes = updater(state);
            const newState = { ...state, ...changes };
            debouncedSave(newState);
            return changes;
        });
    };
    
    const defaultShoppingLists = [
        { id: 'default-meals', name: 'Meals', items: [], isDeletable: false }
    ];

    return {
        // Initial State
        foods: [],
        categories: [],
        meals: [],
        favoriteFoodIds: [],
        dailyLogs: {},
        shoppingLists: [],
        userAchievements: [],
        settings: defaultSettings,

        // --- Food Actions ---
        getFoodById: (id: string) => get().foods.find(f => f.id === id),
        addFood: (food) => setStateAndSave(state => ({ foods: [...state.foods, food] })),
        updateFood: (foodId, updates) => setStateAndSave(state => ({
            foods: state.foods.map(f => (f.id === foodId ? { ...f, ...updates } : f)),
        })),
        deleteFood: (foodId) => {
            const { meals, favoriteFoodIds } = get();
            const conflictingMeals = meals.filter(m => m.foods.some(mf => mf.foodId === foodId));
            if (conflictingMeals.length > 0) {
                return { success: false, conflictingMeals: conflictingMeals.map(m => m.name) };
            }
            setStateAndSave(state => ({
                foods: state.foods.filter(f => f.id !== foodId),
                favoriteFoodIds: favoriteFoodIds.filter(id => id !== foodId),
            }));
            return { success: true };
        },
        importFoods: (csvRows) => {
            let newFoodsCount = 0;
            setStateAndSave(state => {
                 const foodsMap = new Map(state.foods.map(f => [f.id, f]));
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
                        calories: parseFloat(row.calories) || 0, protein: parseFloat(row.protein) || 0,
                        carbohydrates: parseFloat(row.carbohydrates) || 0, fat: parseFloat(row.fat) || 0,
                        fiber: parseFloat(row.fiber) || 0, sugar: parseFloat(row.sugar) || 0,
                        sodium: parseFloat(row.sodium) || 0, serving_size_g: parseInt(row.serving_size_g, 10) || 100,
                    };

                    const existingFood = foodsMap.get(row.id);
                    if (existingFood) {
                        foodsMap.set(row.id, { ...existingFood, ...newFoodData, name, category });
                    } else {
                        if (Object.keys(name).length === 0) return;
                        foodsMap.set(row.id, { id: row.id, name, category, ...newFoodData });
                        newFoodsCount++;
                    }
                });
                return { foods: Array.from(foodsMap.values()) };
            });
            return newFoodsCount;
        },
        exportFoodsToCsv: () => {
            const { foods } = get();
            const headers = ['id', 'serving_size_g', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'name_category'];
            
            const sanitize = (str: string | undefined) => (str || '').replace(/"/g, '""');

            const rows = foods.map(food => {
                const supportedLangs = ['en', 'it'];
                const nameCategoryPairs = supportedLangs
                    .map(lang => {
                        const name = food.name[lang];
                        const category = food.category?.[lang];
                        // Only include the pair if there's a name for that language
                        if (name) {
                            return `${lang}=${sanitize(name)}:${sanitize(category)}`;
                        }
                        return null;
                    })
                    .filter(Boolean) // Remove nulls for languages without a name
                    .join(';');

                const rowData = [
                    sanitize(food.id),
                    food.serving_size_g || 100,
                    food.calories || 0,
                    food.protein || 0,
                    food.carbohydrates || 0,
                    food.fat || 0,
                    food.fiber || 0,
                    food.sugar || 0,
                    food.sodium || 0,
                    `"${nameCategoryPairs}"` // Quote the entire field
                ];
                return rowData.join(',');
            });
            
            return [headers.join(','), ...rows].join('\n');
        },


        // --- Category Actions ---
        addCategory: (category) => setStateAndSave(state => ({
            categories: [...state.categories, category]
        })),
        renameCategory: (oldName, newName) => setStateAndSave(state => {
            const updatedCategories = state.categories.map(cat => {
                const newCatName = { ...cat.name };
                let nameChanged = false;
                Object.keys(newCatName).forEach(lang => {
                    if (newCatName[lang] === oldName) {
                        newCatName[lang] = newName;
                        nameChanged = true;
                    }
                });
                return nameChanged ? { ...cat, name: newCatName } : cat;
            });

            const updatedFoods = state.foods.map(food => {
                const newFoodCat = { ...food.category };
                let categoryChanged = false;
                Object.keys(newFoodCat).forEach(lang => {
                    if (newFoodCat[lang] === oldName) {
                        newFoodCat[lang] = newName;
                        categoryChanged = true;
                    }
                });
                return categoryChanged ? { ...food, category: newFoodCat } : food;
            });
            
            return { categories: updatedCategories, foods: updatedFoods };
        }),
        deleteCategory: (categoryName, defaultCategoryName) => setStateAndSave(state => {
            const updatedCategories = state.categories.filter(cat => Object.values(cat.name).every(name => name !== categoryName));

            const updatedFoods = state.foods.map(food => {
                 const newFoodCat = { ...food.category };
                let categoryChanged = false;
                Object.keys(newFoodCat).forEach(lang => {
                    if (newFoodCat[lang] === categoryName) {
                        newFoodCat[lang] = defaultCategoryName;
                        categoryChanged = true;
                    }
                });
                return categoryChanged ? { ...food, category: newFoodCat } : food;
            });

            return { categories: updatedCategories, foods: updatedFoods };
        }),
        
        // --- Meal Actions ---
        getMealById: (id) => get().meals.find(m => m.id === id),
        addMeal: (meal) => setStateAndSave(state => ({ meals: [...state.meals, meal] })),
        updateMeal: (updatedMeal) => setStateAndSave(state => ({
            meals: state.meals.map(m => (m.id === updatedMeal.id ? updatedMeal : m)),
        })),
        deleteMeal: (mealId) => setStateAndSave(state => ({ meals: state.meals.filter(m => m.id !== mealId) })),
        setMeals: (meals) => setStateAndSave(() => ({ meals })),

        // --- Favorite Actions ---
        toggleFavorite: (foodId) => setStateAndSave(state => ({
            favoriteFoodIds: state.favoriteFoodIds.includes(foodId)
                ? state.favoriteFoodIds.filter(id => id !== foodId)
                : [foodId, ...state.favoriteFoodIds],
        })),
        setFavoriteFoodIds: (ids) => setStateAndSave(() => ({ favoriteFoodIds: ids })),

        // --- DailyLog Actions ---
        addLogEntry: (date, mealType, items) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = { ...(newLogs[date] || {}) };
            
            const itemsArray = Array.isArray(items) ? items : [items];
            const newLogItems = itemsArray.map(itemInput => ({
                ...itemInput,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
            }));
    
            const updatedMealLog = [...(dayLog[mealType] || []), ...newLogItems];
            dayLog[mealType] = updatedMealLog;
            newLogs[date] = dayLog;
    
            return { dailyLogs: newLogs };
        }),
        updateLogEntry: (date, logId, updates) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date];
            if (!dayLog) return {};

            for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
                if (dayLog[mealType]) {
                    const itemIndex = dayLog[mealType]!.findIndex(item => item.id === logId);
                    if (itemIndex !== -1) {
                        const newMealLog = [...dayLog[mealType]!];
                        newMealLog[itemIndex] = { ...newMealLog[itemIndex], ...updates };
                        newLogs[date] = { ...dayLog, [mealType]: newMealLog };
                        break;
                    }
                }
            }
            return { dailyLogs: newLogs };
        }),
        removeLogEntry: (date, mealType, logId) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date] ? { ...newLogs[date] } : undefined;
        
            if (!dayLog || !dayLog[mealType]) {
                return {};
            }
        
            const updatedMealTypeLog = dayLog[mealType]!.filter(item => item.id !== logId);
            const newDayLog = { ...dayLog, [mealType]: updatedMealTypeLog };
        
            if (newDayLog[mealType]!.length === 0) {
                delete newDayLog[mealType];
            }
        
            newLogs[date] = newDayLog;
            return { dailyLogs: newLogs };
        }),
        copyLogFromDate: (sourceDate, targetDate) => {
            const { dailyLogs } = get();
            const sourceLog = dailyLogs[sourceDate];
            const sourceItems = sourceLog ? (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).flatMap(mt => sourceLog[mt] || []) : [];

            if (!sourceLog || sourceItems.length === 0) {
                return { success: false, message: 'noItemsToCopy' };
            }

            // Create new items with new IDs and timestamps
            const newItems = sourceItems.map(item => ({
                ...item,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
            }));
            
            setStateAndSave(state => {
                const newLogs = { ...state.dailyLogs };
                const targetDayLog = { ...(newLogs[targetDate] || {}) };

                // Clear existing items for the target date before copying
                targetDayLog.breakfast = [];
                targetDayLog.lunch = [];
                targetDayLog.dinner = [];
                targetDayLog.snack = [];

                // Assuming all copied items go into 'snack' for simplicity, or we could preserve meal types
                targetDayLog.snack = newItems;

                newLogs[targetDate] = targetDayLog;
                return { dailyLogs: newLogs };
            });

            return { success: true, message: 'Diary copied successfully.' };
        },
        clearLog: (date) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date];
            if (!dayLog) return {};

            const clearedDayLog = {
                waterIntakeMl: dayLog.waterIntakeMl,
                weight: dayLog.weight,
                glucose: dayLog.glucose,
                insulin: dayLog.insulin,
            };

            newLogs[date] = clearedDayLog;
            // Optionally remove the day if it's completely empty
            if (Object.keys(clearedDayLog).every(k => clearedDayLog[k as keyof typeof clearedDayLog] === undefined)) {
                delete newLogs[date];
            }

            return { dailyLogs: newLogs };
        }),
        addWaterIntake: (date, amountMl) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date] || {};
            newLogs[date] = { ...dayLog, waterIntakeMl: (dayLog.waterIntakeMl || 0) + amountMl };
            return { dailyLogs: newLogs };
        }),
        updateWeight: (date, weight) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date] || {};
            if (weight === undefined || weight <= 0) {
                delete dayLog.weight;
            } else {
                dayLog.weight = weight;
            }
            newLogs[date] = { ...dayLog };
            if (Object.keys(newLogs[date]).length === 0) delete newLogs[date];
            return { dailyLogs: newLogs };
        }),
        updateGlucose: (date, glucose) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date] || {};
            if (glucose === undefined || glucose <= 0) {
                delete dayLog.glucose;
            } else {
                dayLog.glucose = glucose;
            }
            newLogs[date] = { ...dayLog };
            if (Object.keys(newLogs[date]).length === 0) delete newLogs[date];
            return { dailyLogs: newLogs };
        }),
        updateInsulin: (date, insulin) => setStateAndSave(state => {
            const newLogs = { ...state.dailyLogs };
            const dayLog = newLogs[date] || {};
            if (insulin === undefined || insulin <= 0) {
                delete dayLog.insulin;
            } else {
                dayLog.insulin = insulin;
            }
            newLogs[date] = { ...dayLog };
            if (Object.keys(newLogs[date]).length === 0) delete newLogs[date];
            return { dailyLogs: newLogs };
        }),

        // --- ShoppingList Actions ---
        setShoppingLists: (updater) => setStateAndSave(state => ({ shoppingLists: updater(state.shoppingLists) })),
        renameShoppingList: (listId, newName) => setStateAndSave(state => ({
            shoppingLists: state.shoppingLists.map(list => list.id === listId ? { ...list, name: newName } : list),
        })),
        addShoppingListItem: (listId, item) => setStateAndSave(state => ({
            shoppingLists: state.shoppingLists.map(list => {
                if (list.id === listId) {
                    if (('foodId' in item && list.items.some(i => i.foodId === item.foodId)) || ('text' in item && list.items.some(i => i.text === item.text))) return list;
                    const newItem: ShoppingListItem = { id: `sli-${Date.now()}`, checked: false, ...item };
                    return { ...list, items: [...list.items, newItem] };
                }
                return list;
            }),
        })),
        updateShoppingListItem: (listId, itemId, updates) => setStateAndSave(state => ({
            shoppingLists: state.shoppingLists.map(list => {
                if (list.id === listId) {
                    return { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) };
                }
                return list;
            }),
        })),
        removeShoppingListItem: (listId, itemId) => setStateAndSave(state => ({
            shoppingLists: state.shoppingLists.map(list => {
                if (list.id === listId) {
                    return { ...list, items: list.items.filter(item => item.id !== itemId) };
                }
                return list;
            }),
        })),
        toggleAllShoppingListItems: (listId, check) => setStateAndSave(state => ({
            shoppingLists: state.shoppingLists.map(list => {
                if (list.id === listId) {
                    return { ...list, items: list.items.map(item => ({ ...item, checked: check })) };
                }
                return list;
            }),
        })),
        addMealToShoppingList: (mealId) => {
            const meal = get().getMealById(mealId);
            if (!meal) return;
            const listId = 'default-meals';
            setStateAndSave(state => ({
                shoppingLists: state.shoppingLists.map(list => {
                    if (list.id === listId) {
                        const existingFoodIds = new Set(list.items.map(i => i.foodId));
                        const newItems = meal.foods
                            .filter(mf => !existingFoodIds.has(mf.foodId))
                            .map(mf => ({ id: `sli-${Date.now()}-${mf.foodId}`, foodId: mf.foodId, checked: false }));
                        return { ...list, items: [...list.items, ...newItems] };
                    }
                    return list;
                }),
            }));
        },
        addFoodToShoppingList: (foodId: string) => {
            setStateAndSave(state => {
                const lists = [...state.shoppingLists];
                // Find the first deletable list, or the first list if none are deletable
                let targetList = lists.find(l => l.isDeletable);
                if (!targetList && lists.length > 0) {
                    targetList = lists[0];
                }
        
                if (targetList) {
                    const listIndex = lists.findIndex(l => l.id === targetList!.id);
                    const list = lists[listIndex];
                    
                    // Avoid duplicates
                    if (!list.items.some(item => item.foodId === foodId)) {
                        const newItem: ShoppingListItem = { id: `sli-${Date.now()}`, foodId, checked: false };
                        const updatedItems = [...list.items, newItem];
                        lists[listIndex] = { ...list, items: updatedItems };
                    }
                }
                return { shoppingLists: lists };
            });
        },

        // --- Settings Actions ---
        updateNutritionalGoals: (goals) => setStateAndSave(state => ({ settings: { ...state.settings, nutritionalGoals: goals } })),
        updateHydrationSettings: (hydrationSettings) => setStateAndSave(state => ({
            settings: { ...state.settings, hydrationSettings: { ...state.settings.hydrationSettings, ...hydrationSettings } },
        })),
        updateSettings: (newSettings) => setStateAndSave(state => ({ settings: { ...state.settings, ...newSettings }})),

        // --- Achievement Actions ---
        setAchievements: (achievements) => setStateAndSave(() => ({ userAchievements: achievements })),

        // --- AppData Actions ---
        setAppData: (data) => setStateAndSave(() => ({ ...data })),
        load: async () => {
            const data = await dataAdapter.loadData();
            // Seed categories from foods if categories are not present
            if (!data.categories || data.categories.length === 0) {
                const categorySet = new Map<string, { [key: string]: string }>();
                data.foods.forEach(food => {
                    if (food.category) {
                        const firstLang = Object.keys(food.category)[0];
                        if (firstLang) {
                            const catName = food.category[firstLang];
                            if (catName && !categorySet.has(catName)) {
                                categorySet.set(catName, food.category);
                            }
                        }
                    }
                });
                data.categories = Array.from(categorySet.values()).map((name, index) => ({
                    id: `cat-${index}-${Date.now()}`,
                    name,
                }));
            }
            set(data);
        },
        reset: async () => {
            const defaultData: AppData = {
                foods: defaultFoods,
                categories: [],
                meals: [],
                favoriteFoodIds: [],
                settings: defaultSettings,
                dailyLogs: {},
                shoppingLists: defaultShoppingLists,
                userAchievements: [],
            };
            await dataAdapter.saveData(defaultData);
            set(defaultData);
        },
    }
});

export default useAppStore;

    
