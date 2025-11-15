
"use client";

import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { useLocale } from '@/context/LocaleContext';
import { PageHeader } from '@/components/PageHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import FoodSelectorForMeal from '@/components/food/FoodSelectorForMeal';
import LogFoodDialog from '@/components/diary/LogFoodDialog';
import { Food, LoggedItem, MealType } from '@/lib/types';
import WaterTracker from '@/components/diary/WaterTracker';
import WeightTracker from '@/components/diary/WeightTracker';
import DailySummary from '@/components/diary/DailySummary';
import MealLog from '@/components/diary/MealLog';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import useAppStore from '@/context/AppStore';
import DiaryLogItem from '@/components/diary/DiaryLogItem';
import GlucoseTracker from '@/components/diary/GlucoseTracker';
import InsulinTracker from '@/components/diary/InsulinTracker';

export default function DiaryPage() {
    const { t, locale } = useLocale();
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    
    const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);
    const [isLogFoodDialogOpen, setLogFoodDialogOpen] = useState(false);
    const [foodToLog, setFoodToLog] = useState<Food | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<LoggedItem | null>(null);
    const { getFoodById, moveLogEntry } = useAppStore();

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

    const handleAddFoodClick = () => {
        setFoodSelectorOpen(true);
    };

    const handleSelectFood = (food: Food) => {
        setFoodToLog(food);
        setFoodSelectorOpen(false);
        setLogFoodDialogOpen(true);
    };
    
    const handleLogDialogClose = () => {
        setLogFoodDialogOpen(false);
        setFoodToLog(null);
    }
    
     const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = active.data.current?.item as LoggedItem;
        setActiveDragItem(item);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
    
        if (over && active.id !== over.id) {
          moveLogEntry(selectedDateString, String(active.id), String(over.id));
        }
    };


    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <PageHeader title={t('Food Diary')} />
            <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
                <div className="flex flex-wrap lg:flex-nowrap gap-6">
                    <div className="w-full lg:w-auto lg:min-w-[350px]">
                        <Card>
                            <CardContent className="p-2 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="w-full"
                                    locale={locale === 'it' ? it : undefined}
                                />
                            </CardContent>
                        </Card>
                         <WaterTracker selectedDate={selectedDateString} />
                         <WeightTracker selectedDate={selectedDateString} />
                         <GlucoseTracker selectedDate={selectedDateString} />
                         <InsulinTracker selectedDate={selectedDateString} />
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-6">
                       <DailySummary selectedDate={selectedDate} />
                       <MealLog 
                          selectedDateString={selectedDateString} 
                          onAddFoodClick={handleAddFoodClick}
                       />
                    </div>
                </div>
            </div>
             <FoodSelectorForMeal
                open={isFoodSelectorOpen}
                onOpenChange={setFoodSelectorOpen}
                onSelectFood={handleSelectFood}
                currentFoodIds={[]}
              />
              {foodToLog && (
                <LogFoodDialog
                    open={isLogFoodDialogOpen}
                    onOpenChange={handleLogDialogClose}
                    food={foodToLog}
                    mealType={'snack'} // Default to snack as sections are merged
                    selectedDateString={selectedDateString}
                    onLogSuccess={() => {
                      setLogFoodDialogOpen(false);
                      setFoodToLog(null);
                    }}
                />
              )}
               <DragOverlay>
                {activeDragItem ? (
                  <DiaryLogItem
                    item={activeDragItem}
                    food={getFoodById(activeDragItem.itemId)}
                    isDragging
                  />
                ) : null}
              </DragOverlay>
        </DndContext>
    );
}

    