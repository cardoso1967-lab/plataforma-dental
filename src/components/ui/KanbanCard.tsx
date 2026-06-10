import React from 'react';
import { Wrench, User, Clock, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface KanbanCardProps {
  id: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  customerName: string;
  equipmentName?: string;
  technicianName?: string;
  scheduledDate?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDetailClick: () => void;
  quickActions?: React.ReactNode;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  id,
  priority,
  customerName,
  equipmentName,
  technicianName,
  scheduledDate,
  onDragStart,
  onDetailClick,
  quickActions,
}) => {
  const getPriorityBadgeType = () => {
    switch (priority) {
      case 'baixa': return 'neutral';
      case 'media': return 'info';
      case 'alta': return 'warning';
      case 'urgente': return 'error';
      default: return 'neutral';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const initials = customerName.substring(0, 2).toUpperCase() || 'OS';
  const colors = [
    'bg-sky-50 text-sky-700 border-sky-100/40',
    'bg-emerald-50 text-emerald-700 border-emerald-100/40',
    'bg-indigo-50 text-indigo-700 border-indigo-100/40',
    'bg-purple-50 text-purple-700 border-purple-100/40',
    'bg-amber-50 text-amber-700 border-amber-100/40',
  ];
  const colorIndex = initials.charCodeAt(0) % colors.length;
  const initialsColor = colors[colorIndex];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200/80 hover:shadow-md transition-all duration-300 hover:scale-[1.015] cursor-grab active:cursor-grabbing space-y-3.5 shadow-3xs text-left"
    >
      {/* Cabecera */}
      <div className="flex justify-between items-start gap-1">
        <span className="text-[9px] font-mono font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-105/10 leading-none">
          #{id.substring(0, 6).toUpperCase()}
        </span>
        <StatusBadge
          label={priority}
          type={getPriorityBadgeType()}
          className={priority === 'urgente' ? 'animate-pulse' : ''}
        />
      </div>

      {/* Cliente y Equipo */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center font-extrabold text-[8.5px] shrink-0 ${initialsColor}`}>
            {initials}
          </div>
          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-snug">
            {customerName}
          </h4>
        </div>
        {equipmentName ? (
          <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 pl-8">
            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{equipmentName}</span>
          </p>
        ) : (
          <span className="text-[9px] text-slate-400 italic font-semibold pl-8 block">Sem equipamento</span>
        )}
      </div>

      {/* Técnico y Fecha */}
      <div className="pt-3 border-t border-slate-50 space-y-2 text-[10px] text-slate-655 font-semibold leading-relaxed">
        <div className="flex items-center gap-1.5">
          {technicianName ? (
            <>
              <div className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[8.5px] font-black shrink-0 border border-sky-200/30">
                {getInitials(technicianName)}
              </div>
              <span className="line-clamp-1 text-slate-700">
                {technicianName}
              </span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shrink-0 border border-slate-200/40">
                <User className="w-3 h-3 text-slate-350" />
              </div>
              <span className="text-slate-400 italic">Não designado</span>
            </>
          )}
        </div>
        
        {scheduledDate && (
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{scheduledDate}</span>
          </div>
        )}
      </div>

      {/* Acciones Móviles Rápidas */}
      {quickActions && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-50 md:hidden justify-between">
          {quickActions}
        </div>
      )}

      {/* Botón Detalles */}
      <button
        onClick={onDetailClick}
        className="w-full text-center text-[9.5px] font-extrabold text-slate-500 hover:text-sky-650 bg-slate-50 hover:bg-sky-50/50 py-2 rounded-xl transition-colors duration-300 mt-1.5 border border-slate-100/50 cursor-pointer"
      >
        Ver detalhes
      </button>
    </div>
  );
};
