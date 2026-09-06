// Identidad visual institucional — Corporación Autónoma Regional del Atlántico.
// Fuente: Manual de Identidad Visual de la C.R.A. (ajustado a la Ley 2345 de 2023).
// Los mismos valores están declarados como variables CSS en styles/geovisor.css;
// este módulo existe para el color que se calcula en TypeScript (gráficas y mapas).

/** Colores de marca, tal como los define el manual. */
export const CRA = {
  azul: '#005F96',   // Pantone 7691 C · CMYK 100/43/0/30 · RGB 0 98 152
  cian: '#00B5D9',   // Pantone 638 C  · CMYK 86/0/9/0    · RGB 0 175 215
  verde: '#8FD400',  // Pantone 375 C  · CMYK 46/0/90/0   · RGB 151 215 0
  ambar: '#EDB512',  // Pantone 7408   · CMYK 0/29/100/0  · RGB 246 190 0
  gris: '#969491',   //                  CMYK 0/0/0/50    · RGB 157 157 156
} as const

/** Variantes oscurecidas del mismo matiz, para texto y trazos sobre fondo claro:
 *  el verde y el ámbar de marca no alcanzan contraste AA como tipografía. */
export const CRA_TEXTO = {
  verde: '#4d7a00',
  ambar: '#8a6a00',
  cian: '#00738c',
} as const

/**
 * Paleta categórica para series de datos (abundancia por especie, actividades
 * por tipo…). Alterna los cuatro colores de marca con variantes propias para
 * que series contiguas se distingan sin salirse de la identidad.
 */
export const PALETA_CRA: string[] = [
  CRA.azul,
  CRA.verde,
  CRA.cian,
  CRA.ambar,
  '#0d7ab8', // azul claro
  CRA_TEXTO.verde,
  '#7ec5e0', // cian claro
  '#b98f0f', // ámbar oscuro
  CRA.gris,
]

/** Color de la serie i, repitiendo la paleta cuando hay más series que colores. */
export const colorSerie = (i: number) => PALETA_CRA[i % PALETA_CRA.length]
