import { useState } from 'react'
import { importarArchivo, type ImportResult } from '../lib/api'

interface Props {
  open: boolean
  onClose: () => void
  onImported: () => void
}

/** Modal de importación de datos (GeoJSON / CSV). */
export default function ImportModal({ open, onClose, onImported }: Props) {
  const [capa, setCapa] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [srid, setSrid] = useState('4326')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const formato: 'csv' | 'geojson' = file?.name.toLowerCase().endsWith('.csv')
    ? 'csv'
    : 'geojson'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!capa.trim() || !file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const text = await file.text()
      const r = await importarArchivo(capa.trim(), formato, text, parseInt(srid) || 4326)
      setResult(r)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la importación')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Importar datos a la plataforma</h3>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label>
            Nombre de la capa
            <input
              value={capa}
              onChange={(e) => setCapa(e.target.value)}
              placeholder="p. ej. curvas_nivel"
              required
            />
          </label>
          <label>
            Archivo (GeoJSON o CSV)
            <input
              type="file"
              accept=".geojson,.json,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          {formato === 'csv' && (
            <label>
              SRID de origen (para CSV)
              <input value={srid} onChange={(e) => setSrid(e.target.value)} placeholder="4326" />
            </label>
          )}
          <p className="modal-hint">
            Formato detectado: <strong>{file ? formato.toUpperCase() : '—'}</strong>. El CSV
            requiere columnas de longitud/latitud (o este/norte + SRID).
          </p>
          {error && <p className="modal-err">⚠️ {error}</p>}
          {result && (
            <p className="modal-ok">
              ✅ {result.insertados} elementos importados en «{result.capa}»
              {result.errores > 0 ? ` (${result.errores} con error)` : ''}.
            </p>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" disabled={busy}>
              {busy ? 'Importando…' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
