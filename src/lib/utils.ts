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
