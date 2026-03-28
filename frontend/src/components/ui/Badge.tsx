interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-cosmic-indigo-light text-cosmic-indigo',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger:  'bg-alert-red-light text-alert-red',
    info:    'bg-stellar-blue-light text-stellar-blue',
    purple:  'bg-purple-50 text-quantum-purple',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function priorityBadge(priority: string) {
  const map: Record<string, BadgeProps['variant']> = {
    Highest: 'danger', High: 'warning', Medium: 'info', Low: 'success', Lowest: 'default',
  };
  return <Badge variant={map[priority] ?? 'default'}>{priority}</Badge>;
}
