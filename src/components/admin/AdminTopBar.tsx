'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, UserCheck } from 'lucide-react';

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const getSectionTitle = () => {
    if (pathname === '/admin') return 'Panel General';
    if (pathname.startsWith('/admin/productos')) return 'Gestión de Productos';
    if (pathname.startsWith('/admin/categorias')) return 'Gestión de Categorías';
    if (pathname.startsWith('/admin/descuentos')) return 'Gestión de Descuentos';
    if (pathname.startsWith('/admin/mayoristas')) return 'Aprobación de Mayoristas';
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
