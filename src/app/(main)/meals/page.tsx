
"use client";

import { useState, useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { useUIState } from '@/context/UIStateContext';
import { PageHeader } from '@/components/PageHeader';
import MealCard from '@/components/meal/MealCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UtensilsCrossed, Plus, Search, Rows, Grid, ListPlus } from 'lucide-react';
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
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import type { Meal } from '@/lib/types';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import WeeklyMealPlanner from '@/components/meal/WeeklyMealPlanner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function MealsPage() {
  const { meals, setMeals, generateWeeklyShoppingList, scheduleMeal } = useAppStore();
  const { setMealBuilderOpen } = useUIState();
  const { t } = useLocale();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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
  const isReorderable = !isSearching;


  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;
    
    // Case 1: Dragging a meal onto a day in the weekly planner
    if (String(over.id).startsWith('day-')) {
        const meal = active.data.current?.meal as Meal | undefined;
        const date = over.data.current?.date as Date | undefined;
        if (meal && date) {
            scheduleMeal(format(date, 'yyyy-MM-dd'), meal.id);
            return;
        }
    }

    // Case 2: Reordering meals in the list
    if (isReorderable && active.id !== over.id) {
        const oldIndex = meals.findIndex((m) => m.id === active.id);
        const newIndex = meals.findIndex((m) => m.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(meals, oldIndex, newIndex);
            setMeals(newOrder);
        }
    }
  }

  const handleGenerateList = (mealIds: string[]) => {
    generateWeeklyShoppingList(mealIds, t('Weekly Plan'));
    toast({
      title: t('Shopping List Generated'),
      description: t('A new shopping list has been created for your weekly plan.'),
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      id="meals-dnd-context"
    >
      <PageHeader title={t('My Meals')}>
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                            {isCollapsed ? <Grid /> : <Rows />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isCollapsed ? t('Grid View') : t('List View')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button onClick={() => setMealBuilderOpen(true, 'all')}>
              <Plus className="mr-2 h-4 w-4" /> {t('Create Meal')}
            </Button>
        </div>
      </PageHeader>
      
      <div className="container mx-auto px-4 flex-grow overflow-auto">
        <WeeklyMealPlanner onGenerateList={handleGenerateList} activeDragId={activeDragId} />

        <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 -mb-4 mt-6">
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

        <div className="py-4 pt-8 space-y-4">
          {filteredMeals.length > 0 ? (
             <SortableContext items={filteredMeals.map(m => m.id)} strategy={isCollapsed ? verticalListSortingStrategy : rectSortingStrategy} disabled={!isReorderable}>
                <div className={cn(
                    "grid gap-4",
                    isCollapsed ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {filteredMeals.map(meal => (
                    <MealCard key={meal.id} meal={meal} isReorderable={isReorderable} isCollapsed={isCollapsed} />
                  ))}
                </div>
              </SortableContext>
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
    </DndContext>
  );
}
