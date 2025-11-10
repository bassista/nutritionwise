"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import type { Meal, MealFood, Food } from '@/lib/types';
import { Plus, Trash2, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import FoodSelectorForMeal from './FoodSelectorForMeal';
import { useLocale } from '@/context/LocaleContext';

interface MealBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealToEdit?: Meal;
}

export default function MealBuilder({ open, onOpenChange, mealToEdit }: MealBuilderProps) {
  const { foods, addMeal, updateMeal, getFoodById } = useAppContext();
  const { toast } = useToast();
  const { t } = useLocale();

  const [mealName, setMealName] = useState('');
  const [mealFoods, setMealFoods] = useState<MealFood[]>([]);
  const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);

  useEffect(() => {
    if (mealToEdit) {
      setMealName(mealToEdit.name);
      setMealFoods(mealToEdit.foods);
    } else {
      setMealName('');
      setMealFoods([]);
    }
  }, [mealToEdit, open]);

  const handleAddFood = (food: Food) => {
    if (!mealFoods.some(mf => mf.foodId === food.id)) {
      setMealFoods(prev => [...prev, { foodId: food.id, grams: food.serving_size_g || 100 }]);
    }
    setFoodSelectorOpen(false);
  };

  const handleRemoveFood = (foodId: string) => {
    setMealFoods(prev => prev.filter(mf => mf.foodId !== foodId));
  };

  const handleGramsChange = (foodId: string, grams: number) => {
    setMealFoods(prev => prev.map(mf => mf.foodId === foodId ? { ...mf, grams: isNaN(grams) ? 0 : grams } : mf));
  };
  
  const totalNutrients = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
    mealFoods.forEach(mealFood => {
      const food = getFoodById(mealFood.foodId);
      if (food) {
        const factor = mealFood.grams / (food.serving_size_g || 100);
        totals.calories += (food.calories || 0) * factor;
        totals.protein += (food.protein || 0) * factor;
        totals.carbohydrates += (food.carbohydrates || 0) * factor;
        totals.fat += (food.fat || 0) * factor;
      }
    });
    return totals;
  }, [mealFoods, getFoodById]);

  const handleSave = () => {
    if (!mealName.trim()) {
      toast({ variant: 'destructive', title: t('Meal name is required.') });
      return;
    }
    if (mealFoods.length === 0) {
      toast({ variant: 'destructive', title: t('Add at least one food to the meal.') });
      return;
    }

    if (mealToEdit) {
      updateMeal({ id: mealToEdit.id, name: mealName, foods: mealFoods });
      toast({ title: t('Meal Updated'), description: `"${mealName}" ${t('has been saved.')}` });
    } else {
      addMeal({ id: Date.now().toString(), name: mealName, foods: mealFoods });
      toast({ title: t('Meal Saved'), description: `"${mealName}" ${t('has been created.')}` });
    }
    onOpenChange(false);
  };
  
  const nutrientSummary = [
      { Icon: Flame, value: totalNutrients.calories.toFixed(0) + ' kcal', color: 'text-orange-400' },
      { Icon: Beef, value: totalNutrients.protein.toFixed(1) + ' g', color: 'text-blue-400' },
      { Icon: Wheat, value: totalNutrients.carbohydrates.toFixed(1) + ' g', color: 'text-yellow-400' },
      { Icon: Droplets, value: totalNutrients.fat.toFixed(1) + ' g', color: 'text-purple-400' }
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>{mealToEdit ? t('Edit Meal') : t('Create New Meal')}</SheetTitle>
            <SheetDescription>
              {t('Build your custom meal by adding foods and specifying quantities.')}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 flex-grow flex flex-col min-h-0">
            <div className="space-y-2">
              <Label htmlFor="meal-name">{t('Meal Name')}</Label>
              <Input
                id="meal-name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder={t('e.g., Post-Workout Lunch')}
              />
            </div>
            
            <h3 className="font-semibold">{t('Ingredients')}</h3>
            <ScrollArea className="flex-grow pr-4 -mr-4">
              <div className="space-y-3">
                {mealFoods.map(({ foodId, grams }) => {
                  const food = getFoodById(foodId);
                  if (!food) return null;
                  return (
                    <div key={foodId} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{food.name}</p>
                        <p className="text-xs text-muted-foreground">{food.calories} kcal / {food.serving_size_g || 100}g</p>
                      </div>
                      <Input
                        type="number"
                        value={grams}
                        onChange={(e) => handleGramsChange(foodId, parseInt(e.target.value))}
                        className="w-20"
                        aria-label={`Grams of ${food.name}`}
                      />
                      <span className="text-sm text-muted-foreground">g</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFood(foodId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full border-dashed" onClick={() => setFoodSelectorOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
                </Button>
              </div>
            </ScrollArea>
            
            <div>
                <h3 className="font-semibold mb-2">{t('Total Nutrients')}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 bg-muted rounded-lg">
                    {nutrientSummary.map(({Icon, value, color}) => (
                        <div key={value} className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span className="font-medium">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">{t('Cancel')}</Button>
            </SheetClose>
            <Button onClick={handleSave}>{t('Save Meal')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <FoodSelectorForMeal
        open={isFoodSelectorOpen}
        onOpenChange={setFoodSelectorOpen}
        onSelectFood={handleAddFood}
        currentFoodIds={mealFoods.map(mf => mf.foodId)}
      />
    </>
  );
}
