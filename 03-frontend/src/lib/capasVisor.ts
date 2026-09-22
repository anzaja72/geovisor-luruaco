import type { ComponenteGeovisor } from '../components/MapView'

// Capas importadas (capas_geograficas) que dibuja cada componente del geovisor.
// "aislamiento_interno" es de Restauración y "maleza_acuatica" de Vegetación acuática.
// curvas_nivel no está en ninguno: satura el mapa y pesa 6,6 MB.
export const CAPAS_POR_COMPONENTE: Record<ComponenteGeovisor, string[]> = {
  restauracion: ['aislamiento_interno'],
  maleza: ['maleza_acuatica'],
  ficorremediacion: [],
  // Cámaras trampa y transectos: la API solo las entrega a técnico y administrador.
  fauna: ['fauna_aves_camaras', 'herpetos'],
}

// Lo único que el visor pide al servidor. Una capa que no figure arriba no se descarga.
export const CAPAS_VISOR = [...new Set(Object.values(CAPAS_POR_COMPONENTE).flat())]
