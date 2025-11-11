
"use client";

import BottomNav from '@/components/BottomNav';
import MealBuilder from '@/components/meal/MealBuilder';
import { useAppContext } from '@/context/AppContext';
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
import { Heart, Wheat, Settings, UtensilsCrossed, ScanLine, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

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

    const navItems = useMemo(() => [
      { href: '/diary', icon: BookOpen, label: t('Diary') },
      { href: '/foods', icon: Wheat, label: t('Foods') },
      { href: '/scanner', icon: ScanLine, label: t('Scanner') },
      { href: '/favorites', icon: Heart, label: t('Favorites') },
      { href: '/meals', icon: UtensilsCrossed, label: t('Meals') },
    ], [t]);
    
    const handleLinkClick = () => {
      if (isMobile) {
        setOpenMobile(false);
      }
    };

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

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMealBuilderOpen, setMealBuilderOpen } = useAppContext();
  const { t } = useLocale();
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeaderContent />
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger />
            <div className='flex-1 flex justify-end items-center'>
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link href="/settings" aria-label={t('Settings')}>
                    <Settings />
                  </Link>
              </Button>
            </div>
          </header>
          <main className="flex-grow pb-24 md:pb-8">{children}</main>
          <BottomNav />
          <MealBuilder
            open={isMealBuilderOpen}
            onOpenChange={setMealBuilderOpen}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
