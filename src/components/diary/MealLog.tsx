
"use client";

import { useMemo, useState } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Plus, Utensils, MoreVertical, Copy, Trash2, CalendarClock, RotateCcw } from 'lucide-react';
import { LoggedItem, MealType } from '@/lib/types';
import DiaryLogItem from './DiaryLogItem';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { getFoodName } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';


interface MealLogProps {
    selectedDateString: string;
    onAddFoodClick: () => void;
    onEditItemClick: (item: LoggedItem) => void;
}

export default function MealLog({ selectedDateString, onAddFoodClick, onEditItemClick }: MealLogProps) {
    const { dailyLogs, removeLogEntry, getFoodById, copyLogFromDate, clearLog } = useAppStore();
    const { t, locale } = useLocale();
    const { toast } = useToast();
    
    const [isCopyFromXDaysOpen, setCopyFromXDaysOpen] = useState(false);
    const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [daysToGoBack, setDaysToGoBack] = useState(1);

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
    
    const handleCopy = (days: number) => {
        const sourceDate = format(subDays(new Date(selectedDateString), days), 'yyyy-MM-dd');
        const result = copyLogFromDate(sourceDate, selectedDateString);

        if (result.success) {
            toast({ title: t('Diary Copied'), description: t('Items from {date} have been copied.', { date: sourceDate }) });
        } else {
            toast({ variant: 'destructive', title: t('Copy Failed'), description: t(result.message) });
        }
    };
    
    const handleCopyFromX = () => {
        if (daysToGoBack > 0) {
            handleCopy(daysToGoBack);
            setCopyFromXDaysOpen(false);
        }
    };

    const handleClear = () => {
        clearLog(selectedDateString);
        toast({ title: t('Diary Cleared') });
        setClearConfirmOpen(false);
    };

    return (
      <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center w-full">
                    <CardTitle>
                        <span className="text-lg font-semibold">{t('Daily Meal')}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopy(1)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            <span>{t('Copy from yesterday')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(7)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>{t('Copy from last week')}</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => { setDaysToGoBack(1); setCopyFromXDaysOpen(true); }}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>{t("Copy from 'X' days ago...")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setClearConfirmOpen(true)} className="text-destructive" disabled={allLoggedItems.length === 0}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t('Empty Meal')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
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
        
        <Dialog open={isCopyFromXDaysOpen} onOpenChange={setCopyFromXDaysOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("Copy from 'X' days ago...")}</DialogTitle>
                    <DialogDescription>{t('Enter the number of days to go back to copy the diary from.')}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        type="number" 
                        value={daysToGoBack}
                        onChange={e => setDaysToGoBack(parseInt(e.target.value))}
                        min="1"
                        onKeyDown={(e) => e.key === 'Enter' && handleCopyFromX()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setCopyFromXDaysOpen(false)}>{t('Cancel')}</Button>
                    <Button onClick={handleCopyFromX}>{t('Copy')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isClearConfirmOpen} onOpenChange={setClearConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('This will remove all food items from the selected day.')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">{t('Empty')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
