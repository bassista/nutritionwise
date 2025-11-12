
"use client";

import { useState } from 'react';
import { ShoppingList, ShoppingListItem } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, Plus, ListTodo, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFoodName } from '@/lib/utils';
import ShoppingListItemDisplay from './ShoppingListItem';
import AddItemDialog from './AddItemDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface ShoppingListCardProps {
  list: ShoppingList;
}

export default function ShoppingListCard({ list }: ShoppingListCardProps) {
  const { 
    getFoodById, 
    deleteShoppingList, 
    renameShoppingList, 
    addShoppingListItem, 
    updateShoppingListItem, 
    removeShoppingListItem,
    toggleAllShoppingListItems,
  } = useAppContext();
  const { t, locale } = useLocale();

  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isRenameOpen, setRenameOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newListName, setNewListName] = useState(list.name);

  const handleAddItem = (item: { foodId: string } | { text: string }) => {
    addShoppingListItem(list.id, item);
  };

  const handleItemToggle = (itemId: string, checked: boolean) => {
    updateShoppingListItem(list.id, itemId, { checked });
  };

  const handleItemRemove = (itemId: string) => {
    removeShoppingListItem(list.id, itemId);
  };

  const handleRename = () => {
    if (newListName.trim() && newListName.trim() !== list.name) {
      renameShoppingList(list.id, newListName.trim());
    }
    setRenameOpen(false);
  };

  const handleDelete = () => {
    deleteShoppingList(list.id);
    setDeleteConfirmOpen(false);
  };
  
  const allItemsChecked = list.items.length > 0 && list.items.every(item => item.checked);

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold">{list.name}</CardTitle>
            {!list.isDeletable ? null : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>{t('Rename')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t('Delete')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0">
          <ScrollArea className="flex-grow pr-3 -mr-3">
            {list.items.length > 0 ? (
              <div className="space-y-2">
                {list.items.map(item => (
                  <ShoppingListItemDisplay 
                    key={item.id} 
                    item={item} 
                    food={item.foodId ? getFoodById(item.foodId) : undefined}
                    onToggle={handleItemToggle}
                    onRemove={handleItemRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <ListTodo className="mx-auto h-8 w-8 mb-2" />
                <p>{t('List is empty')}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6">
            <Button variant="outline" size="sm" className="w-full sm:flex-1" onClick={() => toggleAllShoppingListItems(list.id, !allItemsChecked)}>
                <Check className="mr-2 h-4 w-4" /> {allItemsChecked ? t('Uncheck All') : t('Check All')}
            </Button>
            <Button size="sm" className="w-full sm:flex-1" onClick={() => setAddItemOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> {t('Add Item')}
            </Button>
        </CardFooter>
      </Card>
      
      <AddItemDialog 
        open={isAddItemOpen} 
        onOpenChange={setAddItemOpen} 
        onAddItem={handleAddItem}
        existingItemIds={list.items.map(i => i.foodId)}
      />

      <Dialog open={isRenameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Rename List')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Input value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setRenameOpen(false)}>{t('Cancel')}</Button>
                <Button onClick={handleRename}>{t('Save')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This will permanently delete the "{listName}" shopping list.', { listName: list.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
