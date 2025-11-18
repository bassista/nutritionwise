import { IDataAdapter } from './IDataAdapter';
import { AppData } from '@/lib/types';
import { defaultFoods } from '@/lib/data';
import { defaultSettings } from '@/lib/settings';

const LOCAL_STORAGE_KEY = 'nutrition-wise-data';

const defaultShoppingLists = [
    { id: 'default-meals', name: 'Meals', items: [], isDeletable: false }
];

export class LocalStorageAdapter implements IDataAdapter {
  
  private getDefaultData(): AppData {
    return {
      foods: defaultFoods,
      categories: [],
      meals: [],
      favoriteFoodIds: [],
      settings: defaultSettings,
      dailyLogs: {},
      shoppingLists: defaultShoppingLists,
      userAchievements: [],
      categorySortOrders: {},
    };
  }
  
  async loadData(): Promise<AppData> {
    if (typeof window === 'undefined') {
      return this.getDefaultData();
    }
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        const parsedData = JSON.parse(item);
        // Ensure all top-level keys exist to prevent crashes after data model changes
        const defaultData = this.getDefaultData();
        const loadedData = {
          ...defaultData,
          ...parsedData,
          settings: {
            ...defaultData.settings,
            ...(parsedData.settings || {}),
            hydrationSettings: {
                ...defaultData.settings.hydrationSettings,
                ...(parsedData.settings?.hydrationSettings || {})
            }
          },
          // ensure dailyLogs has all potential fields
          dailyLogs: parsedData.dailyLogs || {}
        };
        // ensure each daily log entry has all fields
        for (const date in loadedData.dailyLogs) {
            loadedData.dailyLogs[date] = {
                ...loadedData.dailyLogs[date]
            };
        }
        return loadedData;
      }
      return this.getDefaultData();
    } catch (error) {
      console.error(`Error reading localStorage key “${LOCAL_STORAGE_KEY}”:`, error);
      return this.getDefaultData();
    }
  }

  async saveData(data: AppData): Promise<void> {
     if (typeof window === 'undefined') {
      return;
    }
    try {
      const dataToStore = JSON.stringify(data);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error(`Error setting localStorage key “${LOCAL_STORAGE_KEY}”:`, error);
    }
  }
}
