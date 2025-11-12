
"use client";
import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { subDays, format, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';
import { useLocale } from '@/context/LocaleContext';
import { LoggedItem, MealType, Food, Meal, AnalysisPeriod } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LineChart as LineChartIcon } from 'lucide-react';
import { calculateTotalNutrientsForItems } from '@/lib/utils';


export default function AnalyticsPage() {
    const { dailyLogs, getFoodById, getMealById, settings } = useAppContext();
    const { t } = useLocale();
    const [period, setPeriod] = useState<AnalysisPeriod>('last7days');

    const analysisData = useMemo(() => {
        const endDate = new Date();
        let startDate: Date;
        let days: number;

        if (period === 'all') {
            const allDates = Object.keys(dailyLogs).sort();
            startDate = allDates.length > 0 ? parseISO(allDates[0]) : endDate;
            days = differenceInDays(endDate, startDate) + 1;
        } else {
            days = period === 'last7days' ? 7 : 30;
            startDate = subDays(endDate, days - 1);
        }

        const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

        let totalNutrientsOverPeriod = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, count: 0 };
        
        const data = dateInterval.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const log = dailyLogs[dateString];
            
            let dailyTotals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };

            if (log) {
                const allItems = Object.values(log).flat() as LoggedItem[];
                const nutrients = calculateTotalNutrientsForItems(allItems, getFoodById, getMealById);
                dailyTotals = {
                    calories: nutrients.calories,
                    protein: nutrients.protein,
                    carbohydrates: nutrients.carbohydrates,
                    fat: nutrients.fat
                };
                totalNutrientsOverPeriod.calories += nutrients.calories;
                totalNutrientsOverPeriod.protein += nutrients.protein;
                totalNutrientsOverPeriod.carbohydrates += nutrients.carbohydrates;
                totalNutrientsOverPeriod.fat += nutrients.fat;
                if (nutrients.calories > 0) {
                    totalNutrientsOverPeriod.count++;
                }
            }
            
            return {
                date: format(date, 'MMM d'),
                ...dailyTotals
            };
        });
        
        const avgNutrients = {
            calories: totalNutrientsOverPeriod.count > 0 ? totalNutrientsOverPeriod.calories / totalNutrientsOverPeriod.count : 0,
            protein: totalNutrientsOverPeriod.count > 0 ? totalNutrientsOverPeriod.protein / totalNutrientsOverPeriod.count : 0,
            carbohydrates: totalNutrientsOverPeriod.count > 0 ? totalNutrientsOverPeriod.carbohydrates / totalNutrientsOverPeriod.count : 0,
            fat: totalNutrientsOverPeriod.count > 0 ? totalNutrientsOverPeriod.fat / totalNutrientsOverPeriod.count : 0,
        };

        const macroDistribution = [
            { name: t('Protein'), value: avgNutrients.protein * 4, fill: 'hsl(var(--chart-1))' },
            { name: t('Carbohydrates'), value: avgNutrients.carbohydrates * 4, fill: 'hsl(var(--chart-2))' },
            { name: t('Fat'), value: avgNutrients.fat * 9, fill: 'hsl(var(--chart-3))' }
        ].filter(item => item.value > 0);
        
        return {
            lineChartData: data,
            avgNutrients,
            macroDistribution,
            days,
        };
    }, [period, dailyLogs, getFoodById, getMealById, t]);
    
    const chartConfig: ChartConfig = {
        calories: { label: t('Calories'), color: 'hsl(var(--chart-1))' },
        protein: { label: t('Protein'), color: 'hsl(var(--chart-2))' },
        carbohydrates: { label: t('Carbohydrates'), color: 'hsl(var(--chart-3))' },
        fat: { label: t('Fat'), color: 'hsl(var(--chart-4))' },
    };

    const noData = Object.keys(dailyLogs).length === 0;

    const periodDescription = () => {
        if (period === 'all') return t('over all time.');
        return t('over the last {days} days.', {days: analysisData.days });
    };

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
            <PageHeader title={t('Analytics')} />
            <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
                 <Tabs defaultValue="last7days" onValueChange={(value) => setPeriod(value as AnalysisPeriod)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="last7days">{t('Last 7 Days')}</TabsTrigger>
                        <TabsTrigger value="last30days">{t('Last 30 Days')}</TabsTrigger>
                        <TabsTrigger value="all">{t('All Time')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value={period}>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>{t('Nutrient Trend')}</CardTitle>
                                    <CardDescription>{t('Calorie and macronutrient intake')} {periodDescription()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-64 w-full">
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
                                        <ChartContainer config={chartConfig} className="h-64 w-full">
                                            <PieChart>
                                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                                <Pie data={analysisData.macroDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    return (
                                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                            {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    );
                                                }} />
                                                <Legend />
                                            </PieChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-muted-foreground">{t('Not enough data')}</div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-3">
                                <CardHeader>
                                    <CardTitle>{t('Average Daily Intake')}</CardTitle>
                                    <CardDescription>{t('Your average daily nutrient intake compared to your goals.')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <ChartContainer config={chartConfig} className="h-64 w-full">
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
                    </TabsContent>
                 </Tabs>
            </div>
        </div>
    );
}
