import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'

const Q_COLOR: [string, string, string] = ['#e08a2c', '#2f6fb0', '#b0509c']

/** Curvas de rarefacción/extrapolación (Q0, Q1, Q2). Sin `datos`, solo dibuja
 *  los ejes y la leyenda — estructura lista para poblarse desde
 *  fauna_diversidad_curvas una vez exista el muestreo de campo. */
function CurvaDiversidad({ nMax = 600 }: { nMax?: number }) {
  const W = 320, H = 190
  const padL = 32, padR = 10, padT = 10, padB = 26

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 190 }}>
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--line)" />
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--line)" />
      <text x={W / 2} y={H - 6} fontSize="8" fill="var(--muted)" textAnchor="middle">Número de individuos</text>
      <text x={9} y={H / 2} fontSize="8" fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 9 ${H / 2})`}>Riqueza</text>
      <text x={2} y={padT + 4} fontSize="7" fill="var(--muted)">{`n=${nMax}`}</text>
      <text x={2} y={H - padB} fontSize="7" fill="var(--muted)">0</text>
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
              <div><em>Abundancia</em><b className="pend">s/d</b></div>
              <div><em>Riqueza</em><b className="pend">s/d</b></div>
            </div>
          </div>
        ))}
        <div className="kpi2 total">
          <div className="top">
            <span className="chip"><Icon id="bird" /></span>
            <span className="lab">Total de especies</span>
          </div>
          <div className="sub">
            <div><em>Abundancia</em><b className="pend">s/d</b></div>
            <div><em>Riqueza</em><b className="pend">s/d</b></div>
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
                      <td className="pend">s/d</td>
                      <td className="pend">s/d</td>
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
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="activity" /> Curvas de Riqueza de Especies</h3></div>
          <div className="chart-empty-overlay">
            <CurvaDiversidad />
          </div>
          <div className="div-legend">
            <span><i style={{ background: Q_COLOR[0] }} /> q0</span>
            <span><i style={{ background: Q_COLOR[1] }} /> q1</span>
            <span><i style={{ background: Q_COLOR[2] }} /> q2</span>
            <span><i className="line solid" /> Rarefacción</span>
            <span><i className="line dashed" /> Extrapolación</span>
          </div>
        </div>

        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="target" /> Gradiente Ambiental</h3></div>
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

      <div className="note"><b>Estructura lista para poblarse.</b> Las tarjetas, la tabla de abundancias, el mapa de puntos y las curvas de diversidad (Q0, Q1, Q2) ya están conectadas al modelo de datos
        (<code>fauna_grupos_resumen</code>, <code>fauna_diversidad_curvas</code>, <code>puntos_monitoreo</code>). Quedan en blanco hasta que se cargue el muestreo de campo por grupo taxonómico.</div>
      <Footer />
    </>
  )
}
