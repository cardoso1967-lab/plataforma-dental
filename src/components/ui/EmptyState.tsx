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
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/20 shadow-3xs max-w-lg mx-auto space-y-4 animate-in fade-in duration-300 my-4">
      {/* Círculo del icono con luz */}
      <div className="w-14 h-14 bg-sky-50 text-sky-650 rounded-2xl flex items-center justify-center shadow-3xs border border-sky-100/30 relative">
        <div className="absolute inset-0 bg-sky-500/5 rounded-2xl animate-pulse blur-xs"></div>
        <div className="relative z-10 shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="space-y-1.5 max-w-xs">
        <h4 className="font-extrabold text-xs text-slate-800 tracking-tight leading-none">
          {title}
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold leading-normal">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onActionClick)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-4.5 py-2 rounded-xl transition-all shadow-sm shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-4.5 py-2 rounded-xl transition-all shadow-sm shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
