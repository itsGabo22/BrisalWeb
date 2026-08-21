'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Gem,
  Percent,
  Ticket,
  Users,
  Images,
  Settings,
  ClipboardList,
  Star,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Productos', href: '/admin/productos', icon: ShoppingBag },
  { name: 'Categorías', href: '/admin/categorias', icon: FolderTree },
  { name: 'Materiales', href: '/admin/materiales', icon: Gem },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ClipboardList },
  { name: 'Reseñas', href: '/admin/resenas', icon: Star },
  { name: 'Descuentos', href: '/admin/descuentos', icon: Percent },
  { name: 'Cupones', href: '/admin/cupones', icon: Ticket },
  { name: 'Mayoristas', href: '/admin/mayoristas', icon: Users },
  { name: 'Imágenes', href: '/admin/imagenes', icon: Images },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  /**
   * Badge counts keyed by the sidebar href they belong on. Generalised from a
   * single pending-orders number so a second queue (reseñas) doesn't need a
   * second piece of state and a third wouldn't either — the notifications
   * endpoint already returns an href per entry, so it says where each count goes.
   */
  const [badgeCounts, setBadgeCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    queueMicrotask(() => setIsMobileOpen(false));
  }, [pathname]);

  // Background scroll while the drawer is open lets the dashboard content
  // move underneath it, which triggers a mobile WebKit/Chromium compositing
  // bug where fixed + backdrop-blur layers repaint out of z-order.
  //
  // Locks <html>, not <body>: the root layout's <html> carries an explicit
  // `overflow-x-clip`, which disqualifies the standard CSS rule that lets a
  // <body> overflow value propagate to the viewport — document.scrollingElement
  // is <html> here, so locking body alone would not actually stop scrolling.
  React.useEffect(() => {
    const root = document.documentElement;
    if (isMobileOpen) {
      root.style.overflowY = 'hidden';
    } else {
      root.style.overflowY = '';
    }
    return () => {
      root.style.overflowY = '';
    };
  }, [isMobileOpen]);

  React.useEffect(() => {
    async function loadNotificationCounts() {
      try {
        const res = await fetch('/api/admin/notificaciones');
        if (res.ok) {
          const data = (await res.json()) as {
            notifications: { id: string; href: string; count: number }[];
          };
          const next: Record<string, number> = {};
          for (const notification of data.notifications) {
            next[notification.href] = (next[notification.href] ?? 0) + notification.count;
          }
          setBadgeCounts(next);
        }
      } catch (error) {
        console.error('Error loading notification counts:', error);
      }
    }

    void Promise.resolve().then(loadNotificationCounts);
    const timer = setInterval(loadNotificationCounts, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-brand-gold text-brand-neutral-900 shadow-lg lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-6" />
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container
          `bg-brand-neutral-950` was never a defined token (the scale stops at
          -900), so it silently compiled to no background at all — the panel
          was fully transparent, letting the backdrop bleed through it with
          only its 1px border as a boundary. `border-brand-gold/20` +
          `shadow-2xl` (the same shadow MobileNav.tsx uses for its own drawer)
          give it a deliberate edge instead. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-45 flex flex-col border-r border-brand-gold/20 bg-brand-neutral-900 text-brand-neutral-200 shadow-2xl transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-brand-neutral-800">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-2 font-serif font-bold text-brand-gold transition-opacity',
              isCollapsed && 'lg:opacity-0'
            )}
          >
            <span>BRISAL ADMIN</span>
          </Link>
          
          {/* Collapse Button (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex size-7 items-center justify-center rounded-md border border-brand-neutral-800 bg-brand-neutral-900 text-brand-neutral-400 hover:text-brand-neutral-200 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badgeCount = badgeCounts[item.href] ?? 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 font-sans text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-brand-gold text-brand-neutral-900 font-semibold'
                    : 'text-brand-neutral-400 hover:bg-brand-neutral-800 hover:text-brand-neutral-200'
                )}
              >
                <Icon
                  className={cn(
                    'size-5 flex-shrink-0',
                    isActive ? 'text-brand-neutral-900' : 'text-brand-neutral-400 group-hover:text-brand-neutral-200'
                  )}
                />
                <span
                  className={cn(
                    'flex flex-1 items-center justify-between transition-all duration-300',
                    isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'
                  )}
                >
                  {item.name}
                  {badgeCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </span>

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <span className="absolute left-14 z-50 scale-0 rounded bg-brand-neutral-900 px-2 py-1 text-xs text-brand-neutral-100 transition-all group-hover:scale-100 shadow-md">
                    {item.name}
                    {badgeCount > 0 && ` (${badgeCount})`}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-brand-neutral-800 text-xs text-brand-neutral-500 font-sans">
          {!isCollapsed && <p>Brisal by Salvador</p>}
        </div>
      </aside>
    </>
  );
}
