import { useMemo, useState } from 'react'
import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'
import OrtoComparador from '../components/OrtoComparador'
import { MALEZA as M } from './data'

export default function MalezaView(map: GeovisorMapProps) {
  const [fecha, setFecha] = useState('Mayo')
  const maxV = Math.max(...M.serie.map((s) => s[1]))

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
          {['Línea base', 'Marzo', 'Abril', 'Mayo'].map((f) => (
            <button key={f} className={fecha === f ? 'on' : ''} onClick={() => setFecha(f)}>{f}</button>
          ))}
        </div>
        {polys.length > 0 && <span className="badge-soft" style={{ background: '#e3f5e6', color: '#1b6d24', borderColor: '#bfe6c6' }}>● Datos en vivo (backend)</span>}
      </div>

      <div className="kpis k4" style={{ marginBottom: 18 }}>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="trash" /></span><span className="lab">Maleza removida (acum.)</span></div>
          <div className="val num">19,0 <small>ha</small></div><div className="trend up">+3,29 ha vs. abril</div></div>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="droplet" /></span><span className="lab">Borde de laguna intervenido</span></div>
          <div className="val num">~3,1 <small>km</small></div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="layers" /></span><span className="lab">Polígonos de limpieza</span></div>
          <div className="val num">{nPolys}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="scale" /></span><span className="lab">Biomasa retirada</span></div>
          <div className="val pend">s/d<sup style={{ color: 'var(--secondary)' }}>*</sup></div></div>
      </div>

      <div className="panel">
        <div className="ph"><h3><Icon id="layers" /> Geovisor de Vegetación Acuática</h3>
          <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
        <MapView {...map} componente="maleza" />
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="trend" /> Visor comparativo antes / después (ortofotos del dron)</h3></div>
        <OrtoComparador poligonos={polys} />
      </div>

      <div className="grid3">
        <div className="bigstat">
          <div className="lab">Maleza acuática removida</div>
          <div className="v num">19,0 <small>ha</small></div>
          <div className="sub">Acumulado a mayo de 2026 · línea base = 0 ha</div>
        </div>
        <div className="panel chart-b">
          <div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="trend" /> Hectáreas removidas (acumulado)</h3></div>
          <div className="bars" style={{ height: 150 }}>
            {M.serie.map(([n, v]) => (
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

      <div className="note"><b>Datos reales</b>: {nPolys} polígonos de limpieza cargados en la geodatabase; remoción reportada <b>Marzo 6,06 ha · Abril 15,71 ha · Mayo 19,0 ha</b> (acumulado).
        <b>*</b> Volumen de biomasa retirada pendiente; imágenes satelitales por fecha pendientes de cargar.</div>
      <Footer />
    </>
  )
}
