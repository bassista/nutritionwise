
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Food, LoggedItem, Meal } from './types';
import type { Locale } from '@/context/LocaleContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFoodName = (food: Food, locale: Locale): string => {
    return food.name[locale] || food.name['en'] || food.id;
};

export const getCategoryName = (food: Food, locale: Locale, t: (key: string) => string): string => {
  if (!food.category || (!food.category[locale] && !food.category['en'])) {
    return t('Uncategorized');
  }
  return food.category[locale] || food.category['en'] || t('Uncategorized');
};


type GetFoodById = (id: string) => Food | undefined;
type GetMealById = (id: string) => Meal | undefined;

export const calculateTotalNutrientsForItems = (
    items: (LoggedItem | { type: 'food', itemId: string, grams?: number })[],
    getFoodById: GetFoodById, 
    getMealById: GetMealById
) => {
    const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    items.forEach(loggedItem => {
        if (loggedItem.type === 'food') {
            const food = getFoodById(loggedItem.itemId);
            if (food) {
                const factor = (loggedItem.grams || food.serving_size_g || 100) / (food.serving_size_g || 100);
                totals.calories += (food.calories || 0) * factor;
                totals.protein += (food.protein || 0) * factor;
                totals.carbohydrates += (food.carbohydrates || 0) * factor;
                totals.fat += (food.fat || 0) * factor;
                totals.fiber += (food.fiber || 0) * factor;
                totals.sugar += (food.sugar || 0) * factor;
                totals.sodium += (food.sodium || 0) * factor;
            }
        } else if (loggedItem.type === 'meal') {
            const meal = getMealById(loggedItem.itemId);
            if (meal) {
                const mealNutrients = calculateTotalNutrientsForMeal(meal, getFoodById);
                totals.calories += mealNutrients.calories;
                totals.protein += mealNutrients.protein;
                totals.carbohydrates += mealNutrients.carbohydrates;
                totals.fat += mealNutrients.fat;
                totals.fiber += mealNutrients.fiber;
                totals.sugar += mealNutrients.sugar;
                totals.sodium += mealNutrients.sodium;
            }
        }
    });
    return totals;
};

export const calculateTotalNutrientsForMeal = (meal: Meal, getFoodById: GetFoodById) => {
    const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    meal.foods.forEach(mealFood => {
        const food = getFoodById(mealFood.foodId);
        if (food) {
            const factor = mealFood.grams / (food.serving_size_g || 100);
            totals.calories += (food.calories || 0) * factor;
            totals.protein += (food.protein || 0) * factor;
            totals.carbohydrates += (food.carbohydrates || 0) * factor;
            totals.fat += (food.fat || 0) * factor;
            totals.fiber += (food.fiber || 0) * factor;
            totals.sugar += (food.sugar || 0) * factor;
            totals.sodium += (food.sodium || 0) * factor;
        }
    });
    return totals;
};
