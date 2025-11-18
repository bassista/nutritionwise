
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
import ScheduleMealDialog from './ScheduleMealDialog';
import { useToast } from '@/hooks/use-toast';

interface WeeklyMealPlannerProps {
  onGenerateList: (mealIds: string[]) => void;
  activeDragId: string | null;
}

export default function WeeklyMealPlanner({ onGenerateList, activeDragId }: WeeklyMealPlannerProps) {
  const { mealSchedule, getMealById, meals, scheduleMeal } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStartsOn = locale === 'it' ? 1 : 0;
  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate, weekStartsOn]);

  const handleGenerate = () => {
    const mealIds = week.map(day => mealSchedule[format(day, 'yyyy-MM-dd')]).filter(Boolean) as string[];
    onGenerateList(mealIds);
     toast({
      title: t('List Generated'),
      description: t('The weekly shopping list has been updated.'),
    })
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsScheduling(true);
  };

  const handleScheduleMeal = (date: Date, mealId: string | null) => {
    const dateString = format(date, 'yyyy-MM-dd');
    scheduleMeal(dateString, mealId);
    setIsScheduling(false);
  };

  return (
    <>
      <Card className="mt-6">
          <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle>{t('Weekly Meal Plan')}</CardTitle>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subDays(currentDate, 7))}>
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="h-8 px-2" onClick={() => setCurrentDate(new Date())}>{t('Today')}</Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleGenerate} size="sm" className="h-8 flex-grow sm:flex-grow-0">
                          <ListPlus className="h-4 w-4 mr-2"/>
                          {t('Generate Weekly List')}
                      </Button>
                  </div>
              </div>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {week.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const mealId = mealSchedule[dateKey];
              const isDraggingMeal = activeDragId !== null;
              
              const { setNodeRef, isOver } = useDroppable({
                id: `day-${dateKey}`,
                data: { date: day },
              });

              let meal = mealId ? getMealById(mealId) : undefined;
              if (isOver && activeDragId) {
                meal = getMealById(activeDragId) || meal;
              }

              return (
                <TooltipProvider key={dateKey}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        ref={setNodeRef}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-2 border rounded-md min-h-[80px] transition-colors text-center cursor-pointer",
                          isOver && isDraggingMeal ? 'bg-primary/20 border-primary' : 'bg-muted/50',
                          isSameDay(day, new Date()) && 'border-primary'
                        )}
                      >
                        <p className="w-full truncate text-xs sm:text-sm font-semibold capitalize">
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
                    {meal ? (
                      <TooltipContent>
                        <p>{meal.name}</p>
                      </TooltipContent>
                    ) : (
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

      {selectedDate && (
        <ScheduleMealDialog
          open={isScheduling}
          onOpenChange={setIsScheduling}
          selectedDate={selectedDate}
          currentMealId={mealSchedule[format(selectedDate, 'yyyy-MM-dd')]}
          meals={meals}
          onScheduleMeal={handleScheduleMeal}
        />
      )}
    </>
  );
}
