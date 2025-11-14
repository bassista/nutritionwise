
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from '@/context/LocaleContext';
import { useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

const settingsSchema = z.object({
  foodsPerPage: z.coerce
    .number()
    .int()
    .min(4, 'Must be at least 4')
    .max(48, 'Must be 48 or less'),
});

export default function DisplaySettings() {
    const { settings, updateSettings } = useSettings();
    const { toast } = useToast();
    const { t } = useLocale();

    const displayForm = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            foodsPerPage: settings.foodsPerPage,
        },
    });
    
    const foodsPerPageValue = displayForm.watch('foodsPerPage');

    useEffect(() => {
        displayForm.reset({ foodsPerPage: settings.foodsPerPage });
    }, [settings, displayForm]);

    function onDisplaySubmit(values: z.infer<typeof settingsSchema>) {
        updateSettings({foodsPerPage: values.foodsPerPage});
        toast({
            title: t('Settings Saved'),
            description: t('Your preferences have been updated.'),
        });
    }
    
    const handleSliderChange = (value: number[]) => {
      displayForm.setValue('foodsPerPage', value[0]);
      onDisplaySubmit({ foodsPerPage: value[0] });
    }


    return (
        <AccordionItem value="display">
            <AccordionTrigger>
                <div className="text-left">
                <h3 className="text-lg font-semibold">{t('Display')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('Customize how the app displays information.')}
                </p>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <Form {...displayForm}>
                <form onSubmit={displayForm.handleSubmit(onDisplaySubmit)} className="space-y-8">
                    <FormField
                    control={displayForm.control}
                    name="foodsPerPage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('Foods Per Page')}</FormLabel>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <FormControl>
                                    <Slider
                                        min={4}
                                        max={48}
                                        step={4}
                                        value={[field.value]}
                                        onValueChange={handleSliderChange}
                                        className="md:w-2/3"
                                     />
                                </FormControl>
                                <span className="text-sm font-medium text-muted-foreground md:w-1/3 text-left md:text-right">
                                    {foodsPerPageValue} {t('foods')}
                                </span>
                            </div>
                            <FormDescription>
                                {t('Set the number of food items to show on each page (4-48).')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                </form>
                </Form>
            </AccordionContent>
        </AccordionItem>
    )
}
