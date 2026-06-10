import { useState } from 'react'
import { API_URL, authHeaders } from '../lib/api'

const TIPOS = [
  { id: 'sitios', nombre: 'Áreas de intervención y restauración', desc: 'Áreas, estado y avance por sitio' },
  { id: 'coberturas', nombre: 'Coberturas vegetales (Corine)', desc: 'Cambios y evolución de coberturas' },
  { id: 'monitoreos', nombre: 'Histórico de monitoreos', desc: 'Mediciones por indicador y estación' },
  { id: 'indicadores', nombre: 'Consolidado de indicadores', desc: 'Indicadores ambientales por categoría' },
  { id: 'insumos', nombre: 'Catálogo de insumos dron', desc: 'Productos del levantamiento (ortofoto, MDT, MDS…)' },
]

const FORMATOS = [
  { id: 'csv', label: 'CSV' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
]

/** Módulo de reportes (spec §7): descarga en CSV / Excel / PDF. */
export default function ReportsPanel() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const descargar = async (tipo: string, formato: string) => {
    const key = `${tipo}-${formato}`
    setBusy(key)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/reportes/${tipo}?formato=${formato}`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.${formato}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error descargando el reporte')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="reports">
      <h2>Descarga de datos y reportes</h2>
      <p className="reports-sub">
        Genera reportes automáticos de la geodatabase en formato CSV, Excel o PDF.
      </p>
      {error && <p className="modal-err">⚠️ {error}</p>}
      <div className="reports-grid">
        {TIPOS.map((t) => (
          <div className="report-card" key={t.id}>
            <h3>{t.nombre}</h3>
            <p>{t.desc}</p>
            <div className="report-actions">
              {FORMATOS.map((f) => (
                <button
                  key={f.id}
                  disabled={busy === `${t.id}-${f.id}`}
                  onClick={() => descargar(t.id, f.id)}
                >
                  {busy === `${t.id}-${f.id}` ? '…' : `⬇ ${f.label}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
