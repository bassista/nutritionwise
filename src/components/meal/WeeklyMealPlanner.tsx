
"use client";

import { useState, useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ListPlus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WeeklyMealPlannerProps {
  onGenerateList: (mealIds: string[]) => void;
  activeDragId: string | null;
}

export default function WeeklyMealPlanner({ onGenerateList, activeDragId }: WeeklyMealPlannerProps) {
  const { mealSchedule, getMealById, scheduleMeal } = useAppStore();
  const { t, locale } = useLocale();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStartsOn = locale === 'it' ? 1 : 0;
  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate, weekStartsOn]);

  const handleDrop = (date: Date, mealId: string) => {
    scheduleMeal(format(date, 'yyyy-MM-dd'), mealId);
  };
  
  const handleGenerate = () => {
    const mealIds = week.map(day => mealSchedule[format(day, 'yyyy-MM-dd')]).filter(Boolean) as string[];
    onGenerateList(mealIds);
  };

  return (
    <Card className="mt-6">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle>{t('Weekly Meal Plan')}</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subDays(currentDate, 7))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 px-2" onClick={() => setCurrentDate(new Date())}>{t('Today')}</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleGenerate} size="sm" className="h-8">
                        <ListPlus className="h-4 w-4 mr-2"/>
                        {t('Generate Weekly Shopping List')}
                    </Button>
                </div>
            </div>
        </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {week.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const mealId = mealSchedule[dateKey];
            const meal = mealId ? getMealById(mealId) : undefined;
            const isDraggingOverMeal = activeDragId?.startsWith('meal-');
            
            const { setNodeRef, isOver } = useDroppable({
              id: `day-${dateKey}`,
              data: { date: day },
            });

            return (
              <TooltipProvider key={dateKey}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      ref={setNodeRef}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-2 border rounded-md min-h-[80px] transition-colors text-center",
                        isOver && isDraggingOverMeal ? 'bg-primary/20 border-primary' : 'bg-muted/50',
                        isSameDay(day, new Date()) && 'border-primary'
                      )}
                      onClick={() => {
                        if (meal) {
                            alert(meal.name);
                        }
                      }}
                    >
                      <p className="text-xs sm:text-sm font-semibold capitalize">
                        {format(day, 'eeee', { locale: locale === 'it' ? it : undefined })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(day, 'd MMM')}
                      </p>
                      {meal && (
                        <p className="text-xs font-bold mt-1 truncate max-w-full">
                          {meal.name}
                        </p>
                      )}
                    </div>
                  </TooltipTrigger>
                  {meal && (
                    <TooltipContent>
                      <p>{meal.name}</p>
                    </TooltipContent>
                  )}
                   {!meal && (
                    <TooltipContent>
                      <p>{t('Drag meals here to plan your week')}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
