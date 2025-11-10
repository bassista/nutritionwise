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
import { Heart, Home, Settings, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';

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

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMealBuilderOpen, setMealBuilderOpen } = useAppContext();
  const pathname = usePathname();
  const { t } = useLocale();

  const navItems = [
    { href: '/foods', icon: Home, label: t('Foods') },
    { href: '/meals', icon: UtensilsCrossed, label: t('Meals') },
    { href: '/favorites', icon: Heart, label: t('Favorites') },
    { href: '/settings', icon: Settings, label: t('Settings') },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeaderContent />
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
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
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">NutritionWise</h1>
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
