
"use client";

import { useState, useEffect } from 'react';
import useAppStore from '@/context/AppStore';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Syringe, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InsulinTrackerProps {
  selectedDate: string;
}

export default function InsulinTracker({ selectedDate }: InsulinTrackerProps) {
  const { dailyLogs, updateInsulin } = useAppStore();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [valueToAdd, setValueToAdd] = useState<string>('');

  const totalValue = dailyLogs[selectedDate]?.insulin || 0;

  const handleAdd = () => {
    const value = parseFloat(valueToAdd);
    if (!isNaN(value) && value > 0) {
      const newTotal = (dailyLogs[selectedDate]?.insulin || 0) + value;
      updateInsulin(selectedDate, newTotal);
      toast({
        title: t('Insulin Saved'),
        description: `${t('Your insulin for this day has been updated to')} ${newTotal.toFixed(1)} units.`,
      });
      setValueToAdd('');
    }
  };

  const handleReset = () => {
    updateInsulin(selectedDate, undefined);
    toast({
        title: t('Insulin value removed'),
    });
  }


  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
             <div>
                <CardTitle>{t('Insulin Intake')}</CardTitle>
                <CardDescription className="text-2xl font-bold pt-2">{totalValue.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{t('units')}</span></CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset} disabled={totalValue === 0}>
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            placeholder={t('Enter units')}
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
