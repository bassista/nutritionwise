
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Droplet, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlucoseTrackerProps {
  selectedDate: string;
}

export default function GlucoseTracker({ selectedDate }: GlucoseTrackerProps) {
  const { dailyLogs, updateGlucose } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [valueToAdd, setValueToAdd] = useState<string>('');
  
  const totalValue = dailyLogs[selectedDate]?.glucose || 0;

  const handleAdd = () => {
    const value = parseFloat(valueToAdd);
    if (!isNaN(value) && value > 0) {
      const newTotal = (dailyLogs[selectedDate]?.glucose || 0) + value;
      updateGlucose(selectedDate, newTotal);
      toast({
        title: t('Glucose Saved'),
        description: `${t('Your glucose for this day has been updated to')} ${newTotal.toFixed(1)} mg/dL.`,
      });
      setValueToAdd('');
    }
  };

  const handleReset = () => {
    updateGlucose(selectedDate, undefined);
    toast({
      title: t('Glucose value removed'),
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>{t('Blood Glucose')}</CardTitle>
                <CardDescription className="text-2xl font-bold pt-2">{totalValue.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset} disabled={totalValue === 0}>
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            placeholder={t('Enter value in mg/dL')}
            value={valueToAdd}
            onChange={(e) => setValueToAdd(e.target.value)}
            className="flex-grow"
          />
           <Button onClick={handleAdd} disabled={!valueToAdd}>
                <Plus className="h-4 w-4 mr-2"/>
                {t('Add')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
