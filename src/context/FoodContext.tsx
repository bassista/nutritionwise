
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Food } from '@/lib/types';
import { defaultFoods } from '@/lib/data';
import { useMeals } from './MealContext';
import { useFavorites } from './FavoriteContext';

interface FoodContextType {
    foods: Food[];
    setFoods: (foods: Food[]) => void;
    getFoodById: (id: string) => Food | undefined;
    addFood: (food: Food) => void;
    updateFood: (foodId: string, updates: Partial<Food>) => void;
    deleteFood: (foodId: string) => { success: boolean; conflictingMeals?: string[] };
    importFoods: (csvRows: { [key: string]: string }[]) => number;
    exportFoodsToCsv: () => string;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export const FoodProvider = ({ children }: { children: ReactNode }) => {
    const [foods, setFoods] = useLocalStorage<Food[]>('foods', defaultFoods);
    const { meals } = useMeals(); // Dependency for deleteFood
    const { setFavoriteFoodIds } = useFavorites(); // Dependency for deleteFood

    const getFoodById = useCallback((id: string) => foods.find(f => f.id === id), [foods]);

    const addFood = (food: Food) => {
        setFoods(prev => [...prev, food]);
    };

    const updateFood = (foodId: string, updates: Partial<Food>) => {
        setFoods(prev => prev.map(f => (f.id === foodId ? { ...f, ...updates } : f)));
    };
    
    const deleteFood = (foodId: string) => {
        const conflictingMeals = meals.filter(m => m.foods.some(mf => mf.foodId === foodId));
        if (conflictingMeals.length > 0) {
            return { success: false, conflictingMeals: conflictingMeals.map(m => m.name) };
        }
        setFoods(prev => prev.filter(f => f.id !== foodId));
        setFavoriteFoodIds(prev => prev.filter(id => id !== foodId));
        return { success: true };
    };

    const importFoods = (csvRows: { [key: string]: string }[]) => {
        const foodsMap = new Map(foods.map(f => [f.id, f]));
        let newFoodsCount = 0;
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
                calories: parseFloat(row.calories) || 0,
                protein: parseFloat(row.protein) || 0,
                carbohydrates: parseFloat(row.carbohydrates) || 0,
                fat: parseFloat(row.fat) || 0,
                fiber: parseFloat(row.fiber) || 0,
                sugar: parseFloat(row.sugar) || 0,
                sodium: parseFloat(row.sodium) || 0,
                serving_size_g: parseInt(row.serving_size_g, 10) || 100,
            };

            const existingFood = foodsMap.get(row.id);
            if (existingFood) {
                foodsMap.set(row.id, { ...existingFood, ...newFoodData, name: { ...existingFood.name, ...name }, category: { ...existingFood.category, ...category } });
            } else {
                if(Object.keys(name).length === 0) return;
                foodsMap.set(row.id, { id: row.id, name, category, ...newFoodData });
                newFoodsCount++;
            }
        });
        setFoods(Array.from(foodsMap.values()));
        return newFoodsCount;
    };

    const exportFoodsToCsv = (): string => {
        const headers = ['id', 'serving_size_g', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'name_category'];
        const rows = foods.map(food => {
            const allLangs = new Set([...Object.keys(food.name), ...Object.keys(food.category || {})]);
            const nameCategoryPairs = Array.from(allLangs).map(lang => `${lang}=${food.name[lang] || ''}:${food.category?.[lang] || ''}`).join(';');
            return [food.id, food.serving_size_g || 100, food.calories || 0, food.protein || 0, food.carbohydrates || 0, food.fat || 0, food.fiber || 0, food.sugar || 0, food.sodium || 0, `"${nameCategoryPairs}"`].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    };

    return (
        <FoodContext.Provider value={{ foods, setFoods, getFoodById, addFood, updateFood, deleteFood, importFoods, exportFoodsToCsv }}>
            {children}
        </FoodContext.Provider>
    );
};

export const useFoods = () => {
    const context = useContext(FoodContext);
    if (context === undefined) {
        throw new Error('useFoods must be used within a FoodProvider');
    }
    return context;
};
