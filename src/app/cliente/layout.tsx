'use client';

import React from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { LayoutDashboard, Receipt, Wrench, LifeBuoy, Stethoscope, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientNavItems = [
    { label: 'Início', href: '/cliente/dashboard', icon: LayoutDashboard },
    { label: 'Pedidos', href: '/cliente/pedidos', icon: Receipt },
    { label: 'Equipamentos', href: '/cliente/equipamentos', icon: Wrench },
    { label: 'Suporte', href: '/cliente/suporte', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0 lg:flex lg:flex-row">
      {/* Sidebar para telas grandes (opcional para desktop do cliente) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-900 text-white p-6 sticky top-0 h-screen">
        <div className="space-y-6">
          <Link href="/cliente/dashboard" className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-brand-clinical" />
            <span className="font-extrabold text-sm tracking-tight text-white">Cliente Dental</span>
          </Link>
          <nav className="space-y-2">
            {clientNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 py-2.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do Portal</span>
        </Link>
      </aside>

      {/* Header simplificado para mobile */}
      <div className="lg:hidden bg-slate-900 text-white p-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <Link href="/cliente/dashboard" className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-clinical" />
          <span className="font-extrabold text-sm tracking-tight">Portal do Cliente</span>
        </Link>
        <Link href="/" className="text-xs font-semibold text-rose-400 flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Sair
        </Link>
      </div>

      {/* Área do conteúdo */}
      <div className="flex-1 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Navegação Inferior Móvel */}
      <BottomNav items={clientNavItems} />
    </div>
  );
}
