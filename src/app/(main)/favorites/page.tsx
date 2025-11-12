
"use client";

import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import { Plus, ScanLine } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { FoodForm } from '@/components/food/FoodForm';
import { Food } from '@/lib/types';
import Link from 'next/link';
import FoodListPage from '@/components/food/FoodListPage';


export default function FavoritesPage() {
  const { foods, favoriteFoodIds, setFavoriteFoodIds, setMealBuilderOpen } = useAppContext();
  const { t } = useLocale();

  const [isFormOpen, setFormOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<Food | undefined>(undefined);

  const favoriteFoods = useMemo(() => {
    const foodMap = new Map(foods.map(f => [f.id, f]));
    return favoriteFoodIds.map(id => foodMap.get(id)).filter(Boolean) as Food[];
  }, [foods, favoriteFoodIds]);
  
  const handleCreateMeal = () => {
    setMealBuilderOpen(true, 'favorites');
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

  const handleNewFood = () => {
    setFoodToEdit(undefined);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Favorite Foods')}>
        <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/scanner?from=favorites">
                <ScanLine className="mr-2 h-4 w-4" /> {t('Scan')}
              </Link>
            </Button>
            <Button onClick={handleNewFood}>
                <Plus className="mr-2 h-4 w-4" /> {t('New Food')}
            </Button>
            <Button onClick={handleCreateMeal} className="hidden md:inline-flex">
            <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
            </Button>
        </div>
      </PageHeader>
      
      <FoodListPage
        foods={favoriteFoods}
        onEditFood={handleEditFood}
        onReorder={setFavoriteFoodIds}
        reorderableIds={favoriteFoodIds}
        pageType="favorites"
      />
     
      <FoodForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        foodToEdit={foodToEdit}
        autoFavorite={true}
      />
    </div>
  );
}
