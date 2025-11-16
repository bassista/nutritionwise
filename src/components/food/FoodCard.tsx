
"use client";

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, GripVertical, Flame, Wheat, Minus, Trash2, Edit, PlusCircle, CalendarPlus } from 'lucide-react';
import type { Food, MealType } from '@/lib/types';
import useAppStore from '@/context/AppStore';
import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFoodName } from '@/lib/utils';

interface FoodCardProps {
  food: Food;
  reorderable?: boolean;
  onDelete?: (foodId: string) => void;
  onEdit?: (food: Food) => void;
  onAddToDiary?: (food: Food) => void;
  style?: React.CSSProperties;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
}

const FoodCard = React.forwardRef<HTMLDivElement, FoodCardProps>(
  ({ food, reorderable, onDelete, onEdit, onAddToDiary, style, attributes, listeners }, ref) => {
    const { favoriteFoodIds, toggleFavorite } = useAppStore();
    const { t, locale } = useLocale();
    const isFavorite = favoriteFoodIds.includes(food.id);
    
    const foodName = getFoodName(food, locale);

    const handleCardClick = () => {
      onEdit?.(food);
    };
    
    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(food.id);
    };
    
    const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.(food);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const handleAddToDiaryClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToDiary?.(food);
    };

    return (
      <div ref={ref} style={style}>
        <Card
          className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="p-4 flex items-start gap-2">
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
            <div className="flex-grow font-semibold leading-tight truncate text-base">
              {foodName}
            </div>
          </div>
          <CardContent className="p-4 pt-0 flex flex-col flex-grow">
            <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-orange-400" /> <span className="hidden sm:inline">{t('Calories')}</span>
                </span>
                <span>{food.calories} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wheat className="w-4 h-4 mr-2 text-yellow-500" /> <span className="hidden sm:inline">{t('Carbohydrates')}</span>
                </span>
                <span>{food.carbohydrates || 0} g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Minus className="w-4 h-4 mr-2 text-pink-400" /> <span className="hidden sm:inline">{t('Sugar')}</span>
                </span>
                <span>{food.sugar || 0} g</span>
              </div>
            </div>
            <div className="flex-grow" />
            <div className="mt-4 flex justify-end gap-1">
              {onAddToDiary && (
               <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={handleAddToDiaryClick}
                aria-label={t('Add to Diary')}
              >
                <CalendarPlus className="w-5 h-5 text-muted-foreground" />
              </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={handleEditClick}
                  aria-label={t('Edit food')}
                >
                  <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              )}
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
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('This will permanently delete the food "{foodName}". This action cannot be undone.', { foodName: foodName })}
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
    );
  }
);

FoodCard.displayName = 'FoodCard';

function SortableFoodCard({ food, onEdit, onDelete, onAddToDiary }: { food: Food, onEdit?: (food: Food) => void, onDelete?: (foodId: string) => void, onAddToDiary?: (food: Food) => void }) {
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
      onEdit={onEdit}
      onDelete={onDelete}
      onAddToDiary={onAddToDiary}
    />
  );
}

export default function FoodCardWrapper({ food, reorderable, onDelete, onEdit, onAddToDiary }: Omit<FoodCardProps, 'style' | 'attributes' | 'listeners'>) {
  if (reorderable) {
    return <SortableFoodCard food={food} onEdit={onEdit} onDelete={onDelete} onAddToDiary={onAddToDiary} />;
  }
  return <FoodCard food={food} reorderable={false} onDelete={onDelete} onEdit={onEdit} onAddToDiary={onAddToDiary} />;
}
