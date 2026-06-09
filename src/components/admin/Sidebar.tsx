'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Wrench,
  UserCog,
  Calendar,
  CircleDollarSign,
  Settings,
  BarChart3,
  Menu,
  X,
  Stethoscope,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/components/AuthProvider';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout, profile } = useAuth();

  const menuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Clientes', href: '/admin/clientes', icon: Users },
    { label: 'Produtos', href: '/admin/produtos', icon: Package },
    { label: 'Pedidos de Venda', href: '/admin/pedidos-venda', icon: Receipt },
    { label: 'Ordens de Serviço', href: '/admin/ordens-servico', icon: Wrench },
    { label: 'Técnicos', href: '/admin/tecnicos', icon: UserCog },
    { label: 'Agenda', href: '/admin/agenda', icon: Calendar },
    { label: 'Orçamentos', href: '/admin/orcamentos', icon: CircleDollarSign },
    { label: 'Peças de Reposição', href: '/admin/pecas', icon: Settings },
    { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Botão de Toggle Mobile */}
      <div className="lg:hidden flex items-center justify-between bg-slate-950 text-white p-4 sticky top-0 z-40 border-b border-slate-900 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-sky-500 text-slate-950 p-1.5 rounded-lg">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">Admin Dental</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl hover:bg-slate-900 text-slate-300 focus:outline-none transition-colors border border-slate-900"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay para Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-slate-950 border-r border-slate-900 text-white w-64 transform lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 lg:z-30 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between bg-slate-980/50">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="bg-sky-550 text-slate-950 p-2 rounded-xl transition-all duration-300 group-hover:scale-105 shadow-sm shadow-sky-550/10">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="font-black text-white text-base tracking-tight leading-none">
                Plataforma<span className="text-sky-455 font-bold block text-[10px] uppercase tracking-widest mt-0.5">Dental</span>
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menus */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4.5 py-3 text-xs font-bold tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-sky-500/10 text-sky-400 border-l-4 border-sky-500 rounded-r-xl shadow-[inset_1px_0_0_0_rgba(14,165,233,0.1)]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 rounded-xl'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${active ? 'text-sky-400' : 'text-slate-405'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-980/30 flex flex-col gap-2">
          {profile && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 border-b border-slate-900/50 mb-1">
              <div className="w-8 h-8 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center font-black text-xs border border-sky-900/30 flex-shrink-0 shadow-2xs">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[11px] font-extrabold text-slate-250 truncate leading-none mb-1">{profile.name}</p>
                <p className="text-[9px] font-bold text-slate-500 truncate leading-none uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all w-full text-left bg-transparent border border-transparent outline-none cursor-pointer hover:scale-[1.01]"
          >
            <LogOut className="w-4 h-4 text-rose-455" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
