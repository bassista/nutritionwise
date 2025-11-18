
"use client";

import React, { useState } from 'react';
import { ShoppingList } from '@/lib/types';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, Plus, ListTodo, Check, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFoodName, cn } from '@/lib/utils';
import ShoppingListItemDisplay from './ShoppingListItem';
import AddItemDialog from './AddItemDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShoppingListCardProps {
  list: ShoppingList;
  reorderable?: boolean;
}

const ShoppingListCardComponent = React.forwardRef<
  HTMLDivElement,
  ShoppingListCardProps & { style?: React.CSSProperties; attributes?: ReturnType<typeof useSortable>['attributes']; listeners?: ReturnType<typeof useSortable>['listeners']; }
>(({ list, reorderable, style, attributes, listeners }, ref) => {
  const { 
    getFoodById,
    setShoppingLists,
    renameShoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    removeShoppingListItem,
    toggleAllShoppingListItems,
  } = useAppStore();
  const { t } = useLocale();

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
    setShoppingLists((prev) => prev.filter(l => l.id !== list.id));
    setDeleteConfirmOpen(false);
  };

  const allItemsChecked = list.items.length > 0 && list.items.every(item => item.checked);
  const listName = !list.isDeletable ? t('Meals') : list.name;

  return (
    <>
      <div ref={ref} style={style}>
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              {reorderable && (
                <div
                  className="p-1 cursor-grab active:cursor-grabbing touch-none"
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <CardTitle className="text-lg font-bold flex-grow truncate">{listName}</CardTitle>
              {list.isDeletable && (
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
          <CardContent className="flex-grow flex flex-col min-h-0 max-h-64">
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
          <CardFooter className="flex flex-wrap gap-2 pt-6">
            <Button variant="outline" size="sm" onClick={() => toggleAllShoppingListItems(list.id, !allItemsChecked)} className="flex-1 basis-40">
              <Check className="mr-2 h-4 w-4" /> {allItemsChecked ? t('Uncheck All') : t('Check All')}
            </Button>
            <Button size="sm" onClick={() => setAddItemOpen(true)} className="flex-1 basis-40">
              <Plus className="mr-2 h-4 w-4" /> {t('Add Item')}
            </Button>
          </CardFooter>
        </Card>
      </div>

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
              {t('This will permanently delete the "{listName}" list.', { listName: list.name })}
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
});
ShoppingListCardComponent.displayName = "ShoppingListCardComponent";


function SortableShoppingListCard({ list }: { list: ShoppingList }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ShoppingListCardComponent
      ref={setNodeRef}
      list={list}
      reorderable={true}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
}

export default function ShoppingListCard({ list, reorderable }: ShoppingListCardProps) {
  if (reorderable) {
    return <SortableShoppingListCard list={list} />;
  }
  return <ShoppingListCardComponent list={list} />;
}
