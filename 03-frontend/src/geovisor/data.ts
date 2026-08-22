// Datos reales del proyecto Luruaco para el geovisor (censo arboles_resumen.xlsx,
// registros de limpieza y análisis de coberturas). Mientras el backend no sirva
// estos datos, viven aquí como única fuente para los tableros.

export const RESTAURACION = {
  // Indicadores Línea base (parcela = 0,1 ha → 1,5 ha muestreadas)
  riqueza: 12,
  densidad: 50, // ind/ha
  areaBasal: 0.30, // m²/ha
  activaHa: 41.72,
  pasivaHa: 6.28,
  individuos: 75,
  fustes: 136,
  alturaMedia: 5.5,
  shannon: 1.81,
  // Densidad por parcela (ind/ha) — solo BD1/BR1 tienen árboles en línea base
  parcelas: [
    ['BD1', 430], ['BR1', 320], ['CU1', 0], ['CU2', 0], ['CU3', 0],
    ['DD1', 0], ['DD2', 0], ['DD3', 0], ['DD4', 0], ['DD5', 0],
    ['DD6', 0], ['DD7', 0], ['VS1', 0], ['VS2', 0], ['VS3', 0],
  ] as [string, number][],
  // Abundancia por especie (% sobre 75 individuos identificados)
  abundancia: [
    ['Olleto', 37, '#1b6d24'], ['Guácimo', 28, '#2f8a45'], ['Tiribuche', 9, '#4f9e63'],
    ['Espina', 5, '#00585f'], ['Uvito', 5, '#1565c0'], ['Guayacán', 4, '#6f9e3a'],
    ['Guacamayo', 3, '#8a9e7a'], ['Manca perro', 3, '#7a8a93'], ['Otras (4)', 5, '#aab2bb'],
  ] as [string, number, string][],
  // Detalle de cobertura (CLC) — total 48,01 ha
  coberturas: [
    ['Mosaico de cultivos', '#e7c878', 4.32, 9.0],
    ['Bosque denso bajo', '#2f7d3a', 4.83, 10.06],
    ['Bosque de galería', '#7cc47f', 1.46, 3.04],
    ['Veg. secundaria baja', '#c0e39a', 7.81, 16.27],
    ['Tierras desnudas', '#bcbcbc', 29.59, 61.63],
  ] as [string, string, number, number][],
}

export const ACTIVA_TXT =
  'En total se realizó análisis de coberturas para un área total de 48 ha; sin embargo, para la ' +
  'implementación de las técnicas de restauración activa se priorizaron las coberturas de mosaico de ' +
  'cultivos, vegetación secundaria baja y tierras desnudas y degradadas, que corresponden principalmente ' +
  'a áreas transformadas o con predominio de vegetación secundaria y usos antrópicos, especialmente para ' +
  'agricultura, que corresponden a 41,72 ha.'

export const PASIVA_TXT =
  'En total se realizó análisis de coberturas para un área total de 48 ha. De estas, el bosque denso bajo ' +
  'de tierra firme y el bosque de galería y ripario representan cerca del 3 % (6,28 ha); son importantes ' +
  'reservorios de biodiversidad, fuentes potenciales de semillas y núcleos para la recuperación de la ' +
  'cobertura vegetal. Se destinaron a preservación y conservación mediante restauración pasiva, por medio ' +
  'de eliminación de tensionantes (tala, quemas, cultivos) y aislamiento con cerca de púas y cerca viva.'

// Maleza acuática: hectáreas removidas acumuladas por monitoreo (datos reales).
export const MALEZA = {
  acumulado: 19.0,
  serie: [['Mar', 6.06], ['Abr', 15.71], ['May', 19.0]] as [string, number][],
  poligonos: 5,
}

// Ficorremediación — variables a medir (Variables Calidad de aguas.xlsx /
// Variables Calidad de sedimentos.xlsx). Sin resultados aún: estructura lista
// para poblarse desde ficor_calidad_agua / ficor_calidad_sedimentos / ficor_biota.
export const FICOR_AGUA: [string, string][] = [
  ['pH', 'pH'],
  ['Oxígeno Disuelto', 'mg/L'],
  ['DBO5', 'mg O2/L'],
  ['Sólidos Suspendidos Totales', 'mg/L'],
  ['Fósforo Reactivo Disuelto', 'mg P-PO4/L'],
  ['Fósforo Total', 'mg P/L'],
  ['Nitritos', 'mg NO3-N/L'],
  ['Nitratos', 'mg NO3-N/L'],
  ['Nitrógeno Amoniacal', 'mg NH3-N/L'],
  ['Nitrógeno Total', 'mg N/L'],
  ['Clorofila A', 'mg/m3'],
  ['Temperatura', 'ºC'],
  ['Coliformes Totales', 'NMP/100 mL'],
  ['Coliformes Termotolerantes', 'NMP/100 mL'],
  ['Cianotoxinas', '—'],
]

export const FICOR_SEDIMENTOS: { categoria: string; variables: [string, string][] }[] = [
  { categoria: 'Metales pesados', variables: [
    ['Hg', 'mg/kg'], ['Pb', 'mg/kg'], ['Cu', 'mg/kg'],
    ['Zn', 'mg/kg'], ['As', 'mg/kg'], ['Cd', 'mg/kg'],
  ] },
  { categoria: 'Plaguicidas', variables: [
    ['Clorpirifos', 'mg/kg'], ['Malatión', 'mg/kg'],
    ['Paratión', 'mg/kg'], ['Profenofos', 'mg/kg'],
  ] },
]

export const FICOR_BIOTA: { id: string; nombre: string; icon: string }[] = [
  { id: 'fitoplancton', nombre: 'Fitoplancton', icon: 'droplet' },
  { id: 'zooplancton', nombre: 'Zooplancton', icon: 'droplet' },
  { id: 'ictioplancton', nombre: 'Ictioplancton', icon: 'droplet' },
  { id: 'macroinvertebrados_bentonicos', nombre: 'Macroinvertebrados bentónicos', icon: 'grid' },
  { id: 'perifiton', nombre: 'Perifiton', icon: 'leaf' },
  { id: 'ictiofauna', nombre: 'Ictiofauna', icon: 'waves' },
]

// Gobernanza ambiental: actividades de participación comunitaria (datos reales,
// COMPONENTE GOBERNAZA AMBIENTAL.xlsx). [actividad, cantidad, participantes, ubicación]
export const GOBERNANZA = {
  actividades: [
    ['Socializaciones', 3, 63, 'Biblioteca Luruaco'],
    ['Talleres acuerdo social', 2, 51, 'Biblioteca Luruaco'],
    ['Capacitaciones - cursos sostenibilidad y resiliencia climática', 3, 252, 'Casa de la Cultura Luruaco'],
    ['Jornadas de limpieza', 2, 48, 'Localización georreferenciada en la foto'],
    ['Recorrido guiado', 2, 55, 'Localización georreferenciada en la foto'],
    ['Negocios verdes', 5, 25, 'Casa de la Cultura Luruaco'],
    ['Talleres de sensibilización y ciudadanos ambientales', 1, 23, 'Institución Educativa Técnica Agropecuaria de Luruaco'],
  ] as [string, number, number, string][],
}

// Componentes (sidebar + transversal)
export type CompId = 'restauracion' | 'maleza' | 'ficorremediacion' | 'fauna' | 'gobernanza' | 'transversal' | 'reportes'
export const COMPONENTES: [CompId, string, string][] = [
  ['restauracion', 'Restauración Ecológica', 'sprout'],
  ['maleza', 'Vegetación Acuática', 'waves'],
  ['ficorremediacion', 'Ficorremediación', 'flask'],
  ['fauna', 'Monitoreo de Fauna', 'paw'],
  ['gobernanza', 'Gobernanza Ambiental', 'users'],
  ['transversal', 'Dashboard Transversal', 'grid'],
  ['reportes', 'Descarga de Datos', 'download'],
]
