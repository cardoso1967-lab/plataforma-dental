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
    <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-slate-800 animate-in fade-in duration-500">
      {/* Luces difusas en CSS de fondo */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.02] pointer-events-none hidden md:block">
        {Icon && <Icon className="w-full h-full text-white scale-150 rotate-12" />}
      </div>
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
        <div className="space-y-2.5 text-left">
          {badge && (
            <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 inline-block font-sans">
              {badge}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-100 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
        
        {rightElement && (
          <div className="self-start md:self-center shrink-0">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
