
"use client";

import { useState } from 'react';
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
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';


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
  const { foods } = useAppContext();
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');

  const availableFoods = foods.filter(food => !currentFoodIds.includes(food.id));

  const filteredFoods = searchTerm
    ? availableFoods.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableFoods;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('Add Food to Meal')}</DialogTitle>
           <DialogDescription>
            {t('Search for a food to add to your current meal.')}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search for a food...')}
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-2">
            {filteredFoods.map(food => {
              return (
                <div
                  key={food.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.calories} kcal / {food.serving_size_g || 100}g</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onSelectFood(food)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
