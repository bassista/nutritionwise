"use client";

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
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from '@/context/LocaleContext';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import type { HydrationSettings as HydrationSettingsType } from '@/lib/types';


export default function HydrationSettings() {
    const { settings, updateHydrationSettings } = useSettings();
    const { t } = useLocale();

    const [currentSettings, setCurrentSettings] = useState<HydrationSettingsType>(settings.hydrationSettings);
    
    useEffect(() => {
      setCurrentSettings(settings.hydrationSettings);
    }, [settings.hydrationSettings]);

    const handleUpdate = (update: Partial<HydrationSettingsType>) => {
      const newSettings = { ...currentSettings, ...update };
      setCurrentSettings(newSettings);
      updateHydrationSettings(newSettings);
    }
    
    const handleToggleReminders = (enabled: boolean) => {
      const newSettings = { ...currentSettings, remindersEnabled: enabled };
      setCurrentSettings(newSettings);
      // The updateHydrationSettings function already handles the async permission logic
      updateHydrationSettings(newSettings);
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
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>{t('Daily Goal (Liters)')}</FormLabel>
                            <Input 
                                type="number" 
                                step="0.1" 
                                value={currentSettings.goalLiters}
                                onBlur={() => handleUpdate({ goalLiters: currentSettings.goalLiters })}
                                onChange={(e) => setCurrentSettings(s => ({...s, goalLiters: Number(e.target.value)}))}
                             />
                        </FormItem>
                         <FormItem>
                            <FormLabel>{t('Glass Size (ml)')}</FormLabel>
                            <Input 
                                type="number" 
                                value={currentSettings.glassSizeMl}
                                onBlur={() => handleUpdate({ glassSizeMl: currentSettings.glassSizeMl })}
                                onChange={(e) => setCurrentSettings(s => ({...s, glassSizeMl: Number(e.target.value)}))}
                            />
                        </FormItem>
                    </div>
                    
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel className="text-base">
                            {t('Enable Reminders')}
                        </FormLabel>
                        <FormDescription>
                            {t('Receive notifications to drink water.')}
                        </FormDescription>
                        </div>
                        <Switch
                            checked={currentSettings.remindersEnabled}
                            onCheckedChange={handleToggleReminders}
                        />
                    </FormItem>
                    
                    {currentSettings.remindersEnabled && (
                        <div className="space-y-4">
                           <FormItem>
                                <FormLabel>{t('Reminder Interval (minutes)')}</FormLabel>
                                <Input 
                                    type="number" 
                                    value={currentSettings.reminderIntervalMinutes}
                                    onBlur={() => handleUpdate({ reminderIntervalMinutes: currentSettings.reminderIntervalMinutes })}
                                    onChange={(e) => setCurrentSettings(s => ({...s, reminderIntervalMinutes: Number(e.target.value)}))}
                                />
                            </FormItem>

                            <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>{t('Reminders Start Time')}</FormLabel>
                                     <Input 
                                        type="time" 
                                        value={currentSettings.reminderStartTime}
                                        onBlur={() => handleUpdate({ reminderStartTime: currentSettings.reminderStartTime })}
                                        onChange={(e) => setCurrentSettings(s => ({...s, reminderStartTime: e.target.value}))}
                                     />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>{t('Reminders End Time')}</FormLabel>
                                     <Input 
                                        type="time" 
                                        value={currentSettings.reminderEndTime}
                                        onBlur={() => handleUpdate({ reminderEndTime: currentSettings.reminderEndTime })}
                                        onChange={(e) => setCurrentSettings(s => ({...s, reminderEndTime: e.target.value}))}
                                    />
                                </FormItem>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}
