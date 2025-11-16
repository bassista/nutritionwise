
"use client";

import { useState } from 'react';
import type { Food } from '@/lib/types';
import FoodCardWrapper from './FoodCard';
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

interface FoodListProps {
  foods: Food[];
  onReorder?: (activeId: string, overId: string) => void;
  onDeleteFood?: (foodId: string) => void;
  onEditFood?: (food: Food) => void;
  onAddToDiary?: (food: Food) => void;
}

export default function FoodList({ foods, onReorder, onDeleteFood, onEditFood, onAddToDiary }: FoodListProps) {
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
      onReorder?.(String(active.id), String(over.id));
    }
  }

  if (foods.length === 0) {
    return null;
  }
  
  if (onReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={foods.map(f => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foods.map(food => (
              <FoodCardWrapper key={food.id} food={food} reorderable={true} onEdit={onEditFood} onDelete={onDeleteFood} onAddToDiary={onAddToDiary} />
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
          <FoodCardWrapper key={food.id} food={food} reorderable={false} onDelete={onDeleteFood} onEdit={onEditFood} onAddToDiary={onAddToDiary} />
        ))}
      </div>
    </div>
  );
}
