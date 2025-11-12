
"use client";

import { Wheat, Heart, UtensilsCrossed, Plus, BookOpen, ShoppingCart } from 'lucide-react';
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
    { href: '/diary', label: t('Diary') },
    { href: '/foods', label: t('Foods') },
    { href: '/favorites', label: t('Favorites') },
    { href: '/meals', label: t('Meals') },
    { href: '/shopping-list', label: t('Shopping Lists') },
  ];
  
  const navIcons: Record<string, React.ElementType> = {
    [t('Diary')]: BookOpen,
    [t('Foods')]: Wheat,
    [t('Favorites')]: Heart,
    [t('Meals')]: UtensilsCrossed,
    [t('Shopping Lists')]: ShoppingCart,
  };


  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border shadow-t-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = navIcons[item.label] || Wheat;
          
          return (
            <Link
              href={item.href}
              key={item.href}
              className="flex-1 flex flex-col items-center justify-center text-center"
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
