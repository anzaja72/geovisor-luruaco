// Cálculo de resumen en el cliente (fallback cuando /api/resumen no responde).
import { ESCALA } from './quality'
import type { Categoria, GeoFeature, Resumen } from './types'

export function periodosDe(features: GeoFeature[]): string[] {
  const set = new Set<string>()
  for (const f of features) {
    if (f.properties.periodo) set.add(f.properties.periodo)
  }
  return Array.from(set).sort().reverse()
}

export function resumenLocal(features: GeoFeature[], periodo: string): Resumen {
  const sitios = periodo
    ? features.filter((f) => f.properties.periodo === periodo)
    : features

  const conteo = new Map<Categoria, number>()
  let reportados = 0
  for (const f of sitios) {
    const cat = f.properties.categoria_calidad
    if (cat) {
      conteo.set(cat, (conteo.get(cat) ?? 0) + 1)
      reportados++
    }
  }

  const categorias = ESCALA.filter((c) => (conteo.get(c.key) ?? 0) > 0).map((c) => {
    const cantidad = conteo.get(c.key) ?? 0
    return {
      categoria: c.key,
      cantidad,
      porcentaje: reportados > 0 ? (cantidad / reportados) * 100 : 0,
    }
  })

  return {
    periodo: periodo || 'todos',
    sitios_visitados: sitios.length,
    sitios_reportados: reportados,
    categorias,
  }
}
