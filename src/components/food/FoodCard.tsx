"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, GripVertical, Flame, Wheat, Minus } from 'lucide-react';
import type { Food } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import FoodDetailsDialog from './FoodDetailsDialog';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocale } from '@/context/LocaleContext';

interface FoodCardProps {
  food: Food;
  reorderable?: boolean;
  style?: React.CSSProperties;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
}

const FoodCard = React.forwardRef<HTMLDivElement, FoodCardProps>(
  ({ food, reorderable, style, attributes, listeners }, ref) => {
    const { favoriteFoodIds, toggleFavoriteFood } = useAppContext();
    const { t } = useLocale();
    const isFavorite = favoriteFoodIds.includes(food.id);
    const [isDetailsOpen, setDetailsOpen] = useState(false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavoriteFood(food.id);
    };

    return (
      <>
        <div ref={ref} style={style}>
          <Card
            className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            onClick={() => setDetailsOpen(true)}
          >
            <CardHeader className="p-4 flex-row items-start justify-between">
              <CardTitle className="text-base font-semibold leading-tight truncate">
                {food.name}
              </CardTitle>
              {reorderable && (
                <div
                  className="p-1 cursor-grab active:cursor-grabbing touch-none"
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col flex-grow">
              <div className="space-y-2 text-sm text-muted-foreground">
                 <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Flame className="w-4 h-4 mr-2 text-orange-400" /> {t('Calories')}
                  </span>
                  <span>{food.calories} kcal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Wheat className="w-4 h-4 mr-2 text-yellow-500" /> {t('Carbohydrates')}
                  </span>
                  <span>{food.carbohydrates || 0} g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Minus className="w-4 h-4 mr-2 text-pink-400" /> {t('Sugar')}
                  </span>
                  <span>{food.sugar || 0} g</span>
                </div>
              </div>
              <div className="flex-grow" />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={handleFavoriteClick}
                  aria-label={
                    isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Heart
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isFavorite
                        ? 'text-red-500 fill-current'
                        : 'text-muted-foreground'
                    )}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <FoodDetailsDialog
          food={food}
          open={isDetailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </>
    );
  }
);

FoodCard.displayName = 'FoodCard';

function SortableFoodCard({ food }: { food: Food }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: food.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <FoodCard
      ref={setNodeRef}
      food={food}
      reorderable={true}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
}

export default function FoodCardWrapper({ food, reorderable }: Omit<FoodCardProps, 'style' | 'attributes' | 'listeners'>) {
  if (reorderable) {
    return <SortableFoodCard food={food} />;
  }
  return <FoodCard food={food} reorderable={false} />;
}
