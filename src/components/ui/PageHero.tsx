import React from 'react';

interface PageHeroProps {
  title: string;
  description: string;
  badge?: string;
  rightElement?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'command' | 'customer' | 'field' | 'compact';
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  description,
  badge,
  rightElement,
  icon: Icon,
  variant = 'command',
}) => {
  // Configuración de fondos y gradientes premium según la variante
  const variantStyles = {
    command: 'from-slate-950 via-slate-900 to-sky-950 border-slate-800/60 shadow-[0_10px_30px_-10px_rgba(8,47,73,0.3)]',
    customer: 'from-slate-900 via-sky-950 to-slate-950 border-slate-850 shadow-[0_10px_30px_-10px_rgba(14,165,233,0.15)]',
    field: 'from-slate-950 via-[#0a1120] to-[#07191d] border-slate-800/60 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.1)]',
    compact: 'from-slate-900 to-sky-950 border-slate-800/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
  };

  const isCompact = variant === 'compact';

  return (
    <div 
      className={`bg-gradient-to-br ${variantStyles[variant]} text-white rounded-2xl relative overflow-hidden border transition-all duration-300 animate-in fade-in duration-500 ${
        isCompact ? 'p-4 md:py-4.5 md:px-6' : 'p-5 md:py-5.5 md:px-7'
      }`}
    >
      {/* Elementos decorativos y luces cibernéticas */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.02] pointer-events-none hidden md:block">
        {Icon && <Icon className="w-full h-full text-white scale-150 rotate-12" />}
      </div>
      
      {/* Luces difusas cibernéticas premium */}
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute right-1/4 bottom-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Patrón de grilla de fondo fino de alta gama */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/5 via-transparent to-transparent opacity-60 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
        <div className="space-y-2 text-left">
          {badge && (
            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-0.5 rounded border border-sky-500/20 inline-block font-mono leading-none">
              {badge}
            </span>
          )}
          <h1 className={`font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-100 bg-clip-text text-transparent leading-tight ${
            isCompact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
          }`}>
            {title}
          </h1>
          <p className={`text-slate-400 font-medium leading-relaxed max-w-2xl ${
            isCompact ? 'text-[10.5px]' : 'text-[11.5px]'
          }`}>
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
