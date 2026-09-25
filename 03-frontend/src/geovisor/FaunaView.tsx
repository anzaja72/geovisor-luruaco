import { useEffect, useState } from 'react'
import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'
import FaunaViewer3D from '../components/FaunaViewer3D'
import RegistrosFauna from '../components/RegistrosFauna'
import BarrasGrupo from '../components/BarrasGrupo'
import { FICHAS_FAUNA, type GrupoFaunaId } from './faunaFichas'
import { fetchFaunaObservaciones, type FaunaObservacion } from '../lib/api'

/** «Especies de aves» → «Aves». */
const titulo = (n: string) => {
  const t = n.replace(/^Especies de /i, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const GRUPOS_FAUNA: { id: 'aves' | 'anfibios' | 'mamiferos' | 'reptiles'; nombre: string; icon: string }[] = [
  { id: 'aves', nombre: 'Especies de aves', icon: 'bird' },
  { id: 'anfibios', nombre: 'Especies de anfibios', icon: 'frog' },
  { id: 'mamiferos', nombre: 'Especies de Mamíferos', icon: 'paw' },
  { id: 'reptiles', nombre: 'Especies de Reptiles', icon: 'snake' },
]

export default function FaunaView(map: GeovisorMapProps) {
  const [obs, setObs] = useState<FaunaObservacion[]>([])
  // Grupo mostrado en el visor 3D de especímenes (línea base de fauna).
  const [grupo3d, setGrupo3d] = useState<GrupoFaunaId>('aves')
  const ficha = FICHAS_FAUNA.find((f) => f.id === grupo3d)!
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

      {/* Especímenes 3D de la línea base — ocupa el lugar que antes tenía el mapa */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">
          <h3><Icon id="paw" /> Especímenes 3D de la línea base</h3>
          <span className="badge-soft">{FICHAS_FAUNA.length} grupos · modelos desde fotos de campo</span>
        </div>
        <div className="f3d-wrap">
          <div className="f3d-grupos">
            {FICHAS_FAUNA.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`f3d-grupo${f.id === grupo3d ? ' on' : ''}`}
                onClick={() => setGrupo3d(f.id)}
              >
                <img src={f.foto} alt="" loading="lazy" />
                <span className="tx">
                  <b>{f.nombre}</b>
                  <small>{f.especieModelo}</small>
                </span>
              </button>
            ))}
          </div>

          <FaunaViewer3D ficha={ficha} alto={400} />

          <div className="f3d-ficha">
            <div className="cab">
              <b>{ficha.nombre}</b>
              <small>{ficha.clase} · modelo: <i>{ficha.especieModelo}</i></small>
            </div>
            <div className="datos">
              <div><em>Riqueza</em><b>{ficha.riqueza}</b></div>
              <div><em>Registros</em><b>{ficha.registros}</b></div>
            </div>
            <p>{ficha.descripcion}</p>
            <div className="datos">
              <div><em>Coberturas</em><b style={{ fontSize: 11.5, fontWeight: 700 }}>{ficha.coberturas}</b></div>
              <div><em>Rol ecológico</em><b style={{ fontSize: 11.5, fontWeight: 700 }}>{ficha.rol}</b></div>
            </div>
            <div className="f3d-chips">
              {ficha.puntos.map((p) => (
                <button key={p.id} type="button" title={p.detail}>
                  <i style={{ background: p.color }} />{p.label}
                </button>
              ))}
            </div>
            <div className="dato">{ficha.dato}</div>
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
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}>
            <h3><Icon id="activity" /> Riqueza por grupo</h3>
            <span className="badge-soft">{especies || 0} especies en total</span>
          </div>
          <BarrasGrupo
            titulo="Especies distintas registradas"
            color="var(--cra-verde)"
            datos={GRUPOS_FAUNA.map((g) => ({
              grupo: titulo(g.nombre), valor: riq(g.id), icon: g.icon,
            }))}
          />
        </div>

        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}>
            <h3><Icon id="grid" /> Abundancia por grupo</h3>
            <span className="badge-soft">{totalInd || 0} individuos en total</span>
          </div>
          <BarrasGrupo
            titulo="Individuos observados"
            color="var(--cra-cian)"
            datos={GRUPOS_FAUNA.map((g) => ({
              grupo: titulo(g.nombre), valor: ab(g.id), icon: g.icon,
            }))}
          />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="bird" /> Registros de fauna (observaciones)</h3>
          <span className="badge-soft">{obs.length} registro(s)</span></div>
        <RegistrosFauna registros={obs} grupos={GRUPOS_FAUNA} />
      </div>

      <div className="note"><b>Estructura lista para poblarse.</b> Las tarjetas, la tabla de abundancias, el mapa de puntos y y las barras de riqueza y abundancia ya están conectadas al modelo de datos
        (<code>fauna_grupos_resumen</code>, <code>fauna_observaciones</code>, <code>puntos_monitoreo</code>). Quedan en blanco hasta que se cargue el muestreo de campo por grupo taxonómico.</div>
      <Footer />
    </>
  )
}
