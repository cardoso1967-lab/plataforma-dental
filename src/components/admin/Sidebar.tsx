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
      <div className="lg:hidden flex items-center justify-between bg-[#070A13] text-white p-4 sticky top-0 z-40 border-b border-[#121829] shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-sky-500 text-slate-950 p-1.5 rounded-lg">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight font-sans">Admin Dental</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl hover:bg-slate-900 text-slate-350 focus:outline-none transition-all border border-[#121829]"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay para Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#070A13] border-r border-[#121829] text-white w-64 transform lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 lg:z-30 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar relative">
          {/* Luz difusa de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="p-6 border-b border-[#121829] flex items-center justify-between bg-[#070A13]">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="bg-sky-500 text-slate-950 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105 shadow-[0_4px_12px_rgba(14,165,233,0.15)] shrink-0">
                <Stethoscope className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-white text-sm tracking-tight block">
                  Plataforma
                </span>
                <span className="text-sky-400 font-bold text-[10px] uppercase tracking-widest block -mt-0.5 font-mono">
                  Dental
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border border-[#121829]"
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

        {/* Footer */}
        <div className="p-4 border-t border-[#121829] bg-[#070A13] flex flex-col gap-3">
          {profile && (
            <div className="flex items-center gap-3 px-3 py-3 bg-[#121829]/30 rounded-2xl border border-[#121829] text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-sky-950/80 text-sky-405 flex items-center justify-center font-bold text-xs border border-sky-500/20 flex-shrink-0 shadow-sm shadow-sky-500/5 font-mono">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-200 truncate leading-none mb-1.5">{profile.name}</p>
                <span className="inline-block text-[8px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 uppercase tracking-wider leading-none font-mono">
                  {profile.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all w-full text-left bg-transparent border border-transparent outline-none cursor-pointer hover:scale-[1.015] active:scale-[0.985]"
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
