import { useEffect, useState } from 'react'
import { Footer, Icon } from './Shell'
import { fetchIndicadoresRestauracion, type IndicadoresRestauracion } from '../lib/api'
import { MALEZA, GOBERNANZA } from './data'
import type { CompId } from './data'

const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function TransversalView({ onNav }: { onNav: (c: CompId) => void }) {
  const go = (c: CompId) => (e: React.MouseEvent) => { e.preventDefault(); onNav(c) }
  const [ind, setInd] = useState<IndicadoresRestauracion | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchIndicadoresRestauracion('Linea base', ac.signal)
      .then((d) => { if (!ac.signal.aborted && !d.sin_datos) setInd(d) })
      .catch(() => { /* fallback a constantes */ })
    return () => ac.abort()
  }, [])

  const area = ind?.area_total_ha ?? 48
  const activa = ind?.activa_ha ?? 41.72
  const especies = ind?.riqueza ?? 12
  const parcelas = ind ? ind.parcelas.length : 15
  const participantes = GOBERNANZA.actividades.reduce((s, [, , p]) => s + p, 0)
  const eventosGobernanza = GOBERNANZA.actividades.reduce((s, [, c]) => s + c, 0)

  return (
    <>
      <div className="page-title">
        <h2><Icon id="grid" /> Dashboard Transversal</h2>
        <span className="sub">Indicadores consolidados del proyecto · Contrato 324 de 2025{ind ? ' · datos en vivo' : ''}</span>
      </div>

      <div className="kpis k6" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="leaf" /></span><span className="lab">Área analizada</span></div><div className="val num">{area} <small>ha</small></div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="sprout" /></span><span className="lab">Restauración activa</span></div><div className="val num">{fmt(activa)} <small>ha</small></div></div>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="trash" /></span><span className="lab">Maleza removida</span></div><div className="val num">{MALEZA.acumulado} <small>ha</small></div></div>
        <div className="kpi alt"><div className="top"><span className="chip"><Icon id="pin" /></span><span className="lab">Puntos de monitoreo</span></div><div className="val num">{parcelas}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="tree" /></span><span className="lab">Especies registradas</span></div><div className="val num">{especies}</div></div>
        <div className="kpi blue"><div className="top"><span className="chip"><Icon id="users" /></span><span className="lab">Participantes</span></div><div className="val num">{participantes}</div></div>
      </div>

      <div className="comp-cards">
        <a className="comp-card" href="#" onClick={go('restauracion')} style={{ textDecoration: 'none' }}>
          <div className="h"><span className="ic"><Icon id="sprout" /></span><div><b>Restauración Ecológica</b><span>Coberturas · parcelas · técnicas</span></div></div>
          <div className="mini"><span><b>{area} ha</b>analizadas</span><span><b>{parcelas}</b>parcelas</span><span><b>{especies}</b>especies</span></div>
          <div className="progress"><i style={{ width: '70%' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Línea base completa · monitoreos 1–4 pendientes</div>
        </a>
        <a className="comp-card" href="#" onClick={go('maleza')} style={{ textDecoration: 'none' }}>
          <div className="h"><span className="ic" style={{ background: '#dbe7fb', color: 'var(--primary)' }}><Icon id="waves" /></span><div><b>Vegetación Acuática</b><span>Remoción en el borde de la laguna</span></div></div>
          <div className="mini"><span><b>{MALEZA.acumulado} ha</b>removidas</span><span><b>{MALEZA.poligonos}</b>polígonos</span><span><b>3</b>monitoreos</span></div>
          <div className="progress"><i style={{ width: '55%', background: 'var(--primary)' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Mar 6,06 → Abr 15,71 → May 19 ha</div>
        </a>
        <a className="comp-card" href="#" onClick={go('ficorremediacion')} style={{ textDecoration: 'none' }}>
          <div className="h"><span className="ic" style={{ background: 'var(--tert-c)', color: 'var(--tertiary)' }}><Icon id="flask" /></span><div><b>Ficorremediación</b><span>Inoculación · calidad del agua</span></div></div>
          <div className="mini"><span><b>1</b>punto</span><span><b>11</b>fotos</span><span><b>s/d</b>parámetros</span></div>
          <div className="progress"><i style={{ width: '18%', background: 'var(--tertiary)' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Estructura lista · datos en captura</div>
        </a>
        <a className="comp-card" href="#" onClick={go('fauna')} style={{ textDecoration: 'none' }}>
          <div className="h"><span className="ic" style={{ background: '#eceff2', color: 'var(--muted)' }}><Icon id="paw" /></span><div><b>Monitoreo de Fauna</b><span>Avistamientos · cámaras trampa</span></div></div>
          <div className="mini"><span><b>s/d</b>especies</span><span><b>s/d</b>cámaras</span></div>
          <div className="progress"><i style={{ width: '8%', background: '#9aa6b0' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>En definición con Darío</div>
        </a>
        <a className="comp-card" href="#" onClick={go('gobernanza')} style={{ textDecoration: 'none' }}>
          <div className="h"><span className="ic" style={{ background: '#dbe7fb', color: 'var(--primary)' }}><Icon id="users" /></span><div><b>Gobernanza Ambiental</b><span>Socializaciones · talleres · capacitaciones</span></div></div>
          <div className="mini"><span><b>{eventosGobernanza}</b>eventos</span><span><b>{participantes}</b>participantes</span><span><b>{GOBERNANZA.actividades.length}</b>tipos</span></div>
          <div className="progress"><i style={{ width: '100%' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Datos reales · Contrato 324 de 2025</div>
        </a>
      </div>

      <div className="note" style={{ marginTop: 14 }}><b>Vista transversal de gobernanza:</b> consolida el avance de los componentes para validar los indicadores contractuales.
        Los valores reales provienen del censo forestal y de los registros de limpieza; Ficorremediación y Fauna muestran su estructura y se poblarán conforme avance la ejecución.</div>
      <Footer />
    </>
  )
}
