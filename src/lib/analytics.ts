
import { subDays, format, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';
import { LoggedItem, DailyLog, AnalysisPeriod, Food, Meal } from '@/lib/types';
import { calculateTotalNutrientsForItems } from '@/lib/utils';

type GetFoodById = (id: string) => Food | undefined;
type GetMealById = (id: string) => Meal | undefined;
type Translator = (key: string, values?: Record<string, string | number>) => string;

export function processAnalyticsData(
    period: AnalysisPeriod, 
    dailyLogs: DailyLog, 
    getFoodById: GetFoodById, 
    getMealById: GetMealById,
    t: Translator
) {
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
}
