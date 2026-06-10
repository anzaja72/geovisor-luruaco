// Escala de calificación de índice (estilo ICAM).
import type { Categoria } from './types'

export interface CategoriaMeta {
  key: Categoria
  label: string
  color: string
  text: string // color de texto legible sobre `color`
}

// Orden de peor → mejor (igual que la barra del ICAM).
export const ESCALA: CategoriaMeta[] = [
  { key: 'pesima', label: 'PÉSIMA', color: '#e8302a', text: '#ffffff' },
  { key: 'inadecuada', label: 'INADECUADA', color: '#f7941d', text: '#3b2300' },
  { key: 'aceptable', label: 'ACEPTABLE', color: '#f4e409', text: '#3b3500' },
  { key: 'adecuada', label: 'ADECUADA', color: '#7ac143', text: '#10330a' },
  { key: 'optima', label: 'ÓPTIMA', color: '#27aae1', text: '#022a3a' },
]

const BY_KEY: Record<Categoria, CategoriaMeta> = Object.fromEntries(
  ESCALA.map((c) => [c.key, c]),
) as Record<Categoria, CategoriaMeta>

const GRIS: CategoriaMeta = {
  key: 'aceptable',
  label: 'SIN DATO',
  color: '#9aa3ad',
  text: '#1f2937',
}

export function metaDe(cat?: Categoria | string | null): CategoriaMeta {
  if (cat && (cat as Categoria) in BY_KEY) return BY_KEY[cat as Categoria]
  return GRIS
}

export function colorDe(cat?: Categoria | string | null): string {
  return metaDe(cat).color
}

export function labelDe(cat?: Categoria | string | null): string {
  return metaDe(cat).label
}
