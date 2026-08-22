// Catálogo de mapas base (inspirado en Colombia en Mapas).
export interface BaseMap {
  id: string
  nombre: string
  url: string
  attribution: string
  maxZoom?: number
  maxNativeZoom?: number
  subdomains?: string
}

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'

// API key de ArcGIS Location Platform (opcional). Si se define VITE_ARCGIS_API_KEY, se
// añade la capa satelital de Esri como OPCIÓN (no por defecto), consumida por el endpoint
// tokenizado y restringida por dominio (referrer) en la consola de Esri. Sin key, Esri no
// aparece: el default es imagen libre (Sentinel-2), sin licencia de terceros.
const ARCGIS_KEY = import.meta.env.VITE_ARCGIS_API_KEY as string | undefined

export const BASEMAPS: BaseMap[] = [
  // Default: imagen satelital LIBRE (Copernicus/ESA, CC-BY). Sobre el predio manda la
  // ortofoto del dron; esta base solo da contexto regional. Nativo hasta z16 (10 m/px),
  // con sobre-zoom hasta 19 para que no quede en blanco al acercar fuera del predio.
  {
    id: 's2',
    nombre: 'Satelital (Sentinel-2, libre)',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
    attribution: '© EOX · Copernicus (ESA), CC-BY-4.0',
    maxNativeZoom: 16,
    maxZoom: 19,
  },
  { id: 'topo', nombre: 'Topográfico (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '© OpenTopoMap (CC-BY-SA)', maxZoom: 17 },
  { id: 'calles', nombre: 'Calles (OSM)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '© OpenStreetMap', maxZoom: 19 },
  { id: 'oscuro', nombre: 'Lona negra (oscuro)', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', subdomains: 'abcd', attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 },
  { id: 'claro', nombre: 'Lona clara', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', subdomains: 'abcd', attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 },
  { id: 'oceano', nombre: 'Océano (Esri)', url: `${ESRI}/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`, attribution: '© Esri, GEBCO, NOAA', maxZoom: 13 },
  // Opción satelital HD de Esri: solo si hay API key (uso licenciado dentro del cupo gratuito).
  ...(ARCGIS_KEY
    ? [
        {
          id: 'esri',
          nombre: 'Satelital HD (Esri, requiere token)',
          url: `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${ARCGIS_KEY}`,
          attribution: '© Esri, Maxar',
          maxZoom: 19,
        } as BaseMap,
      ]
    : []),
]
