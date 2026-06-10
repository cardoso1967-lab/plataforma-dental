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
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center border border-slate-200/80 rounded-3xl bg-gradient-to-b from-white to-slate-50/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.6)] max-w-md mx-auto space-y-5 animate-in fade-in duration-300 my-6">
      {/* Círculo del icono con luz */}
      <div className="w-16 h-16 bg-gradient-to-br from-sky-50 to-white text-sky-600 rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(14,165,233,0.15)] border border-sky-100/50 relative">
        <div className="absolute inset-0 bg-sky-500/5 rounded-2xl animate-pulse blur-xs"></div>
        <div className="relative z-10 shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2 max-w-xs">
        <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-snug">
          {title}
        </h4>
        <p className="text-[11px] text-slate-450 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onActionClick)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/15 hover:scale-[1.015] active:scale-[0.98]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/15 hover:scale-[1.015] active:scale-[0.98] cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
