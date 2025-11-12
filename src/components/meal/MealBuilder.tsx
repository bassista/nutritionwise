
"use client";

import { useState } from 'react';
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
import { useAppContext } from '@/context/AppContext';
import type { Meal } from '@/lib/types';
import { Plus, Trash2, Flame, Beef, Wheat, Droplets, ArrowUp, ArrowDown } from 'lucide-react';
import FoodSelectorForMeal from './FoodSelectorForMeal';
import { useLocale } from '@/context/LocaleContext';
import { getFoodName } from '@/lib/utils';
import { useMealManagement } from '@/hooks/useMealManagement';

interface MealBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealToEdit?: Meal;
}

export default function MealBuilder({ open, onOpenChange, mealToEdit }: MealBuilderProps) {
  const { getFoodById, mealBuilderContext } = useAppContext();
  const { t, locale } = useLocale();
  const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);

  const {
    mealName, setMealName,
    mealFoods, handleAddFood, handleRemoveFood, handleGramsChange, moveFood,
    totalNutrients,
    handleSave,
  } = useMealManagement(mealToEdit, onOpenChange);
  
  const nutrientSummary = [
      { Icon: Flame, value: totalNutrients.calories.toFixed(0) + ' kcal', color: 'text-orange-400' },
      { Icon: Beef, value: totalNutrients.protein.toFixed(1) + ' g', color: 'text-blue-400' },
      { Icon: Wheat, value: totalNutrients.carbohydrates.toFixed(1) + ' g', color: 'text-yellow-400' },
      { Icon: Droplets, value: totalNutrients.fat.toFixed(1) + ' g', color: 'text-purple-400' }
  ];

  const handleSelectFood = (food) => {
    handleAddFood(food);
    setFoodSelectorOpen(false);
  };

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
          <div className="flex-grow flex flex-col gap-4 py-4 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="meal-name">{t('Meal Name')}</Label>
              <Input
                id="meal-name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder={t('e.g., Post-Workout Lunch')}
              />
            </div>
            
            <div className="flex-grow flex flex-col min-h-0">
              <h3 className="font-semibold mb-2">{t('Ingredients')}</h3>
              <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-3">
                  {mealFoods.map(({ foodId, grams }, index) => {
                    const food = getFoodById(foodId);
                    if (!food) return null;
                    const foodName = getFoodName(food, locale);
                    return (
                      <div key={foodId} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                        <div className="flex flex-col gap-1 mr-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFood(index, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFood(index, 'down')} disabled={index === mealFoods.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium text-sm">{foodName}</p>
                          <p className="text-xs text-muted-foreground">{food.calories} kcal / {food.serving_size_g || 100}g</p>
                        </div>
                        <Input
                          type="number"
                          value={grams}
                          onChange={(e) => handleGramsChange(foodId, parseInt(e.target.value))}
                          className="w-20"
                          aria-label={`Grams of ${foodName}`}
                        />
                        <span className="text-sm text-muted-foreground">g</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFood(foodId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <Button variant="outline" className="w-full border-dashed" onClick={() => setFoodSelectorOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
            </Button>
            
            <div className='pt-2'>
                <h3 className="font-semibold mb-2">{t('Total Nutrients')}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 bg-muted rounded-lg">
                    {nutrientSummary.map(({Icon, value, color}) => (
                        <div key={color} className="flex items-center gap-2">
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
        onSelectFood={handleSelectFood}
        currentFoodIds={mealFoods.map(mf => mf.foodId)}
        context={mealBuilderContext}
      />
    </>
  );
}

    