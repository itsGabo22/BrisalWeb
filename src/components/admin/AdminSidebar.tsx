'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Percent,
  Users,
  Images,
  Settings,
  ClipboardList,
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
  { name: 'Pedidos', href: '/admin/pedidos', icon: ClipboardList },
  { name: 'Descuentos', href: '/admin/descuentos', icon: Percent },
  { name: 'Mayoristas', href: '/admin/mayoristas', icon: Users },
  { name: 'Imágenes', href: '/admin/imagenes', icon: Images },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = React.useState(0);

  React.useEffect(() => {
    queueMicrotask(() => setIsMobileOpen(false));
  }, [pathname]);

  React.useEffect(() => {
    async function loadPendingOrders() {
      try {
        const res = await fetch('/api/admin/notificaciones');
        if (res.ok) {
          const data = await res.json();
          const pendingOrders = data.notifications.find(
            (n: { id: string; count: number }) => n.id === 'pending-orders',
          );
          setPendingOrdersCount(pendingOrders?.count ?? 0);
        }
      } catch (error) {
        console.error('Error loading pending orders count:', error);
      }
    }

    void Promise.resolve().then(loadPendingOrders);
    const timer = setInterval(loadPendingOrders, 60_000);
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
          className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-brand-neutral-200 bg-brand-neutral-950 text-brand-neutral-200 transition-all duration-300 dark:border-brand-neutral-800',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-brand-neutral-900">
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

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 font-sans text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-brand-gold text-brand-neutral-950 font-semibold'
                    : 'text-brand-neutral-400 hover:bg-brand-neutral-900 hover:text-brand-neutral-200'
                )}
              >
                <Icon
                  className={cn(
                    'size-5 flex-shrink-0',
                    isActive ? 'text-brand-neutral-950' : 'text-brand-neutral-400 group-hover:text-brand-neutral-200'
                  )}
                />
                <span
                  className={cn(
                    'flex flex-1 items-center justify-between transition-all duration-300',
                    isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'
                  )}
                >
                  {item.name}
                  {item.href === '/admin/pedidos' && pendingOrdersCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                    </span>
                  )}
                </span>

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <span className="absolute left-14 z-50 scale-0 rounded bg-brand-neutral-900 px-2 py-1 text-xs text-brand-neutral-100 transition-all group-hover:scale-100 shadow-md">
                    {item.name}
                    {item.href === '/admin/pedidos' && pendingOrdersCount > 0 && ` (${pendingOrdersCount})`}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-brand-neutral-900 text-xs text-brand-neutral-500 font-sans">
          {!isCollapsed && <p>Brisal by Salvador</p>}
        </div>
      </aside>
    </>
  );
}
