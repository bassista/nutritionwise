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
  const translationKey = `category_${category}`;
  const translated = t(translationKey);
  // If translation doesn't exist (i.e., it returns the key), format the key itself.
  return translated === translationKey
    ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : translated;
};
