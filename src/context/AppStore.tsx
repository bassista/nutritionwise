
"use client";

import { create } from 'zustand';
import { AppData, Food, Meal, LoggedItem, MealType, ShoppingList, ShoppingListItem, NutritionalGoals, HydrationSettings, UserAchievement, AppSettings, DeleteFoodResult } from '@/lib/types';
import { IDataAdapter } from '@/lib/adapters/IDataAdapter';
import { LocalStorageAdapter } from '@/lib/adapters/LocalStorageAdapter';
import { defaultFoods } from '@/lib/data';
import { defaultSettings } from '@/lib/settings';
import { arrayMove } from '@dnd-kit/sortable';

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

  // Meal actions
  getMealById: (id: string) => Meal | undefined;
  addMeal: (meal: Meal) => void;
  updateMeal: (updatedMeal: Meal) => void;
  deleteMeal: (mealId: string) => void;

  // Favorite actions
  toggleFavorite: (foodId: string) => void;
  setFavoriteFoodIds: (ids: string[]) => void;

  // DailyLog actions
  addLogEntry: (date: string, mealType: MealType, items: LogItemInput | LogItemInput[]) => void;
  removeLogEntry: (date: string, mealType: MealType, logId: string) => void;
  moveLogEntry: (date: string, activeId: string, overId: string) => void;
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
            const rows = foods.map(food => {
                const allLangs = new Set([...Object.keys(food.name), ...Object.keys(food.category || {})]);
                const nameCategoryPairs = Array.from(allLangs).map(lang => `${lang}=${food.name[lang] || ''}:${food.category?.[lang] || ''}`).join(';');
                return [food.id, food.serving_size_g || 100, food.calories || 0, food.protein || 0, food.carbohydrates || 0, food.fat || 0, food.fiber || 0, food.sugar || 0, food.sodium || 0, `"${nameCategoryPairs}"`].join(',');
            });
            return [headers.join(','), ...rows].join('\n');
        },
        
        // --- Meal Actions ---
        getMealById: (id) => get().meals.find(m => m.id === id),
        addMeal: (meal) => setStateAndSave(state => ({ meals: [...state.meals, meal] })),
        updateMeal: (updatedMeal) => setStateAndSave(state => ({
            meals: state.meals.map(m => (m.id === updatedMeal.id ? updatedMeal : m)),
        })),
        deleteMeal: (mealId) => setStateAndSave(state => ({ meals: state.meals.filter(m => m.id !== mealId) })),

        // --- Favorite Actions ---
        toggleFavorite: (foodId) => setStateAndSave(state => ({
            favoriteFoodIds: state.favoriteFoodIds.includes(foodId)
                ? state.favoriteFoodIds.filter(id => id !== foodId)
                : [foodId, ...state.favoriteFoodIds],
        })),
        setFavoriteFoodIds: (ids) => setStateAndSave(() => ({ favoriteFoodIds: ids })),

        // --- DailyLog Actions ---
        addLogEntry: (date, mealType, items) => setStateAndSave(state => {
            const itemsArray = Array.isArray(items) ? items : [items];
            if (itemsArray.length === 0) return {};

            const newLogs = { ...state.dailyLogs };
            const dayLog = { ...(newLogs[date] || {}) };
            
            const updatedItemsMap = new Map<string, LoggedItem>();
            const allCurrentItems = (Object.keys(dayLog) as MealType[])
                .filter(key => key !== 'waterIntakeMl' && key !== 'weight' && key !== 'glucose' && key !== 'insulin')
                .flatMap(key => dayLog[key] as LoggedItem[]);

            allCurrentItems.forEach(item => updatedItemsMap.set(item.id, item));

            const itemsToAdd: { item: LoggedItem; mealType: MealType }[] = [];

            itemsArray.forEach(itemInput => {
                if (itemInput.type === 'food') {
                    // Try to find if this food item already exists anywhere in the day's log
                    const existingEntry = allCurrentItems.find(logged => logged.type === 'food' && logged.itemId === itemInput.itemId);
                    
                    if (existingEntry) {
                        // Item exists, so update its grams by overwriting
                        const newGrams = itemInput.grams || 0;
                        updatedItemsMap.set(existingEntry.id, { ...existingEntry, grams: newGrams });
                    } else {
                        // Item doesn't exist, so add it to the list to be added
                        itemsToAdd.push({
                            item: {
                                ...itemInput,
                                id: `${Date.now()}-${Math.random()}`,
                                timestamp: Date.now(),
                            },
                            mealType: mealType
                        });
                    }
                } else { // For meals, we don't merge, just add
                    itemsToAdd.push({
                      item: {
                        ...itemInput,
                        id: `${Date.now()}-${Math.random()}`,
                        timestamp: Date.now(),
                      },
                      mealType: mealType
                    });
                }
            });

            // Reconstruct the day log from the map
            const newDayLog: { [key: string]: any } = {
              waterIntakeMl: dayLog.waterIntakeMl,
              weight: dayLog.weight,
              glucose: dayLog.glucose,
              insulin: dayLog.insulin,
            };
            
            updatedItemsMap.forEach((item, id) => {
              // Find original mealType. This is inefficient but necessary with the current data structure.
              // A better structure would be a single list of items with a mealType property on each item.
              let originalMealType: MealType = 'snack';
              for (const mt of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
                  if (dayLog[mt]?.some(i => i.id === id)) {
                      originalMealType = mt;
                      break;
                  }
              }
              if (!newDayLog[originalMealType]) newDayLog[originalMealType] = [];
              newDayLog[originalMealType].push(item);
            });
            
            // Add completely new items
            itemsToAdd.forEach(({ item, mealType: mt }) => {
                if (!newDayLog[mt]) newDayLog[mt] = [];
                newDayLog[mt].push(item);
            });

            newLogs[date] = newDayLog;

            return { dailyLogs: newLogs };
        }),
        removeLogEntry: (date, mealType, logId) => setStateAndSave(state => {
            const currentLogs = state.dailyLogs;
            const dayLog = currentLogs[date];

            if (!dayLog || !dayLog[mealType]) {
                return {}; // No changes if the log doesn't exist
            }

            // Create a new day log object for immutability
            const newDayLog = { ...dayLog };
            
            // Filter out the item to be removed
            newDayLog[mealType] = dayLog[mealType]!.filter(item => item.id !== logId);

            // If the meal type array is now empty, remove the meal type key
            if (newDayLog[mealType]!.length === 0) {
                delete newDayLog[mealType];
            }

            // Create a new dailyLogs object
            const newLogs = { ...currentLogs };

            // If the day log is now empty (only has keys we ignore or no keys), remove the date entry
            const remainingKeys = Object.keys(newDayLog).filter(k => k !== 'waterIntakeMl' && k !== 'weight' && k !== 'glucose' && k !== 'insulin');
            if (remainingKeys.length === 0) {
                delete newLogs[date];
            } else {
                newLogs[date] = newDayLog;
            }

            return { dailyLogs: newLogs };
        }),
        moveLogEntry: (date, activeId, overId) => setStateAndSave(state => {
            const dayLog = state.dailyLogs[date];
            if (!dayLog) return {};
        
            const allItems = (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
                .flatMap(mt => dayLog[mt] || [])
                .sort((a, b) => a.timestamp - b.timestamp);
        
            const oldIndex = allItems.findIndex(item => item.id === activeId);
            const newIndex = allItems.findIndex(item => item.id === overId);
        
            if (oldIndex === -1 || newIndex === -1) return {};
        
            const reorderedItems = arrayMove(allItems, oldIndex, newIndex);
        
            // Re-assign timestamps to preserve the new order
            const updatedItems = reorderedItems.map((item, index) => ({
                ...item,
                timestamp: Date.now() + index, // Ensure unique and ordered timestamps
            }));
        
            const newDayLog: typeof dayLog = {
                waterIntakeMl: dayLog.waterIntakeMl,
                weight: dayLog.weight,
                glucose: dayLog.glucose,
                insulin: dayLog.insulin,
            };

            // Distribute items back into their original meal types.
            // This simplification keeps them in their original meal categories but reorders them for display.
            // A better data model would have a single list with a `mealType` property on each item.
            const itemToMealTypeMap = new Map<string, MealType>();
            (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).forEach(mt => {
                dayLog[mt]?.forEach(item => itemToMealTypeMap.set(item.id, mt));
            });

            updatedItems.forEach(item => {
                const mealType = itemToMealTypeMap.get(item.id) || 'snack';
                if (!newDayLog[mealType]) {
                    newDayLog[mealType] = [];
                }
                newDayLog[mealType]!.push(item);
            });
        
            return { dailyLogs: { ...state.dailyLogs, [date]: newDayLog } };
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
            set(data);
        },
        reset: async () => {
            const defaultData: AppData = {
                foods: defaultFoods,
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

    