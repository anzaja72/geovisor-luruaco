import { Footer, Icon } from './Shell'
import { GOBERNANZA } from './data'

const COLORES = ['#1b6d24', '#2f8a45', '#1565c0', '#00585f', '#6f9e3a', '#8a9e7a', '#7a8a93']

export default function GobernanzaView() {
  const { actividades } = GOBERNANZA
  const tipos = actividades.length
  const eventos = actividades.reduce((s, [, c]) => s + c, 0)
  const participantes = actividades.reduce((s, [, , p]) => s + p, 0)
  const promedio = Math.round((participantes / eventos) * 10) / 10
  const maxParticipantes = Math.max(...actividades.map(([, , p]) => p))

  // Agrupación por ubicación: # de actividades y participantes por sitio.
  const porUbicacion = new Map<string, { eventos: number; participantes: number }>()
  for (const [, cantidad, p, ubic] of actividades) {
    const u = porUbicacion.get(ubic) ?? { eventos: 0, participantes: 0 }
    u.eventos += cantidad
    u.participantes += p
    porUbicacion.set(ubic, u)
  }

  return (
    <>
      <div className="page-title">
        <h2><Icon id="users" /> Gobernanza Ambiental</h2>
        <span className="badge-soft">Datos reales · participación comunitaria</span>
      </div>

      <div className="kpis k4" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="grid" /></span><span className="lab">Tipos de actividad</span></div><div className="val">{tipos}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="calendar" /></span><span className="lab">Eventos realizados</span></div><div className="val">{eventos}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="users" /></span><span className="lab">Participantes totales</span></div><div className="val">{participantes}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="trend" /></span><span className="lab">Promedio por evento</span></div><div className="val">{promedio}</div></div>
      </div>

      <div className="grid2">
        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="activity" /> Participantes por tipo de actividad</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {actividades.map(([nombre, , p], i) => (
              <div key={nombre} title={`${nombre}: ${p} participantes`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--ink)' }}>{nombre}</span>
                  <b style={{ color: 'var(--ink)' }}>{p}</b>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(4, (p / maxParticipantes) * 100)}%`, background: COLORES[i % COLORES.length], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph"><h3><Icon id="pin" /> Actividades por ubicación</h3></div>
          <div className="chart-b" style={{ padding: 0 }}>
            <table className="fauna-table">
              <thead><tr><th>Ubicación</th><th>Eventos</th><th>Participantes</th></tr></thead>
              <tbody>
                {[...porUbicacion.entries()].map(([ubic, v]) => (
                  <tr key={ubic}>
                    <td><span className="grp"><Icon id="pin" /> {ubic}</span></td>
                    <td>{v.eventos}</td>
                    <td>{v.participantes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="grid" /> Detalle de actividades</h3></div>
        <div className="chart-b" style={{ padding: 0 }}>
          <table className="fauna-table">
            <thead><tr><th>Actividad</th><th>Cantidad</th><th>N° de participantes</th><th>Ubicación / Foto</th></tr></thead>
            <tbody>
              {actividades.map(([nombre, cantidad, p, ubic]) => (
                <tr key={nombre}>
                  <td>{nombre}</td>
                  <td>{cantidad}</td>
                  <td>{p}</td>
                  <td className="pend">{ubic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="note"><b>Gobernanza Ambiental.</b> Registro de socializaciones, talleres, capacitaciones, jornadas de limpieza, recorridos guiados, negocios verdes
        y sensibilización ciudadana ejecutados en el marco del Contrato 324 de 2025. Datos conectados a <code>gobernanza_actividades</code>.</div>
      <Footer />
    </>
  )
}
