import React from 'react';

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'alert' | 'urgent';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  variant = 'primary',
  fullWidth = true,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 duration-100 min-h-[50px] px-6 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-brand-clinical text-white hover:bg-sky-700 focus:ring-brand-clinical',
    secondary: 'bg-slate-100 text-brand-dark hover:bg-slate-200 focus:ring-slate-300',
    success: 'bg-success-bg text-success-text border border-success-border hover:bg-emerald-100 focus:ring-success-border',
    alert: 'bg-alert-bg text-alert-text border border-alert-border hover:bg-amber-100 focus:ring-alert-border',
    urgent: 'bg-urgent-bg text-urgent-text border border-urgent-border hover:bg-rose-100 focus:ring-urgent-border',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
