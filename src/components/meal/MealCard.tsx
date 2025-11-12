
"use client";

import { useMemo, useState } from 'react';
import type { Meal, MealType } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
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
import { formatISO, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { calculateMealScore } from '@/lib/scoring';


interface MealCardProps {
  meal: Meal;
  reorderable?: boolean;
  style?: React.CSSProperties;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
}


const MealCardComponent = React.forwardRef<HTMLDivElement, MealCardProps>(
  ({ meal, reorderable, style, attributes, listeners }, ref) => {
    const { getFoodById, deleteMeal, addLogEntry, addMealToShoppingList, settings } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const { t, locale } = useLocale();
    const { toast } = useToast();

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

     const handleAddToDiary = (e: React.MouseEvent, mealType: MealType) => {
        e.stopPropagation();
        const today = formatISO(startOfToday(), { representation: 'date' });
        addLogEntry(today, mealType, { type: 'meal', itemId: meal.id });
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


    return (
      <>
        <div ref={ref} style={style} className="h-full">
        <Card className="flex flex-col h-full">
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

                {reorderable && (
                   <div
                    className="p-1 cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={(e) => handleAddToDiary(e, 'breakfast')}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>{t('Add to Breakfast')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleAddToDiary(e, 'lunch')}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>{t('Add to Lunch')}</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={(e) => handleAddToDiary(e, 'dinner')}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>{t('Add to Dinner')}</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={(e) => handleAddToDiary(e, 'snack')}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>{t('Add to Snack')}</span>
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
              <div className="flex-grow space-y-2">
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
);
MealCardComponent.displayName = 'MealCard';

function SortableMealCard({ meal }: { meal: Meal }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MealCardComponent
      ref={setNodeRef}
      meal={meal}
      reorderable={true}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
}

export default function MealCard({ meal, reorderable }: Omit<MealCardProps, 'style' | 'attributes' | 'listeners'>) {
  if (reorderable) {
    return <SortableMealCard meal={meal} />;
  }
  return <MealCardComponent meal={meal} />;
}

    
