'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutList, Menu, Send, X } from 'lucide-react';
import { TemplatesNavButton } from '@/components/templates-password-gate';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  hiddenNavHrefs?: string[];
};

const NAV_ITEMS = [
  { href: '/', label: 'Send Application', shortLabel: 'Send', icon: Send },
  { href: '/templates', label: 'Templates', shortLabel: 'Templates', icon: FileText },
  { href: '/applications', label: 'Application Tracker', shortLabel: 'Tracker', icon: LayoutList },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Send;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Button
      asChild
      variant={active ? 'secondary' : 'ghost'}
      className="h-11 w-full justify-start gap-3 px-3"
      onClick={onNavigate}
    >
      <Link href={href}>
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

export function AppHeader({ title, subtitle, icon, actions, hiddenNavHrefs = [] }: AppHeaderProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = NAV_ITEMS.filter((item) => !hiddenNavHrefs.includes(item.href));

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const renderNavItem = (item: NavItem, mobile = false) => {
    const active = pathname === item.href;
    const Icon = item.icon;

    if (item.href === '/templates') {
      return (
        <TemplatesNavButton
          key={item.href}
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          label={mobile ? item.label : 'Templates'}
          alwaysShowLabel={mobile}
          className={mobile ? 'h-11 w-full justify-start gap-3 px-3' : undefined}
          onNavigate={mobile ? closeSidebar : undefined}
        />
      );
    }

    if (mobile) {
      return (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={Icon}
          active={active}
          onNavigate={closeSidebar}
        />
      );
    }

    return (
      <Button key={item.href} asChild variant={active ? 'secondary' : 'ghost'} size="sm">
        <Link href={item.href}>
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.shortLabel}</span>
        </Link>
      </Button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 md:flex">
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{title}</h1>
              {subtitle && (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions once in header (mobile + desktop) so loaders/state stay in sync */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {actions}
            <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
              {navItems.map((item) => renderNavItem(item, false))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={cn('fixed inset-0 z-50 md:hidden', sidebarOpen ? 'visible' : 'invisible')}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeSidebar}
          aria-label="Close menu overlay"
        />

        <aside
          className={cn(
            'absolute left-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-r border-border/60 bg-background shadow-2xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                {icon}
              </div>
              <span className="truncate font-semibold">{title}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={closeSidebar} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {subtitle && (
            <p className="shrink-0 px-4 pb-3 pt-2 text-xs text-muted-foreground">{subtitle}</p>
          )}

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Navigation
            </p>
            {navItems.map((item) => renderNavItem(item, true))}
          </nav>

        </aside>
      </div>
    </>
  );
}
