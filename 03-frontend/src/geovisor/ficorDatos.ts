// Arma lo que dibuja la pantalla de ficorremediación a partir de lo que devuelve
// la geodatabase. Antes estas estructuras eran constantes del navegador, de modo
// que la vista no leía la base y no habría mostrado las mediciones reales aunque
// existieran (migración 19).
//
// Los valores de demostración viven ahora en las tablas, marcados con
// `es_demostracion`. Si alguno de los que se muestran lo está, la pantalla lo
// advierte; cuando el laboratorio entregue resultados y se borren esas filas, el
// aviso desaparece solo.
import type { FicorMediciones } from '../lib/api'

export interface Campana { nombre: string; fecha: string }

/** Las ocho variables que el ICA del IDEAM necesita por punto y campaña. */
export interface Lectura {
  ph: number; temperatura: number; oxigenoDisuelto: number; conductividad: number
  dqo: number; sst: number; nitrogenoTotal: number; fosforoTotal: number
}

export interface DatosFicor {
  campanas: Campana[]
  puntos: string[]
  /** campaña → punto → lectura completa (solo los puntos con las ocho variables) */
  agua: Record<string, Record<string, Lectura>>
  /** campaña → variable → valor por punto, en el orden de `puntos` */
  sedimentos: Record<string, Record<string, (number | null)[]>>
  /** campaña → grupo → [riqueza, abundancia] */
  biota: Record<string, Record<string, [number, number]>>
  /** true si algo de lo que se muestra es siembra de demostración */
  demostracion: boolean
}

/** Nombre de la variable en la geodatabase → campo de `Lectura`. */
const CLAVE_AGUA: Record<string, keyof Lectura> = {
  'pH': 'ph',
  'Temperatura': 'temperatura',
  'Oxígeno disuelto': 'oxigenoDisuelto',
  'Conductividad': 'conductividad',
  'DQO': 'dqo',
  'SST': 'sst',
  'Nitrógeno total': 'nitrogenoTotal',
  'Fósforo total': 'fosforoTotal',
}

const VARIABLES = Object.keys(CLAVE_AGUA).length

export const FICOR_VACIO: DatosFicor = {
  campanas: [], puntos: [], agua: {}, sedimentos: {}, biota: {}, demostracion: false,
}

export function construirFicor(d: FicorMediciones): DatosFicor {
  const fechaDe = new Map<string, string>()   // campaña → fecha del muestreo
  const puntos = new Set<string>()
  let demostracion = false

  const anotar = (campana?: string, fecha?: string, demo?: boolean) => {
    if (campana && fecha && !fechaDe.has(campana)) fechaDe.set(campana, fecha)
    if (demo) demostracion = true
  }

  // Agua: se agrupa por campaña y punto, y solo se acepta la lectura completa.
  // Con una variable de menos el ICA no se puede calcular, y media nota es peor
  // que ninguna: ese punto queda fuera en vez de calificado a medias.
  const parcial: Record<string, Record<string, Partial<Lectura>>> = {}
  for (const m of d.agua ?? []) {
    anotar(m.campana, m.fecha, m.es_demostracion)
    const clave = CLAVE_AGUA[m.variable ?? '']
    if (!clave || !m.campana || !m.punto || m.sin_valor || m.valor == null) continue
    puntos.add(m.punto)
    ;(parcial[m.campana] ??= {})[m.punto] ??= {}
    parcial[m.campana][m.punto][clave] = m.valor
  }
  const agua: DatosFicor['agua'] = {}
  for (const [campana, porPunto] of Object.entries(parcial)) {
    for (const [punto, lectura] of Object.entries(porPunto)) {
      if (Object.keys(lectura).length === VARIABLES) (agua[campana] ??= {})[punto] = lectura as Lectura
    }
  }

  const sedimentos: DatosFicor['sedimentos'] = {}
  const sedCrudo: Record<string, Record<string, Record<string, number | null>>> = {}
  for (const m of d.sedimentos ?? []) {
    anotar(m.campana, m.fecha, m.es_demostracion)
    if (!m.campana || !m.variable || !m.punto) continue
    puntos.add(m.punto)
    ;((sedCrudo[m.campana] ??= {})[m.variable] ??= {})[m.punto] = m.sin_valor ? null : (m.valor ?? null)
  }

  const biota: DatosFicor['biota'] = {}
  for (const m of d.biota ?? []) {
    anotar(m.campana, m.fecha, m.es_demostracion)
    if (!m.campana || !m.grupo) continue
    ;(biota[m.campana] ??= {})[m.grupo] = [m.riqueza ?? 0, m.abundancia ?? 0]
  }

  // El orden de los puntos manda: las tablas de sedimentos son columnas por punto.
  const orden = [...puntos].sort()
  for (const [campana, porVariable] of Object.entries(sedCrudo)) {
    for (const [variable, porPunto] of Object.entries(porVariable)) {
      (sedimentos[campana] ??= {})[variable] = orden.map((p) => porPunto[p] ?? null)
    }
  }

  const campanas = [...fechaDe.entries()]
    .map(([nombre, fecha]) => ({ nombre, fecha }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  return { campanas, puntos: orden, agua, sedimentos, biota, demostracion }
}
