
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from '@/context/LocaleContext';
import { useEffect } from 'react';

const settingsSchema = z.object({
  foodsPerPage: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1')
    .max(50, 'Must be 50 or less'),
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
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                            {t('Set the number of food items to show on each page (1-50).')}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit">{t('Save Preferences')}</Button>
                </form>
                </Form>
            </AccordionContent>
        </AccordionItem>
    )
}
