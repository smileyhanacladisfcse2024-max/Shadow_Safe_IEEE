import { NavLink } from 'react-router-dom';
import { Icon } from '../common/Icon';

const NAV_ITEMS = [
  { path: '/journey', label: 'Journey', icon: 'radar' },
  { path: '/factors', label: 'Factors', icon: 'insights' },
  { path: '/reroute', label: 'Reroute', icon: 'alt_route' },
  { path: '/guardians', label: 'Guardians', icon: 'shield' },
  { path: '/havens', label: 'Havens', icon: 'local_convenience_store' },
  { path: '/privacy', label: 'Privacy', icon: 'lock_reset' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] border-t border-outline-variant/20 select-none lg:hidden"
    >
      <div className="grid grid-cols-6 items-center h-16 px-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[48px] transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon name={item.icon} className="text-[22px]" />
            <span className="font-label-sm text-[9px] tracking-tight truncate max-w-full text-center">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
