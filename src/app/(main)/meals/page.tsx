
"use client";

import { useState, useMemo } from 'react';
import { useMeals } from '@/context/MealContext';
import { useUIState } from '@/context/UIStateContext';
import { PageHeader } from '@/components/PageHeader';
import MealCard from '@/components/meal/MealCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UtensilsCrossed, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const { meals, setMeals } = useMeals();
  const { setMealBuilderOpen } = useUIState();
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredMeals = useMemo(
    () =>
      meals.filter((meal) =>
        meal.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [meals, searchTerm]
  );
  
  const isSearching = searchTerm.trim().length > 0;

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
    <>
      <PageHeader title={t('My Meals')}>
        <Button onClick={() => setMealBuilderOpen(true, 'all')}>
          <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
        </Button>
      </PageHeader>
      <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 -mb-4">
        <div className="container mx-auto px-4">
          <div className="relative py-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search for a meal...')}
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('Search for a meal...')}
            />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 flex-grow overflow-auto">
        <div className="py-4 pt-8 space-y-4">
          {filteredMeals.length > 0 ? (
             <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              id="meals-dnd-context"
            >
              <SortableContext items={meals.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMeals.map(meal => (
                    <MealCard key={meal.id} meal={meal} reorderable={!isSearching} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center mt-8 p-8 border-2 border-dashed rounded-lg">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
                <AlertTitle className="mt-4 text-xl font-semibold">{t('No Meals Saved')}</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground">
                  {isSearching ? t('No meals match your search.') : t('Create your first meal to see it here.')}
                </AlertDescription>
                {!isSearching && (
                  <Button className="mt-4" onClick={() => setMealBuilderOpen(true, 'all')}>
                      <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
