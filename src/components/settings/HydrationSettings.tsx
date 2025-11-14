
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
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

const hydrationSettingsSchema = z.object({
    goalLiters: z.coerce.number().min(0.1, "Must be at least 0.1"),
    glassSizeMl: z.coerce.number().int().min(1, "Must be at least 1"),
    remindersEnabled: z.boolean(),
    reminderIntervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
    reminderStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    reminderEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
});

export default function HydrationSettings() {
    const { settings, updateHydrationSettings } = useSettings();
    const { toast } = useToast();
    const { t } = useLocale();

    const hydrationForm = useForm<z.infer<typeof hydrationSettingsSchema>>({
        resolver: zodResolver(hydrationSettingsSchema),
        defaultValues: settings.hydrationSettings,
    });

    useEffect(() => {
        hydrationForm.reset(settings.hydrationSettings);
    }, [settings, hydrationForm]);

    function onHydrationSubmit(values: z.infer<typeof hydrationSettingsSchema>) {
        updateHydrationSettings(values);
        toast({
            title: t('Hydration Settings Saved'),
            description: t('Your hydration settings have been updated.'),
        });
    }

    return (
        <AccordionItem value="hydration">
            <AccordionTrigger>
                <div className="text-left">
                <h3 className="text-lg font-semibold">{t('Hydration')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('Manage your water intake goals and reminders.')}
                </p>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <Form {...hydrationForm}>
                <form onSubmit={hydrationForm.handleSubmit(onHydrationSubmit)} className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={hydrationForm.control}
                        name="goalLiters"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('Daily Goal (Liters)')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={hydrationForm.control}
                        name="glassSizeMl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('Glass Size (ml)')}</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    
                    <FormField
                        control={hydrationForm.control}
                        name="remindersEnabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">
                                {t('Enable Reminders')}
                            </FormLabel>
                            <FormDescription>
                                {t('Receive notifications to drink water.')}
                            </FormDescription>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    
                    {hydrationForm.watch('remindersEnabled') && (
                        <div className="space-y-4">
                            <FormField
                            control={hydrationForm.control}
                            name="reminderIntervalMinutes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('Reminder Interval (minutes)')}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={hydrationForm.control}
                                name="reminderStartTime"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('Reminders Start Time')}</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={hydrationForm.control}
                                name="reminderEndTime"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('Reminders End Time')}</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                        </div>
                    )}


                    <Button type="submit">{t('Save Hydration Settings')}</Button>
                </form>
                </Form>
            </AccordionContent>
        </AccordionItem>
    )
}
