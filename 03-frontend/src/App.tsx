import { useMemo, useState } from 'react'
import './styles/dashboard.css'
import BrandHeader from './components/BrandHeader'
import NavTabs from './components/NavTabs'
import SubHeader from './components/SubHeader'
import DepartmentSidebar from './components/DepartmentSidebar'
import MetricsPanel from './components/MetricsPanel'
import DonutChart from './components/DonutChart'
import BarsChart from './components/BarsChart'
import MapView from './components/MapView'
import Footer from './components/Footer'
import { useGeoData, useResumen } from './hooks/useGeoData'
import type { GeoFeature } from './lib/types'

const PERIODO_DEFAULT = '2024-2'

export default function App() {
  const { loading, error, features, puntos, periodos } = useGeoData()
  // `null` = aún no hay elección del usuario → se usa el periodo más reciente.
  const [periodoSel, setPeriodoSel] = useState<string | null>(null)
  const [selected, setSelected] = useState<GeoFeature | null>(null)
  const [mapTab, setMapTab] = useState<'mapa' | 'historico'>('mapa')

  const periodo = periodoSel ?? periodos[0] ?? PERIODO_DEFAULT

  const visibles = useMemo(
    () =>
      features.filter(
        (f) => !f.properties.periodo || f.properties.periodo === periodo,
      ),
    [features, periodo],
  )

  const resumen = useResumen(features, periodo)

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
          features={visibles}
          selected={selected}
          onSelect={setSelected}
        />

        <main className="center">
          <MetricsPanel resumen={resumen} />
          <div className="map-wrap">
            {mapTab === 'mapa' ? (
              <MapView
                features={visibles}
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
