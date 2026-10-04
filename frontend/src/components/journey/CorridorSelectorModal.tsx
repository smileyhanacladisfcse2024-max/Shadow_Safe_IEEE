import { useState } from 'react';
import { Icon } from '../common/Icon';
import type { JourneySnapshot } from '../../api/types';

export interface CorridorPreset {
  id: string;
  city: string;
  flag: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  line_label: string;
  line_short: string;
  distance_km: number;
  eta_minutes: number;
  lighting_lux: number;
  lighting_label: string;
  crowd_label: string;
  street_label: string;
}

export const CORRIDOR_PRESETS: CorridorPreset[] = [
  {
    id: 'blr-500d',
    city: 'Bengaluru, India',
    flag: '🇮🇳',
    origin: 'Indiranagar 100ft Rd',
    destination: 'Electronic City Campus',
    origin_lat: 12.9716,
    origin_lng: 77.6412,
    dest_lat: 12.8452,
    dest_lng: 77.6602,
    line_label: 'Bus 500D · Outer Ring Road Transit Corridor',
    line_short: '500D',
    distance_km: 14.5,
    eta_minutes: 38,
    lighting_lux: 85,
    lighting_label: 'High (85 lx)',
    crowd_label: 'High',
    street_label: 'Sarjapur Junction',
  },
  {
    id: 'sf-14r',
    city: 'San Francisco, USA',
    flag: '🌉',
    origin: 'Montgomery St Metro',
    destination: 'Oakland Tech District',
    origin_lat: 37.7891,
    origin_lng: -122.4014,
    dest_lat: 37.8044,
    dest_lng: -122.2712,
    line_label: 'Bus 14R · Toward Downtown Central',
    line_short: '14R',
    distance_km: 3.4,
    eta_minutes: 14,
    lighting_lux: 15,
    lighting_label: 'Low (15 lx)',
    crowd_label: 'Sparse',
    street_label: '7th St',
  },
  {
    id: 'nyc-m15',
    city: 'New York City, USA',
    flag: '🗽',
    origin: 'Manhattan Penn Station',
    destination: 'Brooklyn Navy Yard',
    origin_lat: 40.7505,
    origin_lng: -73.9934,
    dest_lat: 40.7003,
    dest_lng: -73.9715,
    line_label: 'Line M15 · Cross-Borough Night Express',
    line_short: 'M15',
    distance_km: 5.8,
    eta_minutes: 22,
    lighting_lux: 65,
    lighting_label: 'Medium (65 lx)',
    crowd_label: 'Moderate',
    street_label: 'Broadway & 8th Ave',
  },
  {
    id: 'ldn-15',
    city: 'London, UK',
    flag: '🇬🇧',
    origin: 'Oxford Circus',
    destination: 'Canary Wharf Pier',
    origin_lat: 51.5152,
    origin_lng: -0.1419,
    dest_lat: 51.5049,
    dest_lng: -0.0245,
    line_label: 'Bus 15 · Central Commercial Arterial',
    line_short: '15',
    distance_km: 7.2,
    eta_minutes: 26,
    lighting_lux: 40,
    lighting_label: 'Moderate (40 lx)',
    crowd_label: 'Crowded',
    street_label: 'Regent St & Strand',
  },
  {
    id: 'tyo-01',
    city: 'Tokyo, Japan',
    flag: '🗼',
    origin: 'Shibuya Crossing',
    destination: 'Roppongi Hills',
    origin_lat: 35.6595,
    origin_lng: 139.7004,
    dest_lat: 35.6605,
    dest_lng: 139.7292,
    line_label: 'Transit Line 01 · Night Sanctuary Corridor',
    line_short: '01',
    distance_km: 3.8,
    eta_minutes: 16,
    lighting_lux: 110,
    lighting_label: 'Illuminated (110 lx)',
    crowd_label: 'Dense',
    street_label: 'Roppongi-dori',
  },
];

interface CorridorSelectorModalProps {
  currentJourney: JourneySnapshot;
  isOpen: boolean;
  onClose: () => void;
  onSelectCorridor: (preset: Partial<CorridorPreset>) => void;
}

export function CorridorSelectorModal({
  currentJourney,
  isOpen,
  onClose,
  onSelectCorridor,
}: CorridorSelectorModalProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customOrigin, setCustomOrigin] = useState('');
  const [customDestination, setCustomDestination] = useState('');
  const [customLine, setCustomLine] = useState('');
  const [customDistance, setCustomDistance] = useState('4.2');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: CorridorPreset) => {
    onSelectCorridor(preset);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOrigin.trim() || !customDestination.trim()) return;

    const dist = parseFloat(customDistance) || 4.0;
    const eta = Math.round(dist * 3.5);

    onSelectCorridor({
      city: 'Custom Corridor',
      flag: '📍',
      origin: customOrigin.trim(),
      destination: customDestination.trim(),
      line_label: customLine.trim() || 'Express Route · Direct Transit',
      line_short: customLine.slice(0, 4).toUpperCase() || 'EXP',
      distance_km: dist,
      eta_minutes: eta,
      lighting_lux: 45,
      lighting_label: 'Moderate (45 lx)',
      crowd_label: 'Monitored',
      street_label: 'Central Arterial',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end justify-center sm:items-center p-4">
      <div className="w-full max-w-lg bg-surface-container rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="commute" className="text-secondary text-[24px]" />
            <h3 className="font-headline-sm text-on-surface font-bold">Select Active Journey &amp; City</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1"
            aria-label="Close"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <p className="font-body-sm text-on-surface-variant">
          Switch active transit corridor or customize origin and destination. All risk telemetry, map routes, and sanctuary networks will adapt dynamically in real-time.
        </p>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className={`py-2 rounded-lg font-label-md transition-colors ${
              !isCustomMode
                ? 'bg-surface-container-high text-primary font-bold shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pre-Configured Corridors
          </button>
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`py-2 rounded-lg font-label-md transition-colors ${
              isCustomMode
                ? 'bg-surface-container-high text-primary font-bold shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            + Custom City Route
          </button>
        </div>

        {!isCustomMode ? (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {CORRIDOR_PRESETS.map((p) => {
              const isCurrent =
                currentJourney.trip.origin.toLowerCase() === p.origin.toLowerCase() ||
                currentJourney.trip.destination.toLowerCase() === p.destination.toLowerCase();

              return (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    isCurrent
                      ? 'bg-surface-container-high border-secondary/50 shadow-md ring-1 ring-secondary/30'
                      : 'bg-surface-container-low border-transparent hover:border-outline-variant/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-sm font-bold text-on-surface">
                            {p.city}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary text-[9px] font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="font-label-sm text-xs text-secondary font-medium">
                          {p.line_label}
                        </span>
                      </div>
                    </div>
                    <span className="font-label-sm text-xs text-on-surface-variant font-mono">
                      {p.distance_km} km • {p.eta_minutes}m
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="text-primary truncate">{p.origin}</span>
                    <span>→</span>
                    <span className="text-secondary truncate">{p.destination}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[10px] uppercase">
                Origin Station / Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Station / Main Gate"
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface outline-none focus:border-primary text-body-md"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[10px] uppercase">
                Destination Station / Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Technology District / University Dorm"
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface outline-none focus:border-primary text-body-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[10px] uppercase">
                  Line / Vehicle Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro 2B / Nightwalk"
                  value={customLine}
                  onChange={(e) => setCustomLine(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface outline-none focus:border-primary text-body-md"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[10px] uppercase">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="50"
                  value={customDistance}
                  onChange={(e) => setCustomDistance(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface outline-none focus:border-primary text-body-md"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-headline-sm font-bold shadow-md active:scale-95 transition-transform mt-2"
            >
              Activate Custom Journey Corridor
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CorridorSelectorModal;
