
import { LoggedItem, Food, Meal } from './types';

type GetFoodById = (id: string) => Food | undefined;
type GetMealById = (id: string) => Meal | undefined;

export const calculateTotalNutrientsForItems = (
    items: LoggedItem[], 
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
                const totalMealGrams = meal.foods.reduce((acc, mf) => acc + mf.grams, 0);
                const mealFactor = (loggedItem.grams && totalMealGrams > 0) ? loggedItem.grams / totalMealGrams : 1;

                meal.foods.forEach(mealFood => {
                    const food = getFoodById(mealFood.foodId);
                    if (food) {
                        const foodFactorInMeal = mealFood.grams / (food.serving_size_g || 100);
                        const finalFactor = foodFactorInMeal * mealFactor;
                        
                        totals.calories += (food.calories || 0) * finalFactor;
                        totals.protein += (food.protein || 0) * finalFactor;
                        totals.carbohydrates += (food.carbohydrates || 0) * finalFactor;
                        totals.fat += (food.fat || 0) * finalFactor;
                        totals.fiber += (food.fiber || 0) * finalFactor;
                        totals.sugar += (food.sugar || 0) * finalFactor;
                        totals.sodium += (food.sodium || 0) * finalFactor;
                    }
                });
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
