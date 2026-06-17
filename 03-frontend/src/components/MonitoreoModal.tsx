import { useState } from 'react'
import { crearMonitoreo, crearPunto } from '../lib/api'
import { getUsuario } from '../lib/auth'
import type { GeoFeature } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  estaciones: GeoFeature[]
  onSaved: () => void // recarga el mapa al guardar
}

const INDICADORES_SUGERIDOS = [
  'pH', 'oxigeno_disuelto', 'temperatura_agua', 'conductividad', 'turbiedad',
  'cobertura_vegetal', 'altura_promedio_vegetacion', 'riqueza_especies',
  'supervivencia_plantulas', 'observacion',
]

/** Registro de monitoreos/observaciones en estación existente o nueva ubicación GPS. */
export default function MonitoreoModal({ open, onClose, estaciones, onSaved }: Props) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [modo, setModo] = useState<'existente' | 'nueva'>('existente')
  const [estacion, setEstacion] = useState('')
  const [nombreUbic, setNombreUbic] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [indicador, setIndicador] = useState('')
  const [valor, setValor] = useState('')
  const [unidad, setUnidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [busy, setBusy] = useState(false)
  const [geoBusy, setGeoBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError('El navegador no permite geolocalización')
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLon(pos.coords.longitude.toFixed(6))
        setGeoBusy(false)
      },
      () => {
        setError('No se pudo obtener tu ubicación')
        setGeoBusy(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      let estacionId: number | undefined
      if (modo === 'nueva') {
        const la = parseFloat(lat)
        const lo = parseFloat(lon)
        if (Number.isNaN(la) || Number.isNaN(lo)) throw new Error('Ingresa latitud y longitud válidas')
        const p = await crearPunto({
          nombre_punto: nombreUbic.trim() || 'Observación',
          tipo_monitoreo: 'observacion',
          descripcion: observaciones.trim() || undefined,
          latitud: la,
          longitud: lo,
        })
        estacionId = p.id
      } else {
        if (!estacion) throw new Error('Selecciona una estación')
        estacionId = parseInt(estacion)
      }

      const r = await crearMonitoreo({
        estacion_id: estacionId,
        fecha,
        indicador: indicador.trim() || 'observacion',
        valor: valor.trim() === '' ? undefined : parseFloat(valor),
        unidad: unidad.trim() || undefined,
        responsable: getUsuario()?.nombre,
        observaciones: observaciones.trim() || undefined,
      })
      setOk(
        modo === 'nueva'
          ? `Ubicación y monitoreo #${r.id} registrados. Ya aparece en el mapa.`
          : `Monitoreo #${r.id} registrado.`,
      )
      onSaved()
      setIndicador('')
      setValor('')
      setObservaciones('')
      if (modo === 'nueva') {
        setLat('')
        setLon('')
        setNombreUbic('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error registrando')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Registrar monitoreo / observación</h3>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div className="seg-control">
            <button
              type="button"
              className={modo === 'existente' ? 'active' : ''}
              onClick={() => setModo('existente')}
            >
              Estación existente
            </button>
            <button
              type="button"
              className={modo === 'nueva' ? 'active' : ''}
              onClick={() => setModo('nueva')}
            >
              Nueva ubicación (GPS)
            </button>
          </div>

          {modo === 'existente' ? (
            <label>
              Estación / punto
              <select value={estacion} onChange={(e) => setEstacion(e.target.value)}>
                <option value="">— Selecciona —</option>
                {estaciones.map((p) => (
                  <option key={p.properties.id} value={p.properties.id}>
                    {p.properties.codigo_punto ?? `Punto ${p.properties.id}`}
                    {p.properties.nombre_punto ? ` · ${p.properties.nombre_punto}` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Nombre de la ubicación
                <input
                  value={nombreUbic}
                  onChange={(e) => setNombreUbic(e.target.value)}
                  placeholder="p. ej. Punto de erosión sector norte"
                />
              </label>
              <div className="modal-row">
                <label>
                  Latitud
                  <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="10.607" required />
                </label>
                <label>
                  Longitud
                  <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="-75.150" required />
                </label>
              </div>
              <button type="button" className="geo-btn" onClick={usarMiUbicacion} disabled={geoBusy}>
                {geoBusy ? 'Obteniendo…' : '📍 Usar mi ubicación actual'}
              </button>
            </>
          )}

          <label>
            Fecha
            <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Indicador / situación
            <input
              list="indicadores"
              value={indicador}
              onChange={(e) => setIndicador(e.target.value)}
              placeholder="p. ej. cobertura_vegetal / presencia de malezas"
              required
            />
            <datalist id="indicadores">
              {INDICADORES_SUGERIDOS.map((i) => <option key={i} value={i} />)}
            </datalist>
          </label>
          <div className="modal-row">
            <label>
              Valor
              <input type="number" step="any" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="7.2" />
            </label>
            <label>
              Unidad
              <input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="mg/L, %, m…" />
            </label>
          </div>
          <label>
            Observaciones
            <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="opcional" />
          </label>

          {error && <p className="modal-err">⚠️ {error}</p>}
          {ok && <p className="modal-ok">✅ {ok}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cerrar</button>
            <button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
