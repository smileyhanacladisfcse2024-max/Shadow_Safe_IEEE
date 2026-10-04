import { NavLink } from 'react-router-dom';
import { Icon } from '../common/Icon';
import { Logo } from '../common/Logo';

const NAV_ITEMS = [
  { path: '/journey', label: 'Journey', icon: 'radar' },
  { path: '/factors', label: 'Factors', icon: 'insights' },
  { path: '/reroute', label: 'Reroute', icon: 'alt_route' },
  { path: '/guardians', label: 'Guardians', icon: 'shield' },
  { path: '/havens', label: 'Havens', icon: 'local_convenience_store' },
  { path: '/privacy', label: 'Privacy', icon: 'lock_reset' },
];

export function LeftNavRail() {
  return (
    <aside
      aria-label="Desktop Navigation Rail"
      className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-surface-container-lowest border-r border-outline-variant/20 select-none pt-20 pb-6 px-4"
    >
      <div className="flex flex-col gap-1 mt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`
            }
          >
            <Icon name={item.icon} className="text-[22px]" />
            <span className="font-label-md text-sm tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="font-headline-sm text-xs font-bold text-on-surface">ShadowSafe 2.0</span>
        </div>
        <span className="text-[10px] text-on-surface-variant">
          IEEE WIE ILS 2026 Hackathon • Zero-Knowledge Telemetry
        </span>
      </div>
    </aside>
  );
}

export default LeftNavRail;
