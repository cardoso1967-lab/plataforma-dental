import React from 'react';
import Link from 'next/link';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'sky' | 'emerald' | 'purple' | 'indigo';
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  href,
  variant = 'sky',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50/90 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
          borderHover: 'hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/10 hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.08)]',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50/90 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
          borderHover: 'hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/10 hover:shadow-[0_4px_20px_-4px_rgba(147,51,234,0.08)]',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50/90 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
          borderHover: 'hover:border-indigo-500/30 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.08)]',
        };
      default: // sky
        return {
          iconBg: 'bg-sky-50/90 text-sky-650 group-hover:bg-sky-600 group-hover:text-white',
          borderHover: 'hover:border-sky-500/30 hover:bg-gradient-to-br hover:from-white hover:to-sky-50/10 hover:shadow-[0_4px_20px_-4px_rgba(2,132,199,0.08)]',
        };
    }
  };

  const styles = getStyles();

  return (
    <Link
      href={href}
      className={`bg-gradient-to-br from-white to-slate-50/20 border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_10px_20px_-10px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 active:scale-[0.99] group ${styles.borderHover}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-3xs shrink-0 border border-slate-100 ${styles.iconBg}`}>
        {icon}
      </div>
      <div className="text-left space-y-0.5">
        <p className="text-[12px] font-extrabold text-slate-800 tracking-tight leading-none group-hover:text-slate-950 transition-colors">
          {title}
        </p>
        <p className="text-[10px] text-slate-450 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};
