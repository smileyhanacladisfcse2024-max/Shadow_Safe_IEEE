import L from 'leaflet';

/**
 * Official CARTO Basemaps API key provided for ShadowSafe 2.0.
 * Eliminates the "API key required" watermark and unlocks high-resolution raster tiles.
 */
export const CARTO_API_KEY: string =
  (import.meta.env.VITE_CARTO_API_KEY as string | undefined) ||
  'cb1_4485_1_ef9d8486df5fd583ce41f990';

export type MapStyleKey = 'voyager' | 'dark' | 'osm';

export interface MapLayerDefinition {
  id: MapStyleKey;
  label: string;
  badge: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains: string;
}

export const MAP_LAYERS: Record<MapStyleKey, MapLayerDefinition> = {
  voyager: {
    id: 'voyager',
    label: 'Voyager Street',
    badge: 'Real Street Map',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
    attribution:
      '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OSM</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  dark: {
    id: 'dark',
    label: 'Dark Matter',
    badge: 'Night Vision',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
    attribution:
      '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OSM</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    badge: 'Community',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
};

/**
 * Creates a Leaflet TileLayer instance for the chosen style with CARTO authentication.
 */
export function createMapTileLayer(styleKey: MapStyleKey = 'voyager'): L.TileLayer {
  const layerDef = MAP_LAYERS[styleKey] || MAP_LAYERS.voyager;
  return L.tileLayer(layerDef.url, {
    maxZoom: layerDef.maxZoom,
    subdomains: layerDef.subdomains,
    attribution: layerDef.attribution,
    crossOrigin: true,
  });
}
