import React from 'react';

interface KanbanColumnProps {
  id: string;
  label: string;
  badgeCount: number;
  colorStyles: string;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  label,
  badgeCount,
  colorStyles,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex-1 min-w-[250px] bg-slate-50/40 border border-slate-100 rounded-3xl p-4.5 space-y-4 transition-all duration-300 relative ${
        isOver ? 'bg-sky-50/35 border-2 border-dashed border-sky-400 scale-[1.01] shadow-xs' : 'shadow-3xs'
      }`}
    >
      {/* Cabecera de Columna */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-left">
        <span className="font-extrabold text-[11px] text-slate-700 leading-tight tracking-wide uppercase">
          {label}
        </span>
        <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full border shadow-3xs leading-none shrink-0 ${colorStyles}`}>
          {badgeCount}
        </span>
      </div>

      {/* Contenedor de Tarjetas */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-0.5 no-scrollbar min-h-[250px] transition-all duration-300">
        {children}
      </div>
    </div>
  );
};
