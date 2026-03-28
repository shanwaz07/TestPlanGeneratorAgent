import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  const pads = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-cosmic-indigo-light/40 ${pads[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pb-3 mb-4 border-b-2 border-stellar-blue ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-cosmic-indigo font-bold text-base ${className}`}>
      {children}
    </h3>
  );
}
