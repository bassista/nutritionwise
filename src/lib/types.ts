

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Category {
  id: string;
  name: { [key: string]: string };
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
    weight?: number;
    glucose?: number;
    insulin?: number;
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

export type MealSchedule = {
  [date: string]: string | null; // date: mealId
}


export interface AppData {
  foods: Food[];
  categories: Category[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  dailyLogs: DailyLog;
  shoppingLists: ShoppingList[];
  userAchievements: UserAchievement[];
  categorySortOrders: { [categoryName: string]: string[] };
  mealSchedule: MealSchedule;
  lastCheckedDateForMealLog?: string;
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
