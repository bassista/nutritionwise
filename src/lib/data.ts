import type { Food } from './types';

export const defaultFoods: Food[] = [
  {
    id: 'pasta',
    name: { en: 'Pasta', it: 'Pasta' },
    category: { en: 'Cereals and Derivatives', it: 'Cereali e derivati' },
    serving_size_g: 100,
    calories: 355,
    protein: 12.5,
    carbohydrates: 71.7,
    fat: 1.5,
    sugar: 3.2,
    fiber: 3.2,
    sodium: 6,
  },
];
