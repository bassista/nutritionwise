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
}

export interface AppData {
  foods: Food[];
  meals: Meal[];
  favoriteFoodIds: string[];
  settings: AppSettings;
  locale: 'en' | 'it';
}

export type DeleteFoodResult = {
  success: boolean;
  conflictingMeals?: string[];
};
