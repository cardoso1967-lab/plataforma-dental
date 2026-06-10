import React from 'react';
import { Check } from 'lucide-react';

interface TimelineStepProps {
  label: string;
  description?: string;
  status: 'completed' | 'active' | 'upcoming';
  isLast?: boolean;
  icon?: React.ReactNode;
  date?: string;
}

export const TimelineStep: React.FC<TimelineStepProps> = ({
  label,
  description,
  status,
  isLast = false,
  icon,
  date,
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-sky-600 text-white border-sky-600 ring-4 ring-sky-50 shadow-[0_2px_8px_rgba(2,132,199,0.2)]',
          line: 'bg-sky-600',
          text: 'text-slate-800 font-bold',
        };
      case 'active':
        return {
          circle: 'bg-white text-sky-600 border-sky-600 ring-4 ring-sky-100/70 shadow-[0_2px_12px_rgba(2,132,199,0.15)] animate-pulse',
          line: 'bg-slate-200/80',
          text: 'text-sky-700 font-extrabold',
        };
      default: // upcoming
        return {
          circle: 'bg-white text-slate-300 border-slate-200 ring-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]',
          line: 'bg-slate-200/80',
          text: 'text-slate-400 font-medium',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex text-left relative group w-full">
      {/* Línea conectora */}
      {!isLast && (
        <div className={`absolute left-4 top-8.5 bottom-0 w-0.5 -ml-px transition-colors duration-300 ${styles.line}`} />
      )}

      {/* Círculo indicador */}
      <div className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${styles.circle}`}>
        {status === 'completed' ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : (
          icon || <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        )}
      </div>

      {/* Textos */}
      <div className="ml-4 pb-6 space-y-1 w-full">
        <div className="flex items-baseline gap-2 flex-wrap justify-between w-full">
          <p className={`text-[12px] tracking-tight leading-none ${styles.text}`}>
            {label}
          </p>
          {date && (
            <span className="text-[9px] text-slate-400 font-medium font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/35">
              {date}
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-[10px] text-slate-450 font-medium leading-relaxed max-w-md">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
