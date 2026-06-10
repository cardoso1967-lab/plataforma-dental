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
          bg: 'bg-amber-50/40 hover:bg-amber-50/60 border-amber-100/80',
          text: 'text-amber-700',
          iconBg: 'bg-amber-100 text-amber-700',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50/40 hover:bg-rose-50/60 border-rose-100/80',
          text: 'text-rose-700',
          iconBg: 'bg-rose-100 text-rose-700',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50/40 hover:bg-indigo-50/60 border-indigo-100/80',
          text: 'text-indigo-700',
          iconBg: 'bg-indigo-100 text-indigo-700',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50/40 hover:bg-emerald-50/60 border-emerald-100/80',
          text: 'text-emerald-700',
          iconBg: 'bg-emerald-100 text-emerald-700',
        };
      default:
        return {
          bg: 'bg-white hover:bg-slate-50/45 border-slate-100/80 shadow-xs hover:shadow-sm',
          text: 'text-slate-900',
          iconBg: 'bg-sky-50 text-sky-600 border border-sky-100/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] group text-left ${styles.bg} ${className}`}>
      <div className="space-y-1.5">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
          {title}
        </span>
        <h3 className={`text-lg md:text-xl font-black tracking-tight leading-none ${styles.text}`}>
          {value}
        </h3>
        
        {trend && (
          <p className={`text-[9.5px] font-extrabold flex items-center gap-0.5 ${
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
          <p className="text-[10px] text-slate-400 font-semibold leading-normal">
            {description}
          </p>
        )}
      </div>

      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 ${styles.iconBg}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
