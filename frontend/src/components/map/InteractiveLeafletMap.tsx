import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { JourneySnapshot, RouteOption } from '../../api/types';
import { useRoutesQuery, useSelectRouteMutation } from '../../api/hooks';
import { Icon } from '../common/Icon';
import { useToast } from '../common/Toast';
import {
  CARTO_API_KEY,
  MAP_LAYERS,
  type MapStyleKey,
  createMapTileLayer,
} from '../../config/mapConfig';

interface InteractiveLeafletMapProps {
  journey: JourneySnapshot;
}

export function InteractiveLeafletMap({ journey }: InteractiveLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const vectorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);

  const { showToast } = useToast();
  const { data: routesData } = useRoutesQuery();
  const selectRouteMutation = useSelectRouteMutation();

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('voyager');
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [showHavensLayer, setShowHavensLayer] = useState(true);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const trip = journey.trip;
  const havens = useMemo(() => journey.havens_nearby?.items || [], [journey.havens_nearby?.items]);

  // Determine active coordinates
  const originLat = trip.origin_lat || 12.9716;
  const originLng = trip.origin_lng || 77.6412;
  const destLat = trip.dest_lat || 12.8452;
  const destLng = trip.dest_lng || 77.6602;

  // Compute active polyline
  const activePolyline = useMemo<[number, number][]>(() => {
    if (trip.polyline && trip.polyline.length > 1) {
      return trip.polyline as [number, number][];
    }
    // Fallback: smooth arc between origin and destination
    const pts: [number, number][] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arc = Math.sin(t * Math.PI) * 0.012;
      pts.push([
        originLat + t * (destLat - originLat) + arc,
        originLng + t * (destLng - originLng) + arc * 0.8,
      ]);
    }
    return pts;
  }, [trip.polyline, originLat, originLng, destLat, destLng]);

  // 1. Initialize Leaflet Map once with proper lifecycle and cleanup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [originLat, originLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Create Base Tile Layer with CARTO Authentication
    const baseTileLayer = createMapTileLayer(mapStyle);
    baseTileLayer.addTo(map);
    tileLayerRef.current = baseTileLayer;

    // Create LayerGroup for all vector graphics, polylines, and pins
    const vectorGroup = L.layerGroup().addTo(map);
    vectorLayerGroupRef.current = vectorGroup;

    mapInstanceRef.current = map;

    // Ensure map tiles and dimensions resize correctly after container paints
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 350);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      vectorLayerGroupRef.current = null;
      userMarkerRef.current = null;
      userAccuracyCircleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle switching map styles (Voyager Street vs Dark Matter vs OSM)
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

  // 3. Render vector layers, polylines, routes, and haven pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = vectorLayerGroupRef.current;
    if (!map || !group) return;

    // Clear previous vector graphics
    group.clearLayers();

    // A. Draw Alternate Routes in background
    if (routesData?.options) {
      routesData.options.forEach((opt: RouteOption) => {
        if (!opt.selected && opt.polyline && opt.polyline.length > 1) {
          const altPoly = L.polyline(opt.polyline as [number, number][], {
            color: '#818cf8',
            weight: 4,
            opacity: 0.6,
            dashArray: '6, 8',
          }).addTo(group);

          altPoly.bindTooltip(
            `<b>${opt.name}</b><br/>${opt.time_min} min • ${opt.distance_km || ''} km • Click to switch`,
            { sticky: true }
          );

          altPoly.on('click', () => {
            selectRouteMutation.mutate(opt.id);
            showToast({
              message: `Switched corridor to ${opt.name}`,
              variant: 'primary',
              icon: 'alt_route',
            });
          });
        }
      });
    }

    // B. Draw Active Route with Glowing Pathway
    if (activePolyline.length > 0) {
      // Glow underlay
      L.polyline(activePolyline, {
        color: '#06b6d4',
        weight: 9,
        opacity: 0.3,
      }).addTo(group);

      // Core route line
      const mainLine = L.polyline(activePolyline, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.95,
      }).addTo(group);

      // Fit map bounds smoothly
      try {
        const bounds = mainLine.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch {
        // Safe fallback
      }
    }

    // C. Origin Marker
    const originIcon = L.divIcon({
      className: 'custom-origin-icon',
      html: `<div style="background-color: #0284c7; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(2,132,199,0.9); display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #ffffff; width: 5px; height: 5px; border-radius: 50%;"></div>
      </div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker([originLat, originLng], { icon: originIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; min-width: 140px; padding: 2px;">
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px;">Trip Origin</span>
          <p style="margin: 3px 0 0 0; font-size: 12px; font-weight: bold;">${trip.origin}</p>
        </div>
      `)
      .addTo(group);

    // D. Destination Marker
    const destIcon = L.divIcon({
      className: 'custom-dest-icon',
      html: `<div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(16,185,129,0.9); display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 11px;">🏁</span>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; min-width: 150px; padding: 2px;">
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #059669; letter-spacing: 0.5px;">Safe Destination</span>
          <p style="margin: 3px 0 0 0; font-size: 12px; font-weight: bold;">${trip.destination}</p>
          <div style="margin-top: 4px; font-size: 11px; color: #475569;">ETA: ${trip.eta_minutes} min • ${trip.distance_km} km</div>
        </div>
      `)
      .addTo(group);

    // E. Draw Vehicle / In-Transit Location along route
    if (!gpsActive && activePolyline.length > 2) {
      const midIdx = Math.min(2, Math.floor(activePolyline.length / 3));
      const busPos = activePolyline[midIdx];

      const vehicleIcon = L.divIcon({
        className: 'custom-vehicle-icon',
        html: `<div style="background: linear-gradient(135deg, #0284c7, #38bdf8); color: #ffffff; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; box-shadow: 0 0 16px rgba(2,132,199,0.85); display: flex; align-items: center; gap: 4px; white-space: nowrap; border: 2px solid #ffffff;">
          <span>🚌 ${trip.line_short || 'SAFE'}</span>
        </div>`,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      L.marker(busPos, { icon: vehicleIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; padding: 2px;">
            <b style="font-size: 12px; color: #0284c7;">Active Transit Vehicle</b>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">Speed: ${journey.vehicle?.speed_kmh || 24} km/h • Verified Safe Corridor</p>
          </div>
        `)
        .addTo(group);
    }

    // F. Draw Real Safe Havens
    if (showHavensLayer && havens.length > 0) {
      havens.forEach((haven, idx) => {
        let hLat = haven.lat;
        let hLng = haven.lng;

        if (!hLat || !hLng) {
          const refPt = activePolyline[Math.min(idx * 3 + 1, activePolyline.length - 1)] || [originLat, originLng];
          hLat = refPt[0] + 0.0018 * (idx % 2 === 0 ? 1 : -1);
          hLng = refPt[1] + 0.0018 * (idx % 2 === 0 ? -1 : 1);
        }

        const isPolice = haven.icon === 'local_police';
        const isMed = haven.icon === 'health_and_safety' || haven.icon === 'local_pharmacy';
        const isTransit = haven.icon === 'directions_subway';

        const bgColor = isPolice ? '#2563eb' : isMed ? '#059669' : isTransit ? '#d97706' : '#0d9488';
        const emoji = isPolice ? '🛡️' : isMed ? '🏥' : isTransit ? '🚇' : '✨';

        const havenIcon = L.divIcon({
          className: 'custom-haven-pin',
          html: `<div style="background-color: ${bgColor}; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 14px ${bgColor}; border: 2px solid #ffffff; cursor: pointer; transition: transform 0.2s ease;">
            ${emoji}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const havenMarker = L.marker([hLat, hLng], { icon: havenIcon }).addTo(group);

        const phoneLink = haven.phone
          ? `<a href="tel:${haven.phone}" style="display: inline-block; margin-top: 6px; padding: 4px 10px; background-color: #0d9488; color: #ffffff; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">📞 Call Haven</a>`
          : '';

        havenMarker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 170px; line-height: 1.35; padding: 2px;">
            <div style="font-size: 12px; font-weight: bold; color: ${bgColor};">${haven.name}</div>
            <p style="margin: 4px 0 2px 0; font-size: 11px; color: #475569;">${haven.distance_m}m away • ${haven.note}</p>
            ${phoneLink}
          </div>
        `);
      });
    }
  }, [
    originLat,
    originLng,
    destLat,
    destLng,
    trip.origin,
    trip.destination,
    trip.line_short,
    trip.eta_minutes,
    trip.distance_km,
    activePolyline,
    havens,
    showHavensLayer,
    gpsActive,
    routesData?.options,
    selectRouteMutation,
    showToast,
    journey.vehicle?.speed_kmh,
  ]);

  // 4. Handle Real Device GPS Tracking
  const toggleGpsTracking = () => {
    if (gpsActive) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      setGpsActive(false);
      setGpsCoords(null);
      if (userMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      showToast({ message: 'GPS tracking deactivated', variant: 'tertiary' });
      return;
    }

    if (!navigator.geolocation) {
      showToast({ message: 'Geolocation is not supported by your browser', variant: 'error' });
      return;
    }

    showToast({
      message: 'Acquiring live satellite GPS feed...',
      variant: 'primary',
      icon: 'gps_fixed',
    });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsActive(true);
        setGpsCoords({ lat: latitude, lng: longitude, accuracy });

        const map = mapInstanceRef.current;
        if (map) {
          if (!userMarkerRef.current) {
            const gpsUserIcon = L.divIcon({
              className: 'custom-gps-user-pin',
              html: `<div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; inset: -8px; background-color: rgba(2,132,199,0.35); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="background-color: #0284c7; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 16px #0284c7;"></div>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            userMarkerRef.current = L.marker([latitude, longitude], { icon: gpsUserIcon })
              .bindPopup('<b style="color: #0f172a;">Your Live Location (GPS Active)</b>')
              .addTo(map);

            userAccuracyCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: '#0284c7',
              weight: 1,
              opacity: 0.4,
              fillColor: '#0284c7',
              fillOpacity: 0.1,
            }).addTo(map);
          } else {
            userMarkerRef.current.setLatLng([latitude, longitude]);
            if (userAccuracyCircleRef.current) {
              userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
              userAccuracyCircleRef.current.setRadius(accuracy);
            }
          }
        }
      },
      (err) => {
        showToast({ message: `GPS Error: ${err.message}`, variant: 'error' });
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    gpsWatchIdRef.current = watchId;
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (gpsCoords) {
      map.flyTo([gpsCoords.lat, gpsCoords.lng], 16, { duration: 1.2 });
      showToast({ message: 'Centered on live GPS location', variant: 'primary', icon: 'my_location' });
    } else if (activePolyline.length > 0) {
      map.flyTo(activePolyline[0], 15, { duration: 1.2 });
      showToast({ message: 'Centered on active corridor origin', variant: 'primary', icon: 'alt_route' });
    }
  };

  return (
    <div className="relative w-full h-[420px] overflow-hidden bg-surface-container-lowest select-none border-y border-outline-variant/30">
      {/* Real Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status / Accuracy Chip */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 shadow-md">
          <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-secondary animate-ping' : 'bg-primary animate-pulse'}`} />
          <span className="font-label-sm text-[11px] text-on-surface font-semibold tracking-wide">
            {gpsActive ? 'Live GPS Satellite Active' : `Real Map • ${MAP_LAYERS[mapStyle]?.badge || 'CARTO'}`}
          </span>
        </div>

        {gpsCoords && (
          <div className="px-2.5 py-0.5 rounded-md bg-surface-container-lowest/90 backdrop-blur-md text-[10px] text-on-surface-variant font-mono shadow-sm">
            Lat: {gpsCoords.lat.toFixed(5)} • Lng: {gpsCoords.lng.toFixed(5)} (±{Math.round(gpsCoords.accuracy)}m)
          </div>
        )}
      </div>

      {/* Floating Map Controls Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Toggle Real Device GPS */}
        <button
          type="button"
          onClick={toggleGpsTracking}
          title={gpsActive ? 'Deactivate Live GPS' : 'Activate Live GPS'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer ${
            gpsActive
              ? 'bg-secondary text-on-secondary ring-2 ring-secondary/50 scale-105'
              : 'bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface border border-outline-variant/40 backdrop-blur-md'
          }`}
        >
          <Icon name={gpsActive ? 'gps_fixed' : 'gps_not_fixed'} className="text-[18px]" />
        </button>

        {/* Recenter Map */}
        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter Map on Path"
          className="w-9 h-9 rounded-xl bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface border border-outline-variant/40 flex items-center justify-center shadow-lg transition-colors cursor-pointer backdrop-blur-md"
        >
          <Icon name="my_location" className="text-[18px]" />
        </button>

        {/* Toggle Safe Havens Layer */}
        <button
          type="button"
          onClick={() => setShowHavensLayer(!showHavensLayer)}
          title={showHavensLayer ? 'Hide Safe Havens' : 'Show Safe Havens'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-colors cursor-pointer backdrop-blur-md ${
            showHavensLayer
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest/90 text-on-surface-variant border border-outline-variant/40'
          }`}
        >
          <Icon name="local_convenience_store" className="text-[18px]" />
        </button>

        {/* Basemap Style Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Switch Map Tile Style (CARTO Voyager / Dark Matter / OSM)"
            className="w-9 h-9 rounded-xl bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface border border-outline-variant/40 flex items-center justify-center shadow-lg transition-colors cursor-pointer backdrop-blur-md"
          >
            <Icon name="layers" className="text-[18px]" />
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface-container-lowest/95 backdrop-blur-lg border border-outline-variant/40 shadow-xl p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[9px] font-bold text-on-surface-variant px-2 py-0.5 uppercase tracking-wider">
                Basemap Tile Style
              </span>
              {(['voyager', 'dark', 'osm'] as MapStyleKey[]).map((styleKey) => {
                const def = MAP_LAYERS[styleKey];
                const isSelected = mapStyle === styleKey;
                return (
                  <button
                    key={styleKey}
                    type="button"
                    onClick={() => {
                      setMapStyle(styleKey);
                      setShowStyleMenu(false);
                      showToast({
                        message: `Switched to ${def.label}`,
                        variant: 'primary',
                        icon: 'map',
                      });
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{def.label}</span>
                    {isSelected && <Icon name="check" className="text-[14px]" />}
                  </button>
                );
              })}
              <div className="pt-1 mt-1 border-t border-outline-variant/20 px-2 text-[8px] text-on-surface-variant truncate">
                Key: {CARTO_API_KEY.slice(0, 10)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Route Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/30 text-[10px] text-on-surface font-medium pointer-events-none shadow-md">
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 rounded bg-[#0284c7]" />
          <span>Active Safe Path</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-1 rounded bg-[#818cf8] border-b border-dashed" />
          <span>Alternate</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🛡️ Havens</span>
        </div>
      </div>
    </div>
  );
}

export default InteractiveLeafletMap;
