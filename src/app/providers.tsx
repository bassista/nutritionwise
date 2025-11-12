
'use client';
import type {ReactNode} from 'react';
import { LocaleProvider } from '@/context/LocaleContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { FoodProvider } from '@/context/FoodContext';
import { MealProvider } from '@/context/MealContext';
import { FavoriteProvider } from '@/context/FavoriteContext';
import { DailyLogProvider } from '@/context/DailyLogContext';
import { UIStateProvider } from '@/context/UIStateContext';
import { ShoppingListProvider } from '@/context/ShoppingListContext';
import { AchievementProvider } from '@/context/AchievementContext';

export function Providers({children}: {children: ReactNode}) {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <MealProvider>
          <FavoriteProvider>
            <FoodProvider>
              <ShoppingListProvider>
                <DailyLogProvider>
                  <AchievementProvider>
                    <UIStateProvider>
                      {children}
                    </UIStateProvider>
                  </AchievementProvider>
                </DailyLogProvider>
              </ShoppingListProvider>
            </FoodProvider>
          </FavoriteProvider>
        </MealProvider>
      </SettingsProvider>
    </LocaleProvider>
  );
}
