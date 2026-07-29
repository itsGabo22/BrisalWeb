'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, CheckCircle2, LogOut, UserCheck } from 'lucide-react';

const POLL_INTERVAL_MS = 60_000;

interface AdminNotification {
  id: string;
  message: string;
  href: string;
  count: number;
}

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [notifTotal, setNotifTotal] = React.useState(0);
  const [isBellOpen, setIsBellOpen] = React.useState(false);
  const bellRef = React.useRef<HTMLDivElement>(null);

  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setNotifTotal(data.total);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadNotifications());
    const timer = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSectionTitle = () => {
    if (pathname === '/admin') return 'Panel General';
    if (pathname.startsWith('/admin/productos')) return 'Gestión de Productos';
    if (pathname.startsWith('/admin/categorias')) return 'Gestión de Categorías';
    if (pathname.startsWith('/admin/descuentos')) return 'Gestión de Descuentos';
    if (pathname.startsWith('/admin/mayoristas')) return 'Aprobación de Mayoristas';
    if (pathname.startsWith('/admin/pedidos')) return 'Gestión de Pedidos';
    if (pathname.startsWith('/admin/imagenes')) return 'Bandeja de Imágenes';
    if (pathname.startsWith('/admin/configuracion')) return 'Configuración del Sitio';
    return 'Administración';
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const res = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/admin/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-brand-neutral-200 bg-brand-pearl px-6 dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
      {/* Title */}
      <h1 className="font-serif text-xl font-semibold text-brand-neutral-900 dark:text-brand-neutral-100 lg:text-2xl">
        {getSectionTitle()}
      </h1>

      {/* Admin Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setIsBellOpen((prev) => !prev)}
            className="relative flex size-9 items-center justify-center rounded-full text-brand-neutral-600 hover:bg-brand-neutral-100 hover:text-brand-neutral-900 transition-colors dark:text-brand-neutral-400 dark:hover:bg-brand-neutral-800 dark:hover:text-brand-neutral-100"
            aria-label="Notificaciones"
            aria-expanded={isBellOpen}
          >
            <Bell className="size-5" />
            {notifTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notifTotal > 9 ? '9+' : notifTotal}
              </span>
            )}
          </button>

          {isBellOpen && (
            <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-brand-neutral-200 bg-white p-2 shadow-lg dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
              {notifications.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-4 font-sans text-sm text-brand-neutral-500 dark:text-brand-neutral-400">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Sin notificaciones pendientes ✓</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {notifications.map((notif) => (
                    <li key={notif.id}>
                      <Link
                        href={notif.href}
                        onClick={() => setIsBellOpen(false)}
                        className="block rounded-lg px-3 py-2.5 font-sans text-sm text-brand-neutral-700 hover:bg-brand-neutral-50 dark:text-brand-neutral-300 dark:hover:bg-brand-neutral-800 transition-colors"
                      >
                        {notif.message}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-brand-neutral-200 bg-brand-neutral-50 px-3 py-1 text-xs text-brand-neutral-600 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-400">
          <UserCheck className="size-4 text-brand-gold" />
          <span>Administrador</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 rounded-md border border-brand-neutral-200 bg-white px-3 py-2 text-sm font-medium text-brand-neutral-700 hover:bg-brand-neutral-50 hover:text-brand-neutral-900 transition-colors dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-400 dark:hover:bg-brand-neutral-900 dark:hover:text-brand-neutral-100 disabled:opacity-50"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
