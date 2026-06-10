import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onActionClick?: () => void;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onActionClick,
  actionHref,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-slate-200/60 rounded-xl bg-gradient-to-b from-white to-slate-50/30 shadow-[0_2px_8px_rgba(0,0,0,0.015)] max-w-sm mx-auto space-y-4 animate-in fade-in duration-300 my-4">
      {/* Círculo del icono con luz */}
      <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-white text-sky-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(14,165,233,0.1)] border border-sky-100/40 relative">
        <div className="absolute inset-0 bg-sky-500/5 rounded-xl animate-pulse blur-xs"></div>
        <div className="relative z-10 shrink-0">
          {React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'w-4.5 h-4.5 text-sky-600' }) : icon}
        </div>
      </div>
      
      <div className="space-y-1 max-w-xs">
        <h4 className="font-extrabold text-[12.5px] text-slate-800 tracking-tight leading-snug">
          {title}
        </h4>
        <p className="text-[10px] text-slate-450 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onActionClick)) && (
        <div className="pt-1">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold text-[10.5px] px-4 py-2 rounded-lg transition-all shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:scale-[1.01] active:scale-[0.985]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold text-[10.5px] px-4 py-2 rounded-lg transition-all shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:scale-[1.01] active:scale-[0.985] cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
