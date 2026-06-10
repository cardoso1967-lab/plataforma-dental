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
      className={`w-[300px] shrink-0 bg-slate-50/40 border border-slate-200/55 rounded-2xl p-3.5 space-y-3.5 transition-all duration-300 relative ${
        isOver ? 'bg-sky-50/40 border border-dashed border-sky-400 scale-[1.01] shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
      }`}
    >
      {/* Cabecera de Columna */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 text-left">
        <span className="font-extrabold text-[11px] text-slate-800 leading-tight tracking-wide uppercase font-sans">
          {label}
        </span>
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-[0_1px_3px_rgba(0,0,0,0.02)] leading-none shrink-0 ${colorStyles}`}>
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
