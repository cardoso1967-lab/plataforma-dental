import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    type: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'amber' | 'rose' | 'indigo' | 'emerald';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'amber':
        return {
          bg: 'bg-gradient-to-br from-amber-50/40 via-amber-50/10 to-transparent hover:from-amber-50/60 border-amber-200/50 shadow-[0_2px_8px_-3px_rgba(245,158,11,0.05)]',
          text: 'text-amber-800',
          titleColor: 'text-amber-600/80',
          iconBg: 'bg-amber-100/50 text-amber-700 border border-amber-250/20',
        };
      case 'rose':
        return {
          bg: 'bg-gradient-to-br from-rose-50/40 via-rose-50/10 to-transparent hover:from-rose-50/60 border-rose-200/50 shadow-[0_2px_8px_-3px_rgba(244,63,94,0.05)]',
          text: 'text-rose-800',
          titleColor: 'text-rose-600/80',
          iconBg: 'bg-rose-100/50 text-rose-700 border border-rose-250/20',
        };
      case 'indigo':
        return {
          bg: 'bg-gradient-to-br from-indigo-50/40 via-indigo-50/10 to-transparent hover:from-indigo-50/60 border-indigo-200/50 shadow-[0_2px_8px_-3px_rgba(99,102,241,0.05)]',
          text: 'text-indigo-800',
          titleColor: 'text-indigo-600/80',
          iconBg: 'bg-indigo-100/50 text-indigo-700 border border-indigo-250/20',
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/40 via-emerald-50/10 to-transparent hover:from-emerald-50/60 border-emerald-200/50 shadow-[0_2px_8px_-3px_rgba(16,185,129,0.05)]',
          text: 'text-emerald-800',
          titleColor: 'text-emerald-600/80',
          iconBg: 'bg-emerald-100/50 text-emerald-700 border border-emerald-250/20',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-white via-slate-50/20 to-slate-50/5 hover:from-white hover:to-slate-50/30 border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_4px_12px_-4px_rgba(0,0,0,0.015)]',
          text: 'text-slate-900',
          titleColor: 'text-slate-400',
          iconBg: 'bg-sky-50/70 text-sky-600 border border-sky-100/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className={`p-4.5 rounded-xl border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.04)] active:scale-[0.99] group text-left h-auto lg:h-[120px] ${styles.bg} ${className}`}
    >
      <div className="space-y-1.5 flex-1 min-w-0 pr-2">
        <span className={`text-[8.5px] font-bold uppercase tracking-wider block font-sans ${styles.titleColor}`}>
          {title}
        </span>
        <h3 className={`text-lg md:text-xl font-black tracking-tight leading-none truncate ${styles.text}`}>
          {value}
        </h3>
        
        {trend && (
          <p className={`text-[9.5px] font-bold flex items-center gap-1 mt-1 ${
            trend.type === 'up' ? 'text-emerald-600' :
            trend.type === 'down' ? 'text-rose-600' : 'text-slate-500'
          }`}>
            {trend.type === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.type === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.type === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{trend.label}</span>
          </p>
        )}
        
        {!trend && description && (
          <p className="text-[10px] text-slate-450 font-medium leading-normal truncate block">
            {description}
          </p>
        )}
      </div>

      {icon && (
        <div className={`w-9.5 h-9.5 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 shadow-3xs ${styles.iconBg}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'w-4 h-4' }) : icon}
        </div>
      )}
    </div>
  );
};
