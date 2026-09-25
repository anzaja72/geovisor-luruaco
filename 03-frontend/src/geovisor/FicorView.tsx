import { useEffect, useMemo, useState } from 'react'
import { Footer, Icon } from './Shell'
import MapView, { type GeovisorMapProps, type PuntoFicor } from '../components/MapView'
import OrtoFoto from '../components/OrtoFoto'
import GaleriaFotos from '../components/GaleriaFotos'
import BarrasGrupo from '../components/BarrasGrupo'
import { FICOR_BIOTA } from './data'
import { construirFicor, FICOR_VACIO, type DatosFicor } from './ficorDatos'
import {
  calcularICA, categoriaICA, ESCALA_ICA, fmtICA, PESOS_ICA,
  type ResultadoICA, type SubindiceCalculado,
} from '../lib/ica'
import { GUIAS_SEDIMENTO, nivelSedimento, NIVELES_SEDIMENTO } from '../lib/sedimentos'
import { fetchFicorMediciones } from '../lib/api'

const EVIDENCIA_FICOR = Array.from(
  { length: 11 },
  (_, i) => `/evidencia-ficor/foto-${String(i + 1).padStart(2, '0')}.jpg`,
)
const FOTOS_LABORATORIO = Array.from(
  { length: 6 },
  (_, i) => `/laboratorio/lab-${String(i + 1).padStart(2, '0')}.webp`,
)

const num = (v: number, d = 2) =>
  v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })

// ---------------------------------------------------------------------------
// Piezas de presentación
// ---------------------------------------------------------------------------

/** Barra de calificación del índice, como la cabecera del geovisor de referencia. */
function EscalaCalificacion({ activa }: { activa?: string }) {
  return (
    <div className="ica-escala" role="img" aria-label="Escala de calificación del índice">
      {ESCALA_ICA.map((c) => (
        <div
          key={c.key}
          className={c.key === activa ? 'on' : ''}
          style={{ background: c.color, color: c.text }}
          title={`${c.label} · ${c.rango} · ${c.simbolo}`}
        >
          {c.label}
        </div>
      ))}
    </div>
  )
}

/** Medidor semicircular del índice (0–1). */
function Medidor({ valor }: { valor: number | null }) {
  const meta = categoriaICA(valor)
  const W = 190, H = 112, cx = W / 2, cy = 96, r = 74
  const arco = (desde: number, hasta: number) => {
    const p = (t: number) => {
      const a = Math.PI * (1 - t)
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)]
    }
    const [x1, y1] = p(desde), [x2, y2] = p(hasta)
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  const tramos: [number, number, string][] = [
    [0, 0.25, ESCALA_ICA[0].color], [0.25, 0.5, ESCALA_ICA[1].color],
    [0.5, 0.7, ESCALA_ICA[2].color], [0.7, 0.9, ESCALA_ICA[3].color],
    [0.9, 1, ESCALA_ICA[4].color],
  ]
  const t = valor == null ? null : Math.min(1, Math.max(0, valor))
  const ang = t == null ? null : Math.PI * (1 - t)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ica-medidor" aria-hidden="true">
      {tramos.map(([a, b, col]) => (
        <path key={a} d={arco(a, b)} stroke={col} strokeWidth="13" fill="none" strokeLinecap="butt" />
      ))}
      {ang != null && (
        <>
          <line
            x1={cx} y1={cy}
            x2={cx + (r - 17) * Math.cos(ang)} y2={cy - (r - 17) * Math.sin(ang)}
            stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4.4" fill="var(--ink)" />
        </>
      )}
      <text x={cx} y={cy - 26} textAnchor="middle" className="ica-medidor-v" fill={meta.color}>
        {fmtICA(valor)}
      </text>
      <text x={10} y={cy + 12} className="ica-medidor-e">0</text>
      <text x={W - 10} y={cy + 12} textAnchor="end" className="ica-medidor-e">1</text>
    </svg>
  )
}

/** Comportamiento histórico de una variable: un barra por campaña. */
function Historico({
  titulo, unidad, serie, colorear,
}: {
  titulo: string
  unidad: string
  serie: { campana: string; valor: number | null; sub: number | null }[]
  colorear: boolean
}) {
  const vals = serie.map((s) => s.valor).filter((v): v is number => v != null)
  const max = Math.max(...vals, 1)
  return (
    <div className="ica-hist">
      <div className="t">{titulo} <small>{unidad}</small></div>
      <div className="barras">
        {serie.map((s) => {
          const meta = categoriaICA(s.sub)
          const alto = s.valor == null ? 0 : Math.max(6, (s.valor / max) * 100)
          return (
            <div key={s.campana} className="b" title={`${s.campana}: ${s.valor ?? 'sin dato'} ${unidad}`}>
              <em>{s.valor == null ? '—' : num(s.valor, s.valor < 10 ? 2 : 0)}</em>
              <i style={{ height: `${alto}%`, background: colorear ? meta.color : 'var(--cra-cian)' }} />
              <span>{s.campana}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function FicorView(map: GeovisorMapProps) {
  const [campana, setCampana] = useState('')
  const [punto, setPunto] = useState('')
  const [iVar, setIVar] = useState(0)
  const [matriz, setMatriz] = useState<'agua' | 'sedimentos' | 'biota'>('agua')

  // Todo lo que se dibuja sale de la geodatabase. Los valores de demostración
  // están en las mismas tablas, marcados; el aviso depende de esa marca, no de
  // una constante, así que se apaga solo cuando se carguen los reales.
  const [datos, setDatos] = useState<DatosFicor>(FICOR_VACIO)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    const ac = new AbortController()
    fetchFicorMediciones(ac.signal)
      .then((d) => {
        if (ac.signal.aborted) return
        const f = construirFicor(d)
        setDatos(f)
        setCampana(f.campanas[f.campanas.length - 1]?.nombre ?? '')
        setPunto(f.puntos[0] ?? '')
        setCargando(false)
      })
      .catch(() => { if (!ac.signal.aborted) setCargando(false) })
    return () => ac.abort()
  }, [])

  const CAMPANAS = datos.campanas
  const PUNTOS = datos.puntos
  const AGUA = datos.agua

  /** ICA de cada punto en la campaña activa. */
  const resultados = useMemo(() => {
    const m = new Map<string, ResultadoICA>()
    const lecturas = AGUA[campana] ?? {}
    for (const p of PUNTOS) {
      const l = lecturas[p]
      if (l) m.set(p, calcularICA(l))
    }
    return m
  }, [campana, AGUA, PUNTOS])

  /** Lo que el mapa necesita de cada punto: su calificación en la campaña
   *  activa y el informe completo del laboratorio para el pop-up. */
  const ficorMapa = useMemo(() => {
    const m: Record<string, PuntoFicor> = {}
    const porPunto = datos.detalle[campana] ?? {}
    for (const p of PUNTOS) {
      const r = resultados.get(p)
      const meta = r ? r.categoria : categoriaICA(null)
      m[p] = {
        campana,
        ica: r?.ica ?? null,
        etiqueta: meta.label,
        color: meta.color,
        texto: meta.text,
        mediciones: porPunto[p] ?? [],
      }
    }
    return m
  }, [campana, datos.detalle, PUNTOS, resultados])

  const res = resultados.get(punto)
  const idxPunto = PUNTOS.indexOf(punto)
  const irPunto = (d: number) =>
    setPunto(PUNTOS[(idxPunto + d + PUNTOS.length) % PUNTOS.length] ?? punto)

  const sub: SubindiceCalculado | undefined = res?.subindices[iVar]

  /** Serie de la variable seleccionada, a través de las campañas. */
  const serieVar = useMemo(
    () => CAMPANAS.map((c) => {
      const l = AGUA[c.nombre]?.[punto]
      if (!l) return { campana: c.nombre, valor: null, sub: null }
      const s = calcularICA(l).subindices[iVar]
      return { campana: c.nombre, valor: s.valor, sub: s.subindice }
    }),
    [punto, iVar, CAMPANAS, AGUA],
  )

  /** Serie del índice completo, a través de las campañas. */
  const serieICA = useMemo(
    () => CAMPANAS.map((c) => {
      const l = AGUA[c.nombre]?.[punto]
      const r = l ? calcularICA(l) : null
      return { campana: c.nombre, valor: r?.ica ?? null, sub: r?.ica ?? null }
    }),
    [punto, CAMPANAS, AGUA],
  )

  const biota = datos.biota[campana] ?? {}
  const sedimentos = datos.sedimentos[campana] ?? {}

  const fecha = CAMPANAS.find((c) => c.nombre === campana)?.fecha

  return (
    <>
      <div className="page-title">
        <h2><Icon id="flask" /> Ficorremediación</h2>
        <EscalaCalificacion activa={res?.categoria.key} />
      </div>

      {datos.demostracion && (
        <div className="aviso-demo">
          <b>Datos de demostración.</b> Los valores que se muestran están en la geodatabase
          marcados como prueba: sirven para revisar el tablero mientras el laboratorio no
          entrega los resultados del muestreo. No son mediciones y no deben citarse como
          tales. Al cargarse los resultados reales, este aviso desaparece solo.
        </div>
      )}
      {!cargando && CAMPANAS.length === 0 && (
        <div className="aviso-demo">
          <b>Sin mediciones.</b> La geodatabase todavía no tiene registros de
          ficorremediación. En cuanto se carguen —por el formulario o por importación—
          aparecerán aquí.
        </div>
      )}

      <div className="filters">
        <span className="lab" style={{ alignSelf: 'center' }}>Campaña</span>
        <div className="tl">
          {CAMPANAS.map((c) => (
            <button key={c.nombre} className={campana === c.nombre ? 'on' : ''} onClick={() => setCampana(c.nombre)}>
              {c.nombre}
            </button>
          ))}
        </div>
        {fecha && <span className="badge-soft">Muestreo del {fecha}</span>}
      </div>

      {/* ── Índice: medidor, ficha del punto e histórico por variable ─────── */}
      <div className="ica-grid">
        <div className="panel ica-col">
          <div className="ph"><h3><Icon id="target" /> Índice de calidad del agua</h3></div>
          <div className="ica-medidor-caja">
            <Medidor valor={res?.ica ?? null} />
            <div className="ica-cat" style={{ background: res?.categoria.color, color: res?.categoria.text }}>
              {res?.categoria.label ?? 'SIN DATO'}
            </div>
            <div className="ica-tiles">
              <div><em>Variables</em><b>{res ? `${res.disponibles} / 6` : '—'}</b></div>
              <div><em>Cobertura</em><b>{res ? `${Math.round(res.cobertura * 100)} %` : '—'}</b></div>
              <div><em>Campañas</em><b>{CAMPANAS.length}</b></div>
              <div><em>Puntos</em><b>{PUNTOS.length}</b></div>
            </div>
            <p className="ica-nota">
              ICA del IDEAM, seis variables. Ponderación: conductividad, oxígeno, sólidos, DQO y
              N/P al {PESOS_ICA.od * 100} % cada una, pH al {PESOS_ICA.ph * 100} %.
            </p>
          </div>
        </div>

        <div className="panel ica-col">
          <div className="ph">
            <h3><Icon id="pin" /> Punto de muestreo</h3>
            <span className="ica-pager">
              <button onClick={() => irPunto(-1)} aria-label="Punto anterior">‹</button>
              {idxPunto + 1} de {PUNTOS.length}
              <button onClick={() => irPunto(1)} aria-label="Punto siguiente">›</button>
            </span>
          </div>
          <div className="ica-ficha">
            <div className="cab">
              <b>{punto}</b>
              <span style={{ background: res?.categoria.color, color: res?.categoria.text }}>
                {fmtICA(res?.ica ?? null)} · {res?.categoria.label ?? 'SIN DATO'}
              </span>
            </div>
            <div className="vars">
              {res?.subindices.map((s, i) => {
                const meta = categoriaICA(s.subindice)
                return (
                  <button
                    key={s.clave}
                    type="button"
                    className={`var${i === iVar ? ' on' : ''}`}
                    onClick={() => setIVar(i)}
                    title={s.detalle ?? `${s.nombre} · peso ${s.peso}`}
                  >
                    <i style={{ background: meta.color }} />
                    <span className="n">{s.nombre}</span>
                    <span className="v">
                      {s.valor == null ? '—' : num(s.valor, s.valor < 10 ? 2 : 0)}
                      <small> {s.unidad}</small>
                    </span>
                    <span className="s">{s.subindice == null ? '—' : num(s.subindice)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="panel ica-col">
          <div className="ph">
            <h3><Icon id="trend" /> Comportamiento histórico</h3>
            <span className="ica-pager">
              <button onClick={() => setIVar((i) => (i + 5) % 6)} aria-label="Variable anterior">‹</button>
              {iVar + 1} de 6
              <button onClick={() => setIVar((i) => (i + 1) % 6)} aria-label="Variable siguiente">›</button>
            </span>
          </div>
          <div className="chart-b">
            {sub && (
              <Historico
                titulo={sub.nombre}
                unidad={sub.unidad}
                serie={serieVar}
                colorear
              />
            )}
            <Historico
              titulo="Índice de calidad del agua"
              unidad="0 – 1"
              serie={serieICA}
              colorear
            />
            {sub?.detalle && <p className="ica-detalle">{sub.detalle}</p>}
          </div>
        </div>
      </div>

      {/* ── Mapa ──────────────────────────────────────────────────────────── */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="layers" /> Geovisor de Ficorremediación</h3>
          <div className="tools"><Icon id="search" /><Icon id="layers" /></div></div>
        <MapView {...map} componente="ficorremediacion" ficor={ficorMapa} className="map tall" />
      </div>

      {/* ── Matrices: agua, sedimentos, biota ─────────────────────────────── */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph">
          <h3><Icon id="grid" /> Resultados por matriz</h3>
          <div className="mon-tabs" style={{ padding: 0, border: 0 }}>
            {([['agua', 'Agua'], ['sedimentos', 'Sedimentos'], ['biota', 'Biota']] as const).map(([k, n]) => (
              <button key={k} type="button" className={matriz === k ? 'on' : ''} onClick={() => setMatriz(k)}>{n}</button>
            ))}
          </div>
        </div>

        {matriz === 'agua' && (
          <div className="chart-b" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="fauna-table">
              <thead><tr>
                <th>Variable</th><th>Unidad</th>
                {PUNTOS.map((p) => <th key={p}>{p}</th>)}
                <th>Peso</th>
              </tr></thead>
              <tbody>
                {resultados.get(PUNTOS[0])?.subindices.map((s, i) => (
                  <tr key={s.clave}>
                    <td><b>{s.nombre}</b></td>
                    <td>{s.unidad}</td>
                    {PUNTOS.map((p) => {
                      const si = resultados.get(p)?.subindices[i]
                      const meta = categoriaICA(si?.subindice)
                      return (
                        <td key={p}>
                          <span className="celda-cal" style={{ borderColor: meta.color }}>
                            {si?.valor == null ? '—' : num(si.valor, si.valor < 10 ? 2 : 0)}
                          </span>
                        </td>
                      )
                    })}
                    <td>{s.peso}</td>
                  </tr>
                ))}
                <tr className="fila-total">
                  <td colSpan={2}><b>Índice de calidad del agua</b></td>
                  {PUNTOS.map((p) => {
                    const r = resultados.get(p)
                    return (
                      <td key={p}>
                        <span className="celda-cal fuerte" style={{ background: r?.categoria.color, color: r?.categoria.text }}>
                          {fmtICA(r?.ica ?? null)}
                        </span>
                      </td>
                    )
                  })}
                  <td>1,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {matriz === 'sedimentos' && (
          <>
            <div className="leyenda-sed">
              {(['bajo', 'ocasional', 'frecuente', 'sin_guia'] as const).map((k) => (
                <span key={k} title={NIVELES_SEDIMENTO[k].descripcion}>
                  <i style={{ background: NIVELES_SEDIMENTO[k].color }} />{NIVELES_SEDIMENTO[k].label}
                </span>
              ))}
              <small>Guías CCME para sedimento de agua dulce · ISQG y PEL</small>
            </div>
            <div className="chart-b" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="fauna-table">
                <thead><tr>
                  <th>Sustancia</th><th>ISQG</th><th>PEL</th>
                  {PUNTOS.map((p) => <th key={p}>{p}</th>)}
                </tr></thead>
                <tbody>
                  {GUIAS_SEDIMENTO.map((g) => {
                    const vals = sedimentos[g.variable] ?? []
                    return (
                      <tr key={g.variable}>
                        <td><b>{g.nombre}</b> <small>({g.variable})</small></td>
                        <td>{g.isqg ?? '—'}</td>
                        <td>{g.pel ?? '—'}</td>
                        {PUNTOS.map((p, i) => {
                          const v = vals[i]
                          const meta = nivelSedimento(g.variable, v)
                          return (
                            <td key={p}>
                              <span className="celda-cal" style={{ borderColor: meta.color }} title={meta.descripcion}>
                                {v == null ? '—' : num(v, v < 1 ? 3 : 1)}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {matriz === 'biota' && (
          <div className="grid2" style={{ padding: 14, margin: 0 }}>
            <BarrasGrupo
              titulo="Riqueza por grupo (número de especies)"
              color="var(--cra-verde)"
              datos={FICOR_BIOTA.map((b) => ({ grupo: b.nombre, valor: biota[b.id]?.[0] ?? 0 }))}
            />
            <BarrasGrupo
              titulo="Abundancia por grupo (individuos)"
              color="var(--cra-cian)"
              datos={FICOR_BIOTA.map((b) => ({ grupo: b.nombre, valor: biota[b.id]?.[1] ?? 0 }))}
            />
          </div>
        )}
      </div>

      {/* ── Laboratorio ───────────────────────────────────────────────────── */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="camera" /> Laboratorio de Microalgas y Planta de Bioaumentación</h3>
          <span className="badge-soft">Área de interés · 0,2727 ha</span></div>
        <div style={{ padding: 8 }}>
          <OrtoFoto
            src="/ortofotos/laboratorio.webp"
            bounds={[[10.5193770, -75.0983922], [10.5228541, -75.0937417]]}
            height={400}
          />
        </div>
        <div style={{ padding: '0 8px 10px' }}>
          <GaleriaFotos fotos={FOTOS_LABORATORIO} />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="camera" /> Registro fotográfico — punto de bioremediación</h3>
          <span className="badge-soft">{EVIDENCIA_FICOR.length} fotos</span></div>
        <GaleriaFotos fotos={EVIDENCIA_FICOR} />
      </div>

      <div className="note">
        <b>Cómo se califica.</b> El índice es el <b>ICA del IDEAM</b> de seis variables, que es el
        oficial para agua dulce continental — no el ICAM, que aplica a aguas marinas y costeras.
        El oxígeno disuelto se convierte a porcentaje de saturación con la ecuación de Benson–Krause
        a partir de la temperatura de la misma muestra, tomando 10 m s. n. m. como altitud de la
        ciénaga. Los sedimentos se contrastan con las guías CCME (ISQG y PEL); los plaguicidas no
        tienen guía publicada y se reportan sin calificar. La biota no se califica con escala: se
        presenta como riqueza y abundancia por grupo.
      </div>
      <Footer />
    </>
  )
}
