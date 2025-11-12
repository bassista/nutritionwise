
"use client";

import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/AppContext';
import { useLocale } from '@/context/LocaleContext';
import { Food } from '@/lib/types';
import { useMemo } from 'react';
import { getCategoryName } from '@/lib/utils';
import { useFoodManagement } from '@/hooks/useFoodManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FoodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodToEdit?: Food;
  foodToCreate?: Partial<Food>;
  onSubmitted?: () => void;
  autoFavorite?: boolean;
}

export function FoodForm({ open, onOpenChange, foodToEdit, foodToCreate, onSubmitted, autoFavorite = false }: FoodFormProps) {
  const { foods } = useAppContext();
  const { t, locale } = useLocale();
  const { form, handleFoodSubmit } = useFoodManagement(foodToEdit, foodToCreate);

  const categories = useMemo(() => {
    const allCategories = foods.map(f => getCategoryName(f, locale, t)).filter(Boolean);
    return Array.from(new Set(allCategories));
  }, [foods, locale, t]);

  const onSubmit = (data: z.infer<typeof form.schema>) => {
    const success = handleFoodSubmit(data, autoFavorite);
    if (success) {
      onOpenChange(false);
      onSubmitted?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{foodToEdit ? t('Edit Food') : t('Create New Food')}</DialogTitle>
          <DialogDescription>
            {t('Fill in the details for the food item.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-96 p-1">
              <div className="space-y-4 p-3">
                 <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Unique ID (optional)')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('e.g., barcode or custom ID')} disabled={!!foodToEdit || !!foodToCreate?.id} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Category')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select category...')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="uncategorized">{t('Uncategorized')}</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="serving_size_g" render={({ field }) => (<FormItem><FormLabel>{t('Serving Size (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="calories" render={({ field }) => (<FormItem><FormLabel>{t('Calories (kcal)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="protein" render={({ field }) => (<FormItem><FormLabel>{t('Protein (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="carbohydrates" render={({ field }) => (<FormItem><FormLabel>{t('Carbs (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="fat" render={({ field }) => (<FormItem><FormLabel>{t('Fat (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="fiber" render={({ field }) => (<FormItem><FormLabel>{t('Fiber (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sugar" render={({ field }) => (<FormItem><FormLabel>{t('Sugar (g)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sodium" render={({ field }) => (<FormItem><FormLabel>{t('Sodium (mg)')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t('Save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    