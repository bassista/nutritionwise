"use client";

import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, Plus, Search } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PaginationControls from '@/components/food/PaginationControls';
import { getFoodName } from '@/lib/utils';

export default function FavoritesPage() {
  const { foods, favoriteFoodIds, setFavoriteFoodIds, setMealBuilderOpen, settings } = useAppContext();
  const { t, locale } = useLocale();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const favoriteFoods = useMemo(() => {
    const foodMap = new Map(foods.map(f => [f.id, f]));
    return favoriteFoodIds.map(id => foodMap.get(id)).filter(Boolean);
  }, [foods, favoriteFoodIds]);

  const filteredFoods = useMemo(() =>
    favoriteFoods.filter(food =>
      getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase())
    ), [favoriteFoods, searchTerm, locale]);

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const paginatedFoods = filteredFoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCreateMeal = () => {
    setMealBuilderOpen(true, 'favorites');
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Favorite Foods')}>
        <Button onClick={handleCreateMeal} className="hidden md:inline-flex">
          <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
        </Button>
      </PageHeader>
      <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 -mb-4">
        <div className="container mx-auto px-4">
          <div className="relative py-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search for a food...')}
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('Search for a food...')}
            />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 pt-8 space-y-4">
          {favoriteFoods.length > 0 ? (
            <FoodList 
              foods={paginatedFoods} 
              reorderable={!isSearching} 
              onReorder={setFavoriteFoodIds} 
              allFoodIds={favoriteFoodIds}
            />
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

          {filteredFoods.length > 0 && totalPages > 1 && (
             <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
