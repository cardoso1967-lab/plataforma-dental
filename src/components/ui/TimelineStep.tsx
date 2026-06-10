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
          circle: 'bg-sky-600 text-white border-sky-600 ring-4 ring-sky-100',
          line: 'bg-sky-600',
          text: 'text-slate-800 font-extrabold',
        };
      case 'active':
        return {
          circle: 'bg-white text-sky-650 border-sky-600 ring-4 ring-sky-100 animate-pulse',
          line: 'bg-slate-200',
          text: 'text-sky-700 font-black',
        };
      default: // upcoming
        return {
          circle: 'bg-white text-slate-300 border-slate-200 ring-0',
          line: 'bg-slate-200',
          text: 'text-slate-400 font-medium',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex text-left relative group">
      {/* Línea conectora */}
      {!isLast && (
        <div className={`absolute left-4.5 top-9 bottom-0 w-0.5 -ml-px transition-colors duration-300 ${styles.line}`} />
      )}

      {/* Círculo indicador */}
      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${styles.circle}`}>
        {status === 'completed' ? (
          <Check className="w-4.5 h-4.5" />
        ) : (
          icon || <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        )}
      </div>

      {/* Textos */}
      <div className="ml-4 pb-8 space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-xs tracking-tight leading-none ${styles.text}`}>
            {label}
          </p>
          {date && (
            <span className="text-[9px] text-slate-400 font-medium font-mono">
              {date}
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
