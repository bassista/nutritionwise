
"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Food, LoggedItem, MealType } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import { calculateTotalNutrientsForItems, cn, getFoodName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import useAppStore from '@/context/AppStore';
import React from 'react';

interface DiaryLogItemProps {
  item: LoggedItem;
  food?: Food;
  onRemove?: () => void;
  isDragging?: boolean;
}

const DiaryLogItem = React.forwardRef<HTMLDivElement, DiaryLogItemProps>(
  ({ item, food, onRemove, isDragging }, ref) => {
    const { getFoodById, getMealById } = useAppStore();
    const { locale } = useLocale();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting,
    } = useSortable({
        id: item.id,
        data: { item },
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSorting ? 0.5 : 1,
    };
    
    const itemNutrients = calculateTotalNutrientsForItems([item], getFoodById, getMealById);
    let name: string;
    
    if (item.type === 'meal') {
      name = getMealById(item.itemId)?.name || 'Unknown Meal';
    } else {
      name = food ? getFoodName(food, locale) : 'Unknown Food';
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div ref={ref} className={cn("flex items-center gap-2 p-2 rounded-md", isDragging ? "bg-card shadow-lg" : "bg-muted/50")}>
                <div {...listeners} className="cursor-grab touch-none p-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-grow">
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{item.grams ? `${item.grams}g` : ''} {itemNutrients.calories.toFixed(0)} kcal</p>
                </div>
                {onRemove && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
        </div>
    );
});

DiaryLogItem.displayName = 'DiaryLogItem';

export default DiaryLogItem;

    