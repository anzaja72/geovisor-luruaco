import { metaDe } from '../lib/quality'
import type { CategoriaResumen } from '../lib/types'

interface Props {
  categorias: CategoriaResumen[]
}

const SIZE = 168
const STROKE = 30
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

/** Dona de proporción por categoría, dibujada con SVG puro (sin dependencias). */
export default function DonutChart({ categorias }: Props) {
  const total = categorias.reduce((acc, c) => acc + c.cantidad, 0)

  if (total === 0) {
    return <p className="chart-empty">Sin sitios reportados en este periodo.</p>
  }

  const cx = SIZE / 2
  const cy = SIZE / 2

  // Longitud de cada arco y su offset acumulado, calculados sin mutación.
  const lengths = categorias.map((c) => (c.cantidad / total) * C)
  const offsets = lengths.map((_, i) =>
    lengths.slice(0, i).reduce((a, b) => a + b, 0),
  )

  return (
    <div className="donut">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img"
           aria-label="Proporción de sitios por categoría de calidad">
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {categorias.map((c, i) => (
            <circle
              key={c.categoria}
              cx={cx}
              cy={cy}
              r={R}
              fill="none"
              stroke={metaDe(c.categoria).color}
              strokeWidth={STROKE}
              strokeDasharray={`${lengths[i]} ${C - lengths[i]}`}
              strokeDashoffset={-offsets[i]}
            >
              <title>{`${metaDe(c.categoria).label}: ${c.cantidad} (${c.porcentaje.toFixed(0)}%)`}</title>
            </circle>
          ))}
        </g>
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="donut-sub">
          sitios
        </text>
      </svg>

      <ul className="donut-legend">
        {categorias.map((c) => (
          <li key={c.categoria}>
            <span className="dot" style={{ background: metaDe(c.categoria).color }} />
            <span className="lbl">{metaDe(c.categoria).label}</span>
            <span className="pct">{c.porcentaje.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
