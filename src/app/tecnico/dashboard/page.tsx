import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { Calendar, CheckCircle2, Clock, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function TecnicoDashboardPage() {
  const activeService = {
    id: 'OS-0892',
    osNumber: '0892',
    customerName: 'Dra. Sandra Melo',
    equipmentName: 'Autoclave Digital 12L',
    status: 'em_atendimento' as const,
    priority: 'urgente' as const,
    scheduledDate: 'Hoje às 14:00',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Block */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Painel de Campo</span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
          Olá, Carlos Técnico
        </h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Veja a sua agenda de hoje e gerencie os chamados atribuídos à sua rota.
        </p>
      </div>

      {/* OS ativa designada */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          Serviço Ativo para Agora
        </h3>
        <ServiceOrderCard {...activeService} />
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <StatusCard
          title="Agendados Hoje"
          value="3 visitas"
          icon={<Calendar className="w-5 h-5 text-brand-clinical" />}
          variant="light"
        />
        <StatusCard
          title="Concluídos Hoje"
          value="1 concluído"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          variant="light"
        />
      </div>

      {/* Checklist / Próxima rota */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
          Próximas Visitas de Hoje
        </h3>

        <div className="space-y-3 text-xs font-semibold text-slate-600">
          <div className="flex justify-between items-start border-b border-slate-50 pb-2.5">
            <div>
              <p className="text-brand-dark">16:30 - Dr. Roberto Santos</p>
              <p className="text-[10px] text-slate-400 font-medium">Cadeira Premium S500 (Vazamento de água)</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Agendado</span>
          </div>

          <div className="flex justify-between items-start pt-1">
            <div>
              <p className="text-brand-dark">18:00 - Odonto VIP</p>
              <p className="text-[10px] text-slate-400 font-medium">Bomba de Vácuo (Manutenção preventiva)</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Agendado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
