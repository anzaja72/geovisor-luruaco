import { metaDe } from '../lib/quality'
import type { Categoria } from '../lib/types'

interface Props {
  categoriasDisponibles: Categoria[]
  tiposDisponibles: string[]
  catSel: Set<Categoria>
  tipoSel: Set<string>
  onToggleCat: (c: Categoria) => void
  onToggleTipo: (t: string) => void
  onClear: () => void
}

const cap = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())

/** Filtros por categoría de calidad y tipo de ecosistema. */
export default function FiltersPanel({
  categoriasDisponibles,
  tiposDisponibles,
  catSel,
  tipoSel,
  onToggleCat,
  onToggleTipo,
  onClear,
}: Props) {
  const hayFiltro = catSel.size > 0 || tipoSel.size > 0
  if (categoriasDisponibles.length === 0 && tiposDisponibles.length === 0) return null

  return (
    <div className="filters">
      <div className="filters-head">
        <h4>Filtros</h4>
        {hayFiltro && (
          <button className="filters-clear" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {categoriasDisponibles.length > 0 && (
        <fieldset className="filters-group">
          <legend>Categoría de calidad</legend>
          {categoriasDisponibles.map((c) => (
            <label key={c} className="filters-item">
              <input
                type="checkbox"
                checked={catSel.has(c)}
                onChange={() => onToggleCat(c)}
              />
              <span className="dot" style={{ background: metaDe(c).color }} />
              {metaDe(c).label}
            </label>
          ))}
        </fieldset>
      )}

      {tiposDisponibles.length > 0 && (
        <fieldset className="filters-group">
          <legend>Tipo de ecosistema</legend>
          {tiposDisponibles.map((t) => (
            <label key={t} className="filters-item">
              <input
                type="checkbox"
                checked={tipoSel.has(t)}
                onChange={() => onToggleTipo(t)}
              />
              {cap(t)}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  )
}
