'use client';

import React from 'react';
import { MobileButton } from '@/components/ui/MobileButton';
import { LifeBuoy, Wrench, Clock } from 'lucide-react';

export default function ClienteSuportePage() {
  const openOS = [
    { id: 'OS-0892', status: 'Orçamento Pendente', date: '08/06/2026', equipment: 'Autoclave Digital 12L' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Suporte Técnico
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Abra chamados para manutenções corretivas ou preventivas nos seus equipamentos.
        </p>
      </div>

      {/* OS ativas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chamados Ativos
        </h3>
        
        {openOS.map((os) => (
          <div key={os.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">{os.id} | {os.date}</span>
              <h4 className="font-extrabold text-brand-dark text-sm">{os.equipment}</h4>
            </div>
            
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-alert-bg text-alert-text border border-alert-border flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {os.status}
            </span>
          </div>
        ))}
      </div>

      {/* Formulario de Abertura */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
          <LifeBuoy className="w-4 h-4 text-brand-clinical" />
          Novo Chamado de Assistência
        </h3>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selecione o Equipamento</label>
            <select className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50">
              <option>Autoclave Digital Biossegurança 12L (S/N: AUT-12-99812)</option>
              <option>Caneta de Alta Rotação Cobra LED (S/N: PEN-LED-55421)</option>
              <option>Cadeira Odontológica Premium S300 (S/N: CAD-S300-88123)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Descreva o Problema / Sintoma</label>
            <textarea 
              rows={4}
              placeholder="Ex: A autoclave não está atingindo a pressão correta de esterilização..."
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
            />
          </div>

          <MobileButton variant="primary" type="button">
            Enviar Chamado
          </MobileButton>
        </form>
      </div>
    </div>
  );
}
