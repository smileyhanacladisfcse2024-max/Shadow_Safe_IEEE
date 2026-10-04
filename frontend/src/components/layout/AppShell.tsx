import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ThemeScope, getThemeForPath } from '../../theme/ThemeScope';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { LeftNavRail } from './LeftNavRail';
import { useSseStream } from '../../api/stream';
import { useSosStatusQuery, useJourneyQuery } from '../../api/hooks';
import { BackendUnreachableBanner } from '../common/ErrorBanner';
import { Icon } from '../common/Icon';
import { AuthModal } from '../auth/AuthModal';
import { ProfileDrawer } from '../auth/ProfileDrawer';

export function AppShell() {
  // Initialize Server-Sent Events stream
  useSseStream();

  const location = useLocation();
  const { data: sosStatus } = useSosStatusQuery();
  const { data: journey, isError, refetch } = useJourneyQuery();

  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    const handleFallback = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      setFallbackActive(Boolean(customEvent.detail?.active));
    };
    window.addEventListener('shadowsafe:fallback-mode', handleFallback);
    return () => window.removeEventListener('shadowsafe:fallback-mode', handleFallback);
  }, []);

  const isSosActive = sosStatus?.state === 'armed' || sosStatus?.state === 'dispatched';
  const theme = getThemeForPath(location.pathname);

  // Variant decision
  const isTripVariant = location.pathname.startsWith('/guardians') || location.pathname.startsWith('/havens');

  // Subtitle per HUD page
  let subtitle = 'Live Journey';
  let badge: string | undefined;

  if (location.pathname.startsWith('/factors')) {
    subtitle = 'Safety Factor Breakdown';
    badge = 'IEEE WIE ILS 2026';
  } else if (location.pathname.startsWith('/reroute')) {
    subtitle = 'Safe Reroute';
    badge = 'IEEE WIE ILS 2026';
  } else if (location.pathname.startsWith('/privacy')) {
    subtitle = 'Privacy And Demo';
    badge = 'IEEE WIE ILS 2026';
  } else if (location.pathname.startsWith('/guardians')) {
    subtitle = 'Emergency & SOS';
  } else if (location.pathname.startsWith('/havens')) {
    subtitle = 'Havens';
  }

  const tripId = journey?.trip_id || '482';

  return (
    <ThemeScope>
      {/* Top Banner if API fails and fallback wasn't activated */}
      {isError && !fallbackActive && <BackendUnreachableBanner onRetry={() => refetch()} />}

      {/* Offline Standalone Fallback Banner */}
      {fallbackActive && (
        <div className="fixed top-16 left-0 w-full z-40 bg-tertiary-container/90 text-on-tertiary-container text-[11px] font-label-sm py-1 px-4 flex items-center justify-between backdrop-blur-md shadow">
          <div className="flex items-center gap-1.5">
            <Icon name="cloud_off" className="text-[14px]" />
            <span>Standalone Fallback Active (FastAPI offline) • All features &amp; simulations 100% operational</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider">Local Mode</span>
        </div>
      )}

      {/* Main Header */}
      <AppHeader
        variant={isTripVariant ? 'trip' : 'hud'}
        subtitle={subtitle}
        badge={badge}
        tripId={tripId}
        secondaryChip={location.pathname.startsWith('/havens') ? 'Ephemeral' : 'Guarded'}
        secondaryIcon={location.pathname.startsWith('/havens') ? 'shield_lock' : 'shield'}
      />

      {/* Global SOS banner when armed or dispatched */}
      {isSosActive && (
        <Link
          to="/guardians"
          className="fixed top-22 left-0 w-full z-40 bg-error text-surface-container-lowest font-label-sm font-bold text-xs py-1 px-4 flex items-center justify-between shadow-lg animate-pulse"
        >
          <div className="flex items-center gap-1.5">
            <Icon name="emergency" className="text-[16px]" />
            <span>CRITICAL SOS {sosStatus.state.toUpperCase()} — ACTIVE DISPATCH</span>
          </div>
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      )}

      {/* Desktop Navigation Rail (Hidden on mobile/tablet, visible >= 1024px) */}
      <LeftNavRail />

      {/* Page Content Viewport */}
      <main
        className={`flex-1 w-full flex flex-col pt-22 pb-24 min-h-[100dvh] relative lg:pl-64 max-w-6xl mx-auto ${
          theme === 'A' ? 'font-body-md' : 'font-body-md'
        }`}
      >
        <Outlet />
      </main>

      {/* Auth & Onboarding Modal */}
      <AuthModal />

      {/* Women's Safety Profile Drawer */}
      <ProfileDrawer />

      {/* Bottom Navigation (Visible on mobile/tablet, hidden >= 1024px) */}
      <BottomNav />
    </ThemeScope>
  );
}

export default AppShell;
