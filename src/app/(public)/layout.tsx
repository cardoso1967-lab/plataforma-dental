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
            <div className="bg-brand-clinical text-white p-2 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              Plataforma<span className="text-brand-clinical">Dental</span>
            </span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} Plataforma Dental. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
