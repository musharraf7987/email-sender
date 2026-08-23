'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutList, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  hiddenNavHrefs?: string[];
};

const NAV_ITEMS = [
  { href: '/', label: 'Send', icon: Send },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/applications', label: 'Tracker', icon: LayoutList },
] as const;

export function AppHeader({ title, subtitle, icon, actions, hiddenNavHrefs = [] }: AppHeaderProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter((item) => !hiddenNavHrefs.includes(item.href));

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{title}</h1>
            {subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
