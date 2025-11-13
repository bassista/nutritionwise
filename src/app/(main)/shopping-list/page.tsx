
"use client";

import { useState, useMemo } from 'react';
import { useShoppingLists } from '@/context/ShoppingListContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Check } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import ShoppingListCard from '@/components/shopping-list/ShoppingListCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ShoppingListPage() {
  const { shoppingLists, createShoppingList } = useShoppingLists();
  const { t } = useLocale();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const sortedShoppingLists = useMemo(() => {
    return [...shoppingLists].sort((a, b) => {
      if (!a.isDeletable && b.isDeletable) return -1;
      if (a.isDeletable && !b.isDeletable) return 1;
      return 0;
    });
  }, [shoppingLists]);

  const handleCreateList = () => {
    if (newListName.trim()) {
      createShoppingList(newListName.trim());
      setNewListName('');
      setCreateDialogOpen(false);
    }
  };
  
  return (
    <>
      <PageHeader title={t('Shopping Lists')}>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('New List')}
        </Button>
      </PageHeader>
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedShoppingLists.map(list => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create New Shopping List')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('List Name')}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleCreateList}>{t('Create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

