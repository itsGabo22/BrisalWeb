'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-brand-pearl dark:bg-brand-neutral-950 transition-colors">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen lg:pl-64 transition-all duration-300">
        {/* TopBar */}
        <AdminTopBar />

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 font-sans">
          {children}
        </main>
      </div>
    </div>
  );
}
