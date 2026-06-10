import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gradient-to-b from-slate-100 to-slate-200/80 hover:from-slate-200 hover:to-slate-250 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-300/40';
      case 'outline':
        return 'bg-gradient-to-b from-white to-slate-50 hover:to-slate-100 border border-slate-250/90 hover:border-slate-350 text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]';
      case 'danger':
        return 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-[0_1px_2px_rgba(244,63,94,0.1),0_8px_16px_-8px_rgba(244,63,94,0.15)] border border-rose-600/10';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100/60 text-slate-655 hover:text-slate-850';
      case 'emerald':
        return 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-[0_1px_2px_rgba(16,185,129,0.1),0_8px_16px_-8px_rgba(16,185,129,0.15)] border border-emerald-700/10';
      default: // primary
        return 'bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white shadow-[0_1px_2px_rgba(2,132,199,0.1),0_8px_16px_-8px_rgba(2,132,199,0.15)] border border-sky-700/10';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 ${getVariantStyles()} ${className}`}
    >
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
