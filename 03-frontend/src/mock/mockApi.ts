// Mock de API para desarrollo sin backend (lo consume el plugin de Vite).
// Genera "sitios" alrededor de Luruaco con una distribución de calidad
// equivalente a la del tablero ICAM de referencia.
import type { Connect } from 'vite'

type Cat = 'pesima' | 'inadecuada' | 'aceptable' | 'adecuada' | 'optima' | null

const CENTER = { lon: -75.12, lat: 10.61 }

function cuadro(lon: number, lat: number, d = 0.012) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d],
      ],
    ],
  }
}

// Distribución objetivo: 6 adecuada, 3 aceptable, 3 inadecuada, 2 sin reportar.
const PLAN: Cat[] = [
  'adecuada', 'adecuada', 'adecuada', 'adecuada', 'adecuada',
  'aceptable', 'aceptable', 'aceptable',
  'inadecuada', 'inadecuada', 'inadecuada',
  null, null,
]

const TIPOS = ['humedal', 'bosque_nativo', 'pradera', 'manglar', 'suelo_degradado']

function zonas() {
  const features = PLAN.map((cat, i) => {
    const ang = (i / PLAN.length) * Math.PI * 2
    const lon = CENTER.lon + Math.cos(ang) * 0.045
    const lat = CENTER.lat + Math.sin(ang) * 0.035
    return {
      type: 'Feature',
      geometry: cuadro(lon, lat),
      properties: {
        id: i + 1,
        nombre: `Zona de restauración ${i + 1}`,
        codigo_proyecto: `LUR-Z-${String(i + 1).padStart(3, '0')}`,
        tipo_ecosistema: TIPOS[i % TIPOS.length],
        estado_restauracion: 'en_progreso',
        area_hectareas: 8 + (i % 5) * 3.5,
        organizacion_responsable: 'Fundación ProNature',
        categoria_calidad: cat ?? undefined,
        periodo: '2024-2',
        descripcion: 'Sitio de muestreo del programa de restauración (datos demo).',
      },
    }
  })
  return { type: 'FeatureCollection', features }
}

// Coberturas Corine de muestra (datos demo) con TODOS los atributos, para probar en
// desarrollo el popup completo y el filtrado por el selector sin backend.
function coberturas() {
  const base = [
    { codigo_corine: '3.1.1', descripcion: 'Bosque denso bajo', clase_tematica: 'Vegetación densa', area_hectareas: 4.83, porcentaje: 10.06 },
    { codigo_corine: '3.2.3', descripcion: 'Vegetación secundaria baja', clase_tematica: 'Vegetación arbustiva', area_hectareas: 7.81, porcentaje: 16.27 },
    { codigo_corine: '3.1.4', descripcion: 'Bosque de galería', clase_tematica: 'Vegetación densa', area_hectareas: 1.46, porcentaje: 3.04 },
    { codigo_corine: '2.4.1', descripcion: 'Mosaico de cultivos', clase_tematica: 'Áreas agrícolas', area_hectareas: 4.32, porcentaje: 9.00 },
    { codigo_corine: '3.3.3', descripcion: 'Tierras desnudas', clase_tematica: 'Suelo desnudo', area_hectareas: 29.59, porcentaje: 61.63 },
  ]
  const features = base.map((b, i) => {
    const lon = -75.172 + (i - 2) * 0.006
    const lat = 10.606 + (i % 2 === 0 ? 0.004 : -0.004)
    return {
      type: 'Feature',
      geometry: cuadro(lon, lat, 0.0035),
      properties: { ...b, periodo: 'Línea base', fuente: 'Vuelo dron 2026-05 (datos demo)', estado: 'publicado' },
    }
  })
  return { type: 'FeatureCollection', features }
}

function lotes() {
  // Lote real de bioaumentación (LUR-BIO-001), categoría adecuada → completa 6.
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-75.14881428, 10.60541029],
              [-75.15338331, 10.61529649],
              [-75.16398015, 10.61338799],
              [-75.16090275, 10.59983979],
              [-75.15715751, 10.60780007],
              [-75.14881428, 10.60541029],
            ],
          ],
        },
        properties: {
          id: 1001,
          nombre: 'Lote Planta Bioaumentación',
          codigo_lote: 'LUR-BIO-001',
          tipo_ecosistema: 'bioaumentacion',
          tipo_intervencion: 'bioaumentacion',
          estado: 'activo',
          area_hectareas: 132.56,
          perimetro_metros: 4850,
          categoria_calidad: 'adecuada',
          periodo: '2024-2',
          descripcion: 'Planta de bioaumentación para la Ciénaga de Luruaco (datos demo).',
        },
      },
    ],
  }
}

function resumen() {
  const all = [...zonas().features, ...lotes().features]
  const reportadas = all.filter((f) => f.properties.categoria_calidad)
  const orden = ['pesima', 'inadecuada', 'aceptable', 'adecuada', 'optima']
  const conteo: Record<string, number> = {}
  for (const f of reportadas) {
    const c = f.properties.categoria_calidad as string
    conteo[c] = (conteo[c] ?? 0) + 1
  }
  const categorias = orden
    .filter((c) => conteo[c])
    .map((c) => ({
      categoria: c,
      cantidad: conteo[c],
      porcentaje: (conteo[c] / reportadas.length) * 100,
    }))
  return {
    periodo: '2024-2',
    sitios_visitados: all.length,
    sitios_reportados: reportadas.length,
    categorias,
  }
}

// Indicadores de Restauración (datos demo) por fecha y cobertura, para verificar en dev
// el dinamismo de los KPIs. 'Linea base' y 'Monitoreo 1' tienen datos; el resto sin_datos.
function indRestauracion(fecha: string, cob: string) {
  if (fecha !== 'Linea base' && fecha !== 'Monitoreo 1') return { fecha, sin_datos: true }
  const porCob: Record<string, { riqueza: number; individuos: number; fustes: number; densidad: number; ab: number; alt: number; sh: number; parc: [string, number][]; abund: [string, number][] }> = {
    denso: { riqueza: 8, individuos: 34, fustes: 70, densidad: 68, ab: 0.51, alt: 7.2, sh: 1.9, parc: [['BD1', 68], ['BD2', 52]], abund: [['Guácimo', 40], ['Roble', 30], ['Ceiba', 30]] },
    secundaria: { riqueza: 6, individuos: 18, fustes: 28, densidad: 36, ab: 0.18, alt: 4.1, sh: 1.4, parc: [['BR1', 36], ['BR2', 24]], abund: [['Matarratón', 55], ['Guácimo', 25], ['Roble', 20]] },
    galeria: { riqueza: 5, individuos: 12, fustes: 20, densidad: 24, ab: 0.22, alt: 6.0, sh: 1.2, parc: [['GA1', 24], ['GA2', 18]], abund: [['Caracolí', 60], ['Guadua', 40]] },
    mosaico: { riqueza: 2, individuos: 6, fustes: 9, densidad: 12, ab: 0.05, alt: 3.0, sh: 0.6, parc: [['CU1', 12], ['CU2', 8]], abund: [['Mango', 70], ['Cítrico', 30]] },
    desnuda: { riqueza: 1, individuos: 5, fustes: 9, densidad: 10, ab: 0.02, alt: 2.2, sh: 0.2, parc: [['TD1', 10], ['TD2', 6]], abund: [['Pasto', 90], ['Rastrojo', 10]] },
  }
  const full = { riqueza: 12, individuos: 75, fustes: 136, densidad: 50, ab: 0.30, alt: 5.5, sh: 1.81, parc: [['BD1', 68], ['BR1', 36], ['GA1', 24], ['CU1', 12], ['TD1', 10]] as [string, number][], abund: [['Guácimo', 35], ['Matarratón', 25], ['Roble', 15], ['Caracolí', 15], ['Mango', 10]] as [string, number][] }
  const src = cob ? porCob[cob] : full
  if (cob && !src) return { fecha, sin_datos: true }
  const k = fecha === 'Monitoreo 1' ? 1.1 : 1
  const r = (n: number) => Math.round(n * k)
  return {
    fecha,
    riqueza: src.riqueza,
    densidad_ha: r(src.densidad),
    area_basal_ha: src.ab,
    individuos: r(src.individuos),
    fustes: r(src.fustes),
    altura_media: src.alt,
    shannon: src.sh,
    activa_ha: 41.72,
    pasiva_ha: 6.28,
    area_total_ha: 48.01,
    parcelas: src.parc.map(([codigo, dens]) => ({ codigo, individuos: Math.round(dens / 10), riqueza: 3, densidad_ha: r(dens) })),
    abundancia: src.abund.map(([nombre, pct]) => ({ nombre, n: pct, pct })),
    coberturas: [
      { clase: 'Mosaico de cultivos', ha: 4.32, pct: 9.0 },
      { clase: 'Bosque denso bajo', ha: 4.83, pct: 10.06 },
      { clase: 'Bosque de galería', ha: 1.46, pct: 3.04 },
      { clase: 'Veg. secundaria baja', ha: 7.81, pct: 16.27 },
      { clase: 'Tierras desnudas', ha: 29.59, pct: 61.63 },
    ],
  }
}

/** Middleware de Vite que responde /api/* con datos de demostración. */
export const mockApiMiddleware: Connect.NextHandleFunction = (req, res, next) => {
  const url = (req.url || '').split('?')[0]
  let body: unknown
  if (url === '/api/auth/login') {
    // Modo demo sin backend: acepta cualquier credencial como administrador.
    body = {
      token: 'demo-token',
      usuario: { id: 0, nombre: 'Demo (sin backend)', email: 'demo@local', rol: 'administrador' },
    }
  } else if (url === '/api/auth/me') {
    body = { id: 0, nombre: 'Demo (sin backend)', email: 'demo@local', rol: 'administrador' }
  } else if (url === '/api/zonas') body = zonas()
  else if (url === '/api/lotes') body = lotes()
  else if (url === '/api/resumen') body = resumen()
  else if (url === '/api/puntos') body = { type: 'FeatureCollection', features: [] }
  else if (url === '/api/capas/geojson') body = { type: 'FeatureCollection', features: [] }
  else if (url === '/api/capas') body = { capas: [] }
  else if (url === '/api/coberturas') body = coberturas()
  else if (url === '/api/restauracion/indicadores') {
    const q = new URLSearchParams((req.url || '').split('?')[1] || '')
    body = indRestauracion(q.get('fecha') || 'Linea base', q.get('cobertura') || '')
  }
  else if (
    url === '/api/estratos' ||
    url === '/api/malezas' ||
    url === '/api/tecnicas' ||
    url === '/api/validacion'
  )
    body = { type: 'FeatureCollection', features: [] }
  else return next()

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
