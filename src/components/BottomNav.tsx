"use client";

import { Home, Heart, UtensilsCrossed, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/foods', icon: Home, label: 'Foods' },
  { href: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { href: 'create-meal', icon: Plus, label: 'Create' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { setMealBuilderOpen } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border shadow-t-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          if (item.href === 'create-meal') {
            return (
              <div key={item.href} className="relative -top-6">
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                  onClick={() => setMealBuilderOpen(true)}
                  aria-label="Create new meal"
                >
                  <Plus className="w-8 h-8" />
                </Button>
              </div>
            );
          }

          return (
            <Link href={item.href} key={item.href} legacyBehavior>
              <a className="flex flex-col items-center justify-center text-center w-16">
                <item.icon className={cn('w-6 h-6 mb-1', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
