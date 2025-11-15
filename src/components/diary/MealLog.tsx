
"use client";

import { useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Plus, Utensils } from 'lucide-react';
import { LoggedItem, MealType } from '@/lib/types';
import DiaryLogItem from './DiaryLogItem';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { getFoodName } from '@/lib/utils';

interface MealLogProps {
    selectedDateString: string;
    onAddFoodClick: () => void;
    onEditItemClick: (item: LoggedItem) => void;
}

export default function MealLog({ selectedDateString, onAddFoodClick, onEditItemClick }: MealLogProps) {
    const { dailyLogs, removeLogEntry, getFoodById } = useAppStore();
    const { t, locale } = useLocale();

    const todaysLog = useMemo(() => dailyLogs[selectedDateString] || {}, [dailyLogs, selectedDateString]);

    const allLoggedItems = useMemo(() => {
        return (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
            .flatMap(mealType => todaysLog[mealType] || [])
            .sort((a, b) => {
                const foodA = getFoodById(a.itemId);
                const foodB = getFoodById(b.itemId);
                if (!foodA || !foodB) return 0;
                return getFoodName(foodA, locale).localeCompare(getFoodName(foodB, locale));
            });
    }, [todaysLog, getFoodById, locale]);

    const findMealTypeForItem = (logId: string): MealType | undefined => {
        for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
            if (todaysLog[mealType]?.some(item => item.id === logId)) {
                return mealType;
            }
        }
        return undefined;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex justify-between items-center w-full">
                        <span className="text-lg font-semibold">{t('Daily Meal')}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {allLoggedItems.length > 0 ? (
                        allLoggedItems.map((item) => (
                            <DiaryLogItem
                                key={item.id}
                                item={item}
                                food={getFoodById(item.itemId)}
                                onRemove={() => {
                                    const mealType = findMealTypeForItem(item.id);
                                    if (mealType) {
                                        removeLogEntry(selectedDateString, mealType, item.id);
                                    }
                                }}
                                onClick={() => onEditItemClick(item)}
                            />
                        ))
                    ) : (
                        <div className="text-sm text-center text-muted-foreground py-4 flex flex-col items-center gap-2">
                            <Utensils className="w-8 h-8" />
                            <p>{t('Nothing logged yet.')}</p>
                        </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={onAddFoodClick}>
                        <Plus className="mr-2 h-4 w-4" /> {t('Add Food')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
