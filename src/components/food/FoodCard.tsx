"use client";

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Flame, GripVertical } from 'lucide-react';
import type { Food } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import FoodDetailsDialog from './FoodDetailsDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    const isFavorite = favoriteFoodIds.includes(food.id);
    const [isDetailsOpen, setDetailsOpen] = useState(false);

    const placeholder =
      PlaceHolderImages.find((p) => p.id === food.id) || PlaceHolderImages[0];

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
            <CardHeader className="p-0 relative">
              <Image
                src={placeholder.imageUrl}
                alt={food.name}
                width={400}
                height={300}
                className="w-full h-32 object-cover"
                data-ai-hint={placeholder.imageHint}
              />
              {reorderable && (
                <div
                  className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full cursor-grab active:cursor-grabbing touch-none"
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-5 h-5 text-white" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-3 flex flex-col flex-grow">
              <CardTitle className="text-base font-semibold leading-tight truncate mb-1">
                {food.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground flex items-center">
                <Flame className="w-3 h-3 mr-1 text-orange-400" />
                {food.calories} kcal / {food.serving_size_g || 100}g
              </CardDescription>
              <div className="flex-grow" />
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 ml-auto flex items-center justify-center"
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
