
"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UserAchievement } from '@/lib/types';
import { useDailyLogs } from './DailyLogContext';
import { useSettings } from './SettingsContext';
import { useMeals } from './MealContext';
import { useFavorites } from './FavoriteContext';
import { useShoppingLists } from './ShoppingListContext';
import { useFoods } from './FoodContext';
import { allBadges, evaluateAchievements } from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from './LocaleContext';

interface AchievementContextType {
    userAchievements: UserAchievement[];
    setAchievements: (achievements: UserAchievement[]) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
    const [userAchievements, setUserAchievements] = useLocalStorage<UserAchievement[]>('userAchievements', []);
    const { dailyLogs } = useDailyLogs();
    const { settings } = useSettings();
    const { meals } = useMeals();
    const { favoriteFoodIds } = useFavorites();
    const { shoppingLists } = useShoppingLists();
    const { foods } = useFoods();
    const { toast } = useToast();
    const { t } = useLocale();

    useEffect(() => {
        const earnedBadgeIds = new Set(userAchievements.map(a => a.badgeId));
        const newAchievements = evaluateAchievements(
            { dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods },
            allBadges,
            earnedBadgeIds
        );
        if (newAchievements.length > 0) {
            setUserAchievements(prev => [...prev, ...newAchievements]);
            newAchievements.forEach(achievement => {
                const badge = allBadges.find(b => b.id === achievement.badgeId);
                if (badge) {
                    toast({
                        title: `${t('Achievement Unlocked!')} 🎉`,
                        description: t(badge.name),
                    });
                }
            });
        }
    }, [dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods, userAchievements, setUserAchievements, t, toast]);

    return (
        <AchievementContext.Provider value={{ userAchievements, setAchievements: setUserAchievements }}>
            {children}
        </AchievementContext.Provider>
    );
};

export const useAchievements = () => {
    const context = useContext(AchievementContext);
    if (context === undefined) {
        throw new Error('useAchievements must be used within an AchievementProvider');
    }
    return context;
};
