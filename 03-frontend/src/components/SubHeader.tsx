interface Props {
  periodo: string
  periodos: string[]
  onPeriodoChange: (p: string) => void
}

/** Sub-cabecera: título de escala + selector de periodo/categoría. */
export default function SubHeader({ periodo, periodos, onPeriodoChange }: Props) {
  const opciones = periodos.length > 0 ? periodos : [periodo]
  return (
    <div className="sub-header">
      <div className="sub-title">
        <h2>ICAM</h2>
        <span>Nivel Departamental</span>
      </div>
      <div className="sub-select">
        <label htmlFor="periodo-sel">Seleccionar un periodo</label>
        <select
          id="periodo-sel"
          value={periodo}
          onChange={(e) => onPeriodoChange(e.target.value)}
        >
          {opciones.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
