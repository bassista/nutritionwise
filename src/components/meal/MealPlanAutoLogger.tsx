
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { format, startOfToday } from 'date-fns';
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
import { useToast } from '@/hooks/use-toast';

export default function MealPlanAutoLogger() {
    const { mealSchedule, getMealById, addLogEntry, settings, updateSettings } = useAppStore();
    const { t } = useLocale();
    const { toast } = useToast();
    const [showDialog, setShowDialog] = useState(false);
    const [mealToLog, setMealToLog] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const today = format(startOfToday(), 'yyyy-MM-dd');
        if (settings.lastCheckedDateForMealLog === today) {
            return; // Already checked today
        }

        const mealId = mealSchedule[today];
        const meal = mealId ? getMealById(mealId) : null;

        if (meal) {
            setMealToLog({ id: meal.id, name: meal.name });
            setShowDialog(true);
        } else {
             // Mark as checked even if there's no meal to prevent re-checking
            updateSettings({ lastCheckedDateForMealLog: today });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mealSchedule]); // Only re-run when mealSchedule changes

    const handleLogMeal = () => {
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
        
        handleClose();
    };

    const handleClose = () => {
        const today = format(startOfToday(), 'yyyy-MM-dd');
        updateSettings({ lastCheckedDateForMealLog: today });
        setShowDialog(false);
        setMealToLog(null);
    };

    if (!showDialog || !mealToLog) {
        return null;
    }

    return (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("Log Today's Meal?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("Today's scheduled meal is \"{mealName}\". Would you like to add its ingredients to your diary?", { mealName: mealToLog.name })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose}>{t('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogMeal}>{t('Log Meal')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
