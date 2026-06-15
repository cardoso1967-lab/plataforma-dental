'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export function OpenTicketButton() {
  const handleScroll = () => {
    document.getElementById('novo-chamado')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/20 rounded-2xl shadow-[0_4px_20px_rgba(14,165,233,0.03)] text-left animate-in fade-in duration-300">
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Precisa de suporte agora?
        </h4>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Solicite assistência técnica para um equipamento cadastrado.
        </p>
      </div>
      <button
        onClick={handleScroll}
        className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md shadow-sky-500/15 transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2 self-start sm:self-center cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" />
        Abrir novo chamado
      </button>
    </div>
  );
}
