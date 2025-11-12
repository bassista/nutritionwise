
import { DailyLog, AppSettings, Badge, UserAchievement, Meal, Food } from './types';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { useAppContext } from '@/context/AppContext';

export const allBadges: Badge[] = [
  // Easy
  {
    id: 'first-log',
    name: 'First Meal Logged',
    description: 'Log your first meal to start your journey.',
  },
  {
    id: 'meal-creator',
    name: 'Meal Creator',
    description: 'Create your first custom meal.',
  },
  {
    id: 'first-favorite',
    name: 'First Favorite',
    description: 'Add a food to your favorites.',
  },
  {
    id: 'scanner-pro',
    name: 'Scanner Pro',
    description: 'Scan your first barcode.',
  },
   {
    id: 'list-specialist',
    name: 'List Specialist',
    description: 'Create your first shopping list.',
  },

  // Medium
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    description: 'Log a meal every day for 7 days in a row.',
  },
   {
    id: 'water-goal-7',
    name: 'Hydration Marathoner',
    description: 'Reach your daily water intake goal for 7 days in a row.',
  },
  {
    id: 'pro-planner',
    name: 'Pro Planner',
    description: 'Create 10 different meals.',
  },
  {
    id: 'favorite-collector',
    name: 'Favorite Collector',
    description: 'Save 25 foods to your favorites.',
  },
  {
    id: '30-day-streak',
    name: '30-Day Streak',
    description: 'Log a meal every day for 30 days in a row.',
  },

  // Hard
  {
    id: 'hydration-monarch',
    name: 'Hydration Monarch',
    description: 'Reach your daily water intake goal for 30 days in a row.',
  },
  {
    id: 'supreme-chef',
    name: 'Supreme Chef',
    description: 'Create 50 custom meals.',
  },
  {
    id: 'guru-of-favorites',
    name: 'Guru of Favorites',
    description: 'Save 100 foods in your favorites.',
  },
  {
    id: 'legend-of-perseverance',
    name: 'Legend of Perseverance',
    description: 'Log a meal for 100 consecutive days.',
  },
];


type EvaluationData = {
    dailyLogs: DailyLog;
    settings: AppSettings;
    meals?: Meal[];
    favoriteFoodIds?: string[];
    shoppingLists?: any[]; // Use 'any' to avoid circular dependency issues, or define a specific type.
    foods?: Food[];
}

export function evaluateAchievements(data: EvaluationData, badges: Badge[], earnedBadgeIds: Set<string>): UserAchievement[] {
    const newAchievements: UserAchievement[] = [];
    
    // Easy
    if (!earnedBadgeIds.has('first-log') && data.dailyLogs && Object.keys(data.dailyLogs).length > 0) {
        newAchievements.push({ badgeId: 'first-log', date: new Date().toISOString() });
    }
    if (!earnedBadgeIds.has('meal-creator') && data.meals && data.meals.length > 0) {
        newAchievements.push({ badgeId: 'meal-creator', date: new Date().toISOString() });
    }
    if (!earnedBadgeIds.has('first-favorite') && data.favoriteFoodIds && data.favoriteFoodIds.length > 0) {
        newAchievements.push({ badgeId: 'first-favorite', date: new Date().toISOString() });
    }
    if (!earnedBadgeIds.has('scanner-pro') && data.foods && data.foods.some(f => f.id.length === 13 && /^\d+$/.test(f.id))) {
       newAchievements.push({ badgeId: 'scanner-pro', date: new Date().toISOString() });
    }
    if (!earnedBadgeIds.has('list-specialist') && data.shoppingLists && data.shoppingLists.some(l => l.isDeletable)) {
        newAchievements.push({ badgeId: 'list-specialist', date: new Date().toISOString() });
    }

    // Medium
    const checkStreak = (days: number) => {
        if (!data.dailyLogs) return false;
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const dateToCheck = format(subDays(today, i), 'yyyy-MM-dd');
            if (!data.dailyLogs[dateToCheck] || Object.keys(data.dailyLogs[dateToCheck]).filter(k => k !== 'waterIntakeMl').length === 0) {
                return false;
            }
        }
        return true;
    };

    if (!earnedBadgeIds.has('7-day-streak') && checkStreak(7)) {
        newAchievements.push({ badgeId: '7-day-streak', date: new Date().toISOString() });
    }
    if (!earnedBadgeIds.has('30-day-streak') && checkStreak(30)) {
        newAchievements.push({ badgeId: '30-day-streak', date: new Date().toISOString() });
    }

    const checkWaterStreak = (days: number) => {
        if (!data.dailyLogs || !data.settings) return false;
        const goalMl = data.settings.hydrationSettings.goalLiters * 1000;
        if (goalMl <= 0) return false;
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const dateToCheck = format(subDays(today, i), 'yyyy-MM-dd');
            if (!data.dailyLogs[dateToCheck] || (data.dailyLogs[dateToCheck].waterIntakeMl || 0) < goalMl) {
                return false;
            }
        }
        return true;
    };
    
    if (!earnedBadgeIds.has('water-goal-7') && checkWaterStreak(7)) {
        newAchievements.push({ badgeId: 'water-goal-7', date: new Date().toISOString() });
    }

    if (!earnedBadgeIds.has('pro-planner') && data.meals && data.meals.length >= 10) {
        newAchievements.push({ badgeId: 'pro-planner', date: new Date().toISOString() });
    }

    if (!earnedBadgeIds.has('favorite-collector') && data.favoriteFoodIds && data.favoriteFoodIds.length >= 25) {
        newAchievements.push({ badgeId: 'favorite-collector', date: new Date().toISOString() });
    }

    // Hard
    if (!earnedBadgeIds.has('hydration-monarch') && checkWaterStreak(30)) {
        newAchievements.push({ badgeId: 'hydration-monarch', date: new Date().toISOString() });
    }
    
    if (!earnedBadgeIds.has('supreme-chef') && data.meals && data.meals.length >= 50) {
        newAchievements.push({ badgeId: 'supreme-chef', date: new Date().toISOString() });
    }
    
    if (!earnedBadgeIds.has('guru-of-favorites') && data.favoriteFoodIds && data.favoriteFoodIds.length >= 100) {
        newAchievements.push({ badgeId: 'guru-of-favorites', date: new Date().toISOString() });
    }

    if (!earnedBadgeIds.has('legend-of-perseverance') && checkStreak(100)) {
        newAchievements.push({ badgeId: 'legend-of-perseverance', date: new Date().toISOString() });
    }

    return newAchievements;
}

    