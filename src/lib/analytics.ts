
import { subDays, format, parseISO, eachDayOfInterval, differenceInDays, getDay } from 'date-fns';
import { LoggedItem, DailyLog, AnalysisPeriod, Food, Meal, AppSettings, Category } from '@/lib/types';
import { calculateTotalNutrientsForItems, getCategoryName } from '@/lib/utils';
import { calculateDailyScore } from '@/lib/scoring';
import { Locale } from '@/context/LocaleContext';

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
    settings: AppSettings,
    t: Translator,
    locale: Locale
) {
    const endDate = new Date();
    let startDate: Date;
    const goals = settings.nutritionalGoals;
    const hydrationGoal = settings.hydrationSettings.goalLiters * 1000;

    const allLoggedDates = Object.keys(dailyLogs).sort();

    if (period === 'all' && allLoggedDates.length > 0) {
        startDate = parseISO(allLoggedDates[0]);
    } else {
        const days = period === 'last7days' ? 7 : 30;
        startDate = subDays(endDate, days - 1);
    }
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    let totalNutrientsOverPeriod = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, count: 0 };
    
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
    const categoryCaloriesMap = new Map<string, number>();
    const consistencyScores: { [day: number]: { scores: number[], count: number } } = { 0: {scores: [], count: 0}, 1: {scores: [], count: 0}, 2: {scores: [], count: 0}, 3: {scores: [], count: 0}, 4: {scores: [], count: 0}, 5: {scores: [], count: 0}, 6: {scores: [], count: 0} };

    const dailyData = dateInterval.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const log = dailyLogs[dateString];
        
        let dailyNutrientTotals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
        let waterIntake = 0;

        if (log) {
            const allItems = Object.values(log).flat().filter(item => typeof item === 'object' && item !== null && 'type' in item) as LoggedItem[];
            const nutrients = calculateTotalNutrientsForItems(allItems, getFoodById, getMealById);
            waterIntake = log.waterIntakeMl || 0;
            
            const dayOfWeek = getDay(date);
            const dailyScore = calculateDailyScore(nutrients, goals).percentage;
            if (dailyScore > 0) {
                consistencyScores[dayOfWeek].scores.push(dailyScore);
                consistencyScores[dayOfWeek].count++;
            }
            
            allItems.forEach(item => {
                if (item.type === 'food') {
                    const food = getFoodById(item.itemId);
                    if (!food) return;

                    const foodNutrients = calculateTotalNutrientsForItems([item], getFoodById, getMealById);
                    
                    const topFoodEntry = topFoodsMap.get(item.itemId) || { foodId: item.itemId, count: 0, calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
                    topFoodEntry.count++;
                    topFoodEntry.calories += foodNutrients.calories;
                    topFoodEntry.protein += foodNutrients.protein;
                    topFoodEntry.carbohydrates += foodNutrients.carbohydrates;
                    topFoodEntry.fat += foodNutrients.fat;
                    topFoodsMap.set(item.itemId, topFoodEntry);
                    
                    const category = getCategoryName(food, locale, t);
                    const currentCategoryCalories = categoryCaloriesMap.get(category) || 0;
                    categoryCaloriesMap.set(category, currentCategoryCalories + foodNutrients.calories);
                }
            });

            dailyNutrientTotals = { ...nutrients };
            if (nutrients.calories > 0) {
                totalNutrientsOverPeriod = {
                    calories: totalNutrientsOverPeriod.calories + nutrients.calories,
                    protein: totalNutrientsOverPeriod.protein + nutrients.protein,
                    carbohydrates: totalNutrientsOverPeriod.carbohydrates + nutrients.carbohydrates,
                    fat: totalNutrientsOverPeriod.fat + nutrients.fat,
                    count: totalNutrientsOverPeriod.count + 1
                };
            }
        }
        
        if (log?.weight !== undefined) lastKnownWeight = log.weight;
        if (log?.glucose !== undefined) lastKnownGlucose = log.glucose;
        if (log?.insulin !== undefined) lastKnownInsulin = log.insulin;
        
        return {
            date: date,
            dateString: format(date, 'MMM d'),
            weight: lastKnownWeight,
            glucose: lastKnownGlucose,
            insulin: lastKnownInsulin,
            waterIntake,
            ...dailyNutrientTotals
        };
    });

    // Calculate 7-day moving average for calories
    const lineChartData = dailyData.map((day, index) => {
        const start = Math.max(0, index - 6);
        const end = index + 1;
        const weekSlice = dailyData.slice(start, end);
        const daysWithCalories = weekSlice.filter(d => d.calories > 0);
        const weeklyAvgCalories = daysWithCalories.length > 0
            ? daysWithCalories.reduce((acc, curr) => acc + curr.calories, 0) / daysWithCalories.length
            : 0;

        return {
            date: day.dateString,
            weeklyAvgCalories: weeklyAvgCalories,
            ...day,
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

    const categoryDistribution = Array.from(categoryCaloriesMap.entries())
        .map(([name, value], index) => ({ name, value, fill: `hsl(var(--chart-${(index % 5) + 1}))` }))
        .sort((a,b) => b.value - a.value);

    return {
        lineChartData,
        avgNutrients,
        macroDistribution,
        topFoods: Array.from(topFoodsMap.values()),
        consistencyData: reorderedConsistencyData,
        categoryDistribution,
        hydrationGoal,
    };
}
