
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const ITEMS_PER_PAGE = 40;

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
  const [searchFavoritesOnly, setSearchFavoritesOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    if (open) {
      // Default to favorites if there are any, otherwise show all
      setSearchFavoritesOnly(favoriteFoodIds.length > 0);
      // Reset state on open
      setActiveTab('search');
      setSearchTerm('');
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [open, favoriteFoodIds.length]);

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
  
  const visibleFoods = useMemo(() => {
    return filteredFoods.slice(0, visibleCount);
  }, [filteredFoods, visibleCount]);

  const handleSelectFood = (food: Food) => {
    onAddItem({ foodId: food.id });
    onOpenChange(false);
  };

  const handleAddManual = () => {
    if (searchTerm.trim()) {
      onAddItem({ text: searchTerm.trim() });
      onOpenChange(false);
    }
  };
  
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm, searchFavoritesOnly]);

  const handleToggleFavorites = () => {
    // Cannot toggle off if there are no favorites to begin with
    if (favoriteFoodIds.length > 0) {
      setSearchFavoritesOnly(prev => !prev);
    }
  }

  const showSearchAllButton = searchTerm && filteredFoods.length === 0 && searchFavoritesOnly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle>{t('Add to List')}</DialogTitle>
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
                        activeTab === 'manual' && 'invisible',
                        favoriteFoodIds.length === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={handleToggleFavorites}
                    disabled={favoriteFoodIds.length === 0}
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
            <TooltipProvider>
              <div className="space-y-2">
                {visibleFoods.map(food => {
                  const fullName = getFoodName(food, locale);
                  const displayName = fullName && fullName.length > 16 ? `${fullName.substring(0, 13)}...` : fullName;
                  return (
                    <div key={food.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                       <div className="flex-grow text-sm truncate">
                         <Tooltip>
                           <TooltipTrigger asChild>
                              <span className="cursor-default">{displayName}</span>
                           </TooltipTrigger>
                            {displayName !== fullName &&
                              <TooltipContent>
                                <p>{fullName}</p>
                              </TooltipContent>
                            }
                         </Tooltip>
                       </div>
                      <Button size="sm" variant="ghost" onClick={() => handleSelectFood(food)}>
                        <Plus className="h-4 w-4 mr-1" /> {t('Add')}
                      </Button>
                    </div>
                  )
                })}
                {filteredFoods.length > visibleCount && (
                  <div className="flex justify-center py-4">
                      <Button variant="outline" onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}>
                          {t('Load More')} ({filteredFoods.length - visibleCount} {t('remaining')})
                      </Button>
                  </div>
                )}
                 {filteredFoods.length === 0 && searchTerm && !showSearchAllButton && (
                      <p className="text-center text-sm text-muted-foreground py-4">{t('No foods match your search.')}</p>
                  )}
                  {showSearchAllButton && (
                      <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">{t('No results in favorites.')}</p>
                          <Button variant="secondary" onClick={() => setSearchFavoritesOnly(false)}>
                              {t('Search in all foods')}
                          </Button>
                      </div>
                  )}
              </div>
            </TooltipProvider>
          </ScrollArea>
        )}
        
        {activeTab === 'manual' && (
           <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground mb-4">{t('Type the name of the item you want to add and press Enter or click the button below.')}</p>
               <Button onClick={handleAddManual} disabled={!searchTerm.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Item')}
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
