import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Food } from './types';
import type { Locale } from '@/context/LocaleContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFoodName = (food: Food, locale: Locale): string => {
    if (typeof food.name === 'string') {
        return food.name;
    }
    return food.name[locale] || food.name['en'] || food.id;
};

export const getCategoryName = (category: string, t: (key: string) => string): string => {
  if (!category) return '';
  const translated = t(`category_${category}`);
  // If translation doesn't exist, return the category key itself, formatted nicely.
  return translated.startsWith('category_') 
    ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : translated;
};
