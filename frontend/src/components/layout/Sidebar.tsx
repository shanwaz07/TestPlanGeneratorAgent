import { NavLink } from 'react-router-dom';
import { Settings, Zap, History, FileText } from 'lucide-react';

const nav = [
  { to: '/',         icon: Zap,     label: 'Generate'  },
  { to: '/history',  icon: History, label: 'History'   },
  { to: '/settings', icon: Settings,label: 'Settings'  },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-cosmic-indigo flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <img src="/logo-white.png" alt="Leoforce" className="h-7 object-contain" />
        <p className="text-nebula-green text-xs italic mt-1.5 font-medium">
          Test Plan Generator
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
               ${isActive
                 ? 'bg-stellar-blue text-white'
                 : 'text-white/70 hover:bg-white/10 hover:text-white'
               }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-white/40" />
          <span className="text-white/40 text-xs">v1.0.0</span>
        </div>
        <p className="text-nebula-green text-xs italic mt-0.5">Where AI Meets Empathy</p>
      </div>
    </aside>
  );
}
