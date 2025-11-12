
import { DailyLog, AppSettings, Badge, UserAchievement } from './types';
import { subDays, format, parseISO } from 'date-fns';

export const allBadges: Badge[] = [
  {
    id: 'first-log',
    name: 'First Meal Logged',
    description: 'Log your first meal to start your journey.',
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    description: 'Log a meal every day for 7 days in a row.',
  },
  {
    id: 'water-goal-1',
    name: 'Hydration Goal',
    description: 'Reach your daily water intake goal for the first time.',
  },
];

type EvaluationData = {
    dailyLogs: DailyLog;
    settings: AppSettings;
}

export function evaluateAchievements(data: EvaluationData, badges: Badge[], earnedBadgeIds: Set<string>): UserAchievement[] {
    const newAchievements: UserAchievement[] = [];
    
    // Badge: 'first-log'
    if (!earnedBadgeIds.has('first-log')) {
        if (Object.keys(data.dailyLogs).length > 0) {
            newAchievements.push({ badgeId: 'first-log', date: new Date().toISOString() });
        }
    }

    // Badge: '7-day-streak'
    if (!earnedBadgeIds.has('7-day-streak')) {
        const today = new Date();
        let consecutiveDays = 0;
        for (let i = 0; i < 7; i++) {
            const dateToCheck = format(subDays(today, i), 'yyyy-MM-dd');
            if (data.dailyLogs[dateToCheck]) {
                consecutiveDays++;
            } else {
                break;
            }
        }
        if (consecutiveDays >= 7) {
            newAchievements.push({ badgeId: '7-day-streak', date: new Date().toISOString() });
        }
    }

    // Badge: 'water-goal-1'
    if (!earnedBadgeIds.has('water-goal-1')) {
        const goalMl = data.settings.hydrationSettings.goalLiters * 1000;
        for (const date in data.dailyLogs) {
            if ((data.dailyLogs[date].waterIntakeMl || 0) >= goalMl) {
                newAchievements.push({ badgeId: 'water-goal-1', date: new Date().toISOString() });
                break;
            }
        }
    }

    return newAchievements;
}
