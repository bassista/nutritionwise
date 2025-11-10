"use client";

import { useMemo, useState } from 'react';
import type { Meal } from '@/lib/types';
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
import { MoreVertical, Trash2, Edit, Flame, Beef, Wheat, Droplets } from 'lucide-react';
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

const calculateTotalNutrients = (meal: Meal, getFoodById: Function) => {
    const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
    meal.foods.forEach(mealFood => {
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
};

export default function MealCard({ meal }: { meal: Meal }) {
  const { getFoodById, deleteMeal } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLocale();

  const totalNutrients = useMemo(
    () => calculateTotalNutrients(meal, getFoodById),
    [meal, getFoodById]
  );

  const handleDelete = () => {
    deleteMeal(meal.id);
  };
  
  const nutrientDisplay = [
    { Icon: Flame, value: totalNutrients.calories.toFixed(0), label: 'kcal', color: 'text-orange-400', name: t('Calories') },
    { Icon: Beef, value: totalNutrients.protein.toFixed(1), label: 'g', color: 'text-blue-400', name: t('Protein') },
    { Icon: Wheat, value: totalNutrients.carbohydrates.toFixed(1), label: 'g', color: 'text-yellow-400', name: t('Carbohydrates') },
    { Icon: Droplets, value: totalNutrients.fat.toFixed(1), label: 'g', color: 'text-purple-400', name: t('Fat') }
  ];


  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold">{meal.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                                    {food.name} ({grams}g)
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
