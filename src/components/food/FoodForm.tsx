
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/context/LocaleContext';
import { Food } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { CategoryCombobox } from './CategoryCombobox';

const foodSchema = z.object({
  name_en: z.string().min(1, { message: "English name is required." }),
  name_it: z.string().min(1, { message: "Italian name is required." }),
  category: z.string().optional(),
  serving_size_g: z.coerce.number().min(0),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbohydrates: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0).optional(),
  sugar: z.coerce.number().min(0).optional(),
  sodium: z.coerce.number().min(0).optional(),
});

type FoodFormValues = z.infer<typeof foodSchema>;

interface FoodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodToEdit?: Food;
}

export function FoodForm({ open, onOpenChange, foodToEdit }: FoodFormProps) {
  const { addFood, updateFood, foods } = useAppContext();
  const { toast } = useToast();
  const { t } = useLocale();

  const categories = useMemo(() => {
    const allCategories = foods.map(f => f.category).filter(Boolean) as string[];
    return Array.from(new Set(allCategories));
  }, [foods]);

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name_en: '',
      name_it: '',
      category: '',
      serving_size_g: 100,
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
  });

  useEffect(() => {
    if (open && foodToEdit) {
      form.reset({
        name_en: typeof foodToEdit.name === 'object' ? foodToEdit.name.en || '' : foodToEdit.name,
        name_it: typeof foodToEdit.name === 'object' ? foodToEdit.name.it || '' : '',
        category: foodToEdit.category || '',
        serving_size_g: foodToEdit.serving_size_g || 100,
        calories: foodToEdit.calories || 0,
        protein: foodToEdit.protein || 0,
        carbohydrates: foodToEdit.carbohydrates || 0,
        fat: foodToEdit.fat || 0,
        fiber: foodToEdit.fiber || 0,
        sugar: foodToEdit.sugar || 0,
        sodium: foodToEdit.sodium || 0,
      });
    } else if(open && !foodToEdit) {
      form.reset({
        name_en: '',
        name_it: '',
        category: '',
        serving_size_g: 100,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      });
    }
  }, [foodToEdit, form, open]);


  function onSubmit(data: FoodFormValues) {
    const foodId = (data.name_en || '').toLowerCase().replace(/\s+/g, '-');
    
    if (!foodToEdit && foods.some(f => f.id === foodId)) {
        toast({
            variant: "destructive",
            title: t('Food already exists'),
            description: t('A food with this name already exists. Please choose a different name.'),
        });
        return;
    }

    const foodData: Food = {
        id: foodToEdit ? foodToEdit.id : foodId,
        name: {
            en: data.name_en,
            it: data.name_it,
        },
        category: data.category,
        serving_size_g: data.serving_size_g,
        calories: data.calories,
        protein: data.protein,
        carbohydrates: data.carbohydrates,
        fat: data.fat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
    };

    if (foodToEdit) {
      updateFood(foodToEdit.id, foodData);
      toast({ title: t('Food Updated') });
    } else {
      addFood(foodData);
      toast({ title: t('Food Created') });
    }
    onOpenChange(false);
  }

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
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name (English)')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_it"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name (Italian)')}</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('Category')}</FormLabel>
                        <CategoryCombobox
                            categories={categories}
                            value={field.value}
                            onChange={field.onChange}
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serving_size_g"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Serving Size (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Calories (kcal)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Protein (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="carbohydrates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Carbs (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Fat (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="fiber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Fiber (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="sugar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Sugar (g)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="sodium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Sodium (mg)')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

    