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
          iconBg: 'bg-emerald-50/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
          borderHover: 'hover:border-emerald-500/35 hover:bg-emerald-50/5',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50/80 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
          borderHover: 'hover:border-purple-500/35 hover:bg-purple-50/5',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
          borderHover: 'hover:border-indigo-500/35 hover:bg-indigo-50/5',
        };
      default: // sky
        return {
          iconBg: 'bg-sky-50/80 text-sky-650 group-hover:bg-sky-600 group-hover:text-white',
          borderHover: 'hover:border-sky-500/35 hover:bg-sky-50/5',
        };
    }
  };

  const styles = getStyles();

  return (
    <Link
      href={href}
      className={`bg-white border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-[0.99] group ${styles.borderHover}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-3xs shrink-0 ${styles.iconBg}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-slate-950 transition-colors">
          {title}
        </p>
        <p className="text-[10px] text-slate-400 font-semibold leading-normal">
          {description}
        </p>
      </div>
    </Link>
  );
};
