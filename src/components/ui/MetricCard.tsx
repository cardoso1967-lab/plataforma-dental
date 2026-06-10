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
          bg: 'bg-gradient-to-br from-amber-50/60 via-amber-50/30 to-transparent hover:from-amber-50/80 border-amber-200/50 shadow-[0_2px_8px_-3px_rgba(245,158,11,0.08)]',
          text: 'text-amber-800',
          titleColor: 'text-amber-600/80',
          iconBg: 'bg-amber-100/80 text-amber-700 border border-amber-200/40',
        };
      case 'rose':
        return {
          bg: 'bg-gradient-to-br from-rose-50/60 via-rose-50/30 to-transparent hover:from-rose-50/80 border-rose-200/50 shadow-[0_2px_8px_-3px_rgba(244,63,94,0.08)]',
          text: 'text-rose-800',
          titleColor: 'text-rose-600/80',
          iconBg: 'bg-rose-100/80 text-rose-700 border border-rose-200/40',
        };
      case 'indigo':
        return {
          bg: 'bg-gradient-to-br from-indigo-50/60 via-indigo-50/30 to-transparent hover:from-indigo-50/80 border-indigo-200/50 shadow-[0_2px_8px_-3px_rgba(99,102,241,0.08)]',
          text: 'text-indigo-800',
          titleColor: 'text-indigo-600/80',
          iconBg: 'bg-indigo-100/80 text-indigo-700 border border-indigo-200/40',
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/60 via-emerald-50/30 to-transparent hover:from-emerald-50/80 border-emerald-200/50 shadow-[0_2px_8px_-3px_rgba(16,185,129,0.08)]',
          text: 'text-emerald-800',
          titleColor: 'text-emerald-600/80',
          iconBg: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/40',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-white via-slate-50/30 to-slate-50/10 hover:from-white hover:to-slate-50/40 border-slate-250/70 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_16px_-4px_rgba(0,0,0,0.03)]',
          text: 'text-slate-900',
          titleColor: 'text-slate-400',
          iconBg: 'bg-sky-50/90 text-sky-650 border border-sky-100/50',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] active:scale-[0.99] group text-left ${styles.bg} ${className}`}>
      <div className="space-y-2">
        <span className={`text-[9px] font-bold uppercase tracking-widest block font-mono ${styles.titleColor}`}>
          {title}
        </span>
        <h3 className={`text-xl md:text-2xl font-extrabold tracking-tight leading-none ${styles.text}`}>
          {value}
        </h3>
        
        {trend && (
          <p className={`text-[10px] font-bold flex items-center gap-1 ${
            trend.type === 'up' ? 'text-emerald-600' :
            trend.type === 'down' ? 'text-rose-600' : 'text-slate-500'
          }`}>
            {trend.type === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend.type === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend.type === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{trend.label}</span>
          </p>
        )}
        
        {!trend && description && (
          <p className="text-[10.5px] text-slate-450 font-medium leading-normal">
            {description}
          </p>
        )}
      </div>

      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 shrink-0 shadow-3xs ${styles.iconBg}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
