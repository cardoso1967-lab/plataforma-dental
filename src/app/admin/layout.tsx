'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-row">
      {/* Sidebar Responsiva Colapsável */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleSetCollapsed} />

      {/* Main Content Wrapper — ocupa o restante da largura e rola internamente */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
