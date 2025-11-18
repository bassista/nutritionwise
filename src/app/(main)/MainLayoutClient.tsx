
"use client";

import { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import MealBuilder from '@/components/meal/MealBuilder';
import { useUIState } from '@/context/UIStateContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Heart, Wheat, Settings, UtensilsCrossed, LineChart, BookOpen, ScanLine, ShoppingCart, Trophy, HeartPulse, List } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { useAchievementObserver } from '@/context/AchievementContext';

function SidebarHeaderContent() {
  const { open } = useSidebar();
  return (
    <SidebarHeader>
      <div className="flex items-center justify-between">
        {open && <h2 className="text-lg font-semibold px-2">NutritionWise</h2>}
        <SidebarTrigger />
      </div>
    </SidebarHeader>
  );
}

function SidebarNav() {
    const { t } = useLocale();
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    const handleLinkClick = () => {
      if (isMobile) {
        setOpenMobile(false);
      }
    };
    
    const navItems = useMemo(() => [
      { href: '/diary', icon: BookOpen, label: t('Diary') },
      { href: '/health', icon: HeartPulse, label: t('Health') },
      { href: '/analytics', icon: LineChart, label: t('Analytics') },
      { href: '/foods', icon: Wheat, label: t('Foods') },
      { href: '/scanner', icon: ScanLine, label: t('Scanner') },
      { href: '/favorites', icon: Heart, label: t('Favorites') },
      { href: '/meals', icon: UtensilsCrossed, label: t('Meals') },
      { href: '/shopping-list', icon: List, label: t('Lists') },
      { href: '/achievements', icon: Trophy, label: t('Achievements') },
    ], [t]);
    
    return (
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  onClick={handleLinkClick}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
    )
}

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMealBuilderOpen, setMealBuilderOpen } = useUIState();
  const { t } = useLocale();
  useAchievementObserver(); // Initialize the achievement observer
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeaderContent />
        <SidebarNav />
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1 text-center md:hidden">
                <h1 className="text-xl font-bold font-headline">NutritionWise</h1>
              </div>
              <div className="flex justify-end flex-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href="/settings" aria-label={t('Settings')}>
                      <Settings />
                    </Link>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-grow pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav />
        <MealBuilder
          open={isMealBuilderOpen}
          onOpenChange={setMealBuilderOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
