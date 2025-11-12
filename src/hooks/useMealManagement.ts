
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import type { Meal, MealFood, Food } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';

export const useMealManagement = (mealToEdit?: Meal, onOpenChange?: (open: boolean) => void) => {
    const { addMeal, updateMeal, getFoodById } = useAppContext();
    const { toast } = useToast();
    const { t } = useLocale();

    const [mealName, setMealName] = useState('');
    const [mealFoods, setMealFoods] = useState<MealFood[]>([]);

    useEffect(() => {
        if (mealToEdit) {
            setMealName(mealToEdit.name);
            setMealFoods(mealToEdit.foods);
        } else {
            setMealName('');
            setMealFoods([]);
        }
    }, [mealToEdit, onOpenChange]);

    const handleAddFood = (food: Food) => {
        if (!mealFoods.some(mf => mf.foodId === food.id)) {
            setMealFoods(prev => [...prev, { foodId: food.id, grams: food.serving_size_g || 100 }]);
        }
    };

    const handleRemoveFood = (foodId: string) => {
        setMealFoods(prev => prev.filter(mf => mf.foodId !== foodId));
    };

    const handleGramsChange = (foodId: string, grams: number) => {
        setMealFoods(prev => prev.map(mf => (mf.foodId === foodId ? { ...mf, grams: isNaN(grams) ? 0 : grams } : mf)));
    };
    
    const moveFood = (index: number, direction: 'up' | 'down') => {
        const newMealFoods = [...mealFoods];
        const item = newMealFoods[index];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newMealFoods.length) return;
        newMealFoods.splice(index, 1);
        newMealFoods.splice(newIndex, 0, item);
        setMealFoods(newMealFoods);
    };

    const totalNutrients = useMemo(() => {
        return mealFoods.reduce((acc, mealFood) => {
            const food = getFoodById(mealFood.foodId);
            if (food) {
                const factor = mealFood.grams / (food.serving_size_g || 100);
                acc.calories += (food.calories || 0) * factor;
                acc.protein += (food.protein || 0) * factor;
                acc.carbohydrates += (food.carbohydrates || 0) * factor;
                acc.fat += (food.fat || 0) * factor;
            }
            return acc;
        }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
    }, [mealFoods, getFoodById]);

    const handleSave = () => {
        if (!mealName.trim()) {
            toast({ variant: 'destructive', title: t('Meal name is required.') });
            return;
        }
        if (mealFoods.length === 0) {
            toast({ variant: 'destructive', title: t('Add at least one food to the meal.') });
            return;
        }

        if (mealToEdit) {
            updateMeal({ id: mealToEdit.id, name: mealName, foods: mealFoods });
            toast({ title: t('Meal Updated'), description: `"${mealName}" ${t('has been saved.')}` });
        } else {
            addMeal({ id: Date.now().toString(), name: mealName, foods: mealFoods });
            toast({ title: t('Meal Saved'), description: `"${mealName}" ${t('has been created.')}` });
        }
        onOpenChange?.(false);
    };

    return {
        mealName, setMealName,
        mealFoods, handleAddFood, handleRemoveFood, handleGramsChange, moveFood,
        totalNutrients,
        handleSave,
    };
};

    