'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { LayoutDashboard, Receipt, Wrench, LifeBuoy, Stethoscope, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cliente-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('cliente-sidebar-collapsed', String(collapsed));
  };

  const clientNavItems = [
    { label: 'Início', href: '/cliente/dashboard', icon: LayoutDashboard },
    { label: 'Pedidos', href: '/cliente/pedidos', icon: Receipt },
    { label: 'Equipamentos', href: '/cliente/equipamentos', icon: Wrench },
    { label: 'Suporte', href: '/cliente/suporte', icon: LifeBuoy },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    // h-screen overflow-hidden: o container pai tem exatamente a altura do viewport.
    // O scroll acontece dentro da área de conteúdo, não na página inteira.
    // Isso impede que a sidebar "pare" antes do fim do conteúdo.
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-row">

      {/* Sidebar fixa — Desktop: cobre 100% da altura do viewport com position fixed */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen [height:100dvh] flex-col justify-between bg-[#070A13] border-r border-[#121829] text-white p-4 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <Link href="/cliente/dashboard" className="flex items-center gap-3 group">
              <div className="bg-sky-500 text-slate-950 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105 shadow-[0_4px_12px_rgba(14,165,233,0.15)] shrink-0">
                <Stethoscope className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              {!isCollapsed && (
                <div className="text-left animate-in fade-in duration-300">
                  <span className="font-extrabold text-white text-sm tracking-tight block">
                    Área do Cliente
                  </span>
                  <span className="text-sky-400 font-bold text-[10px] uppercase tracking-widest block -mt-0.5 font-mono">
                    Plataforma
                  </span>
                </div>
              )}
            </Link>

            {/* Botão expandir/contraer */}
            <button
              onClick={() => handleSetCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121829] border border-[#121829] transition-all duration-200"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          
          <nav className="space-y-1.5 pt-4">
            {clientNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-sky-500/10 to-transparent text-sky-450 rounded-xl shadow-[inset_2px_0_0_0_rgba(14,165,233,1)] border-l-0'
                      : 'text-slate-400 hover:bg-[#121829]/40 hover:text-slate-200 rounded-xl hover:translate-x-0.5'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 transition-colors duration-200 shrink-0 ${active ? 'text-sky-450' : 'text-slate-500 group-hover:text-slate-350'}`} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          {profile && (
            <div className={`flex items-center bg-[#121829]/30 rounded-xl border border-[#121829] text-left relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}>
              <div className="w-8.5 h-8.5 rounded-lg bg-sky-950/80 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/20 flex-shrink-0 shadow-sm font-mono">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden animate-in fade-in duration-300">
                  <p className="text-[11px] font-bold text-slate-200 truncate leading-none mb-1.5">{profile.name}</p>
                  <span className="inline-block text-[8px] font-bold text-sky-400 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider leading-none font-mono">
                    {profile.role === 'cliente' ? 'CLIENTE' : profile.role}
                  </span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={logout}
            title={isCollapsed ? "Sair do Portal" : undefined}
            className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 transition-all w-full text-left bg-transparent border border-transparent outline-none cursor-pointer hover:scale-[1.015] active:scale-[0.985] ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Sair do Portal</span>}
          </button>
        </div>
      </aside>

      {/* Header simplificado para mobile */}
      <div className="lg:hidden bg-[#070A13] border-b border-[#121829] text-white p-4 fixed top-0 left-0 right-0 z-40 flex items-center justify-between shadow-md">
        <Link href="/cliente/dashboard" className="flex items-center gap-2">
          <div className="bg-sky-500 text-slate-950 p-1.5 rounded-lg">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">Portal do Cliente</span>
        </Link>
        <button 
          onClick={logout}
          className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer hover:text-rose-300"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      {/* Área do conteúdo — rola internamente, padding-left compensa a sidebar fixa no desktop */}
      <div
        className={`flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-0 pt-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Espaçador para o header fixo no mobile */}
        <div className="lg:hidden h-16" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1180px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Navegação Inferior Móvel */}
      <BottomNav items={clientNavItems} />
    </div>
  );
}
