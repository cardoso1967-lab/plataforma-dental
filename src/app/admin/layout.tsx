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
    <div className="min-h-dvh bg-slate-50">
      {/* Riel de fondo oscuro fijo - garantiza continuidad visual de fondo al hacer scroll */}
      <div
        className={`fixed inset-y-0 left-0 z-20 hidden lg:block bg-[#070A13] border-r border-[#121829] transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      />

      {/* Sidebar Responsiva Colapsável */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleSetCollapsed} />

      {/* Main Content Wrapper — ocupa o restante da largura correspondente ao sidebar */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
