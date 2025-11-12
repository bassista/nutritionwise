
"use client";
import { useMemo, useState } from 'react';
import { useDailyLogs } from '@/context/DailyLogContext';
import { useFoods } from '@/context/FoodContext';
import { useMeals } from '@/context/MealContext';
import { useSettings } from '@/context/SettingsContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useLocale } from '@/context/LocaleContext';
import { AnalysisPeriod } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LineChart as LineChartIcon } from 'lucide-react';
import { processAnalyticsData } from '@/lib/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export default function AnalyticsPage() {
    const { dailyLogs } = useDailyLogs();
    const { getFoodById } = useFoods();
    const { getMealById } = useMeals();
    const { settings } = useSettings();
    const { t } = useLocale();
    const [period, setPeriod] = useState<AnalysisPeriod>('last7days');

    const analysisData = useMemo(() => {
        return processAnalyticsData(period, dailyLogs, getFoodById, getMealById, t);
    }, [period, dailyLogs, getFoodById, getMealById, t]);
    
    const chartConfig: ChartConfig = {
        calories: { label: t('Calories'), color: 'hsl(var(--chart-1))' },
        protein: { label: t('Protein'), color: 'hsl(var(--chart-2))' },
        carbohydrates: { label: t('Carbohydrates'), color: 'hsl(var(--chart-3))' },
        fat: { label: t('Fat'), color: 'hsl(var(--chart-4))' },
    };

    const noData = Object.keys(dailyLogs).length === 0;

    const periodDescription = useMemo(() => {
        const periodMap = {
            'last7days': t('over the last {days} days.', {days: 7 }),
            'last30days': t('over the last {days} days.', {days: 30 }),
            'all': t('over all time.'),
        }
        return periodMap[period];
    }, [period, t]);

    if (noData) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title={t('Analytics')} />
                <div className="container mx-auto px-4 flex-grow py-4">
                    <Alert>
                        <LineChartIcon className="h-4 w-4" />
                        <AlertTitle>{t('No Data for Analysis')}</AlertTitle>
                        <AlertDescription>
                            {t('Start logging your meals in the diary to see your analytics.')}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('Analytics')}>
                <Select value={period} onValueChange={(value) => setPeriod(value as AnalysisPeriod)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('Select period')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="last7days">{t('Last 7 Days')}</SelectItem>
                        <SelectItem value="last30days">{t('Last 30 Days')}</SelectItem>
                        <SelectItem value="all">{t('All Time')}</SelectItem>
                    </SelectContent>
                </Select>
            </PageHeader>
            <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('Nutrient Trend')}</CardTitle>
                            <CardDescription>{t('Calorie and macronutrient intake')} {periodDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-52 w-full">
                                <LineChart data={analysisData.lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="calories" stroke="var(--color-calories)" strokeWidth={2} dot={false} name={t('Calories')} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>{t('Avg. Macro Distribution')}</CardTitle>
                            <CardDescription>{t('Average daily macronutrient calorie distribution.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            {analysisData.macroDistribution.length > 0 ? (
                                <ChartContainer config={chartConfig} className="h-52 w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                        <Pie data={analysisData.macroDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            return (
                                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }} />
                                        <Legend />
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-52 text-muted-foreground">{t('Not enough data')}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>{t('Average Daily Intake')}</CardTitle>
                            <CardDescription>{t('Your average daily nutrient intake compared to your goals.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={chartConfig} className="h-52 w-full">
                                <BarChart data={[{ name: 'average', ...analysisData.avgNutrients, ...settings.nutritionalGoals }]} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar dataKey="calories" fill="var(--color-calories)" name={t('Calories')} radius={4} />
                                    <Bar dataKey="protein" fill="var(--color-protein)" name={t('Protein')} radius={4} />
                                    <Bar dataKey="carbohydrates" fill="var(--color-carbohydrates)" name={t('Carbohydrates')} radius={4} />
                                    <Bar dataKey="fat" fill="var(--color-fat)" name={t('Fat')} radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
