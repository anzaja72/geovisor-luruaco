import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps } from '../components/MapView'
import { FICOR_AGUA, FICOR_SEDIMENTOS, FICOR_BIOTA } from './data'

export default function FicorView(map: GeovisorMapProps) {
  return (
    <>
      <div className="page-title">
        <h2><Icon id="flask" /> Ficorremediación</h2>
        <span className="badge-soft">Estructura lista · datos en captura</span>
      </div>

      <div className="kpis k4" style={{ marginBottom: 18 }}>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="pin" /></span><span className="lab">Puntos georreferenciados</span></div>
          <div className="val num">5</div><div className="trend up">con evidencia fotográfica</div></div>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="droplet" /></span><span className="lab">Muestreo de agua</span></div><div className="val pend">s/d</div></div>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="flask" /></span><span className="lab">Muestreo de sedimentos</span></div><div className="val pend">s/d</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="grid" /></span><span className="lab">Grupos de biota</span></div><div className="val num">{FICOR_BIOTA.length}</div></div>
      </div>

      <div className="panel">
        <div className="ph"><h3><Icon id="layers" /> Geovisor de Ficorremediación</h3>
          <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
        <MapView {...map} componente="ficorremediacion" className="map tall" />
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="droplet" /> Calidad del agua</h3><span className="badge-soft">En captura</span></div>
        <div className="wq">
          {FICOR_AGUA.map(([l, u]) => (
            <div key={l} className="cell"><div className="l">{l}</div>
              <div className="v pend num">— <small>{u}</small></div>
              <div className="status" style={{ color: 'var(--muted)' }}><span className="d" style={{ background: '#cfd6dd' }} /> Sin dato</div></div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="flask" /> Calidad de sedimentos</h3><span className="badge-soft">En captura</span></div>
        <div className="chart-b">
          {FICOR_SEDIMENTOS.map((g) => (
            <div key={g.categoria} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>{g.categoria}</div>
              <div className="wq">
                {g.variables.map(([l, u]) => (
                  <div key={l} className="cell"><div className="l">{l}</div>
                    <div className="v pend num">— <small>{u}</small></div>
                    <div className="status" style={{ color: 'var(--muted)' }}><span className="d" style={{ background: '#cfd6dd' }} /> Sin dato</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="grid" /> Biota</h3><span className="badge-soft">En captura</span></div>
        <div className="kpis k6" style={{ padding: 14, margin: 0 }}>
          {FICOR_BIOTA.map((b) => (
            <div key={b.id} className="kpi">
              <div className="top"><span className="chip"><Icon id={b.icon} /></span><span className="lab">{b.nombre}</span></div>
              <div className="val pend">s/d</div>
            </div>
          ))}
        </div>
      </div>

      <div className="note"><b>Componente innovador del proyecto.</b> La estructura (puntos georreferenciados, calidad de agua/sedimentos y biota) queda lista para poblarse con cada campaña.
        Hoy se cuenta con <b>5 puntos georreferenciados</b> en el mapa, con evidencia fotográfica asociada. <b>*</b> Datos por capturar en campo / laboratorio
        (<code>ficor_calidad_agua</code>, <code>ficor_calidad_sedimentos</code>, <code>ficor_biota</code>).</div>
      <Footer />
    </>
  )
}
