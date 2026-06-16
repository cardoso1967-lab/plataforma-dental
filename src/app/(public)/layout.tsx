import React from 'react';
import { Header } from '@/components/Header';
import { Stethoscope } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="bg-brand-dark text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-brand-clinical text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src="/brand/mmuniz-icon.png" alt="M.MUNIZ" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              M.MUNIZ
            </span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} M.MUNIZ. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
