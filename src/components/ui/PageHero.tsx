import React from 'react';

interface PageHeroProps {
  title: string;
  description: string;
  badge?: string;
  rightElement?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  description,
  badge,
  rightElement,
  icon: Icon,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white rounded-3xl p-6 md:p-8 shadow-[0_10px_30px_-10px_rgba(8,47,73,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden border border-slate-800/80 animate-in fade-in duration-500">
      {/* Elementos decorativos y luces cibernéticas */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.03] pointer-events-none hidden md:block">
        {Icon && <Icon className="w-full h-full text-white scale-150 rotate-12" />}
      </div>
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute right-1/4 bottom-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Patrón de grilla de fondo fino de alta gama */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/10 via-transparent to-transparent opacity-60 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
        <div className="space-y-3 text-left">
          {badge && (
            <span className="text-[9px] font-bold text-sky-350 uppercase tracking-widest bg-sky-500/10 px-3.5 py-1 rounded-full border border-sky-500/20 inline-block font-mono">
              {badge}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-100 bg-clip-text text-transparent leading-tight">
            {title}
          </h1>
          <p className="text-[11px] md:text-xs text-slate-350 font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
        
        {rightElement && (
          <div className="self-start md:self-center shrink-0 animate-in slide-in-from-right-4 duration-300">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
