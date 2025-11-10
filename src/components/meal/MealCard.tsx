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

  const totalNutrients = useMemo(
    () => calculateTotalNutrients(meal, getFoodById),
    [meal, getFoodById]
  );

  const handleDelete = () => {
    deleteMeal(meal.id);
  };
  
  const nutrientDisplay = [
    { Icon: Flame, value: totalNutrients.calories.toFixed(0), label: 'kcal', color: 'text-orange-400' },
    { Icon: Beef, value: totalNutrients.protein.toFixed(1), label: 'g', color: 'text-blue-400' },
    { Icon: Wheat, value: totalNutrients.carbohydrates.toFixed(1), label: 'g', color: 'text-yellow-400' },
    { Icon: Droplets, value: totalNutrients.fat.toFixed(1), label: 'g', color: 'text-purple-400' }
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
                  <span>Edit</span>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{meal.name}" meal. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {nutrientDisplay.map(({ Icon, value, label, color }, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <div>
                        <p className="font-semibold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            <p>{meal.foods.length} ingredients</p>
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
