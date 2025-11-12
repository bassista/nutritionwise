
import { NutritionalInfo, NutritionalGoals, Score } from './types';

// Ideal macronutrient distribution (as percentage of calories)
const IDEAL_DISTRIBUTION = {
    protein: 0.30,
    carbohydrates: 0.40,
    fat: 0.30
};

const getGrade = (percentage: number): { grade: string, color: string } => {
    if (percentage >= 95) return { grade: 'A+', color: 'bg-green-500' };
    if (percentage >= 90) return { grade: 'A', color: 'bg-green-400' };
    if (percentage >= 85) return { grade: 'B+', color: 'bg-lime-400' };
    if (percentage >= 80) return { grade: 'B', color: 'bg-yellow-400' };
    if (percentage >= 75) return { grade: 'C+', color: 'bg-amber-400' };
    if (percentage >= 70) return { grade: 'C', color: 'bg-orange-400' };
    if (percentage >= 60) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
};

const calculateMacroBalanceScore = (nutrients: NutritionalInfo): number => {
    const totalCalories = nutrients.calories;
    if (totalCalories === 0) return 0;

    const proteinCalories = nutrients.protein * 4;
    const carbsCalories = nutrients.carbohydrates * 4;
    const fatCalories = nutrients.fat * 9;

    const actualDistribution = {
        protein: proteinCalories / totalCalories,
        carbohydrates: carbsCalories / totalCalories,
        fat: fatCalories / totalCalories
    };
    
    let deviation = 0;
    deviation += Math.abs(actualDistribution.protein - IDEAL_DISTRIBUTION.protein);
    deviation += Math.abs(actualDistribution.carbohydrates - IDEAL_DISTRIBUTION.carbohydrates);
    deviation += Math.abs(actualDistribution.fat - IDEAL_DISTRIBUTION.fat);

    // Max deviation is 2.0. We want to convert deviation (0-2) to a score (100-0).
    const score = 100 * (1 - deviation / 2);
    return Math.max(0, score);
};

const calculateNutrientQualityScore = (nutrients: NutritionalInfo, goals: NutritionalGoals): number => {
    let score = 100;
    const penaltyMultiplier = 25; 

    // Penalty for too much sugar (relative to goal for the day)
    // We assume a meal is ~1/3 of the day
    if (nutrients.sugar && goals.sugar > 0) {
        const sugarRatio = nutrients.sugar / (goals.sugar / 3); // Meal's sugar vs 1/3 of daily goal
        if (sugarRatio > 1) {
            score -= Math.min(20, (sugarRatio - 1) * penaltyMultiplier); // Max penalty of 20 points
        }
    }

    // Penalty for too much sodium
    if (nutrients.sodium && goals.sodium > 0) {
        const sodiumRatio = nutrients.sodium / (goals.sodium / 3);
        if (sodiumRatio > 1) {
            score -= Math.min(20, (sodiumRatio - 1) * penaltyMultiplier); // Max penalty of 20 points
        }
    }

    // Bonus for fiber
    if (nutrients.fiber && goals.fiber > 0) {
        const fiberRatio = nutrients.fiber / (goals.fiber / 3);
        score += Math.min(10, fiberRatio * 10); // Max bonus of 10 points
    }

    return Math.max(0, Math.min(110, score)); // Cap score between 0 and 110
};

export const calculateMealScore = (nutrients: NutritionalInfo, goals: NutritionalGoals): Score => {
    if (nutrients.calories === 0) return { percentage: 0, grade: 'N/A', color: 'bg-muted' };

    const macroScore = calculateMacroBalanceScore(nutrients); // Weight 60%
    const qualityScore = calculateNutrientQualityScore(nutrients, goals); // Weight 40%
    
    const finalScore = (macroScore * 0.6) + (qualityScore * 0.4);
    
    const percentage = Math.round(Math.max(0, Math.min(100, finalScore)));
    const { grade, color } = getGrade(percentage);

    return { percentage, grade, color };
};

export const calculateDailyScore = (nutrients: NutritionalInfo, goals: NutritionalGoals): Score => {
    if (nutrients.calories === 0 || goals.calories === 0) {
        return { percentage: 0, grade: 'N/A', color: 'bg-muted' };
    }

    // Nutrients to be "under" a limit. Score is 100 if under, penalized if over.
    const getUnderLimitScore = (consumed: number, goal: number): number => {
        if (goal <= 0) return 100;
        if (consumed <= goal) return 100;
        // Penalize for exceeding the goal. The score drops from 100 to 0 as consumption goes from goal to 2*goal.
        return Math.max(0, 100 - ((consumed - goal) / goal) * 100);
    };

    // Nutrients to be "close to" a target. Score is 100 at target, decreases if under or over.
    const getTargetAdherenceScore = (consumed: number, goal: number): number => {
        if (goal <= 0) return 100;
        const diffPercent = Math.abs(consumed - goal) / goal;
        // Score is 100 if diff is 0, and 0 if diff is 100% or more.
        return Math.max(0, 100 - diffPercent * 100);
    };
    
    // Bonus for fiber. Score from 0 to 100 based on how close to the goal.
    const getFiberBonusScore = (consumed: number, goal: number): number => {
        if (goal <= 0) return 0;
        return Math.min(100, (consumed / goal) * 100);
    };

    const scores = {
        calories: getUnderLimitScore(nutrients.calories, goals.calories),
        fat: getUnderLimitScore(nutrients.fat, goals.fat),
        sugar: getUnderLimitScore(nutrients.sugar || 0, goals.sugar),
        sodium: getUnderLimitScore(nutrients.sodium || 0, goals.sodium),
        protein: getTargetAdherenceScore(nutrients.protein, goals.protein),
        carbohydrates: getTargetAdherenceScore(nutrients.carbohydrates, goals.carbohydrates),
        fiber: getFiberBonusScore(nutrients.fiber || 0, goals.fiber),
    };

    // Weighted average for the final score
    const weights = {
        calories: 0.25,
        protein: 0.20,
        carbohydrates: 0.20,
        fat: 0.10,
        sugar: 0.10,
        sodium: 0.10,
        fiber: 0.05, // Fiber acts as a bonus of up to 5 points
    };

    const finalScore = 
        scores.calories * weights.calories +
        scores.protein * weights.protein +
        scores.carbohydrates * weights.carbohydrates +
        scores.fat * weights.fat +
        scores.sugar * weights.sugar +
        scores.sodium * weights.sodium +
        scores.fiber * weights.fiber;
    
    const percentage = Math.round(Math.min(100, finalScore));
    const { grade, color } = getGrade(percentage);
    
    return { percentage, grade, color };
};
