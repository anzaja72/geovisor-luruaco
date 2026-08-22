import { useEffect, useMemo, useState } from 'react'
import MapView, { claseCobertura, CLASE_COLOR, type GeovisorMapProps } from '../components/MapView'
import { Footer, Icon } from './Shell'
import { RESTAURACION as R, ACTIVA_TXT, PASIVA_TXT } from './data'
import { fetchIndicadoresRestauracion, type IndicadoresRestauracion } from '../lib/api'

type MapProps = GeovisorMapProps

const fmt = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ABUND_COLORS = ['#1b6d24', '#2f8a45', '#4f9e63', '#00585f', '#1565c0', '#6f9e3a', '#8a9e7a', '#7a8a93', '#aab2bb']
const sinPrefijo = (n: string) => n.replace(/^[\d.]+\.?\s*/, '')

const FECHAS: [string, string][] = [
  ['Linea base', 'Línea base (2024)'], ['Monitoreo 1', 'Monitoreo 1'], ['Monitoreo 2', 'Monitoreo 2'],
  ['Monitoreo 3', 'Monitoreo 3'], ['Monitoreo 4', 'Monitoreo 4'],
]

export default function RestauracionView(map: MapProps) {
  const [info, setInfo] = useState<{ t: string; v: string; b: string } | null>(null)
  const [fecha, setFecha] = useState('Linea base')
  const [ind, setInd] = useState<IndicadoresRestauracion | null>(null)
  const [live, setLive] = useState(false)
  // Cobertura seleccionada en el mapa: 'todas' o la clave de una clase Corine.
  const [cobSel, setCobSel] = useState('todas')

  // Indicadores reales desde el backend para la fecha seleccionada; si falla, data.ts (solo Línea base).
  useEffect(() => {
    const ac = new AbortController()
    setLive(false)
    fetchIndicadoresRestauracion(fecha, ac.signal)
      .then((d) => { if (!ac.signal.aborted && !d.sin_datos) { setInd(d); setLive(true) } })
      .catch(() => { if (!ac.signal.aborted && fecha !== 'Linea base') setInd(null) })
    return () => ac.abort()
  }, [fecha])

  // Datos de presentación: del backend si hay, si no (solo Línea base) del módulo estático.
  const d = useMemo(() => {
    const usar = ind && ind.fecha === fecha ? ind : (fecha === 'Linea base' ? null : ind)
    return {
      riqueza: usar?.riqueza ?? R.riqueza,
      densidad: usar?.densidad_ha ?? R.densidad,
      areaBasal: usar?.area_basal_ha ?? R.areaBasal,
      activa: usar?.activa_ha ?? R.activaHa,
      pasiva: usar?.pasiva_ha ?? R.pasivaHa,
      individuos: usar?.individuos ?? R.individuos,
      fustes: usar?.fustes ?? R.fustes,
      altura: usar?.altura_media ?? R.alturaMedia,
      shannon: usar?.shannon ?? R.shannon,
      parcelas: usar ? usar.parcelas.map((p) => [p.codigo, p.densidad_ha] as [string, number]) : R.parcelas,
      abundancia: usar
        ? usar.abundancia.map((a, i) => [a.nombre, a.pct, ABUND_COLORS[i % ABUND_COLORS.length]] as [string, number, string])
        : R.abundancia,
      coberturas: usar
        ? usar.coberturas.map((c) => [c.clase, claseCobertura(c.clase), c.ha, c.pct] as [string, string, number, number])
        : R.coberturas.map(([n, , ha, pct]) => [n, claseCobertura(n), ha, pct] as [string, string, number, number]),
      totalHa: usar?.area_total_ha ?? 48.01,
    }
  }, [ind, fecha])

  // Opciones del selector: una entrada por clase Corine disponible (sin duplicar clave).
  const opcionesCob = useMemo(() => {
    const seen = new Set<string>()
    const out: [string, string][] = []
    for (const [n, clave] of d.coberturas) {
      if (seen.has(clave)) continue
      seen.add(clave)
      out.push([clave, sinPrefijo(n)])
    }
    return out
  }, [d.coberturas])

  // Si al cambiar de fecha la clase elegida ya no existe, se vuelve a "todas".
  const cobSelValida = cobSel === 'todas' || opcionesCob.some(([c]) => c === cobSel) ? cobSel : 'todas'
  // El mapa recibe undefined = todas visibles, o un set de una sola clase.
  const activasEfectivas = cobSelValida === 'todas' ? undefined : new Set([cobSelValida])

  const sinMediciones = fecha !== 'Linea base' && d.individuos === 0
  const maxD = Math.max(...d.parcelas.map((p) => p[1]), 1)
  const topRiq = ind && ind.fecha === fecha ? [...ind.parcelas].sort((a, b) => b.riqueza - a.riqueza).slice(0, 2) : null

  return (
    <>
      {/* Selectores: línea de tiempo + cobertura en el mapa */}
      <div className="filters">
        <div className="fl"><Icon id="calendar" style={{ width: 17, height: 17, stroke: 'var(--muted)' }} />
          <span className="lab">Línea de tiempo</span>
          <select value={fecha} onChange={(e) => setFecha(e.target.value)}>
            {FECHAS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select></div>
        <div className="fl"><Icon id="layers" style={{ width: 17, height: 17, stroke: 'var(--muted)' }} />
          <span className="lab">Cobertura en el mapa</span>
          <select value={cobSelValida} onChange={(e) => setCobSel(e.target.value)}>
            <option value="todas">Todas las coberturas</option>
            {opcionesCob.map(([clave, label]) => (
              <option key={clave} value={clave}>{label}</option>
            ))}
          </select></div>
        {live && !sinMediciones && <span className="badge-soft" style={{ background: '#e3f5e6', color: '#1b6d24', borderColor: '#bfe6c6' }}>● Datos en vivo (backend)</span>}
        {sinMediciones && <span className="badge-soft">Sin mediciones registradas para esta fecha</span>}
      </div>

      {/* KPIs (izquierda) + tabla resumen de coberturas (derecha), al mismo nivel */}
      <div className="rest-top">
        <div className="kpis k6">
          <div className="kpi"><div className="top"><span className="chip"><Icon id="leaf" /></span><span className="lab">Riqueza de especies</span></div><div className="val num">{d.riqueza}</div></div>
          <div className="kpi"><div className="top"><span className="chip"><Icon id="tree" /></span><span className="lab">Densidad / ha</span></div><div className="val num">{d.densidad}</div></div>
          <div className="kpi alt"><div className="top"><span className="chip"><Icon id="target" /></span><span className="lab">Área basal / ha</span></div><div className="val num">{d.areaBasal.toLocaleString('es-CO', { minimumFractionDigits: 2 })} <small>m²</small></div></div>
          <div className="kpi click" onClick={() => setInfo({ t: 'Restauración activa', v: `${fmt(d.activa)} ha`, b: ACTIVA_TXT })}>
            <div className="top"><span className="chip"><Icon id="sprout" /></span><span className="lab">Restauración activa</span></div><div className="val num">{fmt(d.activa)} <small>ha</small></div></div>
          <div className="kpi click alt" onClick={() => setInfo({ t: 'Restauración pasiva', v: `${fmt(d.pasiva)} ha`, b: PASIVA_TXT })}>
            <div className="top"><span className="chip"><Icon id="shield" /></span><span className="lab">Restauración pasiva</span></div><div className="val num">{fmt(d.pasiva)} <small>ha</small></div></div>
          <div className="kpi" title="No incluido en el censo"><div className="top"><span className="chip"><Icon id="users" /></span><span className="lab">Individuos sembrados</span></div><div className="val">s/d<sup style={{ color: 'var(--secondary)' }}>*</sup></div></div>
        </div>

        <div className="cob-table-wrap">
          <div className="cob-table-title"><b>Resumen total de coberturas</b></div>
          <table className="cob-table">
            <thead>
              <tr><th>Cobertura</th><th className="num">Área (ha)</th><th className="num">%</th></tr>
            </thead>
            <tbody>
              {d.coberturas.map(([n, clave, ha, pct]) => (
                <tr
                  key={n}
                  className={cobSelValida !== 'todas' && cobSelValida !== clave ? 'dim' : ''}
                  onClick={() => setCobSel(cobSelValida === clave ? 'todas' : clave)}
                >
                  <td><span className="dot" style={{ background: CLASE_COLOR[clave] }} />{sinPrefijo(n)}</td>
                  <td className="num">{ha.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="num">{pct.toLocaleString('es-CO', { minimumFractionDigits: 2 })}%</td>
                </tr>
              ))}
              <tr className="total">
                <td>Total monitoreado</td>
                <td className="num">{d.totalHa.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                <td className="num">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="substat">
        <span><Icon id="tree" style={{ width: 15, height: 15, stroke: 'var(--muted)' }} /> <b>{d.individuos}</b> individuos censados</span>
        <span><Icon id="ruler" style={{ width: 15, height: 15, stroke: 'var(--muted)' }} /> altura media <b>{d.altura} m</b></span>
        <span><Icon id="activity" style={{ width: 15, height: 15, stroke: 'var(--muted)' }} /> Shannon H′ <b>{d.shannon}</b></span>
        <span><Icon id="leaf" style={{ width: 15, height: 15, stroke: 'var(--muted)' }} /> <b>{d.fustes}</b> fustes medidos</span>
      </div>

      <div className="panel map-full">
        <div className="ph"><h3><Icon id="layers" /> Geovisor del Predio</h3>
          <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
        <MapView {...map} componente="restauracion" coberturasActivas={activasEfectivas} />
      </div>

      <div className="grid3">
        <div className="panel chart-b"><div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="tree" /> Densidad por parcela (ind/ha)</h3></div>
          {sinMediciones ? (
            <div className="empty"><Icon id="tree" /><b>Sin mediciones</b><p>Esta fecha aún no tiene árboles censados.</p></div>
          ) : (
            <div className="bars">
              {d.parcelas.map(([n, v]) => (
                <div key={n} className={`b ${v ? '' : 'zero'}`} title={`${n}: ${v} ind/ha`}
                  style={{ height: v ? `${Math.max(8, (v / maxD) * 100)}%` : '2%' }}>
                  {v > 0 && <em>{v}</em>}<span>{n}</span></div>
              ))}
            </div>
          )}</div>
        <div className="panel chart-b"><div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="leaf" /> Riqueza por parcela</h3></div>
          {sinMediciones ? (
            <div className="empty"><Icon id="leaf" /><b>Sin mediciones</b><p>Esta fecha aún no tiene especies registradas.</p></div>
          ) : (
            <svg viewBox="0 0 320 150" style={{ width: '100%', height: 150 }}>
              <polyline fill="none" stroke="#1b6d24" strokeWidth="2.2" points="12,28 32,55 52,138 72,138 92,138 112,138 132,138 152,138 172,138 192,138 212,138 232,138 252,138 272,138 292,138" />
              <g fill="#1b6d24"><circle cx="12" cy="28" r="3.2" /><circle cx="32" cy="55" r="3.2" /></g>
              <text x="12" y="20" fontSize="8" fill="#5b6470">{topRiq ? `${topRiq[0].codigo}: ${topRiq[0].riqueza}` : 'BD1: 8'}</text>
              <text x="34" y="48" fontSize="8" fill="#5b6470">{topRiq ? `${topRiq[1].codigo}: ${topRiq[1].riqueza}` : 'BR1: 6'}</text>
              <text x="150" y="150" fontSize="8" fill="#5b6470" textAnchor="middle">resto: 0–1 sp.</text></svg>
          )}</div>
        <div className="panel chart-b"><div className="ph" style={{ padding: '0 0 8px', border: 0 }}><h3><Icon id="grid" /> Abundancia por especies</h3></div>
          {sinMediciones ? (
            <div className="empty"><Icon id="grid" /><b>Sin mediciones</b><p>Esta fecha aún no tiene abundancia por especie.</p></div>
          ) : (
            <div className="treemap">
              {d.abundancia.map(([n, pct, color], i) => (
                <div key={n} className="tm"
                  style={{ gridColumn: i < 2 ? 'span 3' : 'span 2', gridRow: i < 2 ? 'span 2' : undefined, background: color }}>
                  {n}<small>{pct}%</small></div>
              ))}
            </div>
          )}</div>
      </div>

      <div className="note"><b>{live && !sinMediciones ? 'Datos en vivo' : 'Datos reales'}</b> del censo <i>arboles_resumen.xlsx</i> — Línea base: 75 árboles, 136 fustes, 12 especies, 15 parcelas.
        {' '}<b>Fórmulas:</b> Densidad = N ÷ área muestreada · Área basal = Σ[π·(DAP/200)²] ÷ área muestreada · Riqueza = especies distintas · Shannon H′ = −Σ(pᵢ·ln pᵢ).
        {' '}<b>Supuesto:</b> parcela = 0,1 ha (→ 1,5 ha); confirmar con Yurani. <b>*</b> «Individuos sembrados» no está en el censo. Monitoreos 1–4 aún sin mediciones de campo.</div>

      <Footer />

      {info && (
        <div className="ov on" onClick={(e) => { if (e.target === e.currentTarget) setInfo(null) }}>
          <div className="info">
            <div className="ih"><h3>{info.t}</h3><b>{info.v}</b><button className="x" onClick={() => setInfo(null)}>×</button></div>
            <div className="ib">{info.b}</div>
          </div>
        </div>
      )}
    </>
  )
}
