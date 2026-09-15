// DATOS DE DEMOSTRACIÓN — NO SON RESULTADOS DE LABORATORIO
//
// Darío confirmó el 14-sep-2026 que el laboratorio todavía no entrega resultados
// del muestreo 1, y que los valores de la matriz que compartió son de relleno.
// Este módulo existe para poder ver y revisar la pantalla mientras tanto.
//
// REGLAS QUE NO SE PUEDEN ROMPER
//   1. Nada de esto se escribe en la geodatabase. Vive solo en el navegador.
//   2. La vista muestra un aviso permanente mientras esté leyendo de aquí.
//   3. En cuanto /api/ficor/mediciones devuelva datos reales, estos se descartan.
//
// Los valores son plausibles para una ciénaga costera del Atlántico y están
// construidos para que se vea la progresión que buscaría el proyecto: de MALO en
// línea base a ACEPTABLE tras dos campañas de tratamiento.

export interface CampanaDemo { nombre: string; fecha: string }
export interface LecturaDemo {
  ph: number; temperatura: number; oxigenoDisuelto: number; conductividad: number
  dqo: number; sst: number; nitrogenoTotal: number; fosforoTotal: number
}

export const CAMPANAS_DEMO: CampanaDemo[] = [
  { nombre: 'Línea base', fecha: '2026-07-22' },
  { nombre: 'Muestreo 1', fecha: '2026-09-09' },
  { nombre: 'Muestreo 2', fecha: '2026-12-03' },
]

/** Códigos de los cinco puntos, en el orden de las columnas del laboratorio. */
export const PUNTOS_DEMO = ['FICO-1', 'FICO-2', 'FICO-3', 'FICO-4', 'FICO-5'] as const

/** Calidad de agua: campaña → punto → lectura. */
export const AGUA_DEMO: Record<string, Record<string, LecturaDemo>> = {
  'Línea base': {
    'FICO-1': { ph: 9.6, temperatura: 38.0, oxigenoDisuelto: 1.2, conductividad: 1200, dqo: 140, sst: 200, nitrogenoTotal: 0.3, fosforoTotal: 1.9 },
    'FICO-2': { ph: 8.96, temperatura: 36.8, oxigenoDisuelto: 5.4, conductividad: 910, dqo: 88, sst: 38, nitrogenoTotal: 0.52, fosforoTotal: 1.5 },
    'FICO-3': { ph: 8.8, temperatura: 35.9, oxigenoDisuelto: 5.9, conductividad: 840, dqo: 74, sst: 31, nitrogenoTotal: 1.9, fosforoTotal: 0.42 },
    'FICO-4': { ph: 9.05, temperatura: 37.1, oxigenoDisuelto: 5.1, conductividad: 950, dqo: 92, sst: 42, nitrogenoTotal: 0.46, fosforoTotal: 1.55 },
    'FICO-5': { ph: 8.88, temperatura: 36.2, oxigenoDisuelto: 5.7, conductividad: 880, dqo: 79, sst: 34, nitrogenoTotal: 1.6, fosforoTotal: 0.38 },
  },
  'Muestreo 1': {
    'FICO-1': { ph: 8.62, temperatura: 34.1, oxigenoDisuelto: 6.3, conductividad: 610, dqo: 54, sst: 17, nitrogenoTotal: 3.1, fosforoTotal: 0.44 },
    'FICO-2': { ph: 8.44, temperatura: 33.6, oxigenoDisuelto: 6.8, conductividad: 540, dqo: 43, sst: 12, nitrogenoTotal: 4.2, fosforoTotal: 0.4 },
    'FICO-3': { ph: 8.2, temperatura: 32.2, oxigenoDisuelto: 7.3, conductividad: 430, dqo: 33, sst: 8, nitrogenoTotal: 6.1, fosforoTotal: 0.52 },
    'FICO-4': { ph: 8.55, temperatura: 33.9, oxigenoDisuelto: 6.5, conductividad: 580, dqo: 48, sst: 15, nitrogenoTotal: 3.6, fosforoTotal: 0.46 },
    'FICO-5': { ph: 8.31, temperatura: 33.0, oxigenoDisuelto: 7.05, conductividad: 480, dqo: 38, sst: 10, nitrogenoTotal: 5.4, fosforoTotal: 0.48 },
  },
  'Muestreo 2': {
    'FICO-1': { ph: 8.05, temperatura: 31.4, oxigenoDisuelto: 7.4, conductividad: 300, dqo: 24, sst: 6, nitrogenoTotal: 8.8, fosforoTotal: 0.55 },
    'FICO-2': { ph: 7.9, temperatura: 30.8, oxigenoDisuelto: 7.7, conductividad: 255, dqo: 19, sst: 4, nitrogenoTotal: 11.5, fosforoTotal: 0.6 },
    'FICO-3': { ph: 7.7, temperatura: 30.1, oxigenoDisuelto: 7.95, conductividad: 190, dqo: 16, sst: 3, nitrogenoTotal: 16.2, fosforoTotal: 0.72 },
    'FICO-4': { ph: 7.98, temperatura: 31.0, oxigenoDisuelto: 7.55, conductividad: 270, dqo: 22, sst: 5, nitrogenoTotal: 9.9, fosforoTotal: 0.58 },
    'FICO-5': { ph: 7.8, temperatura: 30.4, oxigenoDisuelto: 7.85, conductividad: 215, dqo: 17, sst: 4, nitrogenoTotal: 13.4, fosforoTotal: 0.66 },
  },
}

/** Sedimentos: campaña → variable → valor por punto (mg/kg), en el orden de PUNTOS_DEMO. */
export const SEDIMENTOS_DEMO: Record<string, Record<string, number[]>> = {
  'Línea base': {
    'Hg': [0.62, 0.41, 0.22, 0.55, 0.31],
    'Pb': [110, 74, 38, 96, 52],
    'Cu': [214, 160, 49, 188, 88],
    'Zn': [352, 268, 131, 310, 175],
    'As': [19.4, 12.1, 6.2, 16.8, 8.4],
    'Cd': [4.1, 2.2, 0.71, 3.3, 1.4],
    'Clorpirifos': [0.084, 0.051, 0.019, 0.072, 0.03],
    'Malatión': [0.046, 0.028, 0.011, 0.039, 0.017],
    'Paratión': [0.031, 0.019, 0.008, 0.027, 0.012],
    'Profenofos': [0.058, 0.034, 0.014, 0.049, 0.021],
  },
  'Muestreo 1': {
    'Hg': [0.44, 0.29, 0.16, 0.39, 0.22],
    'Pb': [82, 55, 29, 71, 39],
    'Cu': [163, 118, 38, 142, 66],
    'Zn': [281, 211, 104, 246, 139],
    'As': [14.6, 9.1, 4.7, 12.6, 6.3],
    'Cd': [3.0, 1.6, 0.52, 2.4, 1.0],
    'Clorpirifos': [0.061, 0.037, 0.014, 0.052, 0.022],
    'Malatión': [0.033, 0.02, 0.008, 0.028, 0.012],
    'Paratión': [0.022, 0.014, 0.006, 0.019, 0.009],
    'Profenofos': [0.042, 0.024, 0.01, 0.035, 0.015],
  },
  'Muestreo 2': {
    'Hg': [0.28, 0.19, 0.11, 0.24, 0.14],
    'Pb': [51, 34, 19, 44, 25],
    'Cu': [98, 71, 25, 85, 42],
    'Zn': [196, 148, 76, 172, 99],
    'As': [9.2, 5.8, 3.1, 8.0, 4.1],
    'Cd': [1.8, 1.0, 0.34, 1.5, 0.64],
    'Clorpirifos': [0.034, 0.021, 0.009, 0.029, 0.013],
    'Malatión': [0.018, 0.011, 0.005, 0.015, 0.007],
    'Paratión': [0.012, 0.008, 0.004, 0.011, 0.005],
    'Profenofos': [0.023, 0.014, 0.006, 0.019, 0.009],
  },
}

/** Biota: campaña → grupo → [riqueza, abundancia]. */
export const BIOTA_DEMO: Record<string, Record<string, [number, number]>> = {
  'Línea base': {
    fitoplancton: [14, 2100],
    zooplancton: [9, 640],
    ictioplancton: [4, 85],
    macroinvertebrados_bentonicos: [11, 430],
    perifiton: [8, 310],
    ictiofauna: [6, 52],
  },
  'Muestreo 1': {
    fitoplancton: [21, 3450],
    zooplancton: [14, 1120],
    ictioplancton: [7, 164],
    macroinvertebrados_bentonicos: [17, 780],
    perifiton: [13, 595],
    ictiofauna: [9, 98],
  },
  'Muestreo 2': {
    fitoplancton: [29, 4820],
    zooplancton: [19, 1680],
    ictioplancton: [11, 247],
    macroinvertebrados_bentonicos: [24, 1190],
    perifiton: [18, 910],
    ictiofauna: [13, 141],
  },
}
