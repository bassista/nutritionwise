"use client";

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, GripVertical, Flame, Wheat, Minus, Trash2 } from 'lucide-react';
import type { Food } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import FoodDetailsDialog from './FoodDetailsDialog';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocale } from '@/context/LocaleContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface FoodCardProps {
  food: Food;
  reorderable?: boolean;
  onDelete?: (foodId: string) => void;
  style?: React.CSSProperties;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
}

const FoodCard = React.forwardRef<HTMLDivElement, FoodCardProps>(
  ({ food, reorderable, onDelete, style, attributes, listeners }, ref) => {
    const { favoriteFoodIds, toggleFavoriteFood } = useAppContext();
    const { t } = useLocale();
    const isFavorite = favoriteFoodIds.includes(food.id);
    const [isDetailsOpen, setDetailsOpen] = useState(false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavoriteFood(food.id);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    return (
      <>
        <div ref={ref} style={style}>
          <Card
            className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1"
          >
            <div className="p-4 flex-row items-start justify-between">
               <div
                className="font-semibold leading-tight truncate text-base cursor-pointer"
                onClick={() => setDetailsOpen(true)}
              >
                {food.name}
              </div>
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
            </div>
            <CardContent className="p-4 pt-0 flex flex-col flex-grow">
              <div className="space-y-2 text-sm text-muted-foreground cursor-pointer" onClick={() => setDetailsOpen(true)}>
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
              <div className="mt-4 flex justify-end gap-1">
                {onDelete && (
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={handleDeleteClick}
                        aria-label={t('Delete food')}
                      >
                        <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('This will permanently delete the food "{foodName}". This action cannot be undone.', { foodName: food.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(food.id)} className="bg-destructive hover:bg-destructive/90">
                          {t('Delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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

export default function FoodCardWrapper({ food, reorderable, onDelete }: Omit<FoodCardProps, 'style' | 'attributes' | 'listeners'>) {
  if (reorderable) {
    return <SortableFoodCard food={food} />;
  }
  return <FoodCard food={food} reorderable={false} onDelete={onDelete} />;
}
