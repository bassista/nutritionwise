
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Syringe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InsulinTrackerProps {
  selectedDate: string;
}

export default function InsulinTracker({ selectedDate }: InsulinTrackerProps) {
  const { dailyLogs, updateInsulin } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [currentValue, setCurrentValue] = useState<string>('');

  useEffect(() => {
    const log = dailyLogs[selectedDate]?.insulin;
    setCurrentValue(log ? String(log) : '');
  }, [selectedDate, dailyLogs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };
  
  const handleSave = () => {
    const value = parseFloat(currentValue);
    if (currentValue === '' || value <= 0) {
      updateInsulin(selectedDate, undefined);
       toast({
        title: t('Insulin value removed'),
      });
    } else {
      updateInsulin(selectedDate, value);
      toast({
        title: t('Insulin Saved'),
        description: `${t('Your insulin for this day has been updated to')} ${value} units.`,
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('Insulin Intake')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            placeholder={t('Enter units')}
            value={currentValue}
            onChange={handleChange}
            className="flex-grow"
          />
           <Button onClick={handleSave}>{t('Save')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
