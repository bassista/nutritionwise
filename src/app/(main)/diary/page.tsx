
"use client";

import { useState, useMemo, useCallback } from 'react';
import { format, startOfToday, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';
import { useLocale } from '@/context/LocaleContext';
import { PageHeader } from '@/components/PageHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import FoodSelectorForMeal from '@/components/meal/FoodSelectorForMeal';
import LogFoodDialog from '@/components/diary/LogFoodDialog';
import { Food, Meal, LoggedItem, MealType } from '@/lib/types';
import { getFoodName, cn } from '@/lib/utils';
import WaterTracker from '@/components/diary/WaterTracker';
import { calculateMealScore, calculateDailyScore } from '@/lib/scoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const calculateTotalNutrients = (
    items: LoggedItem[], 
    getFoodById: (id: string) => Food | undefined, 
    getMealById: (id: string) => Meal | undefined
) => {
    const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    items.forEach(loggedItem => {
        if (loggedItem.type === 'food') {
            const food = getFoodById(loggedItem.itemId);
            if (food) {
                const factor = (loggedItem.grams || food.serving_size_g || 100) / (food.serving_size_g || 100);
                totals.calories += (food.calories || 0) * factor;
                totals.protein += (food.protein || 0) * factor;
                totals.carbohydrates += (food.carbohydrates || 0) * factor;
                totals.fat += (food.fat || 0) * factor;
                totals.fiber += (food.fiber || 0) * factor;
                totals.sugar += (food.sugar || 0) * factor;
                totals.sodium += (food.sodium || 0) * factor;
            }
        } else if (loggedItem.type === 'meal') {
            const meal = getMealById(loggedItem.itemId);
            if (meal) {
                meal.foods.forEach(mealFood => {
                    const food = getFoodById(mealFood.foodId);
                    if (food) {
                        const factor = mealFood.grams / (food.serving_size_g || 100);
                        totals.calories += (food.calories || 0) * factor;
                        totals.protein += (food.protein || 0) * factor;
                        totals.carbohydrates += (food.carbohydrates || 0) * factor;
                        totals.fat += (food.fat || 0) * factor;
                        totals.fiber += (food.fiber || 0) * factor;
                        totals.sugar += (food.sugar || 0) * factor;
                        totals.sodium += (food.sodium || 0) * factor;
                    }
                });
            }
        }
    });
    return totals;
};


export default function DiaryPage() {
    const { settings, dailyLogs, getFoodById, getMealById, addLogEntry, removeLogEntry } = useAppContext();
    const { t, locale } = useLocale();
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    
    const [isFoodSelectorOpen, setFoodSelectorOpen] = useState(false);
    const [isLogFoodDialogOpen, setLogFoodDialogOpen] = useState(false);
    const [foodToLog, setFoodToLog] = useState<Food | null>(null);
    const [mealTypeToAdd, setMealTypeToAdd] = useState<MealType | null>(null);

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    const goals = settings.nutritionalGoals;

    const todaysLog = useMemo(() => dailyLogs[selectedDateString] || {}, [dailyLogs, selectedDateString]);

    const allLoggedItems = useMemo(() => {
      const foodItems = (Object.entries(todaysLog)
        .filter(([key]) => key !== 'waterIntakeMl')
        .flatMap(([, value]) => value) as LoggedItem[]) || [];
      return foodItems;
    }, [todaysLog]);

    const totalNutrients = useMemo(() => {
        return calculateTotalNutrients(allLoggedItems, getFoodById, getMealById);
    }, [allLoggedItems, getFoodById, getMealById]);
    
    const dailyScore = useMemo(() => {
        return calculateDailyScore(totalNutrients, goals);
    }, [totalNutrients, goals]);

    const handleAddFoodClick = (mealType: MealType) => {
        setMealTypeToAdd(mealType);
        setFoodSelectorOpen(true);
    };

    const handleSelectFood = (food: Food) => {
        setFoodToLog(food);
        setFoodSelectorOpen(false);
        setLogFoodDialogOpen(true);
    };
    
    const handleLogFood = (food: Food, grams: number) => {
        if (mealTypeToAdd) {
            addLogEntry(selectedDateString, mealTypeToAdd, { type: 'food', itemId: food.id, grams });
        }
        setLogFoodDialogOpen(false);
        setFoodToLog(null);
        setMealTypeToAdd(null);
    };

    const handleLogDialogClose = () => {
        setLogFoodDialogOpen(false);
        setFoodToLog(null);
    }

    const nutrientProgress = [
        { name: t('Calories'), value: totalNutrients.calories, goal: goals.calories, unit: 'kcal' },
        { name: t('Protein'), value: totalNutrients.protein, goal: goals.protein, unit: 'g' },
        { name: t('Carbohydrates'), value: totalNutrients.carbohydrates, goal: goals.carbohydrates, unit: 'g' },
        { name: t('Fat'), value: totalNutrients.fat, goal: goals.fat, unit: 'g' },
        { name: t('Fiber'), value: totalNutrients.fiber, goal: goals.fiber, unit: 'g' },
        { name: t('Sugar'), value: totalNutrients.sugar, goal: goals.sugar, unit: 'g' },
        { name: t('Sodium'), value: totalNutrients.sodium, goal: goals.sodium, unit: 'mg' },
    ];
    
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealTypeTranslations: Record<MealType, string> = {
        breakfast: t('Breakfast'),
        lunch: t('Lunch'),
        dinner: t('Dinner'),
        snack: t('Snacks')
    };
    
    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('Food Diary')} />
            <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <Card>
                            <CardContent className="p-2">
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
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{t('Daily Summary')} - {format(selectedDate, 'PPP', { locale: locale === 'it' ? it : undefined })}</CardTitle>
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
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

                        <Accordion type="multiple" defaultValue={mealTypes} className="w-full">
                            {mealTypes.map(mealType => {
                                const mealItems = todaysLog[mealType] || [];
                                const mealNutrients = calculateTotalNutrients(mealItems, getFoodById, getMealById);
                                const mealScore = calculateMealScore(mealNutrients, goals);

                                return (
                                <AccordionItem value={mealType} key={mealType}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-lg font-semibold">{mealTypeTranslations[mealType]}</span>
                                            {mealItems.length > 0 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                                                            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm mr-2", mealScore.color)}>
                                                                {mealScore.grade}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Meal Score')}: {mealScore.percentage}%</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            {todaysLog[mealType] && todaysLog[mealType]!.length > 0 ? (
                                                todaysLog[mealType]!.map(item => {
                                                    const name = item.type === 'food' 
                                                        ? getFoodName(getFoodById(item.itemId)!, locale)
                                                        : getMealById(item.itemId)?.name || '';
                                                    const itemNutrients = calculateTotalNutrients([item], getFoodById, getMealById);
                                                    return (
                                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                            <div>
                                                                <p className="font-medium">{name}</p>
                                                                <p className="text-sm text-muted-foreground">{item.grams ? `${item.grams}g` : ''} {itemNutrients.calories.toFixed(0)} kcal</p>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLogEntry(selectedDateString, mealType, item.id)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-sm text-muted-foreground">{t('Nothing logged yet.')}</p>
                                            )}
                                            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleAddFoodClick(mealType)}>
                                                <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                )
                            })}
                        </Accordion>
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
                    onLog={handleLogFood}
                />
              )}
        </div>
    );
}
