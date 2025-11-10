
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
import { getCategoryName } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormState } from 'react-hook-form';
import { cn } from '@/lib/utils';

const foodSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
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
  const { t, locale } = useLocale();

  const categories = useMemo(() => {
    const allCategories = foods.map(f => getCategoryName(f, locale, t)).filter(cat => cat && cat !== t('Uncategorized'));
    return Array.from(new Set(allCategories));
  }, [foods, locale, t]);

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: '',
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
    if (open) {
      if (foodToEdit) {
        form.reset({
          name: foodToEdit.name[locale] || foodToEdit.name['en'] || '',
          category: getCategoryName(foodToEdit, locale, t) || '',
          serving_size_g: foodToEdit.serving_size_g || 100,
          calories: foodToEdit.calories || 0,
          protein: foodToEdit.protein || 0,
          carbohydrates: foodToEdit.carbohydrates || 0,
          fat: foodToEdit.fat || 0,
          fiber: foodToEdit.fiber || 0,
          sugar: foodToEdit.sugar || 0,
          sodium: foodToEdit.sodium || 0,
        });
      } else {
        form.reset({
          name: '',
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
    }
  }, [open, foodToEdit, locale, form, t]);


  function onSubmit(data: FoodFormValues) {
    const categoryValue = data.category === 'uncategorized' ? '' : data.category;
    
    if (foodToEdit) {
      const updatedFood: Food = {
        ...foodToEdit,
        name: { ...foodToEdit.name, [locale]: data.name },
        category: { ...foodToEdit.category, [locale]: categoryValue || ''},
        serving_size_g: data.serving_size_g,
        calories: data.calories,
        protein: data.protein,
        carbohydrates: data.carbohydrates,
        fat: data.fat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
      };
      updateFood(foodToEdit.id, updatedFood);
      toast({ title: t('Food Updated') });
    } else {
       const foodId = (data.name || '').toLowerCase().replace(/\s+/g, '-');
      if (foods.some(f => f.id === foodId)) {
          toast({
              variant: "destructive",
              title: t('Food already exists'),
              description: t('A food with this ID already exists. Please choose a different name.'),
          });
          return;
      }
      const newFood: Food = {
          id: foodId,
          name: { [locale]: data.name },
          category: { [locale]: categoryValue || '' },
          serving_size_g: data.serving_size_g,
          calories: data.calories,
          protein: data.protein,
          carbohydrates: data.carbohydrates,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium,
      };
      addFood(newFood);
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

    