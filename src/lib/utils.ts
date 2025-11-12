
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Food } from './types';
import type { Locale } from '@/context/LocaleContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFoodName = (food: Food, locale: Locale): string => {
    return food.name[locale] || food.name['en'] || food.id;
};

export const getCategoryName = (food: Food, locale: Locale, t: (key: string) => string): string => {
  if (!food.category) {
    return t('Uncategorized');
  }
  return food.category[locale] || food.category['en'] || t('Uncategorized');
};
