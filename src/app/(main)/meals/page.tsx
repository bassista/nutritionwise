
"use client";

import { useAppContext } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import MealCard from '@/components/meal/MealCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Meal } from '@/lib/types';

export default function MealsPage() {
  const { meals, setMeals, setMealBuilderOpen } = useAppContext();
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
      const oldIndex = meals.findIndex((m) => m.id === active.id);
      const newIndex = meals.findIndex((m) => m.id === over.id);
      const newOrder = arrayMove(meals, oldIndex, newIndex);
      setMeals(newOrder);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('My Meals')}>
        <Button onClick={() => setMealBuilderOpen(true)} className="hidden md:inline-flex">
          <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
        </Button>
      </PageHeader>
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 space-y-4">
          {meals.length > 0 ? (
             <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={meals.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meals.map(meal => (
                    <MealCard key={meal.id} meal={meal} reorderable />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center mt-8 p-8 border-2 border-dashed rounded-lg">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
                <AlertTitle className="mt-4 text-xl font-semibold">{t('No Meals Saved')}</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground">
                  {t('Create your first meal to see it here.')}
                </AlertDescription>
                <Button className="mt-4" onClick={() => setMealBuilderOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
                </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
