import { useCallback, useMemo, useState } from 'react'
import './styles/dashboard.css'
import BrandHeader from './components/BrandHeader'
import NavTabs from './components/NavTabs'
import SubHeader from './components/SubHeader'
import DepartmentSidebar from './components/DepartmentSidebar'
import FiltersPanel from './components/FiltersPanel'
import MetricsPanel from './components/MetricsPanel'
import DonutChart from './components/DonutChart'
import BarsChart from './components/BarsChart'
import MapView from './components/MapView'
import Footer from './components/Footer'
import { useGeoData, useResumen } from './hooks/useGeoData'
import { resumenLocal } from './lib/aggregate'
import { ESCALA } from './lib/quality'
import type { Categoria, GeoFeature } from './lib/types'

const PERIODO_DEFAULT = '2024-2'

export default function App() {
  const { loading, error, zonas, lotes, puntos, features, periodos } = useGeoData()
  const [periodoSel, setPeriodoSel] = useState<string | null>(null)
  const [selected, setSelected] = useState<GeoFeature | null>(null)
  const [mapTab, setMapTab] = useState<'mapa' | 'historico'>('mapa')
  const [catSel, setCatSel] = useState<Set<Categoria>>(new Set())
  const [tipoSel, setTipoSel] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const periodo = periodoSel ?? periodos[0] ?? PERIODO_DEFAULT

  const enPeriodo = useCallback(
    (f: GeoFeature) => !f.properties.periodo || f.properties.periodo === periodo,
    [periodo],
  )
  const matchFiltros = useCallback(
    (f: GeoFeature) => {
      const cat = f.properties.categoria_calidad
      const tipo = f.properties.tipo_ecosistema
      const okCat = catSel.size === 0 || (cat != null && catSel.has(cat))
      const okTipo = tipoSel.size === 0 || (tipo != null && tipoSel.has(tipo))
      return okCat && okTipo
    },
    [catSel, tipoSel],
  )

  // Sitios filtrados (periodo + categoría + tipo).
  const fZonas = useMemo(
    () => zonas.filter((f) => enPeriodo(f) && matchFiltros(f)),
    [zonas, enPeriodo, matchFiltros],
  )
  const fLotes = useMemo(
    () => lotes.filter((f) => enPeriodo(f) && matchFiltros(f)),
    [lotes, enPeriodo, matchFiltros],
  )
  const fFeatures = useMemo(() => [...fZonas, ...fLotes], [fZonas, fLotes])

  // Opciones de filtro disponibles (según el periodo actual).
  const periodFeatures = useMemo(() => features.filter(enPeriodo), [features, enPeriodo])
  const categoriasDisponibles = useMemo<Categoria[]>(() => {
    const presentes = new Set(
      periodFeatures.map((f) => f.properties.categoria_calidad).filter(Boolean),
    )
    return ESCALA.filter((c) => presentes.has(c.key)).map((c) => c.key)
  }, [periodFeatures])
  const tiposDisponibles = useMemo(
    () =>
      Array.from(
        new Set(periodFeatures.map((f) => f.properties.tipo_ecosistema).filter(Boolean)),
      ).sort() as string[],
    [periodFeatures],
  )

  // Resumen: con filtros activos se calcula localmente sobre el set filtrado;
  // sin filtros se usa el del backend.
  const filtrosActivos = catSel.size > 0 || tipoSel.size > 0
  const backendResumen = useResumen(features, periodo)
  const localResumen = useMemo(() => resumenLocal(fFeatures, periodo), [fFeatures, periodo])
  const resumen = filtrosActivos ? localResumen : backendResumen

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set)
    if (n.has(v)) n.delete(v)
    else n.add(v)
    return n
  }
  const clearFilters = () => {
    setCatSel(new Set())
    setTipoSel(new Set())
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="spinner" />
        <h2>Cargando geovisor…</h2>
        <p>Conectando con el servidor de datos espaciales.</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <BrandHeader />
      <NavTabs active="Escala departamental" />
      <SubHeader periodo={periodo} periodos={periodos} onPeriodoChange={setPeriodoSel} />

      {error && (
        <div className="banner-warn">
          ⚠️ No se pudo conectar con la API ({error}). Mostrando lo disponible; las
          gráficas usan cálculo local si hay datos.
        </div>
      )}

      <div className="dash-body">
        <DepartmentSidebar
          features={fFeatures}
          selected={selected}
          onSelect={setSelected}
          query={query}
          onQuery={setQuery}
          filters={
            <FiltersPanel
              categoriasDisponibles={categoriasDisponibles}
              tiposDisponibles={tiposDisponibles}
              catSel={catSel}
              tipoSel={tipoSel}
              onToggleCat={(c) => setCatSel((s) => toggle(s, c))}
              onToggleTipo={(t) => setTipoSel((s) => toggle(s, t))}
              onClear={clearFilters}
            />
          }
        />

        <main className="center">
          <MetricsPanel resumen={resumen} />
          <div className="map-wrap">
            {mapTab === 'mapa' ? (
              <MapView
                zonas={fZonas}
                lotes={fLotes}
                puntos={puntos}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <div className="historico-placeholder">
                <p>Histórico departamental</p>
                <small>Vista de evolución por periodo (próximamente).</small>
              </div>
            )}
            <div className="map-tabs">
              <button
                className={mapTab === 'mapa' ? 'active' : ''}
                onClick={() => setMapTab('mapa')}
              >
                Mapa y características del muestreo
              </button>
              <button
                className={mapTab === 'historico' ? 'active' : ''}
                onClick={() => setMapTab('historico')}
              >
                Histórico departamental
              </button>
            </div>
          </div>
        </main>

        <aside className="right-panels">
          <section className="panel">
            <h4>Proporción de sitios por categoría de calidad</h4>
            <DonutChart categorias={resumen.categorias} />
          </section>
          <section className="panel">
            <h4>Cantidad de sitios</h4>
            <BarsChart categorias={resumen.categorias} />
          </section>
        </aside>
      </div>

      <Footer />
    </div>
  )
}
