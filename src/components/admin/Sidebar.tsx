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

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-clinical" />
          <span className="font-extrabold text-sm tracking-tight">Admin Dental</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay para Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-brand-dark text-white w-64 transform lg:translate-x-0 transition-transform duration-200 ease-in-out z-50 lg:z-30 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="bg-brand-clinical text-white p-2 rounded-lg">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                Plataforma<span className="text-brand-clinical">Dental</span>
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menus */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-clinical text-white shadow-sm shadow-sky-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Voltar ao Portal</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
