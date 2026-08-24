import type { FeatureCollection, Resumen } from './types'

// Vacío = mismo origen (en dev pega al server de Vite, que sirve el mock de /api/*).
// Define VITE_API_URL para apuntar al backend Go real.
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const TIMEOUT_MS = 6000

/** Cabeceras con el JWT de la sesión (si existe). */
export function authHeaders(): Record<string, string> {
  const t = localStorage.getItem('gdb_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  // Combina la señal externa con un timeout para no colgarse si la API no responde.
  const signals = [AbortSignal.timeout(TIMEOUT_MS)]
  if (signal) signals.push(signal)
  const res = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.any(signals),
    headers: authHeaders(),
  })
  if (res.status === 401) {
    // Solo si había sesión activa (token expirado) limpiamos y recargamos al login.
    // Sin token, dejamos que el caller maneje el 401 (p. ej. fallback a datos locales).
    if (localStorage.getItem('gdb_token')) {
      localStorage.removeItem('gdb_token')
      localStorage.removeItem('gdb_usuario')
      window.location.reload()
    }
    throw new Error('No autorizado (401)')
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en ${path}`)
  }
  return (await res.json()) as T
}

export interface IndicadoresRestauracion {
  fecha: string
  riqueza: number
  densidad_ha: number
  area_basal_ha: number
  individuos: number
  fustes: number
  altura_media: number
  shannon: number
  activa_ha: number
  pasiva_ha: number
  area_total_ha: number
  parcelas: { codigo: string; individuos: number; riqueza: number; densidad_ha: number }[]
  abundancia: { nombre: string; n: number; pct: number }[]
  coberturas: { clase: string; ha: number; pct: number }[]
  sin_datos?: boolean
}

/** Indicadores del componente de Restauración calculados por el backend (censo + coberturas).
 *  `cobertura` (clave de clase: denso/secundaria/galeria/mosaico/desnuda) filtra el censo por
 *  cobertura vía arboles_monitoreo.cobertura; vacío o 'todas' = predio completo. */
export function fetchIndicadoresRestauracion(
  fecha = 'Linea base',
  cobertura?: string,
  signal?: AbortSignal,
): Promise<IndicadoresRestauracion> {
  const cob = cobertura && cobertura !== 'todas' ? `&cobertura=${encodeURIComponent(cobertura)}` : ''
  return getJSON<IndicadoresRestauracion>(
    `/api/restauracion/indicadores?fecha=${encodeURIComponent(fecha)}${cob}`,
    signal,
  )
}

export function fetchZonas(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/zonas', signal)
}

export function fetchLotes(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/lotes', signal)
}

export function fetchResumen(periodo: string, signal?: AbortSignal): Promise<Resumen> {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : ''
  return getJSON<Resumen>(`/api/resumen${q}`, signal)
}

export function fetchPuntos(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/puntos', signal)
}

export function fetchCapas(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/capas/geojson', signal)
}

export function fetchCoberturas(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/coberturas', signal)
}

export interface FaunaObservacion {
  id: number
  nombre_comun: string
  nombre_cientifico: string
  cobertura_vegetal: string
  n_individuos: number
  lugar_percha: string
  habito: string
  comportamiento: string
  fecha: string
  hora: string
  observacion: string
}

/** Observaciones de fauna registradas por el formulario (Monitoreo de Fauna). */
export function fetchFaunaObservaciones(signal?: AbortSignal): Promise<FaunaObservacion[]> {
  return getJSON<FaunaObservacion[]>('/api/fauna/observaciones', signal)
}

export function fetchEstratos(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/estratos', signal)
}
export function fetchMalezas(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/malezas', signal)
}
export function fetchTecnicas(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/tecnicas', signal)
}
export function fetchValidacion(signal?: AbortSignal): Promise<FeatureCollection> {
  return getJSON<FeatureCollection>('/api/validacion', signal)
}

export interface NuevoMonitoreo {
  estacion_id?: number
  fecha: string
  indicador: string
  valor?: number
  unidad?: string
  responsable?: string
  observaciones?: string
}

export interface NuevoPunto {
  nombre_punto?: string
  tipo_monitoreo?: string
  descripcion?: string
  longitud: number
  latitud: number
}

/** Crea un punto/observación por coordenadas GPS (roles administrador/técnico). */
export async function crearPunto(p: NuevoPunto): Promise<{ id: number; codigo_punto: string }> {
  const res = await fetch(`${API_URL}/api/puntos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(p),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as { id: number; codigo_punto: string }
}

/** Registra una medición de monitoreo (roles administrador/técnico). */
export async function crearMonitoreo(m: NuevoMonitoreo): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/api/monitoreos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(m),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as { id: number }
}

/** POST genérico autenticado (formulario "Registrar Monitoreo" por componente). */
export async function postForm(path: string, body: unknown): Promise<{ id?: number }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string })?.error || `HTTP ${res.status}`)
  return data as { id?: number }
}

export interface ImportResult {
  capa: string
  insertados: number
  errores: number
}

/** Importa un archivo (GeoJSON o CSV) a una capa. */
export async function importarArchivo(
  capa: string,
  formato: 'geojson' | 'csv',
  contenido: string,
  srid = 4326,
): Promise<ImportResult> {
  const path =
    formato === 'geojson'
      ? `/api/import/geojson?capa=${encodeURIComponent(capa)}`
      : `/api/import/csv?capa=${encodeURIComponent(capa)}&srid=${srid}`
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': formato === 'geojson' ? 'application/json' : 'text/csv',
      ...authHeaders(),
    },
    body: contenido,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as ImportResult
}
