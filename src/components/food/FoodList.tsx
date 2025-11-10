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
  allFoodIds?: string[]; // The complete list of IDs for reordering
}

export default function FoodList({ foods, reorderable = false, onReorder, onDeleteFood, allFoodIds }: FoodListProps) {
  const { t } = useLocale();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const reorderableIds = allFoodIds || foods.map(f => f.id);

    if (over && active.id !== over.id) {
      const oldIndex = reorderableIds.findIndex((id) => id === active.id);
      const newIndex = reorderableIds.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(reorderableIds, oldIndex, newIndex);
        onReorder?.(newOrder);
      }
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
    const dndIds = allFoodIds || foods.map(f => f.id);
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dndIds} strategy={rectSortingStrategy}>
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
