
"use client";

import { useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoggedItem } from '@/lib/types';
import { cn, calculateTotalNutrientsForItems } from '@/lib/utils';
import { calculateDailyScore } from '@/lib/scoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DailySummaryProps {
    selectedDate: Date;
}

export default function DailySummary({ selectedDate }: DailySummaryProps) {
    const { settings, dailyLogs, getFoodById, getMealById } = useAppStore();
    const { t, locale } = useLocale();

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    const goals = settings.nutritionalGoals;

    const todaysLog = useMemo(() => dailyLogs[selectedDateString] || {}, [dailyLogs, selectedDateString]);

    const allLoggedItems = useMemo(() => {
      const foodItems = (Object.entries(todaysLog)
        .filter(([key]) => key !== 'waterIntakeMl' && key !== 'weight')
        .flatMap(([, value]) => value) as LoggedItem[]) || [];
      return foodItems;
    }, [todaysLog]);

    const totalNutrients = useMemo(() => {
        return calculateTotalNutrientsForItems(allLoggedItems, getFoodById, getMealById);
    }, [allLoggedItems, getFoodById, getMealById]);
    
    const dailyScore = useMemo(() => {
        return calculateDailyScore(totalNutrients, goals);
    }, [totalNutrients, goals]);

    const nutrientProgress = [
        { name: t('Calories'), value: totalNutrients.calories, goal: goals.calories, unit: 'kcal' },
        { name: t('Protein'), value: totalNutrients.protein, goal: goals.protein, unit: 'g' },
        { name: t('Carbohydrates'), value: totalNutrients.carbohydrates, goal: goals.carbohydrates, unit: 'g' },
        { name: t('Fat'), value: totalNutrients.fat, goal: goals.fat, unit: 'g' },
        { name: t('Fiber'), value: totalNutrients.fiber, goal: goals.fiber, unit: 'g' },
        { name: t('Sugar'), value: totalNutrients.sugar, goal: goals.sugar, unit: 'g' },
        { name: t('Sodium'), value: totalNutrients.sodium, goal: goals.sodium, unit: 'mg' },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{t('Daily Summary')} - {format(selectedDate, 'PPP', { locale: locale === 'it' ? it : undefined })}</CardTitle>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                    <div className={cn("flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-xl", dailyScore.color)}>
                                    {dailyScore.grade}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Daily Score')}: {dailyScore.percentage}%</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {nutrientProgress.map(n => (
                    <div key={n.name}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{n.name}</span>
                            <span className="text-muted-foreground">{n.value.toFixed(0)}{n.unit} / {n.goal}{n.unit}</span>
                        </div>
                        <Progress value={(n.value / (n.goal || 1)) * 100} />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
