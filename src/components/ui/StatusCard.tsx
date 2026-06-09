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
  const cardStyles = {
    clinical: 'border-l-4 border-l-brand-clinical bg-white hover:border-sky-500 shadow-sm hover:shadow-md',
    success: 'border-l-4 border-l-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/30 border border-slate-100 shadow-sm hover:shadow-md',
    alert: 'border-l-4 border-l-amber-500 bg-amber-50/20 hover:bg-amber-50/30 border border-slate-100 shadow-sm hover:shadow-md',
    urgent: 'border-l-4 border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/30 border border-slate-100 shadow-sm hover:shadow-md',
    dark: 'border-l-4 border-l-brand-clinical bg-slate-900 text-white shadow-md hover:shadow-lg',
    light: 'border-l-4 border-l-slate-200 bg-white border border-slate-100 shadow-sm hover:shadow-md',
  };

  const iconStyles = {
    clinical: 'bg-sky-50 text-brand-clinical border border-sky-100/30',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100/30',
    alert: 'bg-amber-50 text-amber-600 border border-amber-100/30',
    urgent: 'bg-rose-50 text-rose-600 border border-rose-100/30',
    dark: 'bg-slate-800 text-sky-400 border border-slate-700/35',
    light: 'bg-slate-50 text-slate-600 border border-slate-100/30',
  };

  return (
    <div className={`p-6 rounded-2xl flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${cardStyles[variant]}`}>
      <div className="space-y-1.5 text-left">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
          {title}
        </span>
        <h3 className={`text-xl font-black tracking-tight ${variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h3>
        {description && (
          <p className="text-[10px] text-slate-400 font-medium font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {icon && (
        <div className={`p-3.5 rounded-xl transition-transform duration-300 hover:rotate-6 ${iconStyles[variant]}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
