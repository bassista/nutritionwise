
import { subDays, format, parseISO, eachDayOfInterval, differenceInDays, getDay } from 'date-fns';
import { LoggedItem, DailyLog, AnalysisPeriod, Food, Meal, NutritionalGoals } from '@/lib/types';
import { calculateTotalNutrientsForItems } from '@/lib/utils';
import { calculateDailyScore } from '@/lib/scoring';

type GetFoodById = (id: string) => Food | undefined;
type GetMealById = (id: string) => Meal | undefined;
type Translator = (key: string, values?: Record<string, string | number>) => string;

interface TopFoodInfo {
  foodId: string;
  count: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export function processAnalyticsData(
    period: AnalysisPeriod, 
    dailyLogs: DailyLog, 
    getFoodById: GetFoodById, 
    getMealById: GetMealById,
    goals: NutritionalGoals,
    t: Translator
) {
    const endDate = new Date();
    let startDate: Date;
    let days: number;

    const allLoggedDates = Object.keys(dailyLogs).sort();

    if (period === 'all' && allLoggedDates.length > 0) {
        startDate = parseISO(allLoggedDates[0]);
        days = differenceInDays(endDate, startDate) + 1;
    } else {
        days = period === 'last7days' ? 7 : 30;
        startDate = subDays(endDate, days - 1);
    }
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    let totalNutrientsOverPeriod = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, count: 0 };
    
    // Find the last known values before the start date
    let lastKnownWeight: number | undefined = undefined;
    let lastKnownGlucose: number | undefined = undefined;
    let lastKnownInsulin: number | undefined = undefined;
    
    const intervalStartDateString = format(startDate, 'yyyy-MM-dd');
    const datesBeforeInterval = allLoggedDates.filter(d => d < intervalStartDateString).sort((a, b) => b.localeCompare(a));
    
    for (const date of datesBeforeInterval) {
        if (lastKnownWeight === undefined && dailyLogs[date]?.weight) {
            lastKnownWeight = dailyLogs[date]?.weight;
        }
        if (lastKnownGlucose === undefined && dailyLogs[date]?.glucose) {
            lastKnownGlucose = dailyLogs[date]?.glucose;
        }
        if (lastKnownInsulin === undefined && dailyLogs[date]?.insulin) {
            lastKnownInsulin = dailyLogs[date]?.insulin;
        }
        if (lastKnownWeight !== undefined && lastKnownGlucose !== undefined && lastKnownInsulin !== undefined) break;
    }

    const topFoodsMap = new Map<string, TopFoodInfo>();
    const consistencyScores: { [day: number]: { scores: number[], count: number } } = { 0: {scores: [], count: 0}, 1: {scores: [], count: 0}, 2: {scores: [], count: 0}, 3: {scores: [], count: 0}, 4: {scores: [], count: 0}, 5: {scores: [], count: 0}, 6: {scores: [], count: 0} };

    const data = dateInterval.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const log = dailyLogs[dateString];
        
        let dailyTotals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };

        if (log) {
            const allItems = Object.values(log).flat().filter(item => typeof item === 'object' && item !== null && 'type' in item) as LoggedItem[];
            const nutrients = calculateTotalNutrientsForItems(allItems, getFoodById, getMealById);
            
            // --- Consistency calculation ---
            const dayOfWeek = getDay(date); // Sunday is 0
            const dailyScore = calculateDailyScore(nutrients, goals).percentage;
            if (dailyScore > 0) {
                consistencyScores[dayOfWeek].scores.push(dailyScore);
                consistencyScores[dayOfWeek].count++;
            }
            
            // --- Top foods calculation ---
            allItems.forEach(item => {
                if (item.type === 'food') {
                    const foodNutrients = calculateTotalNutrientsForItems([item], getFoodById, getMealById);
                    const entry = topFoodsMap.get(item.itemId) || { foodId: item.itemId, count: 0, calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
                    entry.count++;
                    entry.calories += foodNutrients.calories;
                    entry.protein += foodNutrients.protein;
                    entry.carbohydrates += foodNutrients.carbohydrates;
                    entry.fat += foodNutrients.fat;
                    topFoodsMap.set(item.itemId, entry);
                }
            });


            dailyTotals = {
                calories: nutrients.calories,
                protein: nutrients.protein,
                carbohydrates: nutrients.carbohydrates,
                fat: nutrients.fat
            };
            if (nutrients.calories > 0) {
                totalNutrientsOverPeriod.calories += nutrients.calories;
                totalNutrientsOverPeriod.protein += nutrients.protein;
                totalNutrientsOverPeriod.carbohydrates += nutrients.carbohydrates;
                totalNutrientsOverPeriod.fat += nutrients.fat;
                totalNutrientsOverPeriod.count++;
            }
        }
        
        // Update last known values with the current day's log, if available
        if (log?.weight !== undefined) lastKnownWeight = log.weight;
        if (log?.glucose !== undefined) lastKnownGlucose = log.glucose;
        if (log?.insulin !== undefined) lastKnownInsulin = log.insulin;
        
        return {
            date: format(date, 'MMM d'),
            weight: lastKnownWeight,
            glucose: lastKnownGlucose,
            insulin: lastKnownInsulin,
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
    
    const dayNames = [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')];
    const consistencyData = Object.keys(consistencyScores).map(dayIndexStr => {
        const dayIndex = parseInt(dayIndexStr, 10);
        const dayData = consistencyScores[dayIndex];
        const avgScore = dayData.count > 0 ? dayData.scores.reduce((a, b) => a + b, 0) / dayData.count : 0;
        return { day: dayNames[dayIndex], score: avgScore };
    });
    const reorderedConsistencyData = [...consistencyData.slice(1), consistencyData[0]];


    return {
        lineChartData: data,
        avgNutrients,
        macroDistribution,
        days,
        topFoods: Array.from(topFoodsMap.values()),
        consistencyData: reorderedConsistencyData
    };
}
