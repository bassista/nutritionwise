
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Meal } from '@/lib/types';

interface MealContextType {
    meals: Meal[];
    setMeals: (meals: Meal[]) => void;
    getMealById: (id: string) => Meal | undefined;
    addMeal: (meal: Meal) => void;
    updateMeal: (updatedMeal: Meal) => void;
    deleteMeal: (mealId: string) => void;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: ReactNode }) => {
    const [meals, setMeals] = useLocalStorage<Meal[]>('meals', []);

    const getMealById = useCallback((id: string) => meals.find(m => m.id === id), [meals]);

    const addMeal = (meal: Meal) => {
        setMeals(prev => [...prev, meal]);
    };

    const updateMeal = (updatedMeal: Meal) => {
        setMeals(prev => prev.map(m => (m.id === updatedMeal.id ? updatedMeal : m)));
    };

    const deleteMeal = (mealId: string) => {
        setMeals(prev => prev.filter(m => m.id !== mealId));
    };

    return (
        <MealContext.Provider value={{ meals, setMeals, getMealById, addMeal, updateMeal, deleteMeal }}>
            {children}
        </MealContext.Provider>
    );
};

export const useMeals = () => {
    const context = useContext(MealContext);
    if (context === undefined) {
        throw new Error('useMeals must be used within a MealProvider');
    }
    return context;
};
