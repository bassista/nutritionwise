
"use client";

import { useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { MealType } from '@/lib/types';
import { getFoodName, calculateTotalNutrientsForItems } from '@/lib/utils';

interface MealLogProps {
    selectedDateString: string;
    onAddFoodClick: (mealType: MealType) => void;
}

export default function MealLog({ selectedDateString, onAddFoodClick }: MealLogProps) {
    const { dailyLogs, removeLogEntry, getFoodById, getMealById } = useAppStore();
    const { t, locale } = useLocale();

    const todaysLog = useMemo(() => dailyLogs[selectedDateString] || {}, [dailyLogs, selectedDateString]);

    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealTypeTranslations: Record<MealType, string> = {
        breakfast: t('Breakfast'),
        lunch: t('Lunch'),
        dinner: t('Dinner'),
        snack: t('Snacks')
    };

    return (
        <Accordion type="multiple" defaultValue={mealTypes} className="w-full">
            {mealTypes.map(mealType => {
                const loggedItems = todaysLog[mealType] || [];
                return (
                    <AccordionItem value={mealType} key={mealType}>
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full">
                                <span className="text-lg font-semibold">{mealTypeTranslations[mealType]}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3">
                                {loggedItems.length > 0 ? (
                                    loggedItems.map(item => {
                                        const name = item.type === 'food' 
                                            ? getFoodName(getFoodById(item.itemId)!, locale)
                                            : getMealById(item.itemId)?.name || '';
                                        const itemNutrients = calculateTotalNutrientsForItems([item], getFoodById, getMealById);
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
                                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => onAddFoodClick(mealType)}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    );
}
