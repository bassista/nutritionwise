"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Food } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';

interface FoodDetailsDialogProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const nutrientOrder: (keyof Food)[] = [
    'calories',
    'protein',
    'carbohydrates',
    'fat',
    'fiber',
    'sugar',
    'sodium',
];

const nutrientLabelKeys: Record<string, string> = {
    calories: 'Calories (kcal)',
    protein: 'Protein (g)',
    carbohydrates: 'Carbs (g)',
    fat: 'Fat (g)',
    fiber: 'Fiber (g)',
    sugar: 'Sugar (g)',
    sodium: 'Sodium (mg)',
};

export default function FoodDetailsDialog({
  food,
  open,
  onOpenChange,
}: FoodDetailsDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{food.name}</DialogTitle>
          <DialogDescription>
            {t('Nutritional values per {serving_size}g serving.', { serving_size: food.serving_size_g || 100 })}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Nutrient')}</TableHead>
                <TableHead className="text-right">{t('Amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nutrientOrder.map((key) => {
                const value = food[key];
                if (value !== undefined && value !== null) {
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{t(nutrientLabelKeys[key] || key)}</TableCell>
                      <TableCell className="text-right">{value}</TableCell>
                    </TableRow>
                  );
                }
                return null;
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
