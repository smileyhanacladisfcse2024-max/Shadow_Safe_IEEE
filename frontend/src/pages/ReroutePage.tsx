import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRoutesQuery,
  useSelectRouteMutation,
  useAutoRerouteMutation,
  useAcceptRouteMutation,
  useNotifyCircleMutation,
} from '../api/hooks';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useToast } from '../components/common/Toast';
import type { RouteOption } from '../api/types';

export function ReroutePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: routesData, isLoading, isError, refetch } = useRoutesQuery();
  const selectRoute = useSelectRouteMutation();
  const autoRerouteMutation = useAutoRerouteMutation();
  const acceptRoute = useAcceptRouteMutation();
  const notifyCircle = useNotifyCircleMutation();

  const [circleNotified, setCircleNotified] = useState(false);

  useEffect(() => {
    document.title = 'Safe Reroute — ShadowSafe 2.0';
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-margin pt-space-xs gap-space-md">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !routesData) {
    return (
      <div className="px-margin pt-space-md">
        <ErrorBanner
          message="Failed to load route recommendations."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { headline, subtitle, options, selected_route_id, auto_reroute } = routesData;
  const selectedRoute = options.find((r) => r.id.toLowerCase() === selected_route_id.toLowerCase()) || options[0];

  const handleSelectRoute = async (routeId: string) => {
    if (selectRoute.isPending) return;
    try {
      await selectRoute.mutateAsync(routeId);
    } catch {
      showToast({ message: 'Failed to select route', variant: 'error' });
    }
  };

  const handleToggleAutoReroute = async () => {
    if (autoRerouteMutation.isPending) return;
    try {
      await autoRerouteMutation.mutateAsync(!auto_reroute.enabled);
    } catch {
      showToast({ message: 'Failed to update auto-reroute setting', variant: 'error' });
    }
  };

  const handleAcceptRoute = async () => {
    if (acceptRoute.isPending || !selectedRoute) return;
    try {
      const res = await acceptRoute.mutateAsync(selectedRoute.id);
      showToast({ message: res.message, icon: 'directions_walk', variant: 'primary' });
      navigate('/journey');
    } catch {
      showToast({ message: 'Failed to accept corridor route', variant: 'error' });
    }
  };

  const handleNotifyCircle = async () => {
    if (notifyCircle.isPending || circleNotified) return;
    try {
      await notifyCircle.mutateAsync({ kind: 'reroute' });
      setCircleNotified(true);
      setTimeout(() => setCircleNotified(false), 2400);
    } catch {
      showToast({ message: 'Failed to notify emergency circle', variant: 'error' });
    }
  };

  const isCurrentRoute = selectedRoute?.id.toLowerCase() === 'a';

  return (
    <div className="flex flex-col w-full relative select-none">
      <div className="flex flex-col w-full px-margin pb-safe space-y-space-md">
        {/* Header Block */}
        <div className="flex flex-col space-y-space-xs pt-space-xs">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>TELEMETRY ACTIVE</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <Icon name="verified_user" className="text-[14px] text-secondary" />
              FastAPI v2.4 Engine
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
            {headline}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {subtitle}
          </p>
        </div>

        {/* Map Preview Banner */}
        <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-low shadow-lg border border-outline-variant/30">
          <div className="w-full h-52 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest flex items-center justify-center p-4">
            {/* SVG Corridor preview */}
            <svg className="w-full h-full" viewBox="0 0 360 160">
              {/* Grid */}
              <path d="M0 40 H360 M0 80 H360 M0 120 H360" stroke="#1c253b" strokeDasharray="3 3" strokeWidth="1" />
              <path d="M60 0 V160 M120 0 V160 M180 0 V160 M240 0 V160 M300 0 V160" stroke="#1c253b" strokeDasharray="3 3" strokeWidth="1" />
              {/* Deviated Path A (red) */}
              <path d="M40 80 C80 80, 110 130, 160 130 C200 130, 240 125, 320 125" stroke="#ffb4ab" strokeWidth="3" strokeDasharray="4 4" fill="none" opacity="0.7" />
              {/* Safe Recommended Path B (teal glow) */}
              <path d="M40 80 C90 80, 140 45, 200 45 C250 45, 280 60, 320 80" stroke="#4fdbc8" strokeWidth="5" strokeLinecap="round" fill="none" />
              {/* Pins */}
              <circle cx="40" cy="80" r="6" fill="#4cd7f6" />
              <circle cx="160" cy="130" r="5" fill="#ffb4ab" />
              <circle cx="200" cy="45" r="7" fill="#4fdbc8" />
              <circle cx="320" cy="80" r="6" fill="#acedff" />
              <text x="50" y="75" fill="#4cd7f6" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Origin</text>
              <text x="210" y="42" fill="#4fdbc8" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Safe Haven</text>
              <text x="165" y="145" fill="#ffb4ab" fontSize="9" fontFamily="sans-serif">Deviation</text>
              <text x="280" y="75" fill="#acedff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Destination</text>
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/30 to-transparent pointer-events-none" />
          <div className="absolute top-space-sm left-space-sm flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-highest/90 backdrop-blur-md text-primary font-label-sm text-label-sm shadow-sm">
              <Icon name="explore" className="text-[14px]" />
              Transit Grid Re-synced
            </span>
          </div>
          <div className="absolute top-space-sm right-space-sm">
            <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-error-container/90 text-on-error-container font-label-sm text-label-sm backdrop-blur-md">
              <Icon name="warning" className="text-[13px]" />
              Path A Deviated
            </span>
          </div>
          <div className="absolute bottom-space-sm inset-x-space-sm flex items-center justify-between bg-surface-container-high/90 backdrop-blur-md px-space-md py-space-xs rounded-lg shadow-sm">
            <div className="flex items-center gap-space-xs">
              <Icon name="navigation" className="text-secondary text-[16px]" />
              <span className="font-label-md text-label-md text-on-surface">
                Active Corridor: <strong className="text-secondary">{selectedRoute?.name}</strong>
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-semibold">
              {selectedRoute?.time_delta}
            </span>
          </div>
        </div>

        {/* Route Option Cards */}
        <div className="flex flex-col space-y-space-sm" id="route-options-container">
          {options.map((route: RouteOption) => {
            const isSelected = route.id.toLowerCase() === selected_route_id.toLowerCase();
            const isRec = route.id.toLowerCase() === 'b';
            const isDev = route.id.toLowerCase() === 'a';

            return (
              <div
                key={route.id}
                id={`route-card-${route.id}`}
                onClick={() => handleSelectRoute(route.id)}
                className={`route-card relative p-space-md rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-surface-container border-secondary/40 shadow-lg'
                    : 'bg-surface-container-low border-transparent hover:border-outline-variant/30'
                }`}
              >
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-label-md text-label-md font-bold uppercase ${
                        isRec
                          ? 'bg-secondary-container text-on-secondary-container'
                          : isDev
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container-highest text-primary'
                      }`}
                    >
                      {route.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          {route.name}
                        </span>
                        {route.tag && (
                          <span
                            className={`px-space-xs py-0.5 rounded font-label-sm text-[10px] uppercase font-bold ${
                              isRec
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            {route.tag}
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-body-sm text-body-sm ${
                          isDev ? 'text-error' : 'text-on-surface-variant'
                        }`}
                      >
                        {route.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-headline-sm text-headline-sm font-bold ${
                        isRec ? 'text-secondary' : 'text-on-surface'
                      }`}
                    >
                      {route.distance_km ? `${route.distance_km} km • ` : ''}{route.time_min} min
                    </span>
                    <span
                      className={`block font-label-sm text-label-sm ${
                        isDev ? 'text-error' : 'text-on-surface-variant'
                      }`}
                    >
                      {route.time_delta}
                    </span>
                  </div>
                </div>

                {/* Sub-chips and radio status */}
                <div className="mt-space-sm flex items-center justify-between pt-space-xs">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    {route.chips.map((chip, cIdx) => (
                      <span
                        key={cIdx}
                        className={`inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm ${
                          isDev && chip.label.includes('Concern')
                            ? 'bg-error-container text-on-error-container font-semibold'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <Icon name={chip.icon} className="text-[13px] text-secondary" />
                        {chip.label}
                      </span>
                    ))}
                  </div>

                  <Icon
                    name={isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    className={`text-[20px] shrink-0 ${isSelected ? 'text-secondary' : 'text-outline'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Route Corridor Advantage Metrics */}
        {selectedRoute?.metrics && selectedRoute.metrics.length > 0 && (
          <div className="flex flex-col space-y-space-xs pt-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Corridor Advantage Metrics
            </span>
            <div className="grid grid-cols-2 gap-space-xs">
              {selectedRoute.metrics.map((metric, mIdx) => {
                const icons = ['light_mode', 'cell_tower', 'local_pharmacy', 'local_police'];
                const colors = ['text-secondary', 'text-primary', 'text-secondary', 'text-tertiary'];
                return (
                  <div
                    key={mIdx}
                    className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container"
                  >
                    <div
                      className={`w-8 h-8 rounded-full bg-surface-container-highest ${colors[mIdx % colors.length]} flex items-center justify-center shrink-0`}
                    >
                      <Icon name={icons[mIdx % icons.length]} className="text-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate block">
                        {metric.label}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant truncate block">
                        {metric.detail}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto Reroute Toggle Bar */}
        <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-high shadow-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <Icon name="published_with_changes" className="text-secondary text-[22px] shrink-0" />
            <div className="min-w-0">
              <span className="font-body-md text-body-md text-on-surface font-semibold block truncate">
                Auto-Reroute if score &gt; {auto_reroute.threshold}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                {auto_reroute.standing_by ? '⚡ Auto-reroute standing by' : 'Triggers hands-free safe switch'}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Toggle auto reroute"
            onClick={handleToggleAutoReroute}
            className={`w-12 h-7 rounded-full flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              auto_reroute.enabled ? 'bg-secondary' : 'bg-surface-container-highest'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full shadow-md transform transition-transform ${
                auto_reroute.enabled
                  ? 'translate-x-5 bg-on-secondary'
                  : 'translate-x-0 bg-on-surface'
              }`}
            />
          </button>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col space-y-space-xs pt-space-xs">
          <button
            type="button"
            onClick={handleAcceptRoute}
            disabled={acceptRoute.isPending || isCurrentRoute}
            className={`w-full h-12 rounded-xl font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-space-xs shadow-md transition-transform ${
              isCurrentRoute
                ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-75'
                : 'bg-secondary-container text-on-secondary-container active:scale-[0.98]'
            }`}
          >
            <Icon name="directions_walk" className="text-[20px]" />
            <span>
              {isCurrentRoute
                ? 'Keep Current Route (Selected)'
                : acceptRoute.isPending
                ? 'Activating Corridor...'
                : 'Accept Safe Corridor & Start Turn-by-Turn'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleNotifyCircle}
            disabled={notifyCircle.isPending || circleNotified}
            className="w-full h-11 rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform"
          >
            {circleNotified ? (
              <>
                <Icon name="check_circle" className="text-[18px] text-secondary" />
                <span className="text-secondary">Emergency Circle Notified!</span>
              </>
            ) : (
              <>
                <Icon name="groups" className="text-[18px]" />
                <span>
                  {notifyCircle.isPending ? 'Notifying Circle...' : 'Notify Emergency Circle of Reroute'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Reassurance Disclaimer */}
        <div className="flex items-center justify-center gap-space-xs p-space-sm rounded-lg bg-surface-container-lowest text-center">
          <Icon name="sentiment_very_satisfied" className="text-[16px] text-secondary" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            You remain in full control. The system advises, you decide.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReroutePage;
