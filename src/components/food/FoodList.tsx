"use client";

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import FoodCardWrapper from './FoodCard';
import PaginationControls from './PaginationControls';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

interface FoodListProps {
  foods: Food[];
  reorderable?: boolean;
  onReorder?: (foodIds: string[]) => void;
  onDeleteFood?: (foodId: string) => void;
}

export default function FoodList({ foods, reorderable = false, onReorder, onDeleteFood }: FoodListProps) {
  const { t } = useLocale();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const allFoodIds = (onReorder as any).allFoodIds as string[];
      const oldIndex = allFoodIds.findIndex((id) => id === active.id);
      const newIndex = allFoodIds.findIndex((id) => id === over.id);

      const reorderedIds = arrayMove(allFoodIds, oldIndex, newIndex);
      onReorder?.(reorderedIds);
    }
  }

  if (foods.length === 0) {
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
    );
  }
  
  if (reorderable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={foods.map(f => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foods.map(food => (
              <FoodCardWrapper key={food.id} food={food} reorderable={true} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {foods.map(food => (
          <FoodCardWrapper key={food.id} food={food} reorderable={false} onDelete={onDeleteFood} />
        ))}
      </div>
    </div>
  );
}
