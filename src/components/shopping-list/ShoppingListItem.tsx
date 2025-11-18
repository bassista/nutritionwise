
"use client";

import { ShoppingListItem, Food } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import { getFoodName } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ShoppingListItemProps {
  item: ShoppingListItem;
  food?: Food;
  onToggle: (itemId: string, checked: boolean) => void;
  onRemove: (itemId: string) => void;
}

export default function ShoppingListItemDisplay({ item, food, onToggle, onRemove }: ShoppingListItemProps) {
  const { locale } = useLocale();
  const name = food ? getFoodName(food, locale) : item.text;

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Checkbox
          id={item.id}
          checked={item.checked}
          onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
        />
        <label htmlFor={item.id} className={`text-sm truncate ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
          {name}
        </label>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onRemove(item.id)}>
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
