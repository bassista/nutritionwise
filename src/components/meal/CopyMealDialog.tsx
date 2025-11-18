
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/context/LocaleContext';
import { Meal } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import useAppStore from '@/context/AppStore';

interface CopyMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMeal: (meal: Meal) => void;
}

export default function CopyMealDialog({ open, onOpenChange, onSelectMeal }: CopyMealDialogProps) {
  const { t } = useLocale();
  const { meals } = useAppStore();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>{t('Copy from Meal')}</DialogTitle>
          <DialogDescription>
            {t('Select a meal to copy its ingredients to the diary.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col min-h-0 gap-4">
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
                  <span className="flex-grow text-sm truncate">{meal.name}</span>
                  <Button size="sm" variant="outline" onClick={() => onSelectMeal(meal)}>
                    <Plus className="h-4 w-4 mr-1" /> {t('Copy')}
                  </Button>
                </div>
              ))}
              {filteredMeals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground p-4">{t('No meals match your search.')}</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
