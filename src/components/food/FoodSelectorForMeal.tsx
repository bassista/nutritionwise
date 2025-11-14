
"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import useAppStore from '@/context/AppStore';
import type { Food } from '@/lib/types';
import { Search, Plus, Heart } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { getFoodName } from '@/lib/utils';
import { useUIState } from '@/context/UIStateContext';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 40;

interface FoodSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFood: (food: Food) => void;
  currentFoodIds: string[];
}

export default function FoodSelectorForMeal({
  open,
  onOpenChange,
  onSelectFood,
  currentFoodIds,
}: FoodSelectorProps) {
  const { foods, favoriteFoodIds } = useAppStore();
  const { mealBuilderContext } = useUIState();
  const { t, locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFavoritesOnly, setSearchFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    if (open) {
      const isFavoritesContext = mealBuilderContext === 'favorites';
      setSearchFavoritesOnly(isFavoritesContext && favoriteFoodIds.length > 0);
      setSearchTerm('');
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [open, mealBuilderContext, favoriteFoodIds.length]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm, searchFavoritesOnly]);
  
  const sourceFoods = useMemo(() => {
    if (searchFavoritesOnly) {
      const favoriteFoodMap = new Map(foods.map(f => [f.id, f]));
      return favoriteFoodIds.map(id => favoriteFoodMap.get(id)).filter(Boolean) as Food[];
    }
    return foods;
  }, [searchFavoritesOnly, foods, favoriteFoodIds]);

  const filteredFoods = useMemo(() =>
    sourceFoods.filter(food => 
      !currentFoodIds.includes(food.id) &&
      getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase())
    ), [sourceFoods, currentFoodIds, locale, searchTerm]
  );
  
  const visibleFoods = useMemo(() => {
    return filteredFoods.slice(0, visibleCount);
  }, [filteredFoods, visibleCount]);

  const handleSelectFood = (food: Food) => {
    onSelectFood(food);
  };
  
  const handleToggleFavorites = () => {
    if (favoriteFoodIds.length > 0) {
      setSearchFavoritesOnly(prev => !prev);
    }
  }

  const showSearchAllButton = searchTerm && filteredFoods.length === 0 && searchFavoritesOnly;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('Add Food to Meal')}</DialogTitle>
           <DialogDescription>
            {t('Search for a food to add to your current meal.')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search for a food...')}
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <Button
              variant="ghost"
              size="icon"
              className={cn(
                  "h-8 w-8",
                  favoriteFoodIds.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleToggleFavorites}
              disabled={favoriteFoodIds.length === 0}
              >
              <Heart className={cn('h-4 w-4', searchFavoritesOnly ? 'text-red-500 fill-current' : 'text-muted-foreground')} />
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-2">
            {visibleFoods.map(food => {
              const foodName = getFoodName(food, locale);
              return (
                <div
                  key={food.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{foodName}</p>
                    <p className="text-xs text-muted-foreground">{food.calories} kcal / {food.serving_size_g || 100}g</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSelectFood(food)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
             {filteredFoods.length > visibleCount && (
                <div className="flex justify-center py-4">
                    <Button variant="outline" onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}>
                        {t('Load More')} ({filteredFoods.length - visibleCount} {t('remaining')})
                    </Button>
                </div>
              )}
               {filteredFoods.length === 0 && searchTerm && !showSearchAllButton && (
                    <p className="text-center text-sm text-muted-foreground py-4">{t('No foods match your search.')}</p>
                )}
                {showSearchAllButton && (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">{t('No results in favorites.')}</p>
                        <Button variant="secondary" onClick={() => setSearchFavoritesOnly(false)}>
                            {t('Search in all foods')}
                        </Button>
                    </div>
                )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
