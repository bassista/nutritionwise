
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Food } from '@/lib/types';
import { getFoodName } from '@/lib/utils';
import { Plus, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';


interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: { foodId: string } | { text: string }) => void;
  existingItemIds: (string | undefined)[];
}

export default function AddItemDialog({ open, onOpenChange, onAddItem, existingItemIds }: AddItemDialogProps) {
  const { t, locale } = useLocale();
  const { foods, favoriteFoodIds } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchFavoritesOnly, setSearchFavoritesOnly] = useState(false);

  const sourceFoods = useMemo(() => {
    if (searchFavoritesOnly) {
        const foodMap = new Map(foods.map(f => [f.id, f]));
        return favoriteFoodIds.map(id => foodMap.get(id)).filter(Boolean) as Food[];
    }
    return foods;
  }, [foods, searchFavoritesOnly, favoriteFoodIds]);

  const filteredFoods = useMemo(() => {
    return sourceFoods.filter(food => 
      !existingItemIds.includes(food.id) &&
      getFoodName(food, locale).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sourceFoods, searchTerm, locale, existingItemIds]);

  const handleSelectFood = (food: Food) => {
    onAddItem({ foodId: food.id });
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleAddManual = () => {
    if (searchTerm.trim()) {
      onAddItem({ text: searchTerm.trim() });
      onOpenChange(false);
      setSearchTerm('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle>{t('Add to Shopping List')}</DialogTitle>
          <DialogDescription>
            {t('Search for a food or add an item manually.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b">
            <div className="flex-1 flex items-center justify-center">
                 <button onClick={() => setActiveTab('search')} className={`pb-2 text-sm font-medium ${activeTab === 'search' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>{t('Search Food')}</button>
                 <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "ml-2 h-8 w-8",
                        activeTab === 'manual' && 'invisible'
                    )}
                    onClick={() => setSearchFavoritesOnly(prev => !prev)}
                    >
                    <Heart className={cn('h-4 w-4', searchFavoritesOnly ? 'text-red-500 fill-current' : 'text-muted-foreground')} />
                </Button>
            </div>
            <button onClick={() => setActiveTab('manual')} className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>{t('Add Manually')}</button>
        </div>
        
        <div className="py-2">
          <Input
            placeholder={activeTab === 'search' ? t('Search for a food...') : t('Enter item name...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && activeTab === 'manual') {
                    handleAddManual();
                }
            }}
          />
        </div>

        {activeTab === 'search' && (
          <ScrollArea className="flex-grow">
            <div className="space-y-2">
              {filteredFoods.map(food => (
                <div key={food.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                  <span className="flex-grow text-sm">{getFoodName(food, locale)}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleSelectFood(food)}>
                    <Plus className="h-4 w-4 mr-1" /> {t('Add')}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {activeTab === 'manual' && (
           <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground mb-4">{t('Type the name of the item you want to add and press Enter or click the button below.')}</p>
               <Button onClick={handleAddManual} disabled={!searchTerm.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add "{item}"', { item: searchTerm || '...' })}
              </Button>
           </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
