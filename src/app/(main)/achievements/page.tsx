
"use client";

import { useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useLocale } from '@/context/LocaleContext';
import { useAchievements } from '@/context/AchievementContext';
import { allBadges } from '@/lib/gamification';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function AchievementsPage() {
  const { t } = useLocale();
  const { userAchievements } = useAchievements();

  const achievementsWithStatus = useMemo(() => {
    const earnedIds = new Set(userAchievements.map(a => a.badgeId));
    return allBadges.map(badge => ({
      ...badge,
      isEarned: earnedIds.has(badge.id),
      earnedOn: userAchievements.find(a => a.badgeId === badge.id)?.date,
    }));
  }, [userAchievements]);

  return (
    <>
      <PageHeader title={t('Achievements')} />
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {achievementsWithStatus.map(badge => (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={cn(
                    "transition-all",
                    badge.isEarned ? "border-primary/50 shadow-lg" : "opacity-60"
                  )}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-full",
                        badge.isEarned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Trophy className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{t(badge.name)}</CardTitle>
                        <CardDescription className="text-xs">{badge.isEarned && badge.earnedOn ? `${t('Earned on')}: ${new Date(badge.earnedOn).toLocaleDateString()}` : t('Locked')}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t(badge.description)}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                {!badge.isEarned && (
                  <TooltipContent>
                    <p>{t('Keep using the app to unlock this achievement!')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </>
  );
}
