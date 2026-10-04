import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useJourneyQuery,
  useDismissAlertMutation,
  useNotifyCircleMutation,
  useUpdateCorridorMutation,
} from '../api/hooks';
import { LiveJourneyMap } from '../components/map/LiveJourneyMap';
import { InteractiveLeafletMap } from '../components/map/InteractiveLeafletMap';
import { TripPlannerCard } from '../components/journey/TripPlannerCard';
import { CorridorSelectorModal, type CorridorPreset } from '../components/journey/CorridorSelectorModal';
import { RiskRing } from '../components/common/RiskRing';
import { Segments } from '../components/common/Segments';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useToast } from '../components/common/Toast';
import { getInitials } from '../utils/format';

export function JourneyPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: journey, isLoading, isError, refetch } = useJourneyQuery();
  const dismissAlert = useDismissAlertMutation();
  const notifyCircle = useNotifyCircleMutation();
  const updateCorridor = useUpdateCorridorMutation();

  const [mapMode, setMapMode] = useState<'radar' | 'real'>('real');
  const [showCorridorModal, setShowCorridorModal] = useState(false);

  useEffect(() => {
    document.title = 'Live Journey — ShadowSafe 2.0';
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-margin pt-space-xs gap-space-sm">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !journey) {
    return (
      <div className="px-margin pt-space-md">
        <ErrorBanner
          message="Failed to load live journey telemetry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { trip, risk, alert, guardians } = journey;

  const handleCircleNotify = async () => {
    try {
      const res = await notifyCircle.mutateAsync({ kind: 'journey_alert' });
      showToast({ message: res.message, icon: 'group', variant: 'tertiary' });
    } catch {
      showToast({ message: 'Failed to notify emergency circle', variant: 'error' });
    }
  };

  const handleDismissAlert = async () => {
    try {
      await dismissAlert.mutateAsync();
    } catch {
      showToast({ message: 'Failed to dismiss alert', variant: 'error' });
    }
  };

  const handleSelectCorridor = async (preset: Partial<CorridorPreset>) => {
    try {
      await updateCorridor.mutateAsync(preset);
      showToast({
        message: `Corridor updated: ${preset.origin} → ${preset.destination}`,
        variant: 'primary',
        icon: 'alt_route',
      });
    } catch {
      showToast({ message: 'Failed to update corridor', variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col w-full relative select-none">
      {/* Top Floating Telemetry & Route Context */}
      <div className="px-margin pt-space-xs pb-space-sm w-full z-20 flex flex-col gap-space-sm">
        {/* Real-time OpenStreetMap & OSRM Trip Planner */}
        <TripPlannerCard journey={journey} />

        {/* Trip Route & Status Ribbon */}
        <div className="bg-surface-container/85 backdrop-blur-xl rounded-xl p-space-md shadow-lg flex flex-col gap-space-xs">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shrink-0" />
              <span className="font-label-sm text-label-sm text-secondary truncate tracking-tight uppercase">
                {trip.line_label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCorridorModal(true)}
                title="Change active city route / destination"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-[10px] hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Icon name="swap_horiz" className="text-[12px]" />
                <span>Change City / Route</span>
              </button>
              <div className="flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-surface-container-high">
                <Icon name="verified" className="text-primary text-[13px]" />
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">
                  {trip.status_chip}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-sm text-on-surface mt-0.5">
            <div className="flex flex-col items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="w-0.5 h-4 bg-outline-variant my-0.5" />
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  {trip.origin}
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-secondary font-semibold truncate">
                  {trip.destination}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Stats */}
          <div className="grid grid-cols-4 gap-space-xs pt-space-xs">
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col">
              <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">ETA</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {trip.eta_minutes}m{' '}
                {trip.eta_clock && (
                  <span className="text-on-surface-variant font-normal text-[10px]">
                    {trip.eta_clock}
                  </span>
                )}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col">
              <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">Distance</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {trip.distance_km} km
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col">
              <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">Lighting</span>
              <span className="font-label-md text-label-md text-tertiary font-semibold truncate">
                {trip.lighting_label}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col">
              <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">Crowd</span>
              <span className="font-label-md text-label-md text-secondary font-semibold truncate">
                {trip.crowd_label}
              </span>
            </div>
          </div>
        </div>

        {/* Live Risk Score HUD */}
        <div className="bg-surface-container/90 backdrop-blur-xl rounded-xl p-space-md shadow-xl flex items-center justify-between gap-space-md">
          <RiskRing score={risk.score} band={risk.band} badge={risk.badge} />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-space-xs">
              <span className="px-space-xs py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-[10px] uppercase font-bold tracking-wider">
                {risk.badge}
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant truncate">
                {risk.headline}
              </span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface mt-1 leading-tight line-clamp-2">
              <Segments segments={risk.explanation} />
            </div>
          </div>
          <button
            type="button"
            aria-label="Expand safety breakdown"
            onClick={() => navigate('/factors')}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0 active:scale-95 transition-transform"
          >
            <Icon name="info" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Map Mode Switcher Bar */}
      <div className="flex items-center justify-between px-margin pb-1 z-10">
        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
          <Icon name={mapMode === 'radar' ? 'radar' : 'map'} className="text-[14px] text-primary" />
          {mapMode === 'radar' ? 'Vector Radar Map' : 'Real Street Map (CARTO)'}
        </span>
        <div className="flex items-center gap-1 bg-surface-container-high p-0.5 rounded-full text-[10px]">
          <button
            type="button"
            onClick={() => setMapMode('radar')}
            className={`px-2.5 py-0.5 rounded-full font-label-sm transition-all cursor-pointer ${
              mapMode === 'radar' ? 'bg-primary text-on-primary font-bold shadow' : 'text-on-surface-variant'
            }`}
          >
            Radar
          </button>
          <button
            type="button"
            onClick={() => setMapMode('real')}
            className={`px-2.5 py-0.5 rounded-full font-label-sm transition-all cursor-pointer ${
              mapMode === 'real' ? 'bg-secondary text-on-secondary font-bold shadow' : 'text-on-surface-variant'
            }`}
          >
            Real Map
          </button>
        </div>
      </div>

      {/* Map Canvas (Vector Radar or Real Leaflet Map) */}
      {mapMode === 'radar' ? (
        <LiveJourneyMap journey={journey} onSwitchToRealMap={() => setMapMode('real')} />
      ) : (
        <InteractiveLeafletMap journey={journey} />
      )}

      {/* Bottom Floating Action Sheet / Telemetry Drawer */}
      <div className="px-margin -mt-space-md z-20 flex flex-col gap-space-sm pt-2">
        {/* Real-time Alert Notification Banner */}
        {alert && !alert.dismissed && (
          <div
            id="alert-banner"
            className="bg-surface-container-high rounded-xl p-space-sm shadow-md flex items-center justify-between gap-space-xs border border-outline-variant/30"
          >
            <div className="flex items-center gap-space-xs min-w-0">
              <Icon
                name={alert.severity === 'critical' ? 'warning' : 'alt_route'}
                className="text-tertiary text-[20px] shrink-0"
              />
              <span className="font-body-sm text-body-sm text-on-surface truncate">
                <Segments segments={alert.message} />
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissAlert}
              className="text-on-surface-variant hover:text-on-surface p-1 shrink-0 active:scale-90 transition-transform"
              aria-label="Dismiss alert"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        )}

        {/* Primary Action Trigger Row */}
        <div className="grid grid-cols-12 gap-space-xs items-center">
          <button
            type="button"
            onClick={() => navigate('/factors')}
            className="col-span-4 h-12 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-space-xs shadow-md active:scale-95 transition-transform"
          >
            <Icon name="psychology_alt" className="text-[18px]" />
            <span className="truncate">See Why ({risk.score})</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reroute')}
            className="col-span-3 h-12 rounded-xl bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs active:scale-95 transition-transform"
          >
            <Icon name="alt_route" className="text-[18px] text-secondary" />
            <span className="truncate">Routes</span>
          </button>
          <button
            type="button"
            onClick={handleCircleNotify}
            disabled={notifyCircle.isPending}
            className="col-span-3 h-12 rounded-xl bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs active:scale-95 transition-transform"
          >
            <Icon name="group" className="text-[18px] text-primary" />
            <span className="truncate">{notifyCircle.isPending ? 'Notifying...' : 'Circle'}</span>
          </button>
          <button
            type="button"
            aria-label="Activate SOS Alert Circle"
            onClick={() => navigate('/guardians')}
            className="col-span-2 h-12 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center justify-center gap-1 shadow-[0_0_16px_rgba(239,68,68,0.35)] active:scale-95 transition-all"
          >
            <Icon name="emergency" className="text-[18px] text-error" />
            <span className="font-bold">SOS</span>
          </button>
        </div>

        {/* Guardian Circle Sync Status Capsule */}
        <div className="bg-surface-container rounded-xl p-space-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="flex -space-x-1.5 shrink-0 overflow-hidden">
              {guardians.names && guardians.names.length > 0 ? (
                guardians.names.slice(0, 2).map((name, idx) => (
                  <div
                    key={name + idx}
                    className={`w-6 h-6 rounded-full ${
                      idx === 0
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-secondary-container text-on-secondary-container'
                    } flex items-center justify-center font-label-sm text-[10px] font-bold`}
                  >
                    {getInitials(name)}
                  </div>
                ))
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-[10px] font-bold">
                  G
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface truncate">
                {guardians.connected} Emergency Guardians Connected
              </span>
              <span className="font-label-sm text-[9px] text-on-surface-variant truncate">
                {guardians.sharing_text}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-secondary shrink-0">
            <Icon name="check_circle" className="text-[14px]" />
            <span className="font-label-sm text-[10px] font-semibold">{guardians.status}</span>
          </div>
        </div>
      </div>

      {/* Corridor & City Selector Modal */}
      <CorridorSelectorModal
        currentJourney={journey}
        isOpen={showCorridorModal}
        onClose={() => setShowCorridorModal(false)}
        onSelectCorridor={handleSelectCorridor}
      />
    </div>
  );
}

export default JourneyPage;
