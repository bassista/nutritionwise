
"use client";

import { useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Plus, Utensils } from 'lucide-react';
import { MealType } from '@/lib/types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DiaryLogItem from './DiaryLogItem';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface MealLogProps {
    selectedDateString: string;
    onAddFoodClick: () => void;
}

export default function MealLog({ selectedDateString, onAddFoodClick }: MealLogProps) {
    const { dailyLogs, removeLogEntry, getFoodById } = useAppStore();
    const { t } = useLocale();

    const todaysLog = useMemo(() => dailyLogs[selectedDateString] || {}, [dailyLogs, selectedDateString]);

    const allLoggedItems = useMemo(() => {
        return (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
            .flatMap(mealType => todaysLog[mealType] || [])
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [todaysLog]);

    // This function is needed to find the original mealType when removing an item.
    // This is a temporary workaround due to the data structure.
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
                <SortableContext items={allLoggedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {allLoggedItems.length > 0 ? (
                            allLoggedItems.map((item, index) => (
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
                </SortableContext>
            </CardContent>
        </Card>
    );
}

    