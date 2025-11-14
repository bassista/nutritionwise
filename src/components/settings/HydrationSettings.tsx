
"use client";

import { useSettings } from '@/context/SettingsContext';
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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';


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
                        <div className="space-y-2">
                            <Label htmlFor="goal-liters">{t('Daily Goal (Liters)')}</Label>
                            <Input 
                                id="goal-liters"
                                type="number" 
                                step="0.1" 
                                value={currentSettings.goalLiters}
                                onBlur={() => handleUpdate({ goalLiters: currentSettings.goalLiters })}
                                onChange={(e) => setCurrentSettings(s => ({...s, goalLiters: Number(e.target.value)}))}
                             />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="glass-size">{t('Glass Size (ml)')}</Label>
                            <Input
                                id="glass-size"
                                type="number" 
                                value={currentSettings.glassSizeMl}
                                onBlur={() => handleUpdate({ glassSizeMl: currentSettings.glassSizeMl })}
                                onChange={(e) => setCurrentSettings(s => ({...s, glassSizeMl: Number(e.target.value)}))}
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <label htmlFor="reminders-switch" className="text-base font-medium">
                            {t('Enable Reminders')}
                        </label>
                        <p className="text-sm text-muted-foreground">
                            {t('Receive notifications to drink water.')}
                        </p>
                        </div>
                        <Switch
                            id="reminders-switch"
                            checked={currentSettings.remindersEnabled}
                            onCheckedChange={handleToggleReminders}
                        />
                    </div>
                    
                    {currentSettings.remindersEnabled && (
                        <div className="space-y-4">
                           <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label htmlFor="reminder-interval">{t('Reminder Interval (minutes)')}</Label>
                                    <span className="text-sm font-medium">{currentSettings.reminderIntervalMinutes} min</span>
                                </div>
                                <Slider
                                    id="reminder-interval"
                                    min={30}
                                    max={240}
                                    step={15}
                                    value={[currentSettings.reminderIntervalMinutes]}
                                    onValueChange={(value) => handleUpdate({ reminderIntervalMinutes: value[0]})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reminder-start">{t('Reminders Start Time')}</Label>
                                     <Input
                                        id="reminder-start" 
                                        type="time" 
                                        value={currentSettings.reminderStartTime}
                                        onBlur={() => handleUpdate({ reminderStartTime: currentSettings.reminderStartTime })}
                                        onChange={(e) => setCurrentSettings(s => ({...s, reminderStartTime: e.target.value}))}
                                     />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reminder-end">{t('Reminders End Time')}</Label>
                                     <Input
                                        id="reminder-end"
                                        type="time" 
                                        value={currentSettings.reminderEndTime}
                                        onBlur={() => handleUpdate({ reminderEndTime: currentSettings.reminderEndTime })}
                                        onChange={(e) => setCurrentSettings(s => ({...s, reminderEndTime: e.target.value}))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}
