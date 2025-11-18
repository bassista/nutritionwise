
"use client";

import { useState, useEffect } from 'react';
import { format, startOfToday, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { useLocale } from '@/context/LocaleContext';
import { PageHeader } from '@/components/PageHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import FoodSelectorForMeal from '@/components/food/FoodSelectorForMeal';
import LogFoodDialog from '@/components/diary/LogFoodDialog';
import EditLogItemDialog from '@/components/diary/EditLogItemDialog';
import { Food, LoggedItem, MealType } from '@/lib/types';
import WaterTracker from '@/components/diary/WaterTracker';
import DailySummary from '@/components/diary/DailySummary';
import MealLog from '@/components/diary/MealLog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useAppStore from '@/context/AppStore';
import { useToast } from '@/hooks/use-toast';

export default function DiaryPage() {
    const { t, locale } = useLocale();
    const {
        mealSchedule,
        getMealById,
        addLogEntry,
        settings,
        updateSettings,
        dailyLogs
    } = useAppStore();
    const { toast } = useToast();

    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    
    const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);
    const [isLogFoodDialogOpen, setLogFoodDialogOpen] = useState(false);
    const [isEditLogItemDialogOpen, setEditLogItemDialogOpen] = useState(false);
    const [foodToLog, setFoodToLog] = useState<Food | null>(null);
    const [itemToEdit, setItemToEdit] = useState<LoggedItem | null>(null);

    const [showMealLogDialog, setShowMealLogDialog] = useState(false);
    const [mealToLog, setMealToLog] = useState<{ id: string, name: string } | null>(null);

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        const today = format(startOfToday(), 'yyyy-MM-dd');
        const isTodaySelected = isSameDay(selectedDate, startOfToday());
        
        // Specific check for food logs
        const todaysLog = dailyLogs[today];
        const dayHasFoodLogs = todaysLog && (
            (todaysLog.breakfast && todaysLog.breakfast.length > 0) ||
            (todaysLog.lunch && todaysLog.lunch.length > 0) ||
            (todaysLog.dinner && todaysLog.dinner.length > 0) ||
            (todaysLog.snack && todaysLog.snack.length > 0)
        );

        if (!isTodaySelected || settings.lastCheckedDateForMealLog === today || dayHasFoodLogs) {
            return;
        }

        const mealId = mealSchedule[today];
        const meal = mealId ? getMealById(mealId) : null;

        if (meal) {
            setMealToLog({ id: meal.id, name: meal.name });
            setShowMealLogDialog(true);
        } else {
            // Mark as checked for today even if there's no meal, to prevent re-checking on every navigation.
            updateSettings({ lastCheckedDateForMealLog: today });
        }
    }, [selectedDate, mealSchedule, getMealById, settings.lastCheckedDateForMealLog, updateSettings, dailyLogs]);

    const handleLogScheduledMeal = () => {
        if (!mealToLog) return;

        const today = format(startOfToday(), 'yyyy-MM-dd');
        const meal = getMealById(mealToLog.id);
        
        if (meal) {
            const itemsToAdd = meal.foods.map(food => ({
                type: 'food' as const,
                itemId: food.foodId,
                grams: food.grams,
            }));
            addLogEntry(today, 'snack', itemsToAdd); // Defaulting to snack
            toast({
                title: t('Meal Added to Diary'),
                description: t('The ingredients for "{mealName}" have been added to your diary.', { mealName: meal.name }),
            });
        }
        
        handleCloseMealLogDialog();
    };

    const handleCloseMealLogDialog = () => {
        const today = format(startOfToday(), 'yyyy-MM-dd');
        updateSettings({ lastCheckedDateForMealLog: today });
        setShowMealLogDialog(false);
        setMealToLog(null);
    };

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

    const handleEditItemClick = (item: LoggedItem) => {
        setItemToEdit(item);
        setEditLogItemDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditLogItemDialogOpen(false);
        setItemToEdit(null);
    };

    return (
        <>
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
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-6">
                       <DailySummary selectedDate={selectedDate} />
                       <MealLog 
                          selectedDateString={selectedDateString} 
                          onAddFoodClick={handleAddFoodClick}
                          onEditItemClick={handleEditItemClick}
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
              {itemToEdit && (
                  <EditLogItemDialog
                      open={isEditLogItemDialogOpen}
                      onOpenChange={handleEditDialogClose}
                      item={itemToEdit}
                      selectedDateString={selectedDateString}
                      onLogSuccess={handleEditDialogClose}
                  />
              )}
              {mealToLog && (
                 <AlertDialog open={showMealLogDialog} onOpenChange={setShowMealLogDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("Log Today's Meal?")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("Today's scheduled meal is \"{mealName}\". Would you like to add its ingredients to your diary?", { mealName: mealToLog.name })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCloseMealLogDialog}>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogScheduledMeal}>{t('Log Meal')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
        </>
    );
}
