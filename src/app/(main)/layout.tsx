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
} from '@/components/ui/sidebar';
import { Heart, Home, Settings, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';

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
      <Sidebar>
        <SidebarHeader>
          <SidebarTrigger />
        </SidebarHeader>
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
