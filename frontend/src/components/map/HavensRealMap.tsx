import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Haven, HavenSpotlight } from '../../api/types';
import { createMapTileLayer, type MapStyleKey } from '../../config/mapConfig';

interface HavensRealMapProps {
  items: Haven[];
  spotlight: HavenSpotlight | null;
  onAction?: (havenId: string, action: 'beacon' | 'call' | 'navigate') => void;
}

export function HavensRealMap({ items, spotlight, onAction }: HavensRealMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('voyager');

  // Base commuter coordinate (e.g. Bangalore center or default)
  const defaultCenterLat = 12.9716;
  const defaultCenterLng = 77.6412;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultCenterLat, defaultCenterLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const baseTile = createMapTileLayer(mapStyle);
    baseTile.addTo(map);
    tileLayerRef.current = baseTile;

    const group = L.layerGroup().addTo(map);
    markerGroupRef.current = group;

    mapInstanceRef.current = map;

    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile style if changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newLayer = createMapTileLayer(mapStyle);
    newLayer.addTo(map);
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Commuter Marker (You)
    const commuterIcon = L.divIcon({
      className: 'custom-commuter-pin',
      html: `<div style="position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; inset: -6px; background-color: rgba(2,132,199,0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #0284c7; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px #0284c7; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([defaultCenterLat, defaultCenterLng], { icon: commuterIcon })
      .bindPopup('<b style="color: #0f172a;">Your Current Location</b><br/><span style="font-size: 10px; color: #475569;">Active Safety Zone Monitoring</span>')
      .addTo(group);

    // 2. Haven Markers
    const bounds = L.latLngBounds([defaultCenterLat, defaultCenterLng], [defaultCenterLat, defaultCenterLng]);

    items.forEach((haven, idx) => {
      // Calculate realistic geographic offset around commuter center based on x_m and y_m
      const hLat = defaultCenterLat + (haven.y_m || (idx % 2 === 0 ? 300 : -250)) / 111320;
      const hLng = defaultCenterLng + (haven.x_m || (idx % 3 === 0 ? 350 : -300)) / (111320 * Math.cos((defaultCenterLat * Math.PI) / 180));

      bounds.extend([hLat, hLng]);

      const isSpotlight = spotlight?.id === haven.id;
      const isPolice = haven.icon === 'local_police';
      const isMed = haven.icon === 'health_and_safety' || haven.icon === 'local_pharmacy';
      const isTransit = haven.icon === 'directions_subway';

      const color = isSpotlight ? '#10b981' : isPolice ? '#2563eb' : isMed ? '#059669' : isTransit ? '#d97706' : '#0d9488';
      const emoji = isSpotlight ? '⭐' : isPolice ? '🛡️' : isMed ? '🏥' : isTransit ? '🚇' : '🏪';

      const icon = L.divIcon({
        className: 'custom-haven-pin',
        html: `<div style="position: relative; cursor: pointer;">
          ${isSpotlight ? '<div style="position: absolute; inset: -6px; background-color: rgba(16,185,129,0.4); border-radius: 50%; animation: pulse 1.5s infinite;"></div>' : ''}
          <div style="background-color: ${color}; color: #ffffff; width: ${isSpotlight ? '32px' : '26px'}; height: ${isSpotlight ? '32px' : '26px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isSpotlight ? '15px' : '13px'}; box-shadow: 0 0 14px ${color}; border: 2px solid #ffffff;">
            ${emoji}
          </div>
        </div>`,
        iconSize: [isSpotlight ? 32 : 26, isSpotlight ? 32 : 26],
        iconAnchor: [isSpotlight ? 16 : 13, isSpotlight ? 16 : 13],
      });

      const phoneButton = haven.phone
        ? `<button onclick="window.location.href='tel:${haven.phone}'" style="margin-top: 6px; padding: 4px 8px; background-color: #0d9488; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">📞 Call Haven</button>`
        : '';

      L.marker([hLat, hLng], { icon })
        .bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 170px; padding: 2px;">
            <div style="font-size: 10px; font-weight: bold; color: ${color}; text-transform: uppercase;">${isSpotlight ? 'Nearest Verified Sanctuary' : 'Verified Safe Haven'}</div>
            <p style="margin: 2px 0; font-size: 12px; font-weight: bold;">${haven.name}</p>
            <div style="font-size: 11px; color: #475569;">${haven.distance_m}m • ~${haven.walk_min} min walk</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${haven.address}</div>
            ${phoneButton}
          </div>
        `)
        .addTo(group);
    });

    if (items.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        // safe fallback
      }
    }
  }, [items, spotlight, defaultCenterLat, defaultCenterLng, onAction]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border border-outline-variant/30 select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left info */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span className="font-label-sm text-[10px] text-on-surface font-semibold">
          Real CARTO Basemap • {items.length} Active Havens
        </span>
      </div>

      {/* Style Toggle */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md p-0.5 rounded-full border border-outline-variant/40 shadow-sm">
        <button
          type="button"
          onClick={() => setMapStyle('voyager')}
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
            mapStyle === 'voyager' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
          }`}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setMapStyle('dark')}
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
            mapStyle === 'dark' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
          }`}
        >
          Dark
        </button>
      </div>
    </div>
  );
}

export default HavensRealMap;
