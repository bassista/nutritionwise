"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppContext } from '@/context/AppContext';
import { Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFoodName } from '@/lib/utils';

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
  const { t, locale } = useLocale();
  const { updateFood } = useAppContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const foodName = getFoodName(food, locale);
  const [editedName, setEditedName] = useState(foodName);

  useEffect(() => {
    if (open) {
      const currentName = getFoodName(food, locale);
      setEditedName(currentName);
      setIsEditing(false);
    }
  }, [open, food, locale]);

  const handleSave = () => {
    if (editedName.trim() === '') {
      toast({
        variant: 'destructive',
        title: t('Name cannot be empty'),
      });
      return;
    }
    
    const newNameObject = typeof food.name === 'object' ? { ...food.name } : { en: food.name };
    newNameObject[locale] = editedName;

    updateFood(food.id, { name: newNameObject });
    
    toast({
      title: t('Food Updated'),
      description: t('The food name has been updated.'),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(foodName);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {isEditing ? (
            <Input 
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-2xl font-headline h-auto p-0 border-0 shadow-none focus-visible:ring-0"
              aria-label={t('Edit food name')}
            />
          ) : (
            <DialogTitle className="text-2xl font-headline flex items-center">
              {foodName}
              <Button variant="ghost" size="icon" className="ml-2 h-7 w-7" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTitle>
          )}
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
        {isEditing && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>{t('Cancel')}</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t('Save')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
