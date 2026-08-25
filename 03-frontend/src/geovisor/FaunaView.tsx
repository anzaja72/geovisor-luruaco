import { useEffect, useMemo, useState } from 'react'
import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'
import { fetchFaunaObservaciones, type FaunaObservacion } from '../lib/api'

/** Curva de rarefacción Q0 (riqueza esperada de Hurlbert) a partir del vector de
 *  abundancias por especie: E[S_m] = Σ (1 − C(N−nᵢ,m)/C(N,m)). */
function rarefaccion(abund: number[], puntos = 40): { m: number; s: number }[] {
  const N = abund.reduce((a, b) => a + b, 0)
  if (N < 2 || abund.length < 1) return []
  const ratio = abund.map(() => 1)
  const out: { m: number; s: number }[] = [{ m: 0, s: 0 }]
  const step = Math.max(1, Math.floor(N / puntos))
  for (let m = 1; m <= N; m++) {
    let s = 0
    const den = N - (m - 1)
    for (let i = 0; i < abund.length; i++) {
      const num = N - abund[i] - (m - 1)
      ratio[i] = den > 0 && num > 0 ? ratio[i] * (num / den) : 0
      s += 1 - ratio[i]
    }
    if (m % step === 0 || m === N) out.push({ m, s })
  }
  return out
}

/** Curva de riqueza (rarefacción Q0) con datos reales de la muestra. */
function CurvaDiversidad({ curva, N, S }: { curva: { m: number; s: number }[]; N: number; S: number }) {
  const W = 320, H = 190, padL = 32, padR = 10, padT = 10, padB = 26
  const ejeX = <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--line)" />
  const ejeY = <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--line)" />
  if (curva.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 190 }}>
        {ejeX}{ejeY}
        <text x={W / 2} y={H / 2} fontSize="9" fill="var(--muted)" textAnchor="middle">Sin datos de abundancia</text>
      </svg>
    )
  }
  const xmax = N, ymax = Math.max(1, Math.ceil(S * 1.05))
  const X = (m: number) => padL + (m / xmax) * (W - padL - padR)
  const Y = (s: number) => (H - padB) - (s / ymax) * (H - padB - padT)
  const pts = curva.map((p) => `${X(p.m).toFixed(1)},${Y(p.s).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 190 }}>
      {ejeX}{ejeY}
      <polyline fill="none" stroke="#2f6fb0" strokeWidth="2.2" points={pts} />
      <circle cx={X(N)} cy={Y(S)} r="3.2" fill="#2f6fb0" />
      <text x={X(N) - 4} y={Y(S) - 6} fontSize="8" fill="#2f6fb0" textAnchor="end">{S} sp.</text>
      <text x={W / 2} y={H - 4} fontSize="8" fill="var(--muted)" textAnchor="middle">Número de individuos (n={N})</text>
      <text x={9} y={H / 2} fontSize="8" fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 9 ${H / 2})`}>Riqueza esperada</text>
    </svg>
  )
}

const GRUPOS_FAUNA: { id: 'aves' | 'anfibios' | 'mamiferos' | 'reptiles'; nombre: string; icon: string }[] = [
  { id: 'aves', nombre: 'Especies de aves', icon: 'bird' },
  { id: 'anfibios', nombre: 'Especies de anfibios', icon: 'frog' },
  { id: 'mamiferos', nombre: 'Especies de Mamíferos', icon: 'paw' },
  { id: 'reptiles', nombre: 'Especies de Reptiles', icon: 'snake' },
]

export default function FaunaView(map: GeovisorMapProps) {
  const [obs, setObs] = useState<FaunaObservacion[]>([])
  useEffect(() => {
    const ac = new AbortController()
    fetchFaunaObservaciones(ac.signal).then((d) => { if (!ac.signal.aborted) setObs(d) }).catch(() => {})
    return () => ac.abort()
  }, [])
  const totalInd = obs.reduce((s, o) => s + (o.n_individuos || 0), 0)
  const especies = new Set(obs.map((o) => o.nombre_cientifico || o.nombre_comun).filter(Boolean)).size
  // Abundancia y riqueza por grupo taxonómico (a partir de las observaciones).
  const porGrupo: Record<string, { ab: number; esp: Set<string> }> = {}
  for (const o of obs) {
    const g = o.grupo || 'otros'
    if (!porGrupo[g]) porGrupo[g] = { ab: 0, esp: new Set() }
    porGrupo[g].ab += o.n_individuos || 0
    if (o.nombre_cientifico) porGrupo[g].esp.add(o.nombre_cientifico)
  }
  const ab = (id: string) => porGrupo[id]?.ab || 0
  const riq = (id: string) => porGrupo[id]?.esp.size || 0

  // Curva de rarefacción (Q0) desde el vector de abundancias por especie.
  const abund = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of obs) {
      if (o.nombre_cientifico && o.n_individuos) m.set(o.nombre_cientifico, (m.get(o.nombre_cientifico) || 0) + o.n_individuos)
    }
    return [...m.values()]
  }, [obs])
  const curva = useMemo(() => rarefaccion(abund), [abund])
  const Nind = abund.reduce((a, b) => a + b, 0)
  const Sesp = abund.length

  return (
    <>
      <div className="page-title">
        <h2><Icon id="paw" /> Monitoreo de Fauna</h2>
        <span className="badge-soft">Estructura lista · datos de muestreo pendientes</span>
      </div>

      <div className="kpis" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(4,1fr) .9fr' }}>
        {GRUPOS_FAUNA.map(g => (
          <div key={g.id} className="kpi2">
            <div className="top"><span className="chip"><Icon id={g.icon} /></span><span className="lab">{g.nombre}</span></div>
            <div className="sub">
              <div><em>Abundancia</em><b className={ab(g.id) ? '' : 'pend'}>{ab(g.id) || 's/d'}</b></div>
              <div><em>Riqueza</em><b className={riq(g.id) ? '' : 'pend'}>{riq(g.id) || 's/d'}</b></div>
            </div>
          </div>
        ))}
        <div className="kpi2 total">
          <div className="top">
            <span className="chip"><Icon id="bird" /></span>
            <span className="lab">Total de especies</span>
          </div>
          <div className="sub">
            <div><em>Abundancia</em><b className={totalInd ? '' : 'pend'}>{totalInd || 's/d'}</b></div>
            <div><em>Riqueza</em><b className={especies ? '' : 'pend'}>{especies || 's/d'}</b></div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="ph"><h3><Icon id="layers" /> Mapa de Puntos de Monitoreo</h3>
            <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
          <MapView {...map} componente="fauna" className="map tall" />
          <div className="pt-count">
            <span><i className="sh sq" /> 0</span>
            <span><i className="sh tri" /> 0</span>
            <span><i className="sh ci" /> 0</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel">
            <div className="ph"><h3><Icon id="pin" /> Leyenda de Puntos</h3></div>
            <div className="chart-b">
              <div className="pt-legend">
                <div><span className="sh sq" /> <span>= Número de puntos muestreados</span></div>
                <div><span className="sh tri" /> <span>= Número de puntos con cámaras trampa</span></div>
                <div><span className="sh ci" /> <span>= Número de puntos de canto de aves</span></div>
                <div><span className="sh dash" /> <small>Línea punteada = representa gradiente ambiental</small></div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph"><h3><Icon id="grid" /> Resumen de Abundancias</h3></div>
            <div className="chart-b" style={{ padding: 0 }}>
              <table className="fauna-table">
                <thead><tr><th>Grupo</th><th>Abundancia</th><th>Riqueza</th></tr></thead>
                <tbody>
                  {GRUPOS_FAUNA.map(g => (
                    <tr key={g.id}>
                      <td><span className="grp"><Icon id={g.icon} /> {g.nombre.replace('Especies de ', '')}</span></td>
                      <td className={ab(g.id) ? '' : 'pend'}>{ab(g.id) || 's/d'}</td>
                      <td className={riq(g.id) ? '' : 'pend'}>{riq(g.id) || 's/d'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="activity" /> Curva de Riqueza de Especies (rarefacción)</h3></div>
          <CurvaDiversidad curva={curva} N={Nind} S={Sesp} />
          <div className="div-legend">
            <span><i style={{ background: '#2f6fb0' }} /> Riqueza esperada (Q0, Hurlbert)</span>
            <span>· calculada de la muestra ({Sesp} especies, {Nind} individuos)</span>
          </div>
        </div>

        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="target" /> Gradiente Ambiental</h3>
            <span className="badge-soft">Pendiente · requiere datos de transecto</span></div>
          <div className="chart-empty-overlay">
            <svg viewBox="0 0 320 190" style={{ width: '100%', height: 190 }}>
              <line x1="32" y1="164" x2="310" y2="164" stroke="var(--line)" />
              <line x1="32" y1="10" x2="32" y2="164" stroke="var(--line)" />
              <text x="160" y="184" fontSize="8" fill="var(--muted)" textAnchor="middle">Distancia</text>
              <text x="9" y="95" fontSize="8" fill="var(--muted)" textAnchor="middle" transform="rotate(-90 9 95)">Número de individuos</text>
            </svg>
          </div>
          <div className="pt-count" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
            <span><i className="sh sq" /> 0</span>
            <span><i className="sh tri" /> 0</span>
            <span><i className="sh ci" /> 0</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="bird" /> Registros de fauna (observaciones)</h3>
          <span className="badge-soft">{obs.length} registro(s)</span></div>
        <div className="chart-b" style={{ padding: 0, overflowX: 'auto' }}>
          {obs.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}><Icon id="bird" /><b>Sin registros aún</b>
              <p>Usa «Registrar Monitoreo» → pestaña Fauna para agregar avistamientos.</p></div>
          ) : (
            <table className="fauna-table">
              <thead><tr>
                <th>Grupo</th><th>Nombre común</th><th>Científico</th><th>Ind.</th><th>Cobertura</th>
                <th>Percha</th><th>Hábito</th><th>Comportamiento</th><th>Fecha</th><th>Hora</th><th>Observación</th>
              </tr></thead>
              <tbody>
                {obs.map((o) => (
                  <tr key={o.id}>
                    <td className="cap">{o.grupo || '—'}</td>
                    <td>{o.nombre_comun || '—'}</td><td><i>{o.nombre_cientifico || '—'}</i></td>
                    <td>{o.n_individuos || '—'}</td><td>{o.cobertura_vegetal || '—'}</td>
                    <td>{o.lugar_percha || '—'}</td><td>{o.habito || '—'}</td>
                    <td>{o.comportamiento || '—'}</td><td>{o.fecha || '—'}</td>
                    <td>{o.hora || '—'}</td><td>{o.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="note"><b>Estructura lista para poblarse.</b> Las tarjetas, la tabla de abundancias, el mapa de puntos y las curvas de diversidad (Q0, Q1, Q2) ya están conectadas al modelo de datos
        (<code>fauna_grupos_resumen</code>, <code>fauna_diversidad_curvas</code>, <code>puntos_monitoreo</code>). Quedan en blanco hasta que se cargue el muestreo de campo por grupo taxonómico.</div>
      <Footer />
    </>
  )
}
