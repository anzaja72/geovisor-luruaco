import { useEffect, useMemo, useState } from 'react'
import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'
import OrtoComparador from '../components/OrtoComparador'
import { MALEZA as M, serieMalezaTexto } from './data'
import { boundsDelMes, MESES_LIMPIEZA } from './ortofotosMaleza'
import { fetchMalezaLimpiezas } from '../lib/api'

// Monitoreos que se pueden ver en el mapa: los que tienen vuelo de dron o polígono
// de limpieza. «Todos» muestra el borde intervenido completo.
const MONITOREOS = ['Todos', ...MESES_LIMPIEZA]

export default function MalezaView(map: GeovisorMapProps) {
  const [mes, setMes] = useState('Todos')
  // Jornadas de limpieza leídas de la geodatabase; si no responde, se conservan
  // las de la línea base para no dejar la vista en blanco.
  const [serie, setSerie] = useState<[string, number][]>(M.serie)
  const [acumulado, setAcumulado] = useState(M.acumulado)
  const [enVivo, setEnVivo] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    fetchMalezaLimpiezas(ac.signal)
      .then((d) => {
        if (ac.signal.aborted || !d.jornadas?.length) return
        setSerie(d.jornadas.map((j) => [j.fecha, j.area_ha] as [string, number]))
        setAcumulado(d.acumulado_ha)
        setEnVivo(true)
      })
      .catch(() => { /* sin backend se conserva la línea base */ })
    return () => ac.abort()
  }, [])

  // Al elegir un monitoreo el mapa se acerca a su área de intervención.
  const focus = useMemo(() => (mes === 'Todos' ? null : boundsDelMes(mes)), [mes])

  const maxV = Math.max(...serie.map((s) => s[1]), 1)

  const polys = useMemo(
    () => map.capas.filter((f) => f.properties?.capa === 'maleza_acuatica'),
    [map.capas],
  )
  const nPolys = polys.length || M.poligonos

  return (
    <>
      <div className="page-title">
        <h2><Icon id="waves" /> Vegetación Acuática</h2>
        <span className="sub">Remoción de maleza en el borde de la Ciénaga · comparación temporal por monitoreo</span>
      </div>

      <div className="filters">
        <span className="lab" style={{ alignSelf: 'center' }}>Monitoreo</span>
        <div className="tl">
          {MONITOREOS.map((m) => (
            <button key={m} className={mes === m ? 'on' : ''} onClick={() => setMes(m)}>{m}</button>
          ))}
        </div>
        <span className="badge-soft">
          {mes === 'Todos' ? 'Todo el borde intervenido' : `El mapa se acerca al área intervenida en ${mes.toLowerCase()}`}
        </span>
        {(enVivo || polys.length > 0) && <span className="badge-soft" style={{ background: 'var(--sec-c)', color: 'var(--on-sec-c)', borderColor: '#cfe89a' }}>● Datos en vivo (geodatabase)</span>}
      </div>

      <div className="kpis k3" style={{ marginBottom: 18 }}>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="trash" /></span><span className="lab">Maleza removida (acum.)</span></div>
          <div className="val num">{acumulado.toLocaleString('es-CO', { minimumFractionDigits: 1 })} <small>ha</small></div>
          {serie.length > 1 && (
            <div className="trend up">+{(serie[serie.length - 1][1] - serie[serie.length - 2][1]).toLocaleString('es-CO', { maximumFractionDigits: 2 })} ha vs. {serie[serie.length - 2][0].toLowerCase()}</div>
          )}</div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="layers" /></span><span className="lab">Polígonos de limpieza</span></div>
          <div className="val num">{nPolys}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="scale" /></span><span className="lab">Biomasa retirada</span></div>
          <div className="val pend">s/d<sup style={{ color: 'var(--secondary)' }}>*</sup></div></div>
      </div>

      <div className="panel">
        <div className="ph"><h3><Icon id="layers" /> Geovisor de Vegetación Acuática</h3>
          <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
        <MapView {...map} componente="maleza" mesLimpieza={mes} focus={focus} />
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="trend" /> Visor comparativo antes / después (ortofotos del dron)</h3></div>
        <OrtoComparador poligonos={polys} mes={mes} onMes={setMes} />
      </div>

      <div className="grid3">
        <div className="bigstat">
          <div className="lab">Maleza acuática removida</div>
          <div className="v num">19,0 <small>ha</small></div>
          <div className="sub">Acumulado a {serie.length ? serie[serie.length - 1][0].toLowerCase() : 'la última jornada'} · línea base = 0 ha</div>
        </div>
        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="trend" /> Hectáreas removidas (acumulado)</h3></div>
          <div className="bars" style={{ height: 150 }}>
            {serie.map(([n, v]) => (
              <div key={n} className="b blue" title={`${n}: ${v} ha`} style={{ height: `${Math.max(10, (v / maxV) * 100)}%` }}>
                <em>{v.toLocaleString('es-CO')}</em><span>{n}</span></div>
            ))}
          </div>
        </div>
        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="leaf" /> Leyenda del geovisor</h3></div>
          <div style={{ padding: '8px 2px', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#7ab648', display: 'inline-block' }} /> Polígonos de limpieza ({nPolys})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#bfe0ea', display: 'inline-block' }} /> Espejo de agua (basemap)</div>
            <div className="note" style={{ marginTop: 10 }}>Activa/desactiva capas con el control del mapa (esquina superior derecha).</div>
          </div>
        </div>
      </div>

      <div className="note"><b>Datos reales</b>: {nPolys} polígonos de limpieza cargados en la geodatabase; remoción acumulada reportada <b>{serieMalezaTexto(' · ')}</b>.
        Sobre el mapa se superponen las ortofotos del dron posteriores a cada limpieza ({MESES_LIMPIEZA.join(' · ')}).
        <b>*</b> Volumen de biomasa retirada pendiente.</div>
      <Footer />
    </>
  )
}
