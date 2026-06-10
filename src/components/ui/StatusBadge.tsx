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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200/60';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      default: // neutral
        return 'bg-slate-50 text-slate-655 border-slate-200/60';
    }
  };

  return (
    <span
      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider inline-block text-center shadow-3xs leading-none ${getTypeStyles()} ${className}`}
    >
      {label}
    </span>
  );
};
