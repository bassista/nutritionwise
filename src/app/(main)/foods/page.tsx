
"use client";

import { useState } from 'react';
import useAppStore from '@/context/AppStore';
import { useUIState } from '@/context/UIStateContext';
import { PageHeader } from '@/components/PageHeader';
import { Plus, ScanLine } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FoodForm } from '@/components/food/FoodForm';
import { Food } from '@/lib/types';
import Link from 'next/link';
import FoodListPage from '@/components/food/FoodListPage';


export default function FoodsPage() {
  const { foods, deleteFood } = useAppStore();
  const { setMealBuilderOpen } = useUIState();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<Food | undefined>(undefined);

  const handleDeleteFood = (foodId: string) => {
    const result = deleteFood(foodId);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: t('Cannot delete food'),
        description: t('Food is used in meal: {mealNames}', { mealNames: result.conflictingMeals?.join(', ') || '' }),
      });
    } else {
        toast({
            title: t('Food Deleted'),
            description: t('The food has been successfully deleted.'),
        });
    }
  };

  const handleNewFood = () => {
    setFoodToEdit(undefined);
    setFormOpen(true);
  };

  const handleEditFood = (food: Food) => {
    setFoodToEdit(food);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setFoodToEdit(undefined);
    }
  }

  return (
    <>
      <PageHeader title={t('All Foods')}>
        <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/scanner">
                <ScanLine className="mr-2 h-4 w-4" /> {t('Scan')}
              </Link>
            </Button>
            <Button onClick={handleNewFood}>
                <Plus className="mr-2 h-4 w-4" /> {t('New Food')}
            </Button>
            <Button onClick={() => setMealBuilderOpen(true)} className="hidden md:inline-flex">
            <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
            </Button>
        </div>
      </PageHeader>
      
      <FoodListPage
        foods={foods}
        onEditFood={handleEditFood}
        onDeleteFood={handleDeleteFood}
        enableSorting={true}
        pageType="all"
      />

       <FoodForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        foodToEdit={foodToEdit}
      />
    </>
  );
}
