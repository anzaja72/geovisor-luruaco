// Índice de Calidad del Agua (ICA) del IDEAM, versión de seis variables.
//
// POR QUÉ ESTE Y NO EL ICAM
// El geovisor que se tomó de referencia es el ICAM del INVEMAR, que es el índice
// para aguas marinas y costeras. La ciénaga de Luruaco es agua dulce continental,
// así que el índice que corresponde es el ICA del IDEAM: misma estructura de cinco
// categorías y misma lectura, pero es el oficial para este caso.
//
// FUENTE
// IDEAM, «Hoja metodológica del indicador Índice de calidad del agua»,
// GCI-OE-F002 versión 03, 10/07/2025. Las ecuaciones de abajo son las de esa hoja,
// transcritas literalmente.
//
// Dos correcciones de transcripción sobre el PDF, ambas evidentes:
//   · El exponente del pH básico aparece como «-5187742»; es -0,5187742. Con el
//     valor del PDF el subíndice caería a cero en el primer decimal sobre 8, y el
//     propio documento fija 0,1 como piso solo por encima de pH 11.
//   · Con -0,5187742 la curva empalma en 1 justo en pH 8, que es como debe ser.

export type CategoriaICA = 'muy_malo' | 'malo' | 'regular' | 'aceptable' | 'bueno'

export interface MetaICA {
  key: CategoriaICA
  label: string
  /** Color oficial de la hoja metodológica (valores RGB de la tabla). */
  color: string
  /** Color de texto legible sobre `color`. */
  text: string
  /** Símbolo que el IDEAM asigna a cada categoría. */
  simbolo: string
  rango: string
}

/** Peor → mejor, como se lee la barra de calificación. */
export const ESCALA_ICA: MetaICA[] = [
  { key: 'muy_malo', label: 'MUY MALO', color: 'rgb(204,0,0)', text: '#ffffff', simbolo: 'Hexágono', rango: '0,00 – 0,25' },
  { key: 'malo', label: 'MALO', color: 'rgb(255,153,0)', text: '#3b2300', simbolo: 'Pentágono', rango: '0,26 – 0,50' },
  { key: 'regular', label: 'REGULAR', color: 'rgb(255,255,0)', text: '#3b3500', simbolo: 'Cuadrado', rango: '0,51 – 0,70' },
  { key: 'aceptable', label: 'ACEPTABLE', color: 'rgb(36,148,6)', text: '#ffffff', simbolo: 'Triángulo', rango: '0,71 – 0,90' },
  { key: 'bueno', label: 'BUENO', color: 'rgb(15,69,241)', text: '#ffffff', simbolo: 'Círculo', rango: '0,91 – 1,00' },
]

const SIN_DATO: MetaICA = {
  key: 'regular', label: 'SIN DATO', color: '#9aa3ad', text: '#1f2937', simbolo: '—', rango: '—',
}

/** Categoría de un valor de ICA (0–1). `null` o fuera de rango ⇒ «sin dato». */
export function categoriaICA(ica: number | null | undefined): MetaICA {
  if (ica == null || !Number.isFinite(ica)) return SIN_DATO
  if (ica <= 0.25) return ESCALA_ICA[0]
  if (ica <= 0.50) return ESCALA_ICA[1]
  if (ica <= 0.70) return ESCALA_ICA[2]
  if (ica <= 0.90) return ESCALA_ICA[3]
  return ESCALA_ICA[4]
}

// ---------------------------------------------------------------------------
// Oxígeno disuelto: de mg/L a porcentaje de saturación
// ---------------------------------------------------------------------------

/** Altitud de la ciénaga de Luruaco (m s. n. m.). Llanura costera del Atlántico:
 *  la corrección por presión queda por debajo del 0,2 %, muy dentro de la
 *  incertidumbre del laboratorio, pero se aplica y se declara. */
export const ALTITUD_LURUACO_M = 10

/** Oxígeno de saturación en agua dulce (mg/L) por Benson–Krause, la ecuación que
 *  recoge el Standard Methods 4500-O G. `tempC` en grados Celsius. */
export function oxigenoSaturacion(tempC: number, altitudM = ALTITUD_LURUACO_M): number {
  const T = tempC + 273.15
  const lnC =
    -139.34411 +
    1.575701e5 / T -
    6.642308e7 / T ** 2 +
    1.243800e10 / T ** 3 -
    8.621949e11 / T ** 4
  const cp = Math.exp(lnC)
  // Presión atmosférica relativa a la del nivel del mar, por altitud (atmósfera estándar).
  const presion = (1 - altitudM / 44307.69231) ** 5.25328
  return cp * presion
}

/** Porcentaje de saturación de oxígeno disuelto. Necesita el OD y la temperatura
 *  **de la misma muestra**; sin temperatura no se puede convertir y devuelve null. */
export function porcentajeSaturacion(odMgL: number | null, tempC: number | null): number | null {
  if (odMgL == null || tempC == null) return null
  const cp = oxigenoSaturacion(tempC)
  if (!(cp > 0)) return null
  return (odMgL / cp) * 100
}

// ---------------------------------------------------------------------------
// Subíndices — ecuaciones de la hoja metodológica
// ---------------------------------------------------------------------------

const acotar = (x: number) => Math.min(1, Math.max(0, x))

/** Oxígeno disuelto, a partir del porcentaje de saturación. La curva es simétrica
 *  alrededor del 100 %: tanto el déficit como la sobresaturación restan calidad. */
export function iOD(psod: number): number {
  return acotar(psod > 100 ? 1 - (0.01 * psod - 1) : 1 - (1 - 0.01 * psod))
}

/** Sólidos suspendidos totales (mg/L). */
export function iSST(sst: number): number {
  if (sst <= 4.5) return 1
  if (sst >= 320) return 0
  return acotar(1 - (-0.02 + 0.003 * sst))
}

/** Demanda química de oxígeno (mg/L). Escalonada, no continua. */
export function iDQO(dqo: number): number {
  if (dqo <= 20) return 0.91
  if (dqo <= 25) return 0.71
  if (dqo <= 40) return 0.51
  if (dqo <= 80) return 0.26
  return 0.125
}

/** Conductividad eléctrica (µS/cm). Llega a 0 alrededor de los 270 µS/cm: el
 *  índice está calibrado para corrientes superficiales, y en un cuerpo léntico
 *  costero esta variable suele salir en el piso. Es comportamiento esperado. */
export function iCE(ce: number): number {
  if (!(ce > 0)) return 0
  return acotar(1 - 10 ** (-3.26 + 1.34 * Math.log10(ce)))
}

/** pH (unidades). */
export function ipH(ph: number): number {
  if (ph < 4) return 0.1
  if (ph <= 7) return acotar(0.02628419 * Math.exp(ph * 0.520025))
  if (ph <= 8) return 1
  if (ph <= 11) return acotar(Math.exp((ph - 8) * -0.5187742))
  return 0.1
}

/** Relación nitrógeno total / fósforo total. Escalonada. */
export function iNTPT(relacion: number): number {
  if (relacion <= 5) return 0.15
  if (relacion <= 10) return 0.35
  if (relacion < 15) return 0.6
  if (relacion <= 20) return 0.8
  return 0.15
}

// ---------------------------------------------------------------------------
// Índice compuesto
// ---------------------------------------------------------------------------

/** Pesos de la hoja metodológica. Suman 1,00. */
export const PESOS_ICA = {
  od: 0.17,
  sst: 0.17,
  dqo: 0.17,
  ce: 0.17,
  ntpt: 0.17,
  ph: 0.15,
} as const

/** Lecturas de un punto y campaña, en las unidades que reporta el laboratorio. */
export interface LecturaICA {
  ph?: number | null
  temperatura?: number | null
  oxigenoDisuelto?: number | null // mg/L
  conductividad?: number | null // µS/cm
  dqo?: number | null // mg O2/L
  sst?: number | null // mg/L
  nitrogenoTotal?: number | null // mg N/L
  fosforoTotal?: number | null // mg P/L
}

export interface SubindiceCalculado {
  clave: keyof typeof PESOS_ICA
  nombre: string
  unidad: string
  /** Valor medido, ya en la unidad que exige el índice. */
  valor: number | null
  /** Cómo llegó el dato, para la ficha metodológica. */
  detalle?: string
  subindice: number | null
  peso: number
}

export interface ResultadoICA {
  /** Índice 0–1, o null si no alcanzan las variables. */
  ica: number | null
  categoria: MetaICA
  subindices: SubindiceCalculado[]
  /** Cuántas de las 6 variables se pudieron calcular. */
  disponibles: number
  /** Suma de los pesos disponibles, sobre 1,00. */
  cobertura: number
}

/**
 * Calcula el ICA de una lectura.
 *
 * Si falta alguna variable, el índice **no se calcula**: se informa cuántas hay y
 * qué cobertura de peso representan. Repartir el peso faltante entre las demás
 * inflaría el resultado y lo haría indefendible; es preferible decir que no alcanza.
 */
export function calcularICA(l: LecturaICA): ResultadoICA {
  const psod = porcentajeSaturacion(l.oxigenoDisuelto ?? null, l.temperatura ?? null)
  const relNtPt =
    l.nitrogenoTotal != null && l.fosforoTotal != null && l.fosforoTotal > 0
      ? l.nitrogenoTotal / l.fosforoTotal
      : null

  const subindices: SubindiceCalculado[] = [
    {
      clave: 'od', nombre: 'Oxígeno disuelto', unidad: '% saturación',
      valor: psod, subindice: psod == null ? null : iOD(psod), peso: PESOS_ICA.od,
      detalle: psod == null
        ? 'Requiere oxígeno disuelto y temperatura de la misma muestra'
        : `Calculado desde ${l.oxigenoDisuelto} mg/L a ${l.temperatura} ºC (Benson–Krause)`,
    },
    {
      clave: 'sst', nombre: 'Sólidos suspendidos totales', unidad: 'mg/L',
      valor: l.sst ?? null, subindice: l.sst == null ? null : iSST(l.sst), peso: PESOS_ICA.sst,
    },
    {
      clave: 'dqo', nombre: 'Demanda química de oxígeno', unidad: 'mg O₂/L',
      valor: l.dqo ?? null, subindice: l.dqo == null ? null : iDQO(l.dqo), peso: PESOS_ICA.dqo,
    },
    {
      clave: 'ce', nombre: 'Conductividad eléctrica', unidad: 'µS/cm',
      valor: l.conductividad ?? null,
      subindice: l.conductividad == null ? null : iCE(l.conductividad), peso: PESOS_ICA.ce,
    },
    {
      clave: 'ntpt', nombre: 'Nitrógeno total / Fósforo total', unidad: 'relación',
      valor: relNtPt, subindice: relNtPt == null ? null : iNTPT(relNtPt), peso: PESOS_ICA.ntpt,
      detalle: relNtPt == null
        ? 'Requiere nitrógeno total y fósforo total'
        : `${l.nitrogenoTotal} mg N/L ÷ ${l.fosforoTotal} mg P/L`,
    },
    {
      clave: 'ph', nombre: 'pH', unidad: 'unidades',
      valor: l.ph ?? null, subindice: l.ph == null ? null : ipH(l.ph), peso: PESOS_ICA.ph,
    },
  ]

  const conDato = subindices.filter((s) => s.subindice != null)
  const cobertura = conDato.reduce((a, s) => a + s.peso, 0)
  const ica =
    conDato.length === subindices.length
      ? conDato.reduce((a, s) => a + s.peso * (s.subindice as number), 0)
      : null

  return {
    ica,
    categoria: categoriaICA(ica),
    subindices,
    disponibles: conDato.length,
    cobertura,
  }
}

/** Formatea el índice como lo presenta el IDEAM: dos decimales con coma. */
export const fmtICA = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v) ? '—' : v.toLocaleString('es-CO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
