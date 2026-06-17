// Estilos (color + etiqueta) de las capas temáticas de restauración.

export const ESTRATO = {
  arboreo: { color: '#1a7431', label: 'Arbóreo' },
  arbustivo: { color: '#7cb342', label: 'Arbustivo' },
  herbaceo: { color: '#cddc39', label: 'Herbáceo' },
} as const

export const MALEZA_ESTADO = {
  requiere_control: { color: '#dc2626', label: 'Requiere control' },
  en_control: { color: '#f59e0b', label: 'En control' },
  controlada: { color: '#16a34a', label: 'Controlada' },
  monitoreo: { color: '#6b7280', label: 'En monitoreo' },
} as const

export const TECNICA = {
  revegetalizacion: { color: '#16a34a', label: 'Revegetalización' },
  bioaumentacion: { color: '#2563eb', label: 'Bioaumentación' },
  siembra: { color: '#0d9488', label: 'Siembra' },
  control_malezas: { color: '#f59e0b', label: 'Control de malezas' },
  recuperacion_suelo: { color: '#b45309', label: 'Recuperación de suelo' },
  restauracion_pasiva: { color: '#7c3aed', label: 'Restauración pasiva' },
} as const

// Homologación temática de coberturas (provisional, por confirmar con el consultor).
export const COBERTURA_TEMATICA: Record<string, string> = {
  'Vegetación densa': '#1a7431',
  'Vegetación arbustiva': '#7cb342',
  'Vegetación abierta / pastos': '#cddc39',
  'Suelo desnudo': '#b45309',
  'Cuerpo de agua': '#2b83ba',
  'Otras coberturas': '#9aa3ad',
}

export function colorCumplimiento(pct?: number): string {
  if (pct == null) return '#6b7280'
  if (pct >= 100) return '#16a34a'
  if (pct >= 80) return '#f59e0b'
  return '#dc2626'
}

export const cap = (s: string) =>
  s.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
