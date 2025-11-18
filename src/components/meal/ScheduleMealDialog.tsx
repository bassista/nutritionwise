
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/context/LocaleContext';
import { Meal } from '@/lib/types';
import { Search, Plus, Trash2 } from 'lucide-react';
import useAppStore from '@/context/AppStore';
import { cn } from '@/lib/utils';

interface ScheduleMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  currentMealId?: string | null;
  meals: Meal[];
  onScheduleMeal: (date: Date, mealId: string | null) => void;
}

export default function ScheduleMealDialog({
  open,
  onOpenChange,
  selectedDate,
  currentMealId,
  meals,
  onScheduleMeal,
}: ScheduleMealDialogProps) {
  const { t, locale } = useLocale();
  const { getMealById } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      setSearchTerm('');
    }
  }, [open]);

  const sortedMeals = useMemo(() => {
    return [...meals].sort((a, b) => a.name.localeCompare(b.name));
  }, [meals]);
  
  const filteredMeals = useMemo(() =>
    sortedMeals.filter(meal => 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [sortedMeals, searchTerm]
  );
  
  const currentMeal = currentMealId ? getMealById(currentMealId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>{t('Schedule Meal')}</DialogTitle>
          <DialogDescription>
            {format(selectedDate, 'EEEE, d MMMM', { locale: locale === 'it' ? it : undefined })}
          </DialogDescription>
        </DialogHeader>

        {currentMeal && (
          <div className="p-2 bg-muted rounded-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('Current Meal')}</p>
              <p className="text-sm text-primary">{currentMeal.name}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onScheduleMeal(selectedDate, null)}>
              <Trash2 className="h-4 w-4"/>
            </Button>
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('Search for a meal...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-grow border rounded-md">
          <div className="space-y-1 p-2">
            {filteredMeals.map(meal => (
              <div key={meal.id} className="flex items-center p-2 rounded-md hover:bg-muted/50">
                <span className="flex-grow text-sm">{meal.name}</span>
                <Button size="sm" variant="outline" onClick={() => onScheduleMeal(selectedDate, meal.id)}>
                  <Plus className="h-4 w-4 mr-1" /> {t('Select')}
                </Button>
              </div>
            ))}
            {filteredMeals.length === 0 && (
              <p className="text-center text-sm text-muted-foreground p-4">{t('No meals match your search.')}</p>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
