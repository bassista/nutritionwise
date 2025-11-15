
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/context/LocaleContext';
import useAppStore from '@/context/AppStore';
import { LoggedItem, MealType } from '@/lib/types';
import { getFoodName } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EditLogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LoggedItem;
  selectedDateString: string;
  onLogSuccess: () => void;
}

export default function EditLogItemDialog({ open, onOpenChange, item, selectedDateString, onLogSuccess }: EditLogItemDialogProps) {
  const { t, locale } = useLocale();
  const { getFoodById, updateLogEntry } = useAppStore();
  const { toast } = useToast();
  
  const [grams, setGrams] = useState(item.grams || 0);

  const food = getFoodById(item.itemId);

  useEffect(() => {
    if (open) {
      setGrams(item.grams || 0);
    }
  }, [open, item]);

  const handleLogClick = () => {
    updateLogEntry(selectedDateString, item.id, { grams });
    toast({ title: t('Quantity Updated') });
    onLogSuccess();
  };

  if (!food) {
      return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Logged Food')}</DialogTitle>
          <DialogDescription>{getFoodName(food, locale)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grams" className="text-right">
              {t('Quantity')}
            </Label>
            <Input
              id="grams"
              type="number"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
              className="col-span-2"
            />
            <span className="text-muted-foreground">g</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button type="submit" onClick={handleLogClick}>{t('Save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
