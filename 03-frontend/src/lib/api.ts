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
    // Sesión expirada → limpiar y recargar al login.
    localStorage.removeItem('gdb_token')
    localStorage.removeItem('gdb_usuario')
    window.location.reload()
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en ${path}`)
  }
  return (await res.json()) as T
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
