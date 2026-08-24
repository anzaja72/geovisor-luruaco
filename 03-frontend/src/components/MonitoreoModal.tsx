import { useEffect, useState } from 'react'
import { postForm } from '../lib/api'
import { encolar, esErrorDeRed, pendientes, sincronizar } from '../lib/offlineQueue'
import type { GeoFeature } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  estaciones: GeoFeature[]
  onSaved: () => void
  componenteActivo?: string // pestaña inicial según el componente abierto
}

type Tab = 'restauracion' | 'maleza' | 'fauna' | 'ficorremediacion' | 'gobernanza'

const TABS: [Tab, string][] = [
  ['restauracion', 'Restauración'],
  ['maleza', 'Veg. Acuática'],
  ['fauna', 'Fauna'],
  ['ficorremediacion', 'Ficorremediación'],
  ['gobernanza', 'Gobernanza'],
]

const FECHAS_REST = ['Linea base', 'Monitoreo 1', 'Monitoreo 2', 'Monitoreo 3', 'Monitoreo 4']
const FECHAS_MALEZA = ['Línea base', 'Marzo', 'Abril', 'Mayo']
const CAT_ARBOL = ['Brinzal', 'Latizal', 'Fustal']
const BIOTA = ['fitoplancton', 'zooplancton', 'ictioplancton', 'macroinvertebrados_bentonicos', 'perifiton', 'ictiofauna']
const hoy = new Date().toISOString().slice(0, 10)

const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
const int = (v: string) => (v.trim() === '' ? undefined : parseInt(v, 10))

/** Formulario "Registrar Monitoreo" con una pestaña por componente. */
export default function MonitoreoModal({ open, onClose, estaciones, onSaved, componenteActivo }: Props) {
  const inicial = (TABS.some(([t]) => t === componenteActivo) ? componenteActivo : 'restauracion') as Tab
  const [tab, setTab] = useState<Tab>(inicial)
  const [f, setF] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pend, setPend] = useState(0)

  // Al abrir, arranca en la pestaña del componente activo y limpia el formulario.
  useEffect(() => {
    if (open) {
      setTab(inicial)
      setF({})
      setOk(null)
      setError(null)
      setPend(pendientes())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }))
  const cambiarTab = (t: Tab) => { setTab(t); setF({}); setOk(null); setError(null) }

  // Construye {path, body} según la pestaña.
  function preparar(): { path: string; body: Record<string, unknown> } {
    switch (tab) {
      case 'restauracion':
        return {
          path: '/api/restauracion/arbol',
          body: {
            fecha: f.fecha || 'Linea base', id_parcela: f.parcela, cobertura: f.cobertura,
            especie: f.especie, nombre_comun: f.nombre_comun, altura_max: num(f.altura || ''),
            n_fustes: int(f.fustes || ''), dap_eq: num(f.dap || ''), categoria_arbol: f.categoria,
          },
        }
      case 'maleza':
        return {
          path: '/api/maleza/limpieza',
          body: {
            fecha: f.fecha || 'Mayo', area_ha: num(f.area || ''),
            borde_km: num(f.borde || ''), observaciones: f.obs,
          },
        }
      case 'fauna':
        return {
          path: '/api/fauna/observacion',
          body: {
            nombre_comun: f.nombre_comun, nombre_cientifico: f.nombre_cientifico,
            cobertura_vegetal: f.cobertura, n_individuos: int(f.individuos || ''),
            lugar_percha: f.percha, habito: f.habito, comportamiento: f.comportamiento,
            fecha: f.fecha, hora: f.hora, observacion: f.observacion,
          },
        }
      case 'ficorremediacion':
        return {
          path: '/api/ficor/medicion',
          body: {
            tipo: f.tipo || 'agua', fecha: f.fecha || hoy, variable: f.variable,
            categoria: f.categoria, grupo: f.grupo, valor: num(f.valor || ''),
            unidad: f.unidad, abundancia: int(f.abundancia || ''), riqueza: int(f.riqueza || ''),
          },
        }
      case 'gobernanza':
        return {
          path: '/api/gobernanza/actividad',
          body: {
            actividad: f.actividad, cantidad: int(f.cantidad || '') ?? 0,
            participantes: int(f.participantes || '') ?? 0, ubicacion: f.ubicacion, fecha: f.fecha,
          },
        }
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null); setOk(null)
    const { path, body } = preparar()
    try {
      await postForm(path, body)
      setOk('✅ Registro guardado')
      setF({})
      onSaved()
    } catch (err) {
      if (esErrorDeRed(err)) {
        // Sin internet: se guarda en el navegador y se subirá al reconectar.
        setPend(encolar(path, body))
        setOk('📴 Sin conexión — guardado en el navegador. Se subirá solo al recuperar internet.')
        setF({})
      } else {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    } finally {
      setBusy(false)
    }
  }

  const sincronizarAhora = async () => {
    setBusy(true)
    const r = await sincronizar()
    setPend(r.pendientes)
    if (r.enviados > 0) { setOk(`✅ ${r.enviados} registro(s) subido(s)`); onSaved() }
    setBusy(false)
  }

  const tipoFicor = f.tipo || 'agua'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Registrar Monitoreo</h3>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="mon-tabs">
          {TABS.map(([t, label]) => (
            <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => cambiarTab(t)}>
              {label}
            </button>
          ))}
        </div>

        <form className="modal-body" onSubmit={submit}>
          {tab === 'restauracion' && (
            <div className="form-grid">
              <label>Monitoreo
                <select value={f.fecha ?? 'Linea base'} onChange={set('fecha')}>
                  {FECHAS_REST.map((v) => <option key={v} value={v}>{v}</option>)}
                </select></label>
              <label>Parcela *
                <input list="parcelas" value={f.parcela ?? ''} onChange={set('parcela')} placeholder="BD1, BR1…" required /></label>
              <datalist id="parcelas">
                {estaciones.map((e) => e.properties?.codigo_punto).filter(Boolean).map((c) => <option key={String(c)} value={String(c)} />)}
              </datalist>
              <label>Cobertura
                <input value={f.cobertura ?? ''} onChange={set('cobertura')} placeholder="Bosque denso…" /></label>
              <label>Especie
                <input value={f.especie ?? ''} onChange={set('especie')} placeholder="nombre científico" /></label>
              <label>Nombre común
                <input value={f.nombre_comun ?? ''} onChange={set('nombre_comun')} /></label>
              <label>Altura (m)
                <input type="number" step="0.01" value={f.altura ?? ''} onChange={set('altura')} /></label>
              <label>Nº fustes
                <input type="number" value={f.fustes ?? ''} onChange={set('fustes')} /></label>
              <label>DAP (cm)
                <input type="number" step="0.001" value={f.dap ?? ''} onChange={set('dap')} /></label>
              <label>Categoría
                <select value={f.categoria ?? ''} onChange={set('categoria')}>
                  <option value="">—</option>
                  {CAT_ARBOL.map((v) => <option key={v} value={v}>{v}</option>)}
                </select></label>
            </div>
          )}

          {tab === 'maleza' && (
            <div className="form-grid">
              <label>Monitoreo
                <select value={f.fecha ?? 'Mayo'} onChange={set('fecha')}>
                  {FECHAS_MALEZA.map((v) => <option key={v} value={v}>{v}</option>)}
                </select></label>
              <label>Área removida (ha)
                <input type="number" step="0.01" value={f.area ?? ''} onChange={set('area')} /></label>
              <label>Borde intervenido (km)
                <input type="number" step="0.01" value={f.borde ?? ''} onChange={set('borde')} /></label>
              <label className="col2">Observaciones
                <input value={f.obs ?? ''} onChange={set('obs')} /></label>
            </div>
          )}

          {tab === 'fauna' && (
            <div className="form-grid">
              <label>Nombre común
                <input value={f.nombre_comun ?? ''} onChange={set('nombre_comun')} placeholder="p. ej. Garza" /></label>
              <label>Nombre científico
                <input value={f.nombre_cientifico ?? ''} onChange={set('nombre_cientifico')} placeholder="p. ej. Ardea alba" /></label>
              <label>Cobertura vegetal
                <input value={f.cobertura ?? ''} onChange={set('cobertura')} /></label>
              <label>Nº de individuos
                <input type="number" value={f.individuos ?? ''} onChange={set('individuos')} /></label>
              <label>Lugar de percha
                <input value={f.percha ?? ''} onChange={set('percha')} /></label>
              <label>Hábito
                <input value={f.habito ?? ''} onChange={set('habito')} placeholder="terrestre, arbóreo…" /></label>
              <label className="col2">Comportamiento
                <input value={f.comportamiento ?? ''} onChange={set('comportamiento')} /></label>
              <label>Fecha
                <input type="date" value={f.fecha ?? hoy} onChange={set('fecha')} /></label>
              <label>Hora
                <input type="time" value={f.hora ?? ''} onChange={set('hora')} /></label>
              <label className="col2">Observación
                <input value={f.observacion ?? ''} onChange={set('observacion')} /></label>
            </div>
          )}

          {tab === 'ficorremediacion' && (
            <div className="form-grid">
              <label>Tipo
                <select value={tipoFicor} onChange={set('tipo')}>
                  <option value="agua">Calidad de agua</option>
                  <option value="sedimento">Calidad de sedimentos</option>
                  <option value="biota">Biota</option>
                </select></label>
              <label>Fecha
                <input type="date" value={f.fecha ?? hoy} onChange={set('fecha')} /></label>
              {tipoFicor === 'sedimento' && (
                <label>Categoría
                  <select value={f.categoria ?? 'metal_pesado'} onChange={set('categoria')}>
                    <option value="metal_pesado">Metal pesado</option>
                    <option value="plaguicida">Plaguicida</option>
                  </select></label>
              )}
              {tipoFicor === 'biota' ? (
                <>
                  <label>Grupo
                    <select value={f.grupo ?? 'fitoplancton'} onChange={set('grupo')}>
                      {BIOTA.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                    </select></label>
                  <label>Abundancia
                    <input type="number" value={f.abundancia ?? ''} onChange={set('abundancia')} /></label>
                  <label>Riqueza
                    <input type="number" value={f.riqueza ?? ''} onChange={set('riqueza')} /></label>
                </>
              ) : (
                <>
                  <label>Variable
                    <input value={f.variable ?? ''} onChange={set('variable')} placeholder={tipoFicor === 'agua' ? 'pH, OD, DBO5…' : 'Hg, Pb, Clorpirifos…'} /></label>
                  <label>Valor
                    <input type="number" step="0.0001" value={f.valor ?? ''} onChange={set('valor')} /></label>
                  <label>Unidad
                    <input value={f.unidad ?? ''} onChange={set('unidad')} placeholder={tipoFicor === 'agua' ? 'mg/L' : 'mg/kg'} /></label>
                </>
              )}
            </div>
          )}

          {tab === 'gobernanza' && (
            <div className="form-grid">
              <label className="col2">Actividad *
                <input value={f.actividad ?? ''} onChange={set('actividad')} placeholder="Socialización, taller…" required /></label>
              <label>Nº eventos
                <input type="number" value={f.cantidad ?? ''} onChange={set('cantidad')} /></label>
              <label>Participantes
                <input type="number" value={f.participantes ?? ''} onChange={set('participantes')} /></label>
              <label>Fecha/monitoreo
                <input value={f.fecha ?? ''} onChange={set('fecha')} placeholder="Línea base, Monitoreo 1…" /></label>
              <label>Ubicación
                <input value={f.ubicacion ?? ''} onChange={set('ubicacion')} /></label>
            </div>
          )}

          {error && <p className="modal-err">⚠️ {error}</p>}
          {ok && <p className="modal-ok">{ok}</p>}
          {pend > 0 && (
            <div className="offline-pend">
              <span>📴 {pend} registro(s) pendiente(s) de subir en este navegador.</span>
              <button type="button" onClick={sincronizarAhora} disabled={busy}>Sincronizar ahora</button>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cerrar</button>
            <button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar registro'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
