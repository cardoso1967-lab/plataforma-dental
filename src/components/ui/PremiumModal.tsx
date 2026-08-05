import React from 'react';
import { X } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default: // md
        return 'max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Fondo oscuro y difuso más denso */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
      ></div>

      {/* Caja del modal premium */}
      <div
        className={`bg-white rounded-2xl w-full ${getSizeStyles()} flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.7)] border border-slate-200/80 relative z-10 transform transition-all duration-300 animate-in zoom-in-95`}
      >
        {/* Cabecera del modal */}
        <div className="shrink-0 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50 to-white z-10">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none text-left">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all border border-slate-200/40 hover:border-slate-350 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
