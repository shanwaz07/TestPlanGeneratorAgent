import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-cosmic-indigo uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-dark-matter
            placeholder:text-gray-400 transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-stellar-blue focus:border-stellar-blue
            ${error ? 'border-alert-red' : 'border-cosmic-indigo-light'}
            ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-alert-red">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
