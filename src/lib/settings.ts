

import { AppSettings, NutritionalGoals, HydrationSettings } from "./types";

export const defaultGoals: NutritionalGoals = {
  calories: 2000,
  protein: 100,
  carbohydrates: 250,
  fat: 65,
  fiber: 30,
  sugar: 50,
  sodium: 2300,
};

export const defaultHydrationSettings: HydrationSettings = {
  goalLiters: 2,
  glassSizeMl: 200,
};

export const defaultSettings: AppSettings = {
  foodsPerPage: 8,
  nutritionalGoals: defaultGoals,
  hydrationSettings: defaultHydrationSettings,
  lastCheckedDateForMealLog: undefined,
};
