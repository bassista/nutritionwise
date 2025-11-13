
"use client";

import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AchievementFilter = "all" | "earned" | "not-earned";

export default function AchievementsPage() {
  const { t } = useLocale();
  const { userAchievements } = useAchievements();
  const [filter, setFilter] = useState<AchievementFilter>("all");

  const achievementsWithStatus = useMemo(() => {
    const earnedIds = new Set(userAchievements.map(a => a.badgeId));
    return allBadges.map(badge => ({
      ...badge,
      isEarned: earnedIds.has(badge.id),
      earnedOn: userAchievements.find(a => a.badgeId === badge.id)?.date,
    }));
  }, [userAchievements]);

  const filteredAchievements = useMemo(() => {
    if (filter === "earned") {
      return achievementsWithStatus.filter(a => a.isEarned);
    }
    if (filter === "not-earned") {
      return achievementsWithStatus.filter(a => !a.isEarned);
    }
    return achievementsWithStatus;
  }, [achievementsWithStatus, filter]);

  return (
    <>
      <PageHeader title={t('Achievements')}>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as AchievementFilter)}>
            <TabsList>
                <TabsTrigger value="all">{t('All')}</TabsTrigger>
                <TabsTrigger value="earned">{t('Earned')}</TabsTrigger>
                <TabsTrigger value="not-earned">{t('Not Earned')}</TabsTrigger>
            </TabsList>
        </Tabs>
      </PageHeader>
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAchievements.map(badge => (
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
