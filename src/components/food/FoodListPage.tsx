
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
  onReorder?: ((ids: string[]) => void) | ((categoryName: string, foodIds: string[]) => void);
  reorderableIds?: string[];
  categorySortOrders?: { [categoryName: string]: string[] };
  pageType: 'all' | 'favorites';
}

export default function FoodListPage({
  foods,
  onEditFood,
  onDeleteFood,
  onAddToDiary,
  onReorder,
  reorderableIds,
  categorySortOrders,
  pageType,
}: FoodListPageProps) {
  const { settings, categories } = useAppStore();
  const { t, locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const categoryNames = useMemo(() => {
    const uncategorizedStr = t('Uncategorized');
    const allCategoryNames = new Set(categories.map(c => c.name[locale] || c.name['en']).filter(Boolean));
    
    const sortedCategories = Array.from(allCategoryNames)
      .filter(name => name !== uncategorizedStr)
      .sort((a, b) => a.localeCompare(b));
      
    const hasUncategorized = foods.some(f => getCategoryName(f, locale, t) === uncategorizedStr);

    return {
        sorted: sortedCategories,
        hasUncategorized: hasUncategorized,
        uncategorizedName: uncategorizedStr
    };
  }, [categories, locale, t, foods]);
  
  const filteredFoods = useMemo(() =>
    foods.filter(food => {
      const matchesSearch = getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase());
      const categoryName = getCategoryName(food, locale, t);
      const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    }), [foods, searchTerm, categoryFilter, locale, t]
  );
  
  const sortedAndFilteredFoods = useMemo(() => {
    let foodsToSort = [...filteredFoods];

    // Apply favorite sort order if it's the favorites page and no filter/search
    if (pageType === 'favorites' && reorderableIds && !searchTerm) {
        const foodMap = new Map(foodsToSort.map(f => [f.id, f]));
        return reorderableIds.map(id => foodMap.get(id)).filter(Boolean) as Food[];
    }
    
    // Apply category sort order if a category is selected and an order exists
    if (categoryFilter !== 'all' && categorySortOrders?.[categoryFilter]) {
        const order = categorySortOrders[categoryFilter];
        const foodMap = new Map(foodsToSort.map(f => [f.id, f]));
        const orderedFoods = order.map(id => foodMap.get(id)).filter(Boolean) as Food[];
        const unorderedFoods = foodsToSort.filter(f => !order.includes(f.id));
        return [...orderedFoods, ...unorderedFoods];
    }
    
    // Default alphabetical sort for 'all' page
    if (pageType === 'all') {
        return foodsToSort.sort((a, b) => getFoodName(a, locale).localeCompare(getFoodName(b, locale)));
    }
    
    return foodsToSort;

  }, [filteredFoods, pageType, reorderableIds, searchTerm, categoryFilter, categorySortOrders, locale]);

  const isReorderable = useMemo(() => {
    if (pageType === 'favorites' && !searchTerm) return true;
    if (pageType === 'all' && categoryFilter !== 'all' && !searchTerm) return true;
    return false;
  }, [pageType, searchTerm, categoryFilter]);


  const handleReorder = (activeId: string, overId: string) => {
    if (!onReorder) return;

    if (pageType === 'favorites' && reorderableIds) {
        const oldIndex = reorderableIds.indexOf(activeId);
        const newIndex = reorderableIds.indexOf(overId);
        const newOrder = arrayMove(reorderableIds, oldIndex, newIndex);
        (onReorder as (ids: string[]) => void)(newOrder);
    } else if (pageType === 'all' && categoryFilter !== 'all') {
        const currentOrder = sortedAndFilteredFoods.map(f => f.id);
        const oldIndex = currentOrder.indexOf(activeId);
        const newIndex = currentOrder.indexOf(overId);
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        (onReorder as (category: string, ids: string[]) => void)(categoryFilter, newOrder);
    }
  }

  const totalPages = Math.ceil(sortedAndFilteredFoods.length / itemsPerPage);
  const paginatedFoods = sortedAndFilteredFoods.slice(
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
            {(categoryNames.sorted.length > 0 || categoryNames.hasUncategorized) && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('Filter by category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Categories')}</SelectItem>
                  {categoryNames.sorted.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  {categoryNames.hasUncategorized && <SelectItem value={categoryNames.uncategorizedName}>{categoryNames.uncategorizedName}</SelectItem>}
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

          {sortedAndFilteredFoods.length > 0 && totalPages > 1 && (
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
