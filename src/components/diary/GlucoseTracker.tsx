
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Droplet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlucoseTrackerProps {
  selectedDate: string;
}

export default function GlucoseTracker({ selectedDate }: GlucoseTrackerProps) {
  const { dailyLogs, updateGlucose } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [currentValue, setCurrentValue] = useState<string>('');

  useEffect(() => {
    const log = dailyLogs[selectedDate]?.glucose;
    setCurrentValue(log ? String(log) : '');
  }, [selectedDate, dailyLogs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };
  
  const handleSave = () => {
    const value = parseFloat(currentValue);
    if (currentValue === '' || value <= 0) {
      updateGlucose(selectedDate, undefined);
       toast({
        title: t('Glucose value removed'),
      });
    } else {
      updateGlucose(selectedDate, value);
      toast({
        title: t('Glucose Saved'),
        description: `${t('Your glucose for this day has been updated to')} ${value} mg/dL.`,
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('Blood Glucose')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            placeholder={t('Enter value in mg/dL')}
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
