
"use client";

import { useState, useMemo, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import FoodList from '@/components/food/FoodList';
import { Input } from '@/components/ui/input';
import { Search, Lightbulb, Heart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocale } from '@/context/LocaleContext';
import PaginationControls from '@/components/food/PaginationControls';
import { getFoodName, getCategoryName } from '@/lib/utils';
import { Food } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { arrayMove } from '@dnd-kit/sortable';

interface FoodListPageProps {
  foods: Food[];
  onEditFood: (food: Food) => void;
  onDeleteFood?: (foodId: string) => void;
  onAddToDiary?: (food: Food) => void;
  onReorder?: (ids: string[]) => void;
  reorderableIds?: string[];
  enableSorting?: boolean;
  pageType: 'all' | 'favorites';
}

export default function FoodListPage({
  foods,
  onEditFood,
  onDeleteFood,
  onAddToDiary,
  onReorder,
  reorderableIds,
  enableSorting = false,
  pageType,
}: FoodListPageProps) {
  const { settings } = useAppStore();
  const { t, locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const allCategories = foods.map(f => getCategoryName(f, locale, t));
    return ['all', ...Array.from(new Set(allCategories.filter(Boolean)))];
  }, [foods, locale, t]);
  
  const sortedFoods = useMemo(() => {
    if (enableSorting) {
      return [...foods].sort((a, b) => getFoodName(a, locale).localeCompare(getFoodName(b, locale)));
    }
    return foods;
  }, [foods, locale, enableSorting]);

  const filteredFoods = useMemo(() =>
    sortedFoods.filter(food => {
      const matchesSearch = getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase());
      const categoryName = getCategoryName(food, locale, t);
      const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    }), [sortedFoods, searchTerm, categoryFilter, locale, t]
  );
  
  const isReorderable = onReorder && !searchTerm && categoryFilter === 'all';

  const handleReorder = (activeId: string, overId: string) => {
    if (onReorder && reorderableIds) {
      const oldIndex = reorderableIds.indexOf(activeId);
      const newIndex = reorderableIds.indexOf(overId);
      onReorder(arrayMove(reorderableIds, oldIndex, newIndex));
    }
  }

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const paginatedFoods = filteredFoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const EmptyState = () => {
    const icon = pageType === 'favorites' ? <Heart className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;
    const title = pageType === 'favorites' ? t('No Favorites Yet') : t('No Foods Found');
    const description = pageType === 'favorites' 
        ? t('You can add foods to your favorites by tapping the heart icon on a food card.')
        : t('You can import your own food list from a CSV file in the Settings page.');
    
    if (searchTerm) {
        return (
             <div className="mt-8">
                <Alert>
                    <Search className="h-4 w-4" />
                    <AlertTitle>{t('No Results')}</AlertTitle>
                    <AlertDescription>
                        {t('No foods match your search. Try a different term.')}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="mt-8">
            <Alert>
                {icon}
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <>
      <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 -mb-4">
        <div className="container mx-auto px-4">
           <div className="py-4 flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
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
            {categories.length > 2 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('Filter by category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Categories')}</SelectItem>
                  {categories.filter(cat => cat !== 'all').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 pt-8 space-y-4">
          {foods.length > 0 ? (
            <FoodList 
              foods={paginatedFoods} 
              onDeleteFood={onDeleteFood}
              onEditFood={onEditFood}
              onAddToDiary={onAddToDiary}
              onReorder={isReorderable ? handleReorder : undefined}
            />
          ) : (
            <EmptyState />
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
    </>
  );
}
