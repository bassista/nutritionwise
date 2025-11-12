
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/context/LocaleContext';
import { Food } from '@/lib/types';
import { useEffect } from 'react';

const foodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Name is required." }),
  category: z.string().optional(),
  serving_size_g: z.coerce.number().min(0),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbohydrates: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0).optional(),
  sugar: z.coerce.number().min(0).optional(),
  sodium: z.coerce.number().min(0).optional(),
});

export type FoodFormValues = z.infer<typeof foodSchema>;

export const useFoodManagement = (foodToEdit?: Food, foodToCreate?: Partial<Food>) => {
  const { addFood, updateFood, foods, toggleFavoriteFood } = useAppContext();
  const { toast } = useToast();
  const { t, locale } = useLocale();

  const defaultValues: FoodFormValues = {
    id: '', name: '', category: '', serving_size_g: 100,
    calories: 0, protein: 0, carbohydrates: 0, fat: 0,
    fiber: 0, sugar: 0, sodium: 0,
  };

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues,
  });

  useEffect(() => {
    if (foodToEdit) {
      form.reset({
        id: foodToEdit.id,
        name: foodToEdit.name[locale] || foodToEdit.name['en'] || '',
        category: foodToEdit.category?.[locale] || foodToEdit.category?.['en'] || '',
        serving_size_g: foodToEdit.serving_size_g || 100,
        calories: foodToEdit.calories || 0,
        protein: foodToEdit.protein || 0,
        carbohydrates: foodToEdit.carbohydrates || 0,
        fat: foodToEdit.fat || 0,
        fiber: foodToEdit.fiber || 0,
        sugar: foodToEdit.sugar || 0,
        sodium: foodToEdit.sodium || 0,
      });
    } else if (foodToCreate) {
      form.reset({
        id: foodToCreate.id || '',
        name: foodToCreate.name?.[locale] || foodToCreate.name?.['en'] || '',
        category: foodToCreate.category?.[locale] || foodToCreate.category?.['en'] || '',
        serving_size_g: foodToCreate.serving_size_g || 100,
        calories: foodToCreate.calories || 0,
        protein: foodToCreate.protein || 0,
        carbohydrates: foodToCreate.carbohydrates || 0,
        fat: foodToCreate.fat || 0,
        fiber: foodToCreate.fiber || 0,
        sugar: foodToCreate.sugar || 0,
        sodium: foodToCreate.sodium || 0,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [foodToEdit, foodToCreate, form, locale]);

  const handleFoodSubmit = (data: FoodFormValues, autoFavorite: boolean = false): boolean => {
    const categoryValue = data.category === 'uncategorized' ? '' : data.category;

    if (foodToEdit) {
      const updatedFood: Food = {
        ...foodToEdit,
        id: data.id || foodToEdit.id,
        name: { ...foodToEdit.name, [locale]: data.name },
        category: { ...foodToEdit.category, [locale]: categoryValue || '' },
        serving_size_g: data.serving_size_g, calories: data.calories, protein: data.protein,
        carbohydrates: data.carbohydrates, fat: data.fat, fiber: data.fiber,
        sugar: data.sugar, sodium: data.sodium,
      };
      updateFood(foodToEdit.id, updatedFood);
      toast({ title: t('Food Updated') });
      return true;
    } else {
      const foodId = data.id || data.name.toLowerCase().replace(/\s+/g, '-');
      if (foods.some(f => f.id === foodId)) {
        toast({ variant: "destructive", title: t('Food already exists'), description: t('A food with this ID already exists. Please choose a different name or ID.') });
        return false;
      }
      const newFood: Food = {
        id: foodId,
        name: { en: data.name, [locale]: data.name },
        category: { en: categoryValue || '', [locale]: categoryValue || '' },
        serving_size_g: data.serving_size_g, calories: data.calories, protein: data.protein,
        carbohydrates: data.carbohydrates, fat: data.fat, fiber: data.fiber,
        sugar: data.sugar, sodium: data.sodium,
      };
      addFood(newFood);
      if (autoFavorite) {
        toggleFavoriteFood(newFood.id);
      }
      toast({ title: t('Food Created') });
      return true;
    }
  };

  return { form, handleFoodSubmit };
};

    