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

export interface AppSettings {
  foodsPerPage: number;
  nutritionalGoals: NutritionalGoals;
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

export interface AppData {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  locale: 'en' | 'it';
  dailyLogs: DailyLog;
}

export type DeleteFoodResult = {
  success: boolean;
  conflictingMeals?: string[];
};

export type AnalysisPeriod = 'last7days' | 'last30days';
