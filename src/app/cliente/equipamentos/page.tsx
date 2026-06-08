import React from 'react';
import { Wrench, Calendar, Tag } from 'lucide-react';

export default function ClienteEquipamentosPage() {
  const myEquipments = [
    { id: '1', name: 'Autoclave Digital Biossegurança 12L', serial: 'AUT-12-99812', brand: 'Cristófoli', installDate: '02/06/2026' },
    { id: '2', name: 'Caneta de Alta Rotação Cobra LED', serial: 'PEN-LED-55421', brand: 'Gnatus', installDate: '15/04/2026' },
    { id: '3', name: 'Cadeira Odontológica Premium S300', serial: 'CAD-S300-88123', brand: 'Dabi Atlante', installDate: '10/01/2025' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Meus Equipamentos
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Lista de equipamentos ativos instalados no seu consultório para controle de manutenção.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {myEquipments.map((eq) => (
          <div 
            key={eq.id}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-clinical uppercase tracking-wider block">
                {eq.brand}
              </span>
              <h4 className="font-extrabold text-brand-dark text-sm leading-snug">
                {eq.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-50">
              <p className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Nº de Série: <strong className="text-brand-dark">{eq.serial}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Instalação: <strong className="text-brand-dark">{eq.installDate}</strong></span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
