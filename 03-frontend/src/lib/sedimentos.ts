// Calificación de calidad de sedimentos.
//
// Colombia no tiene norma propia de calidad de sedimentos, así que se adopta la
// referencia de uso más extendido: las guías del CCME canadiense para sedimento
// de agua dulce, que definen dos umbrales por sustancia:
//
//   ISQG  Interim Sediment Quality Guideline — por debajo, los efectos adversos
//         sobre la biota bentónica son poco probables.
//   PEL   Probable Effect Level — por encima, los efectos adversos son frecuentes.
//
// Entre ambos hay una franja de efectos ocasionales. Es la misma lógica de tres
// niveles que usan la mayoría de autoridades ambientales sin norma nacional.
//
// PENDIENTE DE VALIDACIÓN: la elección de esta guía la debe ratificar Darío. Los
// valores viven aquí, en un solo sitio, justamente para que cambiar de referencia
// sea editar una tabla y no tocar la pantalla.
//
// Los plaguicidas no tienen guía de sedimento publicada en el CCME. Se reporta el
// valor medido sin calificar, que es más honesto que inventar un umbral.

export type NivelSedimento = 'bajo' | 'ocasional' | 'frecuente' | 'sin_guia'

export interface MetaSedimento {
  key: NivelSedimento
  label: string
  descripcion: string
  color: string
  text: string
}

export const NIVELES_SEDIMENTO: Record<NivelSedimento, MetaSedimento> = {
  bajo: {
    key: 'bajo', label: 'BAJO', color: 'rgb(36,148,6)', text: '#ffffff',
    descripcion: 'Por debajo del ISQG · efectos adversos poco probables',
  },
  ocasional: {
    key: 'ocasional', label: 'OCASIONAL', color: 'rgb(255,255,0)', text: '#3b3500',
    descripcion: 'Entre el ISQG y el PEL · efectos adversos ocasionales',
  },
  frecuente: {
    key: 'frecuente', label: 'FRECUENTE', color: 'rgb(204,0,0)', text: '#ffffff',
    descripcion: 'Por encima del PEL · efectos adversos frecuentes',
  },
  sin_guia: {
    key: 'sin_guia', label: 'SIN GUÍA', color: '#9aa3ad', text: '#1f2937',
    descripcion: 'No hay guía de calidad de sedimento publicada para esta sustancia',
  },
}

export interface GuiaSedimento {
  variable: string
  nombre: string
  categoria: 'metal_pesado' | 'plaguicida'
  unidad: string
  isqg?: number
  pel?: number
}

/** Metales: valores del CCME para sedimento de agua dulce (mg/kg peso seco). */
export const GUIAS_SEDIMENTO: GuiaSedimento[] = [
  { variable: 'Hg', nombre: 'Mercurio', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 0.17, pel: 0.486 },
  { variable: 'Pb', nombre: 'Plomo', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 35.0, pel: 91.3 },
  { variable: 'Cu', nombre: 'Cobre', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 35.7, pel: 197 },
  { variable: 'Zn', nombre: 'Zinc', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 123, pel: 315 },
  { variable: 'As', nombre: 'Arsénico', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 5.9, pel: 17.0 },
  { variable: 'Cd', nombre: 'Cadmio', categoria: 'metal_pesado', unidad: 'mg/kg', isqg: 0.6, pel: 3.5 },
  { variable: 'Clorpirifos', nombre: 'Clorpirifos', categoria: 'plaguicida', unidad: 'mg/kg' },
  { variable: 'Malatión', nombre: 'Malatión', categoria: 'plaguicida', unidad: 'mg/kg' },
  { variable: 'Paratión', nombre: 'Paratión', categoria: 'plaguicida', unidad: 'mg/kg' },
  { variable: 'Profenofos', nombre: 'Profenofos', categoria: 'plaguicida', unidad: 'mg/kg' },
]

export const guiaDe = (variable: string) => GUIAS_SEDIMENTO.find((g) => g.variable === variable)

/** Nivel de una concentración contra su guía. Sin guía o sin dato ⇒ «sin guía». */
export function nivelSedimento(variable: string, valor: number | null | undefined): MetaSedimento {
  const g = guiaDe(variable)
  if (valor == null || !g || g.isqg == null || g.pel == null) return NIVELES_SEDIMENTO.sin_guia
  if (valor <= g.isqg) return NIVELES_SEDIMENTO.bajo
  if (valor <= g.pel) return NIVELES_SEDIMENTO.ocasional
  return NIVELES_SEDIMENTO.frecuente
}
