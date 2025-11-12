
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useLocale } from '@/context/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WaterTrackerProps {
  selectedDate: string;
}

export default function WaterTracker({ selectedDate }: WaterTrackerProps) {
  const { settings, dailyLogs, addWaterIntake } = useAppContext();
  const { t } = useLocale();

  const { goalLiters, glassSizeMl } = settings.hydrationSettings;
  const goalMl = goalLiters * 1000;

  const waterIntakeMl = useMemo(() => {
    return dailyLogs[selectedDate]?.waterIntakeMl || 0;
  }, [dailyLogs, selectedDate]);

  const glassesCount = useMemo(() => {
    return Math.floor(waterIntakeMl / glassSizeMl);
  }, [waterIntakeMl, glassSizeMl]);

  const progress = useMemo(() => {
    return goalMl > 0 ? (waterIntakeMl / goalMl) * 100 : 0;
  }, [waterIntakeMl, goalMl]);

  const handleAddGlass = () => {
    addWaterIntake(selectedDate, glassSizeMl);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('Water Intake')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-baseline text-sm mb-1">
            <span className="font-medium">{t("Today's Progress")}</span>
            <span className="text-muted-foreground">{waterIntakeMl}ml / {goalMl}ml</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-5 w-5" />
            <span className="font-medium">{glassesCount} {glassesCount === 1 ? t('glass') : t('glasses')}</span>
          </div>
          <Button onClick={handleAddGlass} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('Add a glass')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
