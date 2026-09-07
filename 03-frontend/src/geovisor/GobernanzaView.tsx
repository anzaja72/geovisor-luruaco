import { useEffect, useState } from 'react'
import { Footer, Icon } from './Shell'
import Carousel3D, { type Foto } from '../components/Carousel3D'
import { GOBERNANZA } from './data'
import { PALETA_CRA } from '../lib/marca'
import { fetchGobernanza, type GobernanzaActividad } from '../lib/api'

const COLORES = PALETA_CRA

// Registro fotográfico real de actividades de gobernanza (25 fotos). Las rutas son el
// respaldo si no se puede leer el índice; /gobernanza/index.json añade la referencia
// (tipo de actividad) de cada foto.
const FOTOS_GOBERNANZA: Foto[] = Array.from({ length: 25 }, (_, i) => ({
  src: `/gobernanza/gob-${String(i + 1).padStart(2, '0')}.jpg`,
}))

/** Respaldo con los datos de la línea base, por si la geodatabase no responde. */
const RESPALDO: GobernanzaActividad[] = GOBERNANZA.actividades.map(
  ([actividad, cantidad, participantes, ubicacion]) => ({ actividad, cantidad, participantes, ubicacion }),
)

export default function GobernanzaView() {
  const [fotos, setFotos] = useState<Foto[]>(FOTOS_GOBERNANZA)
  const [actividades, setActividades] = useState<GobernanzaActividad[]>(RESPALDO)
  const [enVivo, setEnVivo] = useState(false)

  // Las actividades salen de la geodatabase: así lo que se registra por el
  // formulario de campo aparece en esta vista.
  useEffect(() => {
    const ac = new AbortController()
    fetchGobernanza(ac.signal)
      .then((d) => {
        if (ac.signal.aborted || !d.actividades?.length) return
        setActividades(d.actividades)
        setEnVivo(true)
      })
      .catch(() => { /* sin backend se conservan los datos de la línea base */ })
    return () => ac.abort()
  }, [])

  // Índice de fotos con su referencia (generado desde las carpetas del registro).
  useEffect(() => {
    const ac = new AbortController()
    fetch('/gobernanza/index.json', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Foto[] | null) => {
        if (Array.isArray(data) && data.length > 0) setFotos(data)
      })
      .catch(() => { /* sin índice: se muestran las fotos sin referencia */ })
    return () => ac.abort()
  }, [])

  const tipos = actividades.length
  const eventos = actividades.reduce((s, a) => s + a.cantidad, 0)
  const participantes = actividades.reduce((s, a) => s + a.participantes, 0)
  const promedio = eventos > 0 ? Math.round((participantes / eventos) * 10) / 10 : 0
  const maxParticipantes = Math.max(...actividades.map((a) => a.participantes), 1)

  // Agrupación por ubicación: # de actividades y participantes por sitio.
  const porUbicacion = new Map<string, { eventos: number; participantes: number }>()
  for (const a of actividades) {
    const u = porUbicacion.get(a.ubicacion) ?? { eventos: 0, participantes: 0 }
    u.eventos += a.cantidad
    u.participantes += a.participantes
    porUbicacion.set(a.ubicacion, u)
  }

  return (
    <>
      <div className="page-title">
        <h2><Icon id="users" /> Gobernanza Ambiental</h2>
        <span className="badge-soft" style={enVivo ? { background: 'var(--sec-c)', color: 'var(--on-sec-c)', borderColor: '#cfe89a' } : undefined}>
          {enVivo ? '● Datos en vivo (geodatabase)' : 'Datos reales · participación comunitaria'}</span>
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
            {actividades.map((a, i) => (
              <div key={a.actividad} title={`${a.actividad}: ${a.participantes} participantes`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--ink)' }}>{a.actividad}</span>
                  <b style={{ color: 'var(--ink)' }}>{a.participantes}</b>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(4, (a.participantes / maxParticipantes) * 100)}%`, background: COLORES[i % COLORES.length], borderRadius: 4 }} />
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
        <div className="ph"><h3><Icon id="camera" /> Registro fotográfico de actividades</h3>
          <span className="badge-soft">{fotos.length} fotos · arrastra para girar · clic para ampliar</span></div>
        <div style={{ padding: '14px 8px 8px' }}>
          <Carousel3D images={fotos} height={560} />
        </div>
      </div>

      <div className="note"><b>Gobernanza Ambiental.</b> Registro de socializaciones, talleres, capacitaciones, jornadas de limpieza, recorridos guiados, negocios verdes
        y sensibilización ciudadana ejecutados en el marco del Contrato 324 de 2025. Datos conectados a <code>gobernanza_actividades</code>.</div>
      <Footer />
    </>
  )
}
