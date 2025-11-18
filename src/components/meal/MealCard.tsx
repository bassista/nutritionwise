
"use client";

import { useMemo, useState } from 'react';
import type { Meal, MealFood, MealType } from '@/lib/types';
import useAppStore from '@/context/AppStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Trash2, Edit, Flame, Beef, Wheat, Droplets, GripVertical, CalendarPlus, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MealBuilder from './MealBuilder';
import { useLocale } from '@/context/LocaleContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { getFoodName, cn, calculateTotalNutrientsForMeal } from '@/lib/utils';
import { format, formatISO, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { calculateMealScore } from '@/lib/scoring';

interface MealCardProps {
  meal: Meal;
  isReorderable?: boolean;
  isCollapsed?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export default function MealCard({ meal, isReorderable, isCollapsed, isDragging, isOverlay }: MealCardProps) {
  const { getFoodById, deleteMeal, addLogEntry, addMealToShoppingList, settings } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const { t, locale } = useLocale();
  const { toast } = useToast();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: meal.id,
    data: { type: 'meal', meal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  
  const totalNutrients = useMemo(
    () => calculateTotalNutrientsForMeal(meal, getFoodById),
    [meal, getFoodById]
  );

  const mealScore = useMemo(
      () => calculateMealScore(totalNutrients, settings.nutritionalGoals),
      [totalNutrients, settings.nutritionalGoals]
  );

  const handleDelete = () => {
    deleteMeal(meal.id);
  };

  const handleAddToDiary = (e: React.MouseEvent) => {
      e.stopPropagation();
      const today = formatISO(startOfToday(), { representation: 'date' });
      const itemsToAdd = meal.foods.map(food => ({
          type: 'food' as const,
          itemId: food.foodId,
          grams: food.grams,
      }));
      addLogEntry(today, 'snack', itemsToAdd); // Default to snack
      toast({
          title: t('Meal Added to Diary'),
          description: t('The ingredients for "{mealName}" have been added to your diary.', { mealName: meal.name }),
      });
  };

  const handleAddToShoppingList = (e: React.MouseEvent) => {
      e.stopPropagation();
      addMealToShoppingList(meal.id);
      toast({
          title: t('Ingredients Added'),
          description: t('The ingredients for "{mealName}" have been added to your shopping list.', { mealName: meal.name }),
      });
  }
  
  const nutrientDisplay = [
    { Icon: Flame, value: totalNutrients.calories.toFixed(0), label: 'kcal', color: 'text-orange-400', name: t('Calories') },
    { Icon: Beef, value: totalNutrients.protein.toFixed(1), label: 'g', color: 'text-blue-400', name: t('Protein') },
    { Icon: Wheat, value: totalNutrients.carbohydrates.toFixed(1), label: 'g', color: 'text-yellow-400', name: t('Carbohydrates') },
    { Icon: Droplets, value: totalNutrients.fat.toFixed(1), label: 'g', color: 'text-purple-400', name: t('Fat') }
  ];

  if (isOverlay) {
    return (
      <div className="rounded-md bg-primary text-primary-foreground p-2 shadow-lg w-40">
        <p className="font-semibold text-sm truncate">{meal.name}</p>
      </div>
    );
  }


  if (isCollapsed) {
      return (
            <div ref={setNodeRef} style={style} className="h-full" {...attributes}>
              <Card className="flex items-center p-2" {...listeners}>
                  <p className="font-semibold flex-grow truncate px-2">{meal.name}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4" />
                  </Button>
              </Card>
                {isEditing && (
                <MealBuilder
                  open={isEditing}
                  onOpenChange={setIsEditing}
                  mealToEdit={meal}
                />
              )}
          </div>
      )
  }


  return (
    <>
      <div ref={setNodeRef} style={style} className={cn("h-full", isOverlay && "shadow-lg")} {...attributes} {...listeners}>
        <Card className="flex flex-col h-full cursor-grab active:cursor-grabbing">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div className='flex-grow'>
                    <CardTitle className="text-lg font-bold">{meal.name}</CardTitle>
              </div>
              <div className="flex items-center flex-shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn("flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg", mealScore.color)}>
                                {mealScore.grade}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('Meal Score')}: {mealScore.percentage}%</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleAddToDiary}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>{t('Add to Diary')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleAddToShoppingList(e)}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>{t('Add to Shopping List')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>{t('Edit')}</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span className="text-destructive">{t('Delete')}</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('This will permanently delete the "{mealName}" meal. This action cannot be undone.', { mealName: meal.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            {t('Delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {nutrientDisplay.map(({ Icon, value, label, color, name }, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div>
                        <p className="font-semibold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
              ))}
            </div>
            <Separator className="my-4" />
              <div 
                className="flex-grow space-y-2 cursor-pointer rounded-md -m-2 p-2 hover:bg-muted/50"
                onClick={() => setIsEditing(true)}
              >
                  <h4 className="text-sm font-medium mb-2">{t('Ingredients')}</h4>
                  <ScrollArea className="h-24 pr-3">
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {meal.foods.map(({ foodId, grams }) => {
                              const food = getFoodById(foodId);
                              return food ? (
                                  <li key={foodId} className="truncate">
                                      {getFoodName(food, locale)} ({grams}g)
                                  </li>
                              ) : null;
                          })}
                      </ul>
                  </ScrollArea>
              </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-4">
              <p>{meal.foods.length} {meal.foods.length === 1 ? t('ingredient') : t('ingredients')}</p>
          </CardFooter>
        </Card>
        </div>
        {isEditing && (
          <MealBuilder
            open={isEditing}
            onOpenChange={setIsEditing}
            mealToEdit={meal}
          />
        )}
      </>
    );
}
