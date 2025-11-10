"use client";

import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function FavoritesPage() {
  const { foods, favoriteFoodIds } = useAppContext();
  const { t } = useLocale();

  const favoriteFoods = foods.filter(food => favoriteFoodIds.includes(food.id));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Favorite Foods')} />
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4">
          {favoriteFoods.length > 0 ? (
            <FoodList foods={favoriteFoods} />
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
