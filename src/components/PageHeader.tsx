import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 border-b">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <SidebarTrigger />
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-headline text-foreground">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">{children}</div>
        </div>
      </div>
    </header>
  );
}
