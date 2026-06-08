import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'clinical' | 'success' | 'alert' | 'urgent' | 'dark' | 'light';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = 'light',
}) => {
  const borderVariants = {
    clinical: 'border-l-4 border-l-brand-clinical bg-white',
    success: 'border-l-4 border-l-emerald-500 bg-success-bg/30',
    alert: 'border-l-4 border-l-amber-500 bg-alert-bg/30',
    urgent: 'border-l-4 border-l-rose-500 bg-urgent-bg/30',
    dark: 'border-l-4 border-l-brand-dark bg-slate-900 text-white',
    light: 'border-l-4 border-l-slate-300 bg-white',
  };

  const textColors = {
    clinical: 'text-brand-clinical',
    success: 'text-success-text',
    alert: 'text-alert-text',
    urgent: 'text-urgent-text',
    dark: 'text-sky-300',
    light: 'text-brand-dark',
  };

  return (
    <div className={`p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between transition-all hover:shadow-md ${borderVariants[variant]}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className={`text-2xl font-bold tracking-tight ${variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h3>
        {description && (
          <p className="text-xs text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>
      {icon && (
        <div className={`p-3 rounded-lg ${variant === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} ${textColors[variant]}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
