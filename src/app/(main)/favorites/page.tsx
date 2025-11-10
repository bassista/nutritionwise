"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, Plus } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { foods, favoriteFoodIds, setFavoriteFoodIds, setMealBuilderOpen } = useAppContext();
  const { t } = useLocale();

  const favoriteFoods = useMemo(() => {
    const foodMap = new Map(foods.map(f => [f.id, f]));
    return favoriteFoodIds.map(id => foodMap.get(id)).filter(Boolean);
  }, [foods, favoriteFoodIds]);
  
  const handleCreateMeal = () => {
    setMealBuilderOpen(true, 'favorites');
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Favorite Foods')}>
        <Button onClick={handleCreateMeal} className="md:inline-flex">
          <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
        </Button>
      </PageHeader>
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4">
          {favoriteFoods.length > 0 ? (
            <FoodList foods={favoriteFoods} reorderable onReorder={setFavoriteFoodIds} />
          ) : (
            <div className="mt-8">
              <Alert>
                <Heart className="h-4 w-4" />
                <AlertTitle>{t('No Favorites Yet')}</AlertTitle>
                <AlertDescription>
                  {t('You can add foods to your favorites by tapping the heart icon on a food card.')}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
