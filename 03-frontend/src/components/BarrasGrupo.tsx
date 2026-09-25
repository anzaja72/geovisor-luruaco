import { Icon } from '../geovisor/Shell'

// Barras horizontales por grupo taxonómico. Lo usan la biota de
// ficorremediación y el monitoreo de fauna: son la misma lectura —riqueza y
// abundancia por grupo— y conviene que se vean iguales, además de no mantener
// dos gráficos gemelos.

export interface BarraGrupo {
  /** Nombre que se muestra a la izquierda. */
  grupo: string
  valor: number
  /** Ícono del sprite, opcional: fauna lo usa, la biota no. */
  icon?: string
}

export default function BarrasGrupo({
  titulo,
  datos,
  color,
}: {
  titulo: string
  datos: BarraGrupo[]
  color: string
}) {
  // La escala la fija el mayor del propio gráfico: riqueza y abundancia están
  // en órdenes de magnitud distintos y compartir escala aplanaría la primera.
  const max = Math.max(...datos.map((d) => d.valor), 1)
  const vacio = datos.every((d) => !d.valor)

  return (
    <div className="biota-barras">
      <div className="t">{titulo}</div>
      {datos.map((d) => (
        <div key={d.grupo} className="fila" title={`${d.grupo}: ${d.valor.toLocaleString('es-CO')}`}>
          <span className="lab">
            {d.icon && <Icon id={d.icon} />}{d.grupo}
          </span>
          <span className="pista">
            <i style={{ width: `${d.valor ? Math.max(2, (d.valor / max) * 100) : 0}%`, background: color }} />
          </span>
          <b className={d.valor ? '' : 'pend'}>{d.valor ? d.valor.toLocaleString('es-CO') : 's/d'}</b>
        </div>
      ))}
      {vacio && <p className="sin-datos">Sin registros cargados para esta campaña.</p>}
    </div>
  )
}
