
"use client";

import { useMemo, useState } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getCategoryName } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CategorySettings() {
    const { foods, renameCategory, deleteCategory } = useAppStore();
    const { t, locale } = useLocale();
    const { toast } = useToast();
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const categories = useMemo(() => {
        const categorySet = new Set<string>();
        foods.forEach(food => {
            const catName = food.category?.[locale] || food.category?.['en'];
            if (catName) {
                categorySet.add(catName);
            }
        });
        return Array.from(categorySet).sort();
    }, [foods, locale]);

    const handleAddCategory = () => {
        if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
            // "Adding" a category is done by assigning it to a food.
            // For now, we can just close the dialog. The user can create a food with this category.
            // To make this more robust, we would need a separate state for categories.
            // For now, let's just let user rename/delete existing ones.
            // A better approach is to simply rename an "Uncategorized" food.
            renameCategory(t('Uncategorized'), newCategoryName.trim());
            toast({ title: t('Category Added'), description: t("A new category has been created by renaming 'Uncategorized'.")});
            setNewCategoryName('');
            setAddDialogOpen(false);
        } else {
             toast({ variant: 'destructive', title: t('Invalid Name'), description: t('Category name cannot be empty or a duplicate.')});
        }
    };
    
    const handleRenameCategory = () => {
        if (categoryToRename && newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
            renameCategory(categoryToRename, newCategoryName.trim());
            toast({ title: t('Category Renamed') });
            setCategoryToRename(null);
            setNewCategoryName('');
            setRenameDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: t('Invalid Name'), description: t('Category name cannot be empty or a duplicate.')});
        }
    };
    
    const handleDeleteCategory = () => {
        if (categoryToDelete) {
            deleteCategory(categoryToDelete, t('Uncategorized'));
            toast({ title: t('Category Deleted') });
            setCategoryToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    return (
        <>
            <AccordionItem value="categories">
                <AccordionTrigger>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold">{t('Categories')}</h3>
                        <p className="text-sm text-muted-foreground">{t('Manage your food categories.')}</p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <Button onClick={() => { setNewCategoryName(''); setAddDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('Add Category')}
                        </Button>
                        <ScrollArea className="h-64 rounded-md border p-4">
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <div key={category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <span className="text-sm font-medium">{category}</span>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCategoryToRename(category); setNewCategoryName(category); setRenameDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setCategoryToDelete(category); setDeleteDialogOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Add New Category')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input placeholder={t('Category Name')} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('Cancel')}</Button>
                        <Button onClick={handleAddCategory}>{t('Add')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Rename Category')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input placeholder={t('New Category Name')} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>{t('Cancel')}</Button>
                        <Button onClick={handleRenameCategory}>{t('Rename')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This will not delete the foods, but will move them to the "{uncategorized}" category.', { uncategorized: t('Uncategorized') })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">{t('Delete Category')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
