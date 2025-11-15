
"use client";

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { UserAchievement } from '@/lib/types';
import { allBadges, evaluateAchievements } from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from './LocaleContext';
import useAppStore from './AppStore';

const AchievementContext = createContext<undefined>(undefined);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
    useAchievementObserver(); // Initialize the achievement observer
    return <AchievementContext.Provider value={undefined}>{children}</AchievementContext.Provider>;
};


// This is not a provider anymore, but a hook that encapsulates the achievement logic
export const useAchievementObserver = () => {
    const { 
        userAchievements, 
        setAchievements, 
        dailyLogs, 
        settings, 
        meals, 
        favoriteFoodIds, 
        shoppingLists, 
        foods 
    } = useAppStore();
    
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
            setAchievements([...userAchievements, ...newAchievements]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dailyLogs, settings, meals, favoriteFoodIds, shoppingLists, foods]); // userAchievements is omitted to prevent loop
};
