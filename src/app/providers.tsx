
'use client';
import type {ReactNode} from 'react';
import { AppProvider } from '@/context/AppContext';
import { LocaleProvider } from '@/context/LocaleContext';

export function Providers({children}: {children: ReactNode}) {
  return (
    <LocaleProvider>
      <AppProvider>{children}</AppProvider>
    </LocaleProvider>
  );
}
