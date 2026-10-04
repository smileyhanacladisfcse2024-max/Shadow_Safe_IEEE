import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JourneySnapshot } from '../../api/types';
import { Icon } from '../common/Icon';
import { formatDistance } from '../../utils/format';

interface LiveJourneyMapProps {
  journey: JourneySnapshot;
  onSwitchToRealMap?: () => void;
}

export function LiveJourneyMap({ journey, onSwitchToRealMap }: LiveJourneyMapProps) {
  const navigate = useNavigate();

  const [compassAngle, setCompassAngle] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [isRecentering, setIsRecentering] = useState(false);

  const vehicle = journey.vehicle;
  const corridor = journey.corridor;
  const trip = journey.trip;
  const havensNearby = journey.havens_nearby?.items || [];
  const havenCount = journey.havens_nearby?.count_within_500m ?? havensNearby.length;

  // Calibrated projection: stage-2 position (0,0) lands at x=252, y=148
  const baseBusX = 252;
  const baseBusY = 148;
  const busX = Math.max(30, Math.min(360, baseBusX + (vehicle?.x_m || 0) * 0.5));
  const busY = Math.max(40, Math.min(380, baseBusY - (vehicle?.y_m || 0) * 0.5));

  // Divergence point marker
  const hasDeviation = (corridor?.deviation_m ?? 0) >= 50;
  const divX = 185;
  const divY = 215;

  const showDimlyLit = (trip?.lighting_lux ?? 100) < 20;

  const handleCompassClick = () => {
    setCompassAngle((prev) => (prev + 90) % 360);
  };

  const handleRecenter = () => {
    setIsRecentering(true);
    setTimeout(() => setIsRecentering(false), 400);
  };

  return (
    <div className="relative w-full h-[420px] overflow-hidden bg-[#0b101b] select-none border-y border-outline-variant/30">
      {/* Interactive Vector Map Canvas SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 390 420"
      >
        <defs>
          <filter id="cyan-route-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#06b6d4" floodOpacity="0.75" />
          </filter>
          <filter id="amber-dev-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.85" />
          </filter>
          <pattern id="unlit-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.22" />
          </pattern>
          <linearGradient id="safe-zone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fdbc8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#04b4a2" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Base map land & blocks */}
        <rect width="390" height="420" fill="#0a0e17" />
        <path d="M-20,130 L110,130 L130,220 L-20,240 Z" fill="#111927" />
        <path d="M230,-10 L370,-10 L360,110 L220,90 Z" fill="#0e1624" />
        <path d="M240,150 L400,160 L410,290 L250,270 Z" fill="#111927" />
        <path d="M-10,310 L160,300 L150,430 L-10,430 Z" fill="#0e1522" />

        {/* Major thoroughfares & street geometry */}
        <path d="M 40,30 C 70,60 85,110 75,170 C 65,220 30,260 20,300" fill="none" stroke="#132338" strokeWidth="28" strokeLinecap="round" />
        <path d="M240,285 C270,285 300,320 340,340 C380,360 400,355 420,355 L420,430 L220,430 Z" fill="#0d1a24" />
        <path d="M250,300 C280,300 310,335 350,350" fill="none" stroke="#183442" strokeWidth="16" strokeLinecap="round" />

        <path d="M 70,30 L 70,410" fill="none" stroke="#161d2d" strokeWidth="14" />
        <path d="M 145,-10 L 145,430" fill="none" stroke="#172030" strokeWidth="12" />
        <path d="M 220,-10 L 220,430" fill="none" stroke="#192336" strokeWidth="16" />
        <path d="M 320,-10 L 320,430" fill="none" stroke="#151c2b" strokeWidth="12" />

        <path d="M -10,75 L 400,75" fill="none" stroke="#172030" strokeWidth="10" />
        <path d="M -10,140 L 400,140" fill="none" stroke="#192336" strokeWidth="18" />
        <path d="M -10,215 L 400,215" fill="none" stroke="#1c2538" strokeWidth="22" />
        <path d="M -10,315 L 400,315" fill="none" stroke="#172030" strokeWidth="12" />
        <path d="M -10,380 L 400,380" fill="none" stroke="#151d2c" strokeWidth="10" />

        <path d="M 200,-10 L 390,180" fill="none" stroke="#182235" strokeWidth="10" />
        <path d="M -20,260 L 200,430" fill="none" stroke="#162033" strokeWidth="10" />

        {/* Polygons (toggled via Layers if requested) */}
        {showLayers && (
          <>
            <polygon
              points="50,120 230,120 230,235 50,235"
              fill="url(#safe-zone-grad)"
              stroke="#4fdbc8"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              strokeOpacity="0.4"
            />
            {showDimlyLit && (
              <polygon
                points="210,125 350,125 350,240 210,240"
                fill="url(#unlit-hatch)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                strokeOpacity="0.55"
              />
            )}
          </>
        )}

        {/* Safe Corridor Planned Route Path */}
        <path
          d="M -10,360 C 90,340 135,270 170,215 C 205,160 250,90 320,25"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M 25,370 C 85,350 140,295 185,215 C 220,150 255,100 330,45"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="7,5"
          filter="url(#cyan-route-glow)"
        />

        {/* Deviation Path */}
        {hasDeviation && (
          <>
            <path
              d="M 185,215 C 200,215 220,215 235,215 C 248,215 252,205 252,185 L 252,148"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#amber-dev-glow)"
            />
            <circle cx="185" cy="215" r="5.5" fill="#f59e0b" />
            <circle cx="185" cy="215" r="2.5" fill="#0f131d" />
          </>
        )}

        {/* Street Name Labels */}
        <text x="62" y="180" fill="#94a3b8" fontFamily="Inter" fontSize="8" fontWeight="600" letterSpacing="0.8" transform="rotate(-90 62 180)">
          MARKET STREET
        </text>
        <text x="80" y="136" fill="#94a3b8" fontFamily="Inter" fontSize="9" fontWeight="700" letterSpacing="1">
          BROADWAY BLVD
        </text>
        <text x="70" y="211" fill="#64748b" fontFamily="Inter" fontSize="8" fontWeight="600" letterSpacing="0.6">
          GRAND AVE
        </text>
        {hasDeviation && (
          <text x="226" y="211" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="8" fontWeight="600" letterSpacing="0.5">
            {corridor?.street_label?.toUpperCase() || '7TH ST'} (DEVIATION)
          </text>
        )}
        <text x="152" y="40" fill="#64748b" fontFamily="Inter" fontSize="7.5" fontWeight="500" letterSpacing="0.5" transform="rotate(90 152 40)">
          MISSION ST
        </text>
        <text x="326" y="230" fill="#64748b" fontFamily="Inter" fontSize="7.5" fontWeight="500" letterSpacing="0.5" transform="rotate(90 326 230)">
          WAREHOUSE ROW
        </text>
      </svg>

      {/* Floating Badges on Map */}
      <div className="absolute left-[40px] top-[148px] bg-secondary-container/20 border border-secondary/40 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
        <span className="font-label-sm text-[9px] text-secondary font-semibold uppercase tracking-wider">
          High-Illumination Safe Zone
        </span>
      </div>

      {showDimlyLit && (
        <div className="absolute left-[225px] top-[175px] bg-[#241708]/90 border border-[#f59e0b]/50 px-2 py-0.5 rounded shadow-md pointer-events-none">
          <div className="flex items-center gap-1">
            <Icon name="dark_mode" className="text-[11px] text-tertiary" />
            <span className="font-label-sm text-[8.5px] text-tertiary font-bold tracking-tight uppercase">
              Dimly Lit (&lt;20 lx)
            </span>
          </div>
        </div>
      )}

      {/* Divergence Point Marker Badge */}
      {hasDeviation && (
        <div
          className="absolute -translate-x-1/2 -translate-y-[120%] pointer-events-none z-10 flex flex-col items-center"
          style={{ left: `${divX}px`, top: `${divY}px` }}
        >
          <div className="bg-surface-container-highest/95 border border-tertiary/70 backdrop-blur-md px-2 py-1 rounded-lg shadow-xl flex items-center gap-1.5 animate-bounce duration-1000">
            <Icon name="warning" className="text-tertiary text-[14px]" />
            <div className="flex flex-col">
              <span className="font-label-sm text-[9px] text-tertiary font-bold leading-none">
                Divergence Point
              </span>
              <span className="font-label-sm text-[8px] text-on-surface-variant leading-none mt-0.5">
                +{corridor?.deviation_m}m from route
              </span>
            </div>
          </div>
          <div className="w-2 h-2 bg-tertiary rotate-45 -mt-1 shadow-sm" />
        </div>
      )}

      {/* Dynamic Vehicle / Bus Marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group"
        style={{ left: `${busX}px`, top: `${busY}px` }}
      >
        <span className="absolute w-12 h-12 -inset-3 rounded-full bg-secondary/25 animate-ping" />
        <span className="absolute w-8 h-8 -inset-1 rounded-full bg-primary/30 animate-pulse" />
        <div className="relative w-7 h-7 rounded-full bg-primary text-on-primary-container flex items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.9)] border-2 border-white/90 active:scale-95 transition-transform">
          <Icon name="directions_bus" className="text-[17px] font-bold text-slate-900" />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-surface-container-lowest/95 border border-primary/40 backdrop-blur-md shadow-xl text-nowrap flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <div className="flex flex-col leading-none">
            <span className="font-label-sm text-[9px] text-on-surface font-bold">
              {trip?.line_short ? `Bus ${trip.line_short} · Live` : 'Transit Live'}
            </span>
            <span className="font-label-sm text-[8px] text-primary">
              {vehicle?.speed_kmh ?? 18} km/h · Heading {vehicle?.heading || 'N'}
            </span>
          </div>
        </div>
      </div>

      {/* Up to 3 nearby safe haven pins */}
      {havensNearby.slice(0, 3).map((haven, idx) => {
        // Position anchors for the 3 pins from the design
        const coords = [
          { left: '105px', top: '95px', color: 'text-secondary bg-secondary/20 border-secondary/50' },
          { left: '85px', top: '265px', color: 'text-primary bg-primary/20 border-outline-variant/60' },
          { left: '295px', top: '290px', color: 'text-secondary bg-secondary-container border-secondary/40' },
        ][idx] || { left: '105px', top: '95px', color: 'text-secondary bg-secondary/20 border-secondary/50' };

        return (
          <div
            key={haven.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
            style={{ left: coords.left, top: coords.top }}
          >
            <div
              onClick={() => navigate(`/havens?focus=${encodeURIComponent(haven.id)}`)}
              className={`flex items-center gap-1.5 bg-surface-container-lowest/95 border ${coords.color.split(' ')[2]} backdrop-blur-md px-2 py-1 rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer`}
            >
              <div
                className={`w-5 h-5 rounded-full ${coords.color.split(' ')[1]} flex items-center justify-center ${coords.color.split(' ')[0]} shrink-0`}
              >
                <Icon name={haven.icon || 'shield'} className="text-[13px]" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="font-label-sm text-[9px] text-on-surface font-semibold leading-tight truncate max-w-[120px]">
                  {haven.name}
                </span>
                <span className="font-label-sm text-[8px] text-secondary font-medium leading-none">
                  {formatDistance(haven.distance_m)} · {haven.note || 'Verified Safe Haven'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Top Left GPS Status pill */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 border border-outline-variant/40 backdrop-blur-md shadow-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label-sm text-[9px] text-primary font-bold uppercase tracking-wider">
            GPS Active
          </span>
          <span className="text-outline font-label-sm text-[9px]">|</span>
          <span className="font-label-sm text-[9px] text-on-surface-variant font-medium">
            Line {trip?.line_short || '14R'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-lowest/90 border border-outline-variant/40 backdrop-blur-md shadow-md text-on-surface-variant active:text-on-surface cursor-pointer">
          <Icon name="wb_incandescent" className="text-[13px] text-tertiary" />
          <span className="font-label-sm text-[9px] text-on-surface">Lighting ON</span>
        </div>
        {onSwitchToRealMap && (
          <button
            type="button"
            onClick={onSwitchToRealMap}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-on-secondary shadow-md font-label-sm text-[9px] font-bold cursor-pointer transition-transform active:scale-95"
            title="Switch to Real Street Map"
          >
            <Icon name="map" className="text-[13px]" />
            <span>Real Map</span>
          </button>
        )}
      </div>

      {/* Top Right Controls (Compass & Layers) */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5 items-end">
        <button
          type="button"
          aria-label="North Heading Compass"
          onClick={handleCompassClick}
          className="w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-outline-variant/40 backdrop-blur-md text-on-surface flex items-center justify-center shadow-md active:scale-90 transition-transform"
          style={{ transform: `rotate(${compassAngle}deg)` }}
        >
          <Icon name="explore" className="text-[18px] text-error" />
        </button>
        <button
          type="button"
          aria-label="Toggle Map Layers"
          onClick={() => setShowLayers(!showLayers)}
          className={`w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-outline-variant/40 backdrop-blur-md flex items-center justify-center shadow-md active:scale-90 transition-transform ${
            showLayers ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          <Icon name="layers" className="text-[16px]" />
        </button>
      </div>

      {/* Bottom Right Controls (Havens & Recenter) */}
      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2 items-end">
        <button
          type="button"
          onClick={() => navigate('/havens')}
          className="h-8 px-2.5 rounded-full bg-surface-container-lowest/90 border border-secondary/40 backdrop-blur-md text-on-surface font-label-sm text-[10px] flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Icon name="shield" className="text-[15px] text-secondary" />
          <span className="font-semibold">{havenCount} Safe Havens</span>
        </button>
        <button
          type="button"
          aria-label="Recenter map to bus position"
          onClick={handleRecenter}
          className={`w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_14px_rgba(76,215,246,0.5)] active:scale-90 transition-transform ${
            isRecentering ? 'rotate-180' : ''
          }`}
        >
          <Icon name="my_location" className="text-[19px]" />
        </button>
      </div>
    </div>
  );
}
