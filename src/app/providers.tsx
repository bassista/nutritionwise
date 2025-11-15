
'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import { LocaleProvider } from '@/context/LocaleContext';
import useAppStore from '@/context/AppStore';
import { UIStateProvider } from '@/context/UIStateContext';
import Spinner from '@/components/ui/spinner';
import { useAchievementObserver } from '@/context/AchievementContext';

function AppInitializer({ children }: { children: ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const load = useAppStore((state) => state.load);

    useEffect(() => {
        const initialize = async () => {
            await load();
            setIsInitialized(true);
        };
        initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isInitialized) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }
    return <>{children}</>;
}


export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
        <AppInitializer>
          <UIStateProvider>
              {children}
          </UIStateProvider>
        </AppInitializer>
    </LocaleProvider>
  );
}
