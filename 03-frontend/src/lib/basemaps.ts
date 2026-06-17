// Catálogo de mapas base (inspirado en Colombia en Mapas).
export interface BaseMap {
  id: string
  nombre: string
  url: string
  attribution: string
  maxZoom?: number
  subdomains?: string
}

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'

export const BASEMAPS: BaseMap[] = [
  { id: 'sat', nombre: 'Satelital (Esri)', url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attribution: '© Esri, Maxar', maxZoom: 19 },
  { id: 'topo', nombre: 'Topográfico (Esri)', url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, attribution: '© Esri', maxZoom: 19 },
  { id: 'terreno', nombre: 'Terreno (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '© OpenTopoMap (CC-BY-SA)', maxZoom: 17 },
  { id: 'oceano', nombre: 'Océano (Esri)', url: `${ESRI}/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`, attribution: '© Esri, GEBCO, NOAA', maxZoom: 13 },
  { id: 'calles', nombre: 'Calles (OSM)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '© OpenStreetMap', maxZoom: 19 },
  { id: 'oscuro', nombre: 'Lona negra (oscuro)', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', subdomains: 'abcd', attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 },
  { id: 'claro', nombre: 'Lona clara', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', subdomains: 'abcd', attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 },
]
