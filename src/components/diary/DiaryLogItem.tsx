
"use client";

import { Food, LoggedItem } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import { calculateTotalNutrientsForItems, cn, getFoodName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import useAppStore from '@/context/AppStore';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface DiaryLogItemProps {
  item: LoggedItem;
  food?: Food;
  onRemove?: () => void;
  onClick?: () => void;
}

const DiaryLogItem = React.forwardRef<HTMLDivElement, DiaryLogItemProps>(
  ({ item, food, onRemove, onClick }, ref) => {
    const { getFoodById, getMealById } = useAppStore();
    const { locale } = useLocale();
    
    const itemNutrients = calculateTotalNutrientsForItems([item], getFoodById, getMealById);
    let fullName: string;
    
    if (item.type === 'meal') {
      fullName = getMealById(item.itemId)?.name || 'Unknown Meal';
    } else {
      fullName = food ? getFoodName(food, locale) : 'Unknown Food';
    }

    const displayName = fullName.length > 16 ? `${fullName.substring(0, 13)}...` : fullName;

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent click event from bubbling up to the div
        onRemove?.();
    };

    return (
        <div ref={ref} onClick={onClick} className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/50", !!onClick && "cursor-pointer hover:bg-muted")}>
            <div className="flex-grow">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <p className="font-medium truncate">{displayName}</p>
                        </TooltipTrigger>
                         {displayName !== fullName && (
                            <TooltipContent>
                                <p>{fullName}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                <p className="text-sm text-muted-foreground">{item.grams ? `${item.grams}g` : ''} {itemNutrients.calories.toFixed(0)} kcal</p>
            </div>
            {onRemove && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveClick}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
        </div>
    );
});

DiaryLogItem.displayName = 'DiaryLogItem';

export default DiaryLogItem;
