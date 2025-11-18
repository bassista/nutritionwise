
"use client";

import { useState, useMemo } from 'react';
import useAppStore from '@/context/AppStore';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import ShoppingListCard from '@/components/shopping-list/ShoppingListCard';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { ShoppingList } from '@/lib/types';


export default function ShoppingListPage() {
  const { shoppingLists, setShoppingLists } = useAppStore();
  const { t } = useLocale();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const defaultList = useMemo(() => shoppingLists.find(list => !list.isDeletable), [shoppingLists]);
  
  const userLists = useMemo(() => shoppingLists.filter(list => list.isDeletable), [shoppingLists]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = userLists.findIndex((list) => list.id === active.id);
      const newIndex = userLists.findIndex((list) => list.id === over.id);
      const reorderedUserLists = arrayMove(userLists, oldIndex, newIndex);
      const newShoppingLists = defaultList ? [defaultList, ...reorderedUserLists] : reorderedUserLists;
      setShoppingLists(() => newShoppingLists);
    }
  };

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList: ShoppingList = { id: `sl-${Date.now()}`, name: newListName.trim(), items: [], isDeletable: true };
      setShoppingLists(prev => [...prev, newList]);
      setNewListName('');
      setCreateDialogOpen(false);
    }
  };
  
  return (
    <>
      <PageHeader title={t('Lists')}>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('New List')}
        </Button>
      </PageHeader>
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {defaultList && <ShoppingListCard list={defaultList} />}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            id="shopping-lists-dnd-context"
          >
            <SortableContext items={userLists.map(l => l.id)} strategy={verticalListSortingStrategy}>
                {userLists.map(list => (
                  <ShoppingListCard key={list.id} list={list} reorderable />
                ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create New List')}</DialogTitle>
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
