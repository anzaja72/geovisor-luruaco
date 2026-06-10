import { metaDe } from '../lib/quality'
import type { CategoriaResumen } from '../lib/types'

interface Props {
  categorias: CategoriaResumen[]
}

/** Barras horizontales de cantidad de sitios por categoría (SVG/CSS puro). */
export default function BarsChart({ categorias }: Props) {
  if (categorias.length === 0) {
    return <p className="chart-empty">Sin datos para graficar.</p>
  }

  const max = Math.max(...categorias.map((c) => c.cantidad), 1)
  // Eje redondeado hacia arriba al múltiplo de 5 más cercano (como el ICAM: 0..10).
  const axisMax = Math.max(5, Math.ceil(max / 5) * 5)

  return (
    <div className="bars">
      {categorias.map((c) => {
        const meta = metaDe(c.categoria)
        const pct = (c.cantidad / axisMax) * 100
        return (
          <div className="bar-row" key={c.categoria}>
            <span className="bar-label">{meta.label}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              >
                <span className="bar-value">{c.cantidad}</span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="bar-axis">
        <span>0</span>
        <span>{axisMax}</span>
      </div>
    </div>
  )
}
