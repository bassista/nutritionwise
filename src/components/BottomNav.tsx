"use client";

import { Home, Heart, UtensilsCrossed, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { setMealBuilderOpen } = useAppContext();
  const { t } = useLocale();

  const navItems = [
    { href: '/foods', label: t('Foods') },
    { href: '/meals', label: t('Meals') },
    { href: 'create-meal', label: t('Create') },
    { href: '/favorites', label: t('Favorites') },
    { href: '/settings', label: t('Settings') },
  ];
  
  const navIcons = {
    [t('Foods')]: Home,
    [t('Meals')]: UtensilsCrossed,
    [t('Create')]: Plus,
    [t('Favorites')]: Heart,
    [t('Settings')]: Settings,
  };


  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border shadow-t-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = navIcons[item.label as keyof typeof navIcons] || Home;

          if (item.href === 'create-meal') {
            return (
              <div key={item.href} className="relative -top-6">
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                  onClick={() => setMealBuilderOpen(true)}
                  aria-label={t('Create new meal')}
                >
                  <Plus className="w-8 h-8" />
                </Button>
              </div>
            );
          }

          return (
            <Link
              href={item.href}
              key={item.href}
              className="flex flex-col items-center justify-center text-center w-16"
            >
              <Icon className={cn('w-6 h-6 mb-1', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
