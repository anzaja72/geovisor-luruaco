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

// Catálogo de técnicas / HMP. Las claves son slugs (ver `slug`): cubren tanto los
// valores normalizados del campo `tecnica` como el nombre de la HMP que trae la capa
// en sus atributos (p. ej. «Sistema agroforestal», «Nucleos de vegetacion»).
export const TECNICA: Record<string, { color: string; label: string }> = {
  revegetalizacion: { color: '#16a34a', label: 'Revegetalización' },
  bioaumentacion: { color: '#2563eb', label: 'Bioaumentación' },
  siembra: { color: '#0d9488', label: 'Siembra' },
  control_malezas: { color: '#f59e0b', label: 'Control de malezas' },
  recuperacion_suelo: { color: '#b45309', label: 'Recuperación de suelo' },
  restauracion_pasiva: { color: '#7c3aed', label: 'Restauración pasiva' },
  restauracion_activa: { color: '#16a34a', label: 'Restauración activa' },
  // HMP aplicadas en el predio (nombres tal como vienen en la tabla de atributos)
  sistema_agroforestal: { color: '#0d9488', label: 'Sistema agroforestal' },
  nucleos_de_vegetacion: { color: '#65a30d', label: 'Núcleos de vegetación' },
  franjas_de_restauracion: { color: '#0891b2', label: 'Franjas de restauración' },
  enriquecimiento: { color: '#4d7c0f', label: 'Enriquecimiento' },
  cercas_vivas: { color: '#a16207', label: 'Cercas vivas' },
  aislamiento: { color: '#dc2626', label: 'Aislamiento' },
}

/** Clave normalizada: minúsculas, sin tildes y con «_» entre palabras. */
export const slug = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/**
 * Nombre, tipo y color de un polígono de la capa «Técnicas aplicadas».
 * El nombre de la HMP viaja en `descripcion` (atributo de la capa); `tecnica`
 * guarda el tipo de restauración (activa / pasiva).
 */
export function tecnicaMeta(p: Record<string, unknown>) {
  const crudoNombre = String(p.hmp ?? p.nombre ?? p.descripcion ?? '').trim()
  const crudoTipo = String(p.tecnica ?? '').trim()
  const catNombre = TECNICA[slug(crudoNombre)]
  const catTipo = TECNICA[slug(crudoTipo)]
  const nombre = catNombre?.label ?? (crudoNombre ? cap(crudoNombre) : catTipo?.label ?? 'Técnica de restauración')
  const tipo = catTipo?.label ?? (crudoTipo ? cap(crudoTipo) : '')
  return { nombre, tipo, color: catNombre?.color ?? catTipo?.color ?? '#0d9488' }
}

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

export function cap(s: string): string {
  return s.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
}
