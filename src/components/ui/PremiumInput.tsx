import React from 'react';

interface PremiumInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  as?: 'input' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  rows?: number;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  icon,
  as = 'input',
  options = [],
  className = '',
  rows = 3,
}) => {
  const baseInputStyles = "w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 transition-all bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01),inset_0_1px_0_rgba(255,255,255,0.8)] disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      <label htmlFor={name} className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block font-mono">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none z-10 shrink-0">
            {icon}
          </div>
        )}
        
        {as === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${baseInputStyles} ${icon ? 'pl-10' : ''} resize-none`}
          />
        ) : as === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`${baseInputStyles} ${icon ? 'pl-10' : ''}`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseInputStyles} ${icon ? 'pl-10' : ''}`}
          />
        )}
      </div>
    </div>
  );
};
