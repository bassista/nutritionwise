
"use client";
import { useMemo, useState } from 'react';
import useAppStore from '@/context/AppStore';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useLocale } from '@/context/LocaleContext';
import { AnalysisPeriod } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LineChart as LineChartIcon, TrendingUp, Trophy } from 'lucide-react';
import { processAnalyticsData } from '@/lib/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFoodName } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TopFoodsMetric = 'calories' | 'protein' | 'carbohydrates' | 'fat' | 'count';


export default function AnalyticsPage() {
    const { dailyLogs, getFoodById, getMealById, settings } = useAppStore();
    const { t, locale } = useLocale();
    const [period, setPeriod] = useState<AnalysisPeriod>('last7days');
    const [topFoodsMetric, setTopFoodsMetric] = useState<TopFoodsMetric>('calories');

    const analysisData = useMemo(() => {
        return processAnalyticsData(period, dailyLogs, getFoodById, getMealById, settings.nutritionalGoals, t);
    }, [period, dailyLogs, getFoodById, getMealById, settings.nutritionalGoals, t]);
    
    const chartConfig: ChartConfig = {
        calories: { label: t('Calories'), color: 'hsl(var(--chart-1))' },
        protein: { label: t('Protein'), color: 'hsl(var(--chart-2))' },
        carbohydrates: { label: t('Carbohydrates'), color: 'hsl(var(--chart-3))' },
        fat: { label: t('Fat'), color: 'hsl(var(--chart-4))' },
        weight: { label: t('Weight'), color: 'hsl(var(--chart-5))' },
        glucose: { label: t('Glucose'), color: 'hsl(var(--chart-1))' },
        insulin: { label: t('Insulin'), color: 'hsl(var(--chart-2))' },
        consistency: { label: t('Consistency'), color: 'hsl(var(--chart-1))' },
        score: { label: t('Score'), color: 'hsl(var(--chart-2))' },
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
    
    const weightDataAvailable = useMemo(() => analysisData.lineChartData.some(d => d.weight !== undefined), [analysisData.lineChartData]);
    const glucoseDataAvailable = useMemo(() => analysisData.lineChartData.some(d => d.glucose !== undefined), [analysisData.lineChartData]);
    const insulinDataAvailable = useMemo(() => analysisData.lineChartData.some(d => d.insulin !== undefined), [analysisData.lineChartData]);
    
    const topFoodsSorted = useMemo(() => {
        return [...analysisData.topFoods].sort((a, b) => b[topFoodsMetric] - a[topFoodsMetric]).slice(0, 10);
    }, [analysisData.topFoods, topFoodsMetric]);

    if (noData) {
        return (
             <>
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
            </>
        )
    }

    return (
        <>
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
                                    <Line type="monotone" dataKey="protein" stroke="var(--color-protein)" strokeWidth={2} dot={false} name={t('Protein')} />
                                    <Line type="monotone" dataKey="carbohydrates" stroke="var(--color-carbohydrates)" strokeWidth={2} dot={false} name={t('Carbohydrates')} />
                                    <Line type="monotone" dataKey="fat" stroke="var(--color-fat)" strokeWidth={2} dot={false} name={t('Fat')} />
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
                            <CardTitle>{t('Top 10 Foods')}</CardTitle>
                             <CardDescription>
                                {t('Your most frequently consumed foods, ranked by')}{' '}
                                <Select value={topFoodsMetric} onValueChange={(v) => setTopFoodsMetric(v as TopFoodsMetric)}>
                                    <SelectTrigger className="inline-flex w-auto h-auto p-1 text-sm font-semibold border-none shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="count">{t('Frequency')}</SelectItem>
                                        <SelectItem value="calories">{t('Calories')}</SelectItem>
                                        <SelectItem value="protein">{t('Protein')}</SelectItem>
                                        <SelectItem value="carbohydrates">{t('Carbohydrates')}</SelectItem>
                                        <SelectItem value="fat">{t('Fat')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {topFoodsSorted.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('Food')}</TableHead>
                                            <TableHead className="text-right">{t(topFoodsMetric.charAt(0).toUpperCase() + topFoodsMetric.slice(1))}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topFoodsSorted.map(food => (
                                            <TableRow key={food.foodId}>
                                                <TableCell>{getFoodName(getFoodById(food.foodId)!, locale)}</TableCell>
                                                <TableCell className="text-right">{food[topFoodsMetric].toFixed(topFoodsMetric === 'count' ? 0 : 1)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                           ) : (
                             <div className="flex items-center justify-center h-40 text-muted-foreground"><TrendingUp className="h-5 w-5 mr-2"/>{t('Not enough data')}</div>
                           )}
                        </CardContent>
                    </Card>


                    {weightDataAvailable && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Weight Trend')}</CardTitle>
                                <CardDescription>{t('Your weight trend')} {periodDescription}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-52 w-full">
                                    <AreaChart data={analysisData.lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} unit="kg" />
                                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <defs>
                                            <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="weight" stroke="var(--color-weight)" strokeWidth={2} dot={false} name={t('Weight (kg)')} fill="url(#fillWeight)" />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}

                    {glucoseDataAvailable && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Glucose Trend')}</CardTitle>
                                <CardDescription>{t('Your glucose trend')} {periodDescription}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-52 w-full">
                                    <AreaChart data={analysisData.lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} unit="mg/dL" />
                                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <defs>
                                            <linearGradient id="fillGlucose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-glucose)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--color-glucose)" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="glucose" stroke="var(--color-glucose)" strokeWidth={2} dot={false} name={t('Glucose (mg/dL)')} fill="url(#fillGlucose)" />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}

                    {insulinDataAvailable && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Insulin Trend')}</CardTitle>
                                <CardDescription>{t('Your insulin trend')} {periodDescription}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-52 w-full">
                                    <AreaChart data={analysisData.lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} unit="units" />
                                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <defs>
                                            <linearGradient id="fillInsulin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-insulin)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--color-insulin)" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="insulin" stroke="var(--color-insulin)" strokeWidth={2} dot={false} name={t('Insulin (units)')} fill="url(#fillInsulin)" />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Weekly Consistency')}</CardTitle>
                            <CardDescription>{t('Average diet score by day of the week.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {analysisData.consistencyData.some(d => d.score > 0) ? (
                            <ChartContainer config={chartConfig} className="h-52 w-full">
                                <BarChart data={analysisData.consistencyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis domain={[0, 100]} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="score" fill="var(--color-score)" name={t('Score')} radius={4} />
                                </BarChart>
                            </ChartContainer>
                           ) : (
                                <div className="flex items-center justify-center h-52 text-muted-foreground"><Trophy className="h-5 w-5 mr-2"/>{t('Not enough data')}</div>
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
        </>
    );
}
