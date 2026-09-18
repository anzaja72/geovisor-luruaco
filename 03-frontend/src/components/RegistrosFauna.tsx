import { useMemo, useState } from 'react'
import { Icon } from '../geovisor/Shell'
import type { FaunaObservacion } from '../lib/api'

// Registros de fauna agrupados por grupo taxonómico y filtrables por columna.
//
// Antes eran una sola tabla con todas las filas expuestas —119 en producción, 89 de
// ellas de aves—, imposible de recorrer. Ahora cada grupo arranca plegado con su
// conteo, y una fila de filtros bajo los encabezados acota la tabla completa.
// Es una sola <table> con un <tbody> por grupo: así las columnas quedan alineadas
// entre grupos y el filtro de GRUPO sigue teniendo sentido.

type Col =
  | 'grupo' | 'nombre_comun' | 'nombre_cientifico' | 'n_individuos' | 'cobertura_vegetal'
  | 'lugar_percha' | 'habito' | 'comportamiento' | 'fecha' | 'hora' | 'observacion'

interface Columna {
  key: Col
  label: string
  /** texto: «contiene» · numero: mínimo · categoria: lista si hay pocos valores distintos. */
  tipo: 'texto' | 'numero' | 'categoria'
}

const COLUMNAS: Columna[] = [
  { key: 'grupo', label: 'Grupo', tipo: 'categoria' },
  { key: 'nombre_comun', label: 'Nombre común', tipo: 'texto' },
  { key: 'nombre_cientifico', label: 'Científico', tipo: 'texto' },
  { key: 'n_individuos', label: 'Ind.', tipo: 'numero' },
  { key: 'cobertura_vegetal', label: 'Cobertura', tipo: 'categoria' },
  { key: 'lugar_percha', label: 'Percha', tipo: 'categoria' },
  { key: 'habito', label: 'Hábito', tipo: 'categoria' },
  { key: 'comportamiento', label: 'Comportamiento', tipo: 'categoria' },
  { key: 'fecha', label: 'Fecha', tipo: 'texto' },
  { key: 'hora', label: 'Hora', tipo: 'texto' },
  { key: 'observacion', label: 'Observación', tipo: 'texto' },
]

/** Por encima de este número de valores distintos, una lista deja de ser práctica. */
const MAX_OPCIONES = 25

/** Sin tildes ni mayúsculas: «vegetacion» encuentra «Vegetación». */
const norm = (v: unknown) =>
  String(v ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const vacio = (v: unknown) => v == null || v === '' || v === 0

/** «Especies de aves» → «Aves». Los nombres de origen vienen con mayúsculas dispares. */
const titulo = (nombre: string) => {
  const t = nombre.replace(/^Especies de /i, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export interface GrupoRegistro {
  id: string
  nombre: string
  icon: string
}

type Filtros = Partial<Record<Col, string>>

function cumple(o: FaunaObservacion, f: Filtros): boolean {
  for (const c of COLUMNAS) {
    const q = f[c.key]
    if (!q) continue
    const v = o[c.key]
    if (c.tipo === 'numero') {
      if (!(Number(v) >= Number(q))) return false
    } else if (c.tipo === 'categoria' && q.startsWith('=')) {
      if (norm(v) !== norm(q.slice(1))) return false
    } else if (!norm(v).includes(norm(q))) {
      return false
    }
  }
  return true
}

export default function RegistrosFauna({
  registros,
  grupos,
}: {
  registros: FaunaObservacion[]
  grupos: GrupoRegistro[]
}) {
  const [filtros, setFiltros] = useState<Filtros>({})
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())

  // Grupos a mostrar: los conocidos, en su orden, más cualquier otro que aparezca en
  // los datos. Los que no tienen registros también se listan: que no haya anfibios
  // es información.
  const listaGrupos = useMemo(() => {
    const conocidos = new Set(grupos.map((g) => g.id))
    const extra = [...new Set(registros.map((r) => r.grupo || 'otros'))]
      .filter((g) => !conocidos.has(g))
      .map((g) => ({ id: g, nombre: g.charAt(0).toUpperCase() + g.slice(1), icon: 'paw' }))
    return [...grupos, ...extra]
  }, [grupos, registros])

  // Opciones de las columnas de categoría, construidas con los valores reales.
  const opciones = useMemo(() => {
    const m = new Map<Col, string[]>()
    for (const c of COLUMNAS) {
      if (c.tipo !== 'categoria') continue
      const vals = [...new Set(registros.map((r) => String(r[c.key] ?? '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'))
      if (vals.length <= MAX_OPCIONES) m.set(c.key, vals)
    }
    return m
  }, [registros])

  const filtrados = useMemo(() => registros.filter((r) => cumple(r, filtros)), [registros, filtros])
  const hayFiltro = Object.values(filtros).some(Boolean)

  const porGrupo = useMemo(() => {
    const m = new Map<string, FaunaObservacion[]>()
    for (const r of filtrados) {
      const g = r.grupo || 'otros'
      if (!m.has(g)) m.set(g, [])
      m.get(g)!.push(r)
    }
    return m
  }, [filtrados])

  const totalPorGrupo = useMemo(() => {
    const m = new Map<string, { n: number; especies: number }>()
    for (const g of listaGrupos) {
      const rs = registros.filter((r) => (r.grupo || 'otros') === g.id)
      m.set(g.id, { n: rs.length, especies: new Set(rs.map((r) => r.nombre_cientifico).filter(Boolean)).size })
    }
    return m
  }, [listaGrupos, registros])

  /** Al cambiar un filtro se abren los grupos con coincidencias: si no, el resultado
   *  quedaría escondido detrás de un grupo plegado. */
  const cambiarFiltro = (col: Col, valor: string) => {
    const nuevos = { ...filtros, [col]: valor }
    setFiltros(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      const conCoincidencias = new Set(
        registros.filter((r) => cumple(r, nuevos)).map((r) => r.grupo || 'otros'),
      )
      setAbiertos(conCoincidencias)
    }
  }

  const alternar = (id: string) =>
    setAbiertos((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const expandirTodo = () =>
    setAbiertos(new Set(listaGrupos.filter((g) => (porGrupo.get(g.id)?.length ?? 0) > 0).map((g) => g.id)))
  const limpiar = () => { setFiltros({}); setAbiertos(new Set()) }

  if (registros.length === 0) {
    return (
      <div className="empty" style={{ padding: 24 }}><Icon id="bird" /><b>Sin registros aún</b>
        <p>Usa «Registrar Monitoreo» → pestaña Fauna para agregar avistamientos.</p></div>
    )
  }

  return (
    <div className="reg-fauna">
      <div className="reg-barra">
        <span className="cuenta">
          {hayFiltro
            ? <><b>{filtrados.length}</b> de {registros.length} registros coinciden</>
            : <><b>{registros.length}</b> registros · pulse un grupo para desplegarlo</>}
        </span>
        <span className="acciones">
          <button type="button" onClick={expandirTodo}>Expandir todo</button>
          <button type="button" onClick={() => setAbiertos(new Set())}>Contraer todo</button>
          {hayFiltro && <button type="button" className="limpiar" onClick={limpiar}>Limpiar filtros</button>}
        </span>
      </div>

      <div className="reg-scroll">
        <table className="fauna-table reg-tabla">
          <thead>
            <tr>
              {COLUMNAS.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
            <tr className="reg-filtros">
              {COLUMNAS.map((c) => {
                const val = filtros[c.key] ?? ''
                const lista = opciones.get(c.key)
                return (
                  <th key={c.key}>
                    {lista && lista.length === 0 ? (
                      <select disabled aria-label={`${c.label}: sin datos registrados`}>
                        <option>sin datos</option>
                      </select>
                    ) : lista ? (
                      <select
                        value={val}
                        onChange={(e) => cambiarFiltro(c.key, e.target.value)}
                        aria-label={`Filtrar por ${c.label}`}
                        className={val ? 'on' : ''}
                      >
                        <option value="">Todos</option>
                        {lista.map((o) => (
                          <option key={o} value={`=${o}`}>{c.key === 'grupo' ? o.charAt(0).toUpperCase() + o.slice(1) : o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.tipo === 'numero' ? 'number' : 'search'}
                        min={c.tipo === 'numero' ? 1 : undefined}
                        value={val}
                        placeholder={c.tipo === 'numero' ? '≥' : 'Filtrar…'}
                        onChange={(e) => cambiarFiltro(c.key, e.target.value)}
                        aria-label={`Filtrar por ${c.label}`}
                        className={val ? 'on' : ''}
                      />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {listaGrupos.map((g) => {
            const filas = porGrupo.get(g.id) ?? []
            const total = totalPorGrupo.get(g.id) ?? { n: 0, especies: 0 }
            const abierto = abiertos.has(g.id) && filas.length > 0
            const inactivo = filas.length === 0
            return (
              <tbody key={g.id} className={`reg-grupo${inactivo ? ' vacio' : ''}`}>
                <tr className="reg-cab">
                  <td colSpan={COLUMNAS.length}>
                    <button
                      type="button"
                      onClick={() => alternar(g.id)}
                      disabled={inactivo}
                      aria-expanded={abierto}
                    >
                      <span className={`chev${abierto ? ' on' : ''}`}>›</span>
                      <Icon id={g.icon} />
                      <b>{titulo(g.nombre)}</b>
                      <span className="meta">
                        {total.n === 0
                          ? 'sin registros'
                          : hayFiltro
                            ? `${filas.length} de ${total.n} registros`
                            : `${total.n} registros · ${total.especies} especies`}
                      </span>
                    </button>
                  </td>
                </tr>
                {abierto && filas.map((o) => (
                    <tr key={o.id}>
                      <td className="cap">{o.grupo || '—'}</td>
                      <td>{o.nombre_comun || '—'}</td>
                      <td><i>{o.nombre_cientifico || '—'}</i></td>
                      <td className="num">{vacio(o.n_individuos) ? '—' : o.n_individuos}</td>
                      <td>{o.cobertura_vegetal || '—'}</td>
                      <td>{o.lugar_percha || '—'}</td>
                      <td>{o.habito || '—'}</td>
                      <td>{o.comportamiento || '—'}</td>
                      <td>{o.fecha || '—'}</td>
                      <td>{o.hora || '—'}</td>
                      <td>{o.observacion || '—'}</td>
                    </tr>
                ))}
              </tbody>
            )
          })}
        </table>
      </div>
    </div>
  )
}
