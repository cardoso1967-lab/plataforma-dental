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
      {/* Fondo oscuro y difuso */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Caja del modal */}
      <div
        className={`bg-white rounded-3xl w-full ${getSizeStyles()} overflow-hidden shadow-2xl border border-slate-100 relative z-10 transform transition-all duration-300 animate-in zoom-in-95`}
      >
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none text-left">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-slate-100/40 hover:border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
