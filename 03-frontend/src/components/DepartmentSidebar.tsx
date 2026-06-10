import type { ReactNode } from 'react'
import { metaDe } from '../lib/quality'
import type { GeoFeature } from '../lib/types'

interface Props {
  features: GeoFeature[]
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
  query: string
  onQuery: (q: string) => void
  filters?: ReactNode
}

function iconoDe(f: GeoFeature): string {
  const t = f.properties.tipo_ecosistema
  if (t === 'humedal' || t === 'ecosistema_acuatico') return '💧'
  if (t === 'bosque_nativo' || t === 'bosque_secundario' || t === 'manglar') return '🌳'
  if (t === 'bioaumentacion' || f.properties.codigo_lote) return '🏭'
  return '🌿'
}

/** Listado de sitios con búsqueda por nombre y panel de filtros. */
export default function DepartmentSidebar({
  features,
  selected,
  onSelect,
  query,
  onQuery,
  filters,
}: Props) {
  const q = query.trim().toLowerCase()
  const lista = q
    ? features.filter((f) => (f.properties.nombre ?? '').toLowerCase().includes(q))
    : features

  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Seleccione un sitio</h3>

      <div className="sidebar-search">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar sitio por nombre…"
          aria-label="Buscar sitio por nombre"
        />
        {query && (
          <button onClick={() => onQuery('')} aria-label="Limpiar búsqueda">
            ×
          </button>
        )}
      </div>

      {filters}

      <div className="site-list">
        {lista.length === 0 && <p className="muted">Sin sitios para los filtros actuales.</p>}
        {lista.map((f) => {
          const meta = metaDe(f.properties.categoria_calidad)
          const isSel = selected?.properties.id === f.properties.id
          return (
            <button
              key={`site-${f.properties.id}`}
              className={`site-row ${isSel ? 'active' : ''}`}
              onClick={() => onSelect(f)}
            >
              <span className="site-ico" aria-hidden>{iconoDe(f)}</span>
              <span className="site-name">{f.properties.nombre}</span>
              <span className="site-cat" style={{ background: meta.color }} title={meta.label} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
