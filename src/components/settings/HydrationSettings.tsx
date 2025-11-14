
"use client";

import useAppStore from '@/context/AppStore';
import { Input } from '@/components/ui/input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from '@/context/LocaleContext';
import { useEffect, useState } from 'react';
import type { HydrationSettings as HydrationSettingsType } from '@/lib/types';
import { Label } from '@/components/ui/label';


export default function HydrationSettings() {
    const { settings, updateHydrationSettings } = useAppStore();
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
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}
