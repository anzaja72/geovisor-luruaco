import { useEffect, useMemo, useState } from 'react'
import { fetchLotes, fetchPuntos, fetchResumen, fetchZonas } from '../lib/api'
import { periodosDe, resumenLocal } from '../lib/aggregate'
import type { FeatureCollection, GeoFeature, Resumen } from '../lib/types'

interface GeoData {
  loading: boolean
  error: string | null
  zonas: GeoFeature[]
  lotes: GeoFeature[]
  puntos: GeoFeature[]
  features: GeoFeature[]
  periodos: string[]
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

/** Carga zonas y lotes en paralelo, tolerando que una de las dos falle. */
export function useGeoData(): GeoData {
  const [zonas, setZonas] = useState<GeoFeature[]>([])
  const [lotes, setLotes] = useState<GeoFeature[]>([])
  const [puntos, setPuntos] = useState<GeoFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()

    Promise.allSettled([
      fetchZonas(ac.signal),
      fetchLotes(ac.signal),
      fetchPuntos(ac.signal),
    ])
      .then(([z, l, p]) => {
        if (ac.signal.aborted) return
        const okZ = z.status === 'fulfilled' ? z.value : EMPTY
        const okL = l.status === 'fulfilled' ? l.value : EMPTY
        const okP = p.status === 'fulfilled' ? p.value : EMPTY
        setZonas(okZ.features ?? [])
        setLotes(okL.features ?? [])
        setPuntos(okP.features ?? [])

        if (z.status === 'rejected' && l.status === 'rejected') {
          setError(
            z.reason instanceof Error ? z.reason.message : 'No se pudo conectar con la API',
          )
        } else {
          setError(null)
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })

    return () => ac.abort()
  }, [])

  // "sitios" (zonas + lotes) alimentan KPIs/gráficas; los puntos son referencia.
  const features = useMemo(() => [...zonas, ...lotes], [zonas, lotes])
  const periodos = useMemo(() => periodosDe(features), [features])

  return { loading, error, zonas, lotes, puntos, features, periodos }
}

/**
 * Obtiene el resumen del periodo. Intenta el endpoint /api/resumen y, si falla,
 * cae a un cálculo local con las features ya cargadas.
 */
export function useResumen(features: GeoFeature[], periodo: string): Resumen {
  const local = useMemo(() => resumenLocal(features, periodo), [features, periodo])
  const [resumen, setResumen] = useState<Resumen>(local)

  useEffect(() => {
    const ac = new AbortController()
    fetchResumen(periodo, ac.signal)
      .then((r) => {
        if (!ac.signal.aborted && r && r.categorias?.length) setResumen(r)
        else if (!ac.signal.aborted) setResumen(local)
      })
      .catch(() => {
        if (!ac.signal.aborted) setResumen(local)
      })
    return () => ac.abort()
  }, [periodo, local])

  return resumen
}
