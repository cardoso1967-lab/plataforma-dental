'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { LayoutDashboard, Wrench, Calendar, LogOut, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function TecnicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, profile } = useAuth();
  
  const tecnicoNavItems = [
    { label: 'Painel', href: '/tecnico/dashboard', icon: LayoutDashboard },
    { label: 'Serviços', href: '/tecnico/servicos', icon: Wrench },
    { label: 'Agenda', href: '/tecnico/agenda', icon: Calendar },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0 lg:flex lg:flex-row">
      {/* Sidebar para telas grandes (opcional para desktop do técnico) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-[#070A13] border-r border-[#121829] text-white p-6 sticky top-0 h-screen">
        <div className="space-y-6">
          <Link href="/tecnico/dashboard" className="flex items-center gap-3 group">
            <div className="bg-sky-500 text-slate-950 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105 shadow-[0_4px_12px_rgba(14,165,233,0.15)] shrink-0">
              <Stethoscope className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-white text-sm tracking-tight block">
                Painel Técnico
              </span>
              <span className="text-sky-400 font-bold text-[10px] uppercase tracking-widest block -mt-0.5 font-mono">
                Plataforma
              </span>
            </div>
          </Link>
          
          <nav className="space-y-1.5 pt-4">
            {tecnicoNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-sky-500/10 to-transparent text-sky-450 rounded-xl shadow-[inset_2px_0_0_0_rgba(14,165,233,1)] border-l-0'
                      : 'text-slate-400 hover:bg-[#121829]/40 hover:text-slate-200 rounded-xl hover:translate-x-0.5'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${active ? 'text-sky-450' : 'text-slate-500 group-hover:text-slate-350'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          {profile && (
            <div className="flex items-center gap-3 px-3 py-3 bg-[#121829]/30 rounded-2xl border border-[#121829] text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-sky-950/80 text-sky-405 flex items-center justify-center font-bold text-xs border border-sky-500/20 flex-shrink-0 shadow-sm shadow-sky-500/5 font-mono">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-200 truncate leading-none mb-1.5">{profile.name}</p>
                <span className="inline-block text-[8px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 uppercase tracking-wider leading-none font-mono">
                  TÉCNICO
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 transition-all w-full text-left bg-transparent border border-transparent outline-none cursor-pointer hover:scale-[1.015] active:scale-[0.985]"
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Sair do Portal</span>
          </button>
        </div>
      </aside>

      {/* Header simplificado para mobile */}
      <div className="lg:hidden bg-[#070A13] border-b border-[#121829] text-white p-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <Link href="/tecnico/dashboard" className="flex items-center gap-2">
          <div className="bg-sky-500 text-slate-950 p-1.5 rounded-lg">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">Painel Técnico</span>
        </Link>
        <button 
          onClick={logout}
          className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer hover:text-rose-300"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      {/* Área do conteúdo */}
      <div className="flex-1 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Navegação Inferior Móvel */}
      <BottomNav items={tecnicoNavItems} />
    </div>
  );
}
