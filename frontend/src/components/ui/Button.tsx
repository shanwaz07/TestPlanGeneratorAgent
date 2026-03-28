import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:   'bg-stellar-blue text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-stellar-blue',
      secondary: 'bg-white text-cosmic-indigo border border-cosmic-indigo-light hover:bg-cosmic-indigo-light focus:ring-cosmic-indigo',
      ghost:     'bg-transparent text-dark-matter hover:bg-cosmic-indigo-light focus:ring-cosmic-indigo',
      danger:    'bg-alert-red text-white hover:bg-red-700 active:bg-red-800 focus:ring-alert-red',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
