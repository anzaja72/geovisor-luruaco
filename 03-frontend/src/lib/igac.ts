// Capas de referencia oficiales del IGAC (Colombia en Mapas) vía WMS.
// Se consumen como servicio; no se almacenan datos en el proyecto.
const BASE = 'https://mapas.igac.gov.co/server/services'

export interface IgacLayer {
  id: string
  nombre: string
  service: string
  layers: string
}

export const IGAC_WMS: IgacLayer[] = [
  { id: 'catastro', nombre: 'Catastro predial', service: 'Dato_Fundamental_Catastro', layers: '0,1,2,3,4' },
  { id: 'pendientes', nombre: 'Pendientes (30 m)', service: 'ordenamientoterritorial/pendientescolombia', layers: '0' },
  { id: 'agrologia', nombre: 'Agrología nacional', service: 'agrologia/actividadquimicanacional', layers: '0' },
]

export const wmsUrl = (service: string) => `${BASE}/${service}/MapServer/WMSServer`

export const IGAC_ATTRIBUTION = '© IGAC — Colombia en Mapas'
