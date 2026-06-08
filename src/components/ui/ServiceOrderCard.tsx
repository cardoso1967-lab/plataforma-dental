import React from 'react';
import { Calendar, User, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface ServiceOrderCardProps {
  id: string;
  osNumber: string;
  customerName: string;
  equipmentName: string;
  status: 'aberta' | 'em_analise' | 'orcamento_pendente' | 'orcamento_aprovado' | 'em_atendimento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  scheduledDate?: string;
  onClick?: () => void;
}

export const ServiceOrderCard: React.FC<ServiceOrderCardProps> = ({
  osNumber,
  customerName,
  equipmentName,
  status,
  priority,
  scheduledDate,
  onClick,
}) => {
  const statusConfig = {
    aberta: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Aberta' },
    em_analise: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Em Análise' },
    orcamento_pendente: { bg: 'bg-alert-bg text-alert-text border-alert-border', label: 'Orçamento Pendente' },
    orcamento_aprovado: { bg: 'bg-success-bg text-success-text border-success-border', label: 'Orçamento Aprovado' },
    em_atendimento: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Em Atendimento' },
    concluida: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Concluída' },
    cancelada: { bg: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Cancelada' },
  };

  const priorityConfig = {
    baixa: { badge: 'bg-slate-100 text-slate-600', label: 'Prioridade Baixa' },
    media: { badge: 'bg-blue-50 text-blue-600', label: 'Prioridade Média' },
    alta: { badge: 'bg-orange-50 text-orange-600', label: 'Prioridade Alta' },
    urgente: { badge: 'bg-rose-50 text-rose-600 font-bold border border-rose-200', label: 'Urgente' },
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 space-y-4 hover:shadow-md transition-all cursor-pointer active:bg-slate-50/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">
          OS: {osNumber}
        </span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig[status].bg}`}>
          {statusConfig[status].label}
        </span>
      </div>

      <div className="space-y-1.5">
        <h4 className="font-extrabold text-slate-900 text-base leading-snug">
          {equipmentName}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <User className="w-3.5 h-3.5" />
          <span>{customerName}</span>
        </div>
      </div>

      {scheduledDate && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-brand-clinical" />
          <span>Agendado para: <strong>{scheduledDate}</strong></span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${priorityConfig[priority].badge}`}>
          {priorityConfig[priority].label}
        </span>
        <div className="flex items-center text-[10px] text-slate-400 font-medium">
          {status === 'concluida' ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
            </span>
          ) : priority === 'urgente' ? (
            <span className="flex items-center gap-1 text-rose-600 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> Requer atenção
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Acompanhar
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
