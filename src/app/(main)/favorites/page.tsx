
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, Plus, Search, ScanLine } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PaginationControls from '@/components/food/PaginationControls';
import { getFoodName, getCategoryName } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoodForm } from '@/components/food/FoodForm';
import { Food } from '@/lib/types';
import Link from 'next/link';


export default function FavoritesPage() {
  const { foods, favoriteFoodIds, setFavoriteFoodIds, setMealBuilderOpen, settings } = useAppContext();
  const { t, locale } = useLocale();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;
  const [isFormOpen, setFormOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<Food | undefined>(undefined);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const favoriteFoods = useMemo(() => {
    const foodMap = new Map(foods.map(f => [f.id, f]));
    return favoriteFoodIds.map(id => foodMap.get(id)).filter(Boolean) as Food[];
  }, [foods, favoriteFoodIds]);

  const categories = useMemo(() => {
    const allCategories = favoriteFoods.map(f => getCategoryName(f, locale, t));
    return ['all', ...Array.from(new Set(allCategories.filter(Boolean)))];
  }, [favoriteFoods, locale, t]);

  const filteredFoods = useMemo(() =>
    favoriteFoods.filter(food => {
      if (!food) return false;
      const matchesSearch = getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase());
      const categoryName = getCategoryName(food, locale, t);
      const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    }), [favoriteFoods, searchTerm, categoryFilter, locale, t]);

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const paginatedFoods = filteredFoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Favorite Foods')}>
        <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/scanner">
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
          {favoriteFoods.length > 0 ? (
            <FoodList 
              foods={paginatedFoods} 
              reorderable={!isSearching && categoryFilter === 'all'}
              onReorder={setFavoriteFoodIds} 
              allFoodIds={favoriteFoodIds}
              onEditFood={handleEditFood}
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
      <FoodForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        foodToEdit={foodToEdit}
        autoFavorite={true}
      />
    </div>
  );
}
