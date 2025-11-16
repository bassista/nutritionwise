
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import useAppStore from '@/context/AppStore';
import { useToast } from '@/hooks/use-toast';
import type { Meal, MealFood, Food } from '@/lib/types';
import { Plus, Trash2, Flame, Beef, Wheat, Droplets, ArrowUp, ArrowDown, CalendarPlus, ShoppingCart } from 'lucide-react';
import FoodSelectorForMeal from '../food/FoodSelectorForMeal';
import { useLocale } from '@/context/LocaleContext';
import { getFoodName, calculateTotalNutrientsForMeal } from '@/lib/utils';
import { formatISO, startOfToday } from 'date-fns';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface MealBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealToEdit?: Meal;
}

export default function MealBuilder({ open, onOpenChange, mealToEdit }: MealBuilderProps) {
  const { getFoodById, addMeal, updateMeal, addLogEntry, addFoodToShoppingList } = useAppStore();
  const { toast } = useToast();
  const { t, locale } = useLocale();

  const [mealName, setMealName] = useState('');
  const [mealFoods, setMealFoods] = useState<MealFood[]>([]);
  const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mealToEdit) {
        setMealName(mealToEdit.name);
        setMealFoods(mealToEdit.foods);
      } else {
        setMealName(t('New Meal'));
        setMealFoods([]);
      }
      setIsEditingName(false);
    }
  }, [open, mealToEdit, t]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditingName]);

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
    setMealFoods(prev => prev.map(mf => (mf.foodId === foodId ? { ...mf, grams: isNaN(grams) ? 0 : grams } : mf)));
  };

  const handleAddToDiary = (food: Food, grams: number) => {
    const today = formatISO(startOfToday(), { representation: 'date' });
    addLogEntry(today, 'snack', { type: 'food', itemId: food.id, grams: grams });
     toast({
        title: t('Ingredient Added to Diary'),
        description: t('{foodName} ({grams}g) has been added to today\'s diary.', { foodName: getFoodName(food, locale), grams: grams }),
    });
  };

  const handleAddToShoppingList = (food: Food) => {
    addFoodToShoppingList(food.id);
    toast({
        title: t('Ingredient Added to Shopping List'),
        description: t('{foodName} has been added to your shopping list.', { foodName: getFoodName(food, locale) }),
    });
  };

  const moveFood = (index: number, direction: 'up' | 'down') => {
    const newMealFoods = [...mealFoods];
    const item = newMealFoods[index];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newMealFoods.length) return;
    newMealFoods.splice(index, 1);
    newMealFoods.splice(newIndex, 0, item);
    setMealFoods(newMealFoods);
  };

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

  const handleNameEdit = () => {
    setIsEditingName(false);
    if (!mealName.trim()) {
        setMealName(mealToEdit ? mealToEdit.name : t('New Meal'));
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg flex flex-col">
          <SheetHeader>
            {isEditingName ? (
                <Input
                    ref={inputRef}
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    onBlur={handleNameEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                    className="text-lg font-semibold border-2 border-primary"
                />
            ) : (
                <SheetTitle onClick={() => setIsEditingName(true)} className="cursor-pointer truncate">
                    {mealName}
                </SheetTitle>
            )}
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 flex-1 min-h-0">
            <div className="flex flex-col flex-1 min-h-0 space-y-2">
              <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-3 pr-1">
                  <TooltipProvider>
                    {mealFoods.map(({ foodId, grams }, index) => {
                      const food = getFoodById(foodId);
                      if (!food) return null;
                      const foodName = getFoodName(food, locale);
                      return (
                        <div key={foodId} className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md">
                           <div className="flex items-center gap-2">
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
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFood(foodId)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleAddToDiary(food, grams)}>
                                    <CalendarPlus className="h-4 w-4" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{t('Add to today\'s diary')}</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleAddToShoppingList(food)}>
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{t('Add to shopping list')}</p>
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex flex-col">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveFood(index, 'up')} disabled={index === 0}>
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveFood(index, 'down')} disabled={index === mealFoods.length - 1}>
                                    <ArrowDown className="h-3 w-3" />
                                </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </ScrollArea>
              <Button variant="outline" className="w-full border-dashed mt-2" onClick={() => setFoodSelectorOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
              </Button>
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
