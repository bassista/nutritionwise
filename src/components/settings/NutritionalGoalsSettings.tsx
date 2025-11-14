
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useAppStore from '@/context/AppStore';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from '@/context/LocaleContext';
import { NutritionalGoals } from '@/lib/types';
import { useEffect } from 'react';

const nutritionalGoalsSchema = z.object({
    calories: z.coerce.number().min(0, "Cannot be negative"),
    protein: z.coerce.number().min(0, "Cannot be negative"),
    carbohydrates: z.coerce.number().min(0, "Cannot be negative"),
    fat: z.coerce.number().min(0, "Cannot be negative"),
    fiber: z.coerce.number().min(0, "Cannot be negative"),
    sugar: z.coerce.number().min(0, "Cannot be negative"),
    sodium: z.coerce.number().min(0, "Cannot be negative"),
});

export default function NutritionalGoalsSettings() {
  const { settings, updateNutritionalGoals } = useAppStore();
  const { toast } = useToast();
  const { t } = useLocale();

  const goalsForm = useForm<z.infer<typeof nutritionalGoalsSchema>>({
    resolver: zodResolver(nutritionalGoalsSchema),
    defaultValues: settings.nutritionalGoals,
  });

  useEffect(() => {
    goalsForm.reset(settings.nutritionalGoals);
  }, [settings, goalsForm]);

  function onGoalsSubmit(values: z.infer<typeof nutritionalGoalsSchema>) {
    updateNutritionalGoals(values);
    toast({
        title: t('Goals Saved'),
        description: t('Your nutritional goals have been updated.'),
    });
  }

  const goalsFields: {name: keyof NutritionalGoals, label: string}[] = [
      { name: 'calories', label: t('Calories (kcal)')},
      { name: 'protein', label: t('Protein (g)')},
      { name: 'carbohydrates', label: t('Carbs (g)')},
      { name: 'fat', label: t('Fat (g)')},
      { name: 'fiber', label: t('Fiber (g)')},
      { name: 'sugar', label: t('Sugar (g)')},
      { name: 'sodium', label: t('Sodium (mg)')},
  ];

  return (
    <AccordionItem value="goals">
        <AccordionTrigger>
        <div className="text-left">
            <h3 className="text-lg font-semibold">{t('Nutritional Goals')}</h3>
            <p className="text-sm text-muted-foreground">
            {t('Set your daily nutritional targets.')}
            </p>
        </div>
        </AccordionTrigger>
        <AccordionContent>
        <Form {...goalsForm}>
            <form onSubmit={goalsForm.handleSubmit(onGoalsSubmit)} className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                {goalsFields.map(goal => (
                        <FormField
                        key={goal.name}
                        control={goalsForm.control}
                        name={goal.name}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{goal.label}</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                ))}
            </div>
            <Button type="submit">{t('Save Goals')}</Button>
            </form>
        </Form>
        </AccordionContent>
    </AccordionItem>
  );
}
