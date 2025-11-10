"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import PaginationControls from '@/components/food/PaginationControls';
import { getFoodName, getCategoryName } from '@/lib/utils';
import { FoodForm } from '@/components/food/FoodForm';
import { Food } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function FoodsPage() {
  const { foods, deleteFood, setMealBuilderOpen, settings } = useAppContext();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;
  const [isFormOpen, setFormOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<Food | undefined>(undefined);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const allCategories = foods.map(f => getCategoryName(f, locale, t)).filter(cat => cat && cat !== t('Uncategorized'));
    return ['all', ...Array.from(new Set(allCategories))];
  }, [foods, locale, t]);

  const sortedFoods = useMemo(() => 
    [...foods].sort((a, b) => getFoodName(a, locale).localeCompare(getFoodName(b, locale))), 
    [foods, locale]
  );

  const filteredFoods = useMemo(() =>
    sortedFoods.filter(food => {
      const matchesSearch = getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase());
      const categoryName = getCategoryName(food, locale, t);
      const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    }), [sortedFoods, searchTerm, categoryFilter, locale, t]
  );

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const paginatedFoods = filteredFoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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
    <div className="flex flex-col h-full">
      <PageHeader title={t('All Foods')}>
        <div className="flex gap-2">
            <Button onClick={handleNewFood}>
                <Plus className="mr-2 h-4 w-4" /> {t('New Food')}
            </Button>
            <Button onClick={() => setMealBuilderOpen(true)} className="hidden md:inline-flex">
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
                  {categories.map(cat => cat !== 'all' && <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 pt-8 space-y-4">
          {foods.length === 0 ? (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>{t('No Foods Found')}</AlertTitle>
                <AlertDescription>
                  {t('You can import your own food list from a CSV file in the Settings page.')}
                </AlertDescription>
              </Alert>
          ) : (
            <FoodList 
              foods={paginatedFoods} 
              onDeleteFood={handleDeleteFood} 
              onEditFood={handleEditFood}
            />
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
      />
    </div>
  );
}
