
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Food extends NutritionalInfo {
  id: string;
  name: { [key: string]: string };
  category: { [key: string]: string };
  serving_size_g?: number;
}

export interface MealFood {
  foodId: string;
  grams: number;
}

export interface Meal {
  id: string;
  name: string;
  foods: MealFood[];
}

export interface HydrationSettings {
  goalLiters: number;
  glassSizeMl: number;
  remindersEnabled: boolean;
  reminderIntervalMinutes: number;
  reminderStartTime: string; // "HH:mm"
  reminderEndTime: string; // "HH:mm"
}

export interface AppSettings {
  foodsPerPage: number;
  nutritionalGoals: NutritionalGoals;
  hydrationSettings: HydrationSettings;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LoggedItem {
  id: string; // unique id for the logged item
  type: 'food' | 'meal';
  itemId: string; // foodId or mealId
  grams?: number; // only for food type
  timestamp: number;
}

export interface DailyLog {
  [date: string]: { // ISO date string: YYYY-MM-DD
    [mealType in MealType]?: LoggedItem[];
    waterIntakeMl?: number;
  };
}

export interface NutritionalGoals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface ShoppingListItem {
    id: string;
    foodId?: string;
    text?: string;
    checked: boolean;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingListItem[];
    isDeletable: boolean;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
}

export interface UserAchievement {
    badgeId: string;
    date: string; // ISO string
}


export interface AppData {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  locale: 'en' | 'it';
  dailyLogs: DailyLog;
  shoppingLists: ShoppingList[];
  userAchievements: UserAchievement[];
}

export type DeleteFoodResult = {
  success: boolean;
  conflictingMeals?: string[];
};

export type AnalysisPeriod = 'last7days' | 'last30days' | 'all';

export interface Score {
    grade: string;
    percentage: number;
    color: string;
}
