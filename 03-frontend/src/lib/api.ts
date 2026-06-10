import type { FeatureCollection, Resumen } from './types'

// Vacío = mismo origen (en dev pega al server de Vite, que sirve el mock de /api/*).
// Define VITE_API_URL para apuntar al backend Go real.
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const TIMEOUT_MS = 6000

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  // Combina la señal externa con un timeout para no colgarse si la API no responde.
  const signals = [AbortSignal.timeout(TIMEOUT_MS)]
  if (signal) signals.push(signal)
  const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.any(signals) })
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
