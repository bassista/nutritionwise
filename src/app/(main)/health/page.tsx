
"use client";

import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { useLocale } from '@/context/LocaleContext';
import { PageHeader } from '@/components/PageHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import WeightTracker from '@/components/diary/WeightTracker';
import GlucoseTracker from '@/components/diary/GlucoseTracker';
import InsulinTracker from '@/components/diary/InsulinTracker';

export default function HealthPage() {
    const { t, locale } = useLocale();
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

    return (
        <>
            <PageHeader title={t('Health')} />
            <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
                <div className="flex flex-wrap lg:flex-nowrap gap-6">
                    <div className="w-full lg:w-auto lg:min-w-[350px]">
                        <Card>
                            <CardContent className="p-2 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="w-full"
                                    locale={locale === 'it' ? it : undefined}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-6">
                         <WeightTracker selectedDate={selectedDateString} />
                         <GlucoseTracker selectedDate={selectedDateString} />
                         <InsulinTracker selectedDate={selectedDateString} />
                    </div>
                </div>
            </div>
        </>
    );
}
