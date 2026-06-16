'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Menu, X, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', href: '/' },
    { label: 'Equipamentos', href: '/produtos' },
    { label: 'Suporte Técnico', href: '/suporte' },
    { label: 'Contato', href: '/contato' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white border border-slate-200 rounded-2xl w-10 h-10 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                <img src="/brand/mmuniz-icon.png" alt="M.MUNIZ" className="h-[78%] w-[78%] object-contain" />
              </div>
              <span className="font-extrabold text-brand-dark text-lg tracking-tight">
                M.MUNIZ
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-clinical border-b-2 border-brand-clinical py-5'
                    : 'text-slate-500 hover:text-brand-dark'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="bg-brand-dark text-white hover:bg-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              Área Restrita
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-brand-dark hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 rounded-lg text-base font-semibold transition-all ${
                  isActive(item.href)
                    ? 'bg-sky-50 text-brand-clinical'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-brand-dark text-white hover:bg-slate-800 text-sm font-bold py-3 rounded-lg transition-all mt-4"
            >
              Acessar Área Restrita
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
