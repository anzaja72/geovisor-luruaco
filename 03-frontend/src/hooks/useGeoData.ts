import { useEffect, useMemo, useState } from 'react'
import {
  fetchCapas,
  fetchCoberturas,
  fetchEstratos,
  fetchLotes,
  fetchMalezas,
  fetchPuntos,
  fetchResumen,
  fetchTecnicas,
  fetchValidacion,
  fetchZonas,
} from '../lib/api'
import { periodosDe, resumenLocal } from '../lib/aggregate'
import type { FeatureCollection, GeoFeature, Resumen } from '../lib/types'

export interface Tematicas {
  estratos: GeoFeature[]
  malezas: GeoFeature[]
  tecnicas: GeoFeature[]
  validacion: GeoFeature[]
}

interface GeoData {
  loading: boolean
  error: string | null
  zonas: GeoFeature[]
  lotes: GeoFeature[]
  puntos: GeoFeature[]
  capas: GeoFeature[]
  coberturas: GeoFeature[]
  tematicas: Tematicas
  features: GeoFeature[]
  periodos: string[]
  reload: () => void
}

/** Carga zonas y lotes en paralelo, tolerando que una de las dos falle. */
export function useGeoData(): GeoData {
  const [zonas, setZonas] = useState<GeoFeature[]>([])
  const [lotes, setLotes] = useState<GeoFeature[]>([])
  const [puntos, setPuntos] = useState<GeoFeature[]>([])
  const [capas, setCapas] = useState<GeoFeature[]>([])
  const [coberturas, setCoberturas] = useState<GeoFeature[]>([])
  const [tematicas, setTematicas] = useState<Tematicas>({
    estratos: [],
    malezas: [],
    tecnicas: [],
    validacion: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ac = new AbortController()
    const feats = (r: PromiseSettledResult<FeatureCollection>) =>
      r.status === 'fulfilled' ? (r.value.features ?? []) : []

    Promise.allSettled([
      fetchZonas(ac.signal),
      fetchLotes(ac.signal),
      fetchPuntos(ac.signal),
      fetchCapas(ac.signal),
      fetchCoberturas(ac.signal),
      fetchEstratos(ac.signal),
      fetchMalezas(ac.signal),
      fetchTecnicas(ac.signal),
      fetchValidacion(ac.signal),
    ])
      .then(([z, l, p, ca, co, es, ma, te, va]) => {
        if (ac.signal.aborted) return
        setZonas(feats(z))
        setLotes(feats(l))
        setPuntos(feats(p))
        setCapas(feats(ca))
        setCoberturas(feats(co))
        setTematicas({
          estratos: feats(es),
          malezas: feats(ma),
          tecnicas: feats(te),
          validacion: feats(va),
        })

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
  }, [tick])

  // "sitios" (zonas + lotes) alimentan KPIs/gráficas; puntos y capas son referencia.
  const features = useMemo(() => [...zonas, ...lotes], [zonas, lotes])
  const periodos = useMemo(() => periodosDe(features), [features])

  return {
    loading,
    error,
    zonas,
    lotes,
    puntos,
    capas,
    coberturas,
    tematicas,
    features,
    periodos,
    reload: () => setTick((t) => t + 1),
  }
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
