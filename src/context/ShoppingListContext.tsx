
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ShoppingList, ShoppingListItem, Meal } from '@/lib/types';
import { useMeals } from './MealContext';

interface ShoppingListContextType {
    shoppingLists: ShoppingList[];
    setShoppingLists: (lists: ShoppingList[]) => void;
    createShoppingList: (name: string) => void;
    deleteShoppingList: (listId: string) => void;
    renameShoppingList: (listId: string, newName: string) => void;
    addShoppingListItem: (listId: string, item: { foodId: string } | { text: string }) => void;
    updateShoppingListItem: (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => void;
    removeShoppingListItem: (listId: string, itemId: string) => void;
    toggleAllShoppingListItems: (listId: string, check: boolean) => void;
    addMealToShoppingList: (mealId: string) => void;
}

const defaultShoppingLists: ShoppingList[] = [
    { id: 'default-meals', name: 'Meals', items: [], isDeletable: false }
];

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
    const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('shoppingLists', defaultShoppingLists);

    useEffect(() => {
        const hasDefaultList = shoppingLists.some(list => list.id === 'default-meals');
        if (!hasDefaultList) {
            setShoppingLists(prev => [...prev, defaultShoppingLists[0]]);
        }
    }, [shoppingLists, setShoppingLists]);


    const { getMealById } = useMeals();

    const createShoppingList = (name: string) => {
        const newList: ShoppingList = { id: `sl-${Date.now()}`, name, items: [], isDeletable: true };
        setShoppingLists(prev => [...prev, newList]);
    };
    
    const deleteShoppingList = (listId: string) => {
        setShoppingLists(prev => prev.filter(list => list.id !== listId));
    };
    
    const renameShoppingList = (listId: string, newName: string) => {
        setShoppingLists(prev => prev.map(list => list.id === listId ? { ...list, name: newName } : list));
    };
    
    const addShoppingListItem = (listId: string, item: { foodId: string } | { text: string }) => {
        const newItem: ShoppingListItem = { id: `sli-${Date.now()}`, checked: false, ...item };
        setShoppingLists(prev => prev.map(list => {
            if (list.id === listId) {
                if (('foodId' in item && list.items.some(i => i.foodId === item.foodId)) || ('text' in item && list.items.some(i => i.text === item.text))) return list;
                return { ...list, items: [...list.items, newItem] };
            }
            return list;
        }));
    };
    
    const updateShoppingListItem = (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => {
        setShoppingLists(prev => prev.map(list => {
            if (list.id === listId) {
                return { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) };
            }
            return list;
        }));
    };

    const removeShoppingListItem = (listId: string, itemId: string) => {
        setShoppingLists(prev => prev.map(list => {
            if (list.id === listId) {
                return { ...list, items: list.items.filter(item => item.id !== itemId) };
            }
            return list;
        }));
    };

    const toggleAllShoppingListItems = (listId: string, check: boolean) => {
        setShoppingLists(prev => prev.map(list => {
            if (list.id === listId) {
                return { ...list, items: list.items.map(item => ({ ...item, checked: check })) };
            }
            return list;
        }));
    };

    const addMealToShoppingList = (mealId: string) => {
        const meal = getMealById(mealId);
        if (!meal) return;
        const listId = 'default-meals'; // Always add to the default meals list
        setShoppingLists(prev => prev.map(list => {
            if (list.id === listId) {
                const existingFoodIds = new Set(list.items.map(i => i.foodId));
                const newItems = meal.foods
                    .filter(mf => !existingFoodIds.has(mf.foodId))
                    .map(mf => ({ id: `sli-${Date.now()}-${mf.foodId}`, foodId: mf.foodId, checked: false }));
                return { ...list, items: [...list.items, ...newItems] };
            }
            return list;
        }));
    };

    return (
        <ShoppingListContext.Provider value={{ shoppingLists, setShoppingLists, createShoppingList, deleteShoppingList, renameShoppingList, addShoppingListItem, updateShoppingListItem, removeShoppingListItem, toggleAllShoppingListItems, addMealToShoppingList }}>
            {children}
        </ShoppingListContext.Provider>
    );
};

export const useShoppingLists = () => {
    const context = useContext(ShoppingListContext);
    if (context === undefined) {
        throw new Error('useShoppingLists must be used within a ShoppingListProvider');
    }
    return context;
};
