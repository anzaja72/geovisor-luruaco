import { metaDe } from '../lib/quality'
import type { GeoFeature } from '../lib/types'

interface Props {
  features: GeoFeature[]
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
}

function iconoDe(f: GeoFeature): string {
  const t = f.properties.tipo_ecosistema
  if (t === 'humedal' || t === 'ecosistema_acuatico') return '💧'
  if (t === 'bosque_nativo' || t === 'bosque_secundario' || t === 'manglar') return '🌳'
  if (t === 'bioaumentacion' || f.properties.codigo_lote) return '🏭'
  return '🌿'
}

/** Listado seleccionable de sitios (equivalente al selector de departamentos). */
export default function DepartmentSidebar({ features, selected, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Seleccione un sitio</h3>
      <div className="site-list">
        {features.length === 0 && <p className="muted">No hay sitios cargados.</p>}
        {features.map((f) => {
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
              <span
                className="site-cat"
                style={{ background: meta.color }}
                title={meta.label}
              />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
