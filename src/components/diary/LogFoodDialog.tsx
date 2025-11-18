
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/context/LocaleContext';
import useAppStore from '@/context/AppStore';
import { Food, MealType } from '@/lib/types';
import { getFoodName } from '@/lib/utils';

interface LogFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food;
  mealType: MealType;
  selectedDateString: string;
  onLogSuccess: () => void;
}

export default function LogFoodDialog({ open, onOpenChange, food, mealType, selectedDateString, onLogSuccess }: LogFoodDialogProps) {
  const { t, locale } = useLocale();
  const { addLogEntry } = useAppStore();
  const [grams, setGrams] = useState(food.serving_size_g || 100);

  useEffect(() => {
    if (open) {
      setGrams(food.serving_size_g || 100);
    }
  }, [open, food]);

  const handleLogClick = () => {
    addLogEntry(selectedDateString, mealType, { type: 'food', itemId: food.id, grams });
    onLogSuccess();
  };

  const foodDisplayName = getFoodName(food, locale);
  const truncatedName = foodDisplayName.length > 16 ? `${foodDisplayName.substring(0, 13)}...` : foodDisplayName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Log Food')}</DialogTitle>
          <DialogDescription title={foodDisplayName}>
            {truncatedName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grams" className="text-right">
              {t('Quantity')}
            </Label>
            <Input
              id="grams"
              type="number"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
              className="col-span-2"
            />
            <span className="text-muted-foreground">g</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button type="submit" onClick={handleLogClick}>{t('Add to Diary')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
