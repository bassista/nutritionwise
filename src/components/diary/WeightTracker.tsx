
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Weight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeightTrackerProps {
  selectedDate: string;
}

export default function WeightTracker({ selectedDate }: WeightTrackerProps) {
  const { dailyLogs, updateWeight } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [currentWeight, setCurrentWeight] = useState<string>('');

  useEffect(() => {
    const weightLog = dailyLogs[selectedDate]?.weight;
    setCurrentWeight(weightLog ? String(weightLog) : '');
  }, [selectedDate, dailyLogs]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentWeight(e.target.value);
  };
  
  const handleSaveWeight = () => {
    const weightValue = parseFloat(currentWeight);
    if (currentWeight === '' || weightValue <= 0) {
      updateWeight(selectedDate, undefined);
       toast({
        title: t('Weight Removed'),
      });
    } else {
      updateWeight(selectedDate, weightValue);
      toast({
        title: t('Weight Saved'),
        description: `${t('Your weight for this day has been updated to')} ${weightValue} kg.`,
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('Body Weight')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Weight className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            placeholder={t('Enter weight in kg')}
            value={currentWeight}
            onChange={handleWeightChange}
            className="flex-grow"
          />
           <Button onClick={handleSaveWeight}>{t('Save')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
