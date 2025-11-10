"use client";

import BottomNav from '@/components/BottomNav';
import MealBuilder from '@/components/meal/MealBuilder';
import { useAppContext } from '@/context/AppContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMealBuilderOpen, setMealBuilderOpen } = useAppContext();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-24 md:pb-8">{children}</main>
      <BottomNav />
      <MealBuilder open={isMealBuilderOpen} onOpenChange={setMealBuilderOpen} />
    </div>
  );
}
