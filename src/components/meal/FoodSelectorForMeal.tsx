"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';


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
          <DialogTitle>Add Food to Meal</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a food..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-2">
            {filteredFoods.map(food => {
              const placeholder = PlaceHolderImages.find((p) => p.id === food.id) || PlaceHolderImages[0];
              return (
                <div
                  key={food.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                >
                    <Image 
                        src={placeholder.imageUrl}
                        alt={food.name}
                        width={40}
                        height={40}
                        className="rounded-md w-10 h-10 object-cover"
                        data-ai-hint={placeholder.imageHint}
                    />
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
