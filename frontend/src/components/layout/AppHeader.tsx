import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../common/StatusBar';
import { Logo } from '../common/Logo';
import { Icon } from '../common/Icon';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  variant?: 'hud' | 'trip';
  subtitle?: string;
  badge?: string;
  tripId?: string;
  secondaryChip?: string;
  secondaryIcon?: string;
}

export function AppHeader({
  variant = 'hud',
  subtitle = 'Live Journey',
  badge,
  tripId = '482',
  secondaryChip = 'Guarded',
  secondaryIcon = 'shield',
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, setIsProfileDrawerOpen, setIsAuthModalOpen } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <StatusBar />
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
        {/* Left: Logo & Title block */}
        <div className="flex items-center gap-space-sm min-w-0">
          <Logo className="h-8 w-auto object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface truncate">
                ShadowSafe 2.0
              </span>
              {badge && (
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-[9px] uppercase tracking-wider shrink-0">
                  {badge}
                </span>
              )}
            </div>

            {variant === 'hud' ? (
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest truncate">
                {subtitle}
              </span>
            ) : (
              <div className="flex items-center gap-space-xs">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse shrink-0" />
                  <span className="truncate">Active Trip #{tripId}</span>
                </div>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[10px]">
                  <Icon name={secondaryIcon} className="text-[12px] text-tertiary" />
                  <span className="truncate">{secondaryChip}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-space-xs sm:gap-space-sm shrink-0">
          {/* Emergency SOS Button */}
          <button
            type="button"
            aria-label="Emergency SOS"
            onClick={() => navigate('/guardians')}
            className="h-9 sm:h-10 px-3 sm:px-space-md rounded-full bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-1 sm:gap-space-xs shadow-[0_0_18px_rgba(239,68,68,0.4)] active:scale-95 transition-transform cursor-pointer"
          >
            <Icon name="emergency_home" className="text-[18px] text-error" />
            <span className="font-bold tracking-wider text-xs sm:text-sm">SOS</span>
          </button>

          {/* User Profile / Auth Control */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              {user.blood_group && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-error/20 border border-error/40 text-error font-headline-sm text-[10px] font-black shadow-sm">
                  {user.blood_group}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsProfileDrawerOpen(true)}
                className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-md hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer shrink-0"
                aria-label={`User Profile: ${user.name}`}
                title={`Safety Profile: ${user.name} (${user.blood_group})`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-xs font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
