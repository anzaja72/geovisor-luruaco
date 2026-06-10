import type { Resumen } from '../lib/types'

/** Texto explicativo + dos KPIs (sitios visitados / reportados). */
export default function MetricsPanel({ resumen }: { resumen: Resumen }) {
  return (
    <section className="metrics">
      <p className="metrics-note">
        El número de sitios con índice reportado puede diferir de los visitados,
        ya que no todos cumplen el mínimo de variables con datos para su cálculo.
      </p>
      <div className="metrics-kpis">
        <div className="kpi">
          <span className="kpi-icon" aria-hidden>💧</span>
          <span className="kpi-value">{resumen.sitios_visitados}</span>
          <span className="kpi-label">Sitios visitados</span>
        </div>
        <div className="kpi">
          <span className="kpi-icon" aria-hidden>📈</span>
          <span className="kpi-value">{resumen.sitios_reportados}</span>
          <span className="kpi-label">Sitios con índice reportado</span>
        </div>
      </div>
    </section>
  )
}
