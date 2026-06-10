import { metaDe } from '../lib/quality'
import type { GeoFeature } from '../lib/types'

/** Contenido de popup como componente React (sin HTML inline). */
export default function FeaturePopup({ feature }: { feature: GeoFeature }) {
  const p = feature.properties
  const meta = metaDe(p.categoria_calidad)
  const tipo = (p.tipo_ecosistema || p.tipo_intervencion || '').replace(/_/g, ' ')

  return (
    <div className="popup">
      <h3 className="popup-title">{p.nombre}</h3>
      <span className="popup-chip" style={{ background: meta.color, color: meta.text }}>
        {meta.label}
      </span>
      <dl className="popup-grid">
        {(p.codigo_proyecto || p.codigo_lote) && (
          <>
            <dt>Código</dt>
            <dd>{p.codigo_proyecto || p.codigo_lote}</dd>
          </>
        )}
        {tipo && (
          <>
            <dt>Tipo</dt>
            <dd className="cap">{tipo}</dd>
          </>
        )}
        {p.area_hectareas != null && (
          <>
            <dt>Área</dt>
            <dd>{p.area_hectareas.toFixed(2)} ha</dd>
          </>
        )}
        {(p.estado_restauracion || p.estado) && (
          <>
            <dt>Estado</dt>
            <dd className="cap">{(p.estado_restauracion || p.estado)!.replace(/_/g, ' ')}</dd>
          </>
        )}
        {p.organizacion_responsable && (
          <>
            <dt>Organización</dt>
            <dd>{p.organizacion_responsable}</dd>
          </>
        )}
      </dl>
      {p.descripcion && <p className="popup-desc">{p.descripcion}</p>}
    </div>
  )
}
