import { useState } from 'react'
import { crearMonitoreo } from '../lib/api'
import { getUsuario } from '../lib/auth'
import type { GeoFeature } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  estaciones: GeoFeature[] // puntos_monitoreo para asociar la medición
}

const INDICADORES_SUGERIDOS = [
  'pH',
  'oxigeno_disuelto',
  'temperatura_agua',
  'conductividad',
  'turbiedad',
  'cobertura_vegetal',
  'altura_promedio_vegetacion',
  'riqueza_especies',
  'supervivencia_plantulas',
]

/** Registro de mediciones de monitoreo (roles administrador/técnico). */
export default function MonitoreoModal({ open, onClose, estaciones }: Props) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [estacion, setEstacion] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [indicador, setIndicador] = useState('')
  const [valor, setValor] = useState('')
  const [unidad, setUnidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const r = await crearMonitoreo({
        estacion_id: estacion ? parseInt(estacion) : undefined,
        fecha,
        indicador: indicador.trim(),
        valor: valor.trim() === '' ? undefined : parseFloat(valor),
        unidad: unidad.trim() || undefined,
        responsable: getUsuario()?.nombre,
        observaciones: observaciones.trim() || undefined,
      })
      setOk(`Monitoreo #${r.id} registrado.`)
      setIndicador('')
      setValor('')
      setObservaciones('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error registrando el monitoreo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Registrar monitoreo</h3>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label>
            Estación / punto de control (opcional)
            <select value={estacion} onChange={(e) => setEstacion(e.target.value)}>
              <option value="">— Sin estación —</option>
              {estaciones.map((p) => (
                <option key={p.properties.id} value={p.properties.id}>
                  {p.properties.codigo_punto ?? `Punto ${p.properties.id}`}
                  {p.properties.nombre_punto ? ` · ${p.properties.nombre_punto}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Indicador
            <input
              list="indicadores"
              value={indicador}
              onChange={(e) => setIndicador(e.target.value)}
              placeholder="ej. oxigeno_disuelto"
              required
            />
            <datalist id="indicadores">
              {INDICADORES_SUGERIDOS.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
          </label>
          <div className="modal-row">
            <label>
              Valor
              <input
                type="number"
                step="any"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="7.2"
              />
            </label>
            <label>
              Unidad
              <input
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="mg/L, %, m…"
              />
            </label>
          </div>
          <label>
            Observaciones
            <input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="opcional"
            />
          </label>

          {error && <p className="modal-err">⚠️ {error}</p>}
          {ok && <p className="modal-ok">✅ {ok} Puede registrar otra medición.</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cerrar</button>
            <button type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
