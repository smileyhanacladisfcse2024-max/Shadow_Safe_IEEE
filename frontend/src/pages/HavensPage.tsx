import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useHavensQuery,
  useHavenActionMutation,
  useNotifyCircleMutation,
} from '../api/hooks';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useToast } from '../components/common/Toast';
import { HavensRealMap } from '../components/map/HavensRealMap';
import type { Haven } from '../api/types';

export function HavensPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';
  const focusId = searchParams.get('focus');

  const { showToast } = useToast();
  const { data: havensData, isLoading, isError, refetch } = useHavensQuery(activeFilter);
  const havenAction = useHavenActionMutation();
  const notifyCircle = useNotifyCircleMutation();

  const [mapViewMode, setMapViewMode] = useState<'real' | 'radar'>('real');
  const [expandedHavenIds, setExpandedHavenIds] = useState<Record<string, boolean>>({});
  const [spotlightExpanded, setSpotlightExpanded] = useState(false);
  const directoryCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    document.title = 'Safe Havens — ShadowSafe 2.0';
  }, []);

  // Handle focus scrolling if ?focus=<id> is present
  useEffect(() => {
    if (focusId && directoryCardRefs.current[focusId]) {
      directoryCardRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedHavenIds((prev) => ({ ...prev, [focusId]: true }));
    }
  }, [focusId, havensData]);

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-gutter pt-space-xs gap-space-md">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !havensData) {
    return (
      <div className="px-gutter pt-space-md">
        <ErrorBanner
          message="Failed to load safe havens network."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { spotlight, items, mesh, counts } = havensData;

  const filterOptions = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'staffed', label: '24/7 Staffed', count: counts.staffed },
    { id: 'transit', label: 'Transit Police', count: counts.transit },
    { id: 'medical', label: 'Medical/Pharmacy', count: counts.medical },
    { id: 'beacon', label: 'Illuminated Beacon', count: counts.beacon },
  ];

  const handleFilterChange = (filterId: string) => {
    setSearchParams(filterId === 'all' ? {} : { filter: filterId });
  };

  const handleAction = async (havenId: string, action: 'beacon' | 'call' | 'navigate' | 'ping' | 'activate-path') => {
    try {
      const res = await havenAction.mutateAsync({ havenId, action });
      if (action === 'call') {
        const haven = items.find((h) => h.id === havenId) || (spotlight?.id === havenId ? spotlight : null);
        const tel = haven?.phone || (res.extra as any)?.phone || '112';
        window.location.href = `tel:${tel}`;
      }
      showToast({
        message: res.message,
        icon: action === 'beacon' ? 'campaign' : action === 'call' ? 'call' : 'near_me',
        variant: action === 'beacon' ? 'tertiary' : 'primary',
      });
    } catch {
      showToast({ message: `Action ${action} failed`, variant: 'error' });
    }
  };

  const handleNotifyCircleDiversion = async (havenId: string) => {
    try {
      const res = await notifyCircle.mutateAsync({ kind: 'haven_diversion', haven_id: havenId });
      showToast({ message: res.message, icon: 'shield', variant: 'tertiary' });
    } catch {
      showToast({ message: 'Failed to notify emergency circle', variant: 'error' });
    }
  };

  const toggleDirectoryCard = (id: string) => {
    setExpandedHavenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full relative select-none">
      <div className="flex flex-col w-full px-gutter pb-safe space-y-space-md">
        {/* Header Context / Operational Mesh Bar */}
        <div className="flex flex-col gap-space-xs pt-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Sanctuary Mesh v2.4 Active
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="wifi_tethering" className="text-[13px] text-primary" />
              <span>{mesh.nodes_in_range} Nodes in Range</span>
            </div>
          </div>
          <div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">
              Verified Safe Havens
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              24/7 Community Sanctuary Mesh • Within 500m of Active Corridor
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto py-1 no-scrollbar -mx-gutter px-gutter">
            {filterOptions.map((f) => {
              const isActive = activeFilter.toLowerCase() === f.id.toLowerCase();
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilterChange(f.id)}
                  className={`haven-filter-btn shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Proximity Radar / Real Street Map Card */}
        <div className="relative w-full rounded-2xl bg-surface-container-lowest overflow-hidden shadow-xl p-space-sm flex flex-col gap-space-sm border border-outline-variant/30">
          <div className="flex items-center justify-between pb-0.5">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Icon name={mapViewMode === 'real' ? 'map' : 'radar'} className="text-[14px] text-primary" />
              {mapViewMode === 'real' ? 'Real Street Map (CARTO Basemaps)' : 'Proximity Radar Grid'}
            </span>
            <div className="flex items-center gap-1 bg-surface-container-high p-0.5 rounded-full text-[10px]">
              <button
                type="button"
                onClick={() => setMapViewMode('real')}
                className={`px-2.5 py-0.5 rounded-full font-label-sm transition-all cursor-pointer ${
                  mapViewMode === 'real' ? 'bg-secondary text-on-secondary font-bold shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Real Map
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('radar')}
                className={`px-2.5 py-0.5 rounded-full font-label-sm transition-all cursor-pointer ${
                  mapViewMode === 'radar' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Radar
              </button>
            </div>
          </div>

          {mapViewMode === 'real' ? (
            <HavensRealMap
              items={items}
              spotlight={spotlight}
              onAction={handleAction}
            />
          ) : (
            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-[#070b14] flex items-center justify-center">
            {/* Ambient Radial Lighting / Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              fill="none"
              viewBox="0 0 360 220"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient cx="50%" cy="58%" id="radarPulse" r="65%">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.22" />
                  <stop offset="50%" stopColor="#0566d9" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="corridorGlow" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#4cd7f6" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Backdrop */}
              <rect fill="url(#radarPulse)" height="220" width="360" />

              {/* Urban Grid Vector Lines */}
              <path d="M-20 60 H380 M-20 120 H380 M-20 180 H380" stroke="#1c253b" strokeDasharray="3 3" strokeWidth="1" />
              <path d="M70 -20 V240 M180 -20 V240 M290 -20 V240" stroke="#1c253b" strokeDasharray="3 3" strokeWidth="1" />

              {/* 250m & 500m Radar Distance Envelopes */}
              <circle cx="180" cy="130" fill="none" r="45" stroke="#4cd7f6" strokeOpacity="0.2" strokeWidth="1" />
              <circle cx="180" cy="130" fill="none" r="90" stroke="#4cd7f6" strokeDasharray="4 4" strokeOpacity="0.12" strokeWidth="1" />

              {/* Active Corridor */}
              <path d="M180 130 C195 105, 210 90, 230 68" stroke="url(#corridorGlow)" strokeLinecap="round" strokeOpacity="0.4" strokeWidth="6" />
              <path d="M180 130 C195 105, 210 90, 230 68" stroke="#4edea3" strokeLinecap="round" strokeWidth="2" />
              <path d="M180 130 C150 140, 110 135, 88 115" stroke="#4cd7f6" strokeDasharray="3 3" strokeLinecap="round" strokeOpacity="0.6" strokeWidth="2" />

              {/* Haven Pins */}
              <g className="cursor-pointer" transform="translate(230, 68)">
                <circle className="animate-ping" cx="0" cy="0" fill="#1bbd85" fillOpacity="0.2" r="16" />
                <circle cx="0" cy="0" fill="#1bbd85" r="10" />
                <path d="M-4 0 H4 M0 -4 V4" stroke="#003824" strokeLinecap="round" strokeWidth="2" />
              </g>
              <g transform="translate(88, 115)">
                <circle cx="0" cy="0" fill="#0566d9" r="8" />
                <circle cx="0" cy="0" fill="#ffffff" r="3" />
              </g>
              <g transform="translate(285, 150)">
                <circle cx="0" cy="0" fill="#1bbd85" r="7" />
                <circle cx="0" cy="0" fill="#ffffff" r="2.5" />
              </g>

              {/* Commuter Position */}
              <g transform="translate(180, 130)">
                <circle className="animate-pulse" cx="0" cy="0" fill="#4cd7f6" fillOpacity="0.25" r="18" />
                <circle cx="0" cy="0" fill="#4cd7f6" r="8" />
                <circle cx="0" cy="0" fill="#003640" r="3.5" />
              </g>
            </svg>

            {/* Overlays */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-high/90 backdrop-blur-md">
              <Icon name="wb_sunny" className="text-primary text-[14px]" />
              <span className="font-label-sm text-label-sm text-on-surface">Path Lux: 184 lx (High Visibility)</span>
            </div>

            {spotlight && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-tertiary-container text-on-tertiary-container shadow-md">
                <Icon name="local_hospital" className="text-[14px]" />
                <span className="font-label-sm text-label-sm font-semibold">
                  {spotlight.name} • {spotlight.distance_m}m
                </span>
              </div>
            )}

            <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span>You (Active Corridor)</span>
            </div>
          </div>
          )}

          {/* Quick Target Action Bar */}
          {spotlight && (
            <div className="flex items-center justify-between gap-space-sm pt-1">
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-primary font-medium tracking-wide">
                  NEAREST SANCTUARY LOCKED
                </span>
                <span className="font-headline-md text-headline-md text-on-surface truncate">
                  {spotlight.name}
                </span>
              </div>
              <button
                type="button"
                id="quickTargetBtn"
                onClick={() => handleAction(spotlight.id, 'navigate')}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-secondary-container to-primary text-on-primary font-label-lg text-label-lg font-bold shadow-lg active:scale-95 transition-transform"
              >
                <Icon name="turn_sharp_right" className="text-[18px]" />
                <span>Target ({spotlight.distance_m}m)</span>
              </button>
            </div>
          )}
        </div>

        {/* Priority Sanctuary Spotlight Card */}
        {spotlight && (
          <div className="w-full rounded-2xl bg-surface-container-low p-space-md shadow-lg flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-11 h-11 rounded-xl bg-tertiary-container/30 flex items-center justify-center shrink-0">
                  <Icon name="health_and_safety" className="text-tertiary text-[26px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold truncate">
                      {spotlight.name}
                    </span>
                    <Icon name="verified" className="text-tertiary text-[17px]" />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {spotlight.address}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-headline-md text-headline-md font-bold text-tertiary">
                  {spotlight.distance_m}m
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {spotlight.walk_min} min walk
                </span>
              </div>
            </div>

            {/* Capability Grid */}
            <div className="grid grid-cols-2 gap-space-xs">
              {spotlight.capabilities.map((cap, cIdx) => (
                <div
                  key={cIdx}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-[11px]"
                >
                  <Icon name={cap.icon} className="text-tertiary text-[15px]" />
                  <span className="truncate">{cap.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAction(spotlight.id, 'beacon')}
                className="py-2.5 px-3 rounded-xl bg-surface-container-high text-tertiary font-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Icon name="campaign" className="text-[18px]" />
                <span>Flash/Sound Beacon</span>
              </button>

              {spotlight.phone ? (
                <a
                  href={`tel:${spotlight.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-surface-container-high text-on-surface font-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Icon name="call" className="text-primary text-[18px]" />
                  <span>Call Front Desk</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAction(spotlight.id, 'call')}
                  className="py-2.5 px-3 rounded-xl bg-surface-container-high text-on-surface font-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Icon name="call" className="text-primary text-[18px]" />
                  <span>Call Front Desk</span>
                </button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleAction(spotlight.id, 'activate-path')}
                className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                <Icon name="navigation" className="text-[18px]" />
                <span>Activate Sanctuary Path &amp; Direct Walk</span>
              </button>

              <button
                type="button"
                onClick={() => handleNotifyCircleDiversion(spotlight.id)}
                className="w-full py-2 px-3 rounded-xl bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center justify-center gap-1.5 active:bg-surface-container-highest transition-colors"
              >
                <Icon name="group" className="text-[16px] text-tertiary" />
                <span>Notify Guardian Circle of Haven Diversion</span>
              </button>
            </div>

            {/* Details toggle */}
            <button
              type="button"
              onClick={() => setSpotlightExpanded(!spotlightExpanded)}
              className="font-label-sm text-primary flex items-center justify-center gap-1 pt-1"
            >
              <span>{spotlightExpanded ? 'Hide Details' : 'View Hub Telemetry & Camera Coverage'}</span>
              <Icon name={spotlightExpanded ? 'expand_less' : 'expand_more'} className="text-[16px]" />
            </button>

            {spotlightExpanded && (
              <div className="bg-surface-container-lowest p-3 rounded-xl space-y-1 font-label-sm text-xs text-on-surface-variant animate-in fade-in">
                <div>Hours: 24/7 Monitored Sanctuary Hub</div>
                <div>CCTV Cameras: {spotlight.cctv_cameras ?? 4} High-Definition Monitored Nodes</div>
                <div>Ambient Luminance: {spotlight.lux ?? 210} lx</div>
                <div>Security Contact: {spotlight.phone ?? '+1 (555) 019-4829'}</div>
              </div>
            )}
          </div>
        )}

        {/* Directory Cards Section */}
        <div className="flex items-center justify-between pt-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Sanctuary Directory ({items.length})
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Sorted by Proximity
          </span>
        </div>

        <div className="space-y-space-sm">
          {items.map((haven: Haven) => {
            const isExpanded = expandedHavenIds[haven.id] ?? false;
            const isFocused = focusId === haven.id;

            return (
              <div
                key={haven.id}
                ref={(el) => {
                  directoryCardRefs.current[haven.id] = el;
                }}
                className={`bg-surface-container rounded-2xl p-space-md shadow-md space-y-space-sm transition-all duration-200 border ${
                  isFocused ? 'border-primary ring-2 ring-primary/40' : 'border-transparent'
                }`}
              >
                <div
                  onClick={() => toggleDirectoryCard(haven.id)}
                  className="flex items-start justify-between gap-space-sm cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <Icon name={haven.icon || 'storefront'} className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-headline-sm text-label-lg font-bold text-on-surface truncate">
                        {haven.name}
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate block">
                        {haven.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-label-lg text-label-lg font-bold text-secondary">
                      {haven.distance_m}m
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">
                      {haven.walk_min} min walk
                    </span>
                  </div>
                </div>

                {/* Sub-tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-[10px] text-on-surface-variant">
                    {haven.hours}
                  </span>
                  {haven.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-[10px] uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-surface-container-low rounded-xl p-space-sm space-y-2 pt-2 animate-in fade-in">
                    <p className="font-body-sm text-on-surface">{haven.note}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {haven.phone && (
                        <a
                          href={`tel:${haven.phone}`}
                          className="py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-center font-semibold"
                        >
                          Call ({haven.phone})
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAction(haven.id, 'navigate')}
                        className="py-2 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-center font-bold"
                      >
                        Direct Walk Route
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HavensPage;
