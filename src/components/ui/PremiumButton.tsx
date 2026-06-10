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
        return 'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-2xs border border-slate-200/40';
      case 'outline':
        return 'bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 shadow-3xs';
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/10';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/10';
      default: // primary
        return 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-500/10';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition-all hover:scale-[1.015] active:scale-[0.975] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 ${getVariantStyles()} ${className}`}
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
