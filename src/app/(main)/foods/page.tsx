"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/hooks/use-toast';


export default function FoodsPage() {
  const { foods, deleteFood } = useAppContext();
  const { t } = useLocale();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const sortedFoods = useMemo(() => 
    [...foods].sort((a, b) => a.name.localeCompare(b.name)), 
    [foods]
  );

  const filteredFoods = sortedFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('All Foods')} />
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 space-y-4">
          <div className="relative">
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
          {foods.length === 0 ? (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>{t('No Foods Found')}</AlertTitle>
                <AlertDescription>
                  {t('You can import your own food list from a CSV file in the Settings page.')}
                </AlertDescription>
              </Alert>
          ) : (
            <FoodList foods={filteredFoods} onDeleteFood={handleDeleteFood} />
          )}
        </div>
      </div>
    </div>
  );
}
