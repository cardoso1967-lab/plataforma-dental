import React from 'react';

interface StatusBadgeProps {
  label: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'indigo';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  type = 'neutral',
  className = '',
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'error':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      case 'info':
        return 'bg-sky-500/10 text-sky-700 border-sky-500/20';
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20';
      default: // neutral
        return 'bg-slate-100/80 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`text-[9.5px] font-bold px-2.5 py-1 rounded-full border inline-block text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)] leading-none ${getTypeStyles()} ${className}`}
    >
      {label}
    </span>
  );
};
