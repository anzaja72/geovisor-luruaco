import { useState } from 'react'
import { Footer, Icon } from './Shell'
import { API_URL, authHeaders } from '../lib/api'

const TIPOS = [
  { id: 'sitios', nombre: 'Áreas de intervención y restauración', desc: 'Áreas, estado y avance por sitio', icon: 'sprout' },
  { id: 'coberturas', nombre: 'Coberturas vegetales (Corine)', desc: 'Cambios y evolución de coberturas', icon: 'leaf' },
  { id: 'monitoreos', nombre: 'Histórico de monitoreos', desc: 'Mediciones por indicador y estación', icon: 'pin' },
  { id: 'indicadores', nombre: 'Consolidado de indicadores', desc: 'Indicadores ambientales por categoría', icon: 'activity' },
  { id: 'insumos', nombre: 'Catálogo de insumos dron', desc: 'Productos del levantamiento (ortofoto, MDT, MDS…)', icon: 'layers' },
] as const

const FORMATOS = [
  { id: 'csv', label: 'CSV' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
] as const

/** Descarga de reportes (spec §7): CSV / Excel / PDF — mismo backend, diseño del shell actual. */
export default function ReportesView() {
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
    <>
      <div className="page-title">
        <h2><Icon id="download" /> Descarga de Datos y Reportes</h2>
        <span className="sub">Reportes automáticos de la geodatabase en CSV, Excel o PDF</span>
      </div>

      {error && <div className="note" style={{ borderColor: 'var(--poor)', color: 'var(--poor)' }}>⚠️ {error}</div>}

      <div className="comp-grid">
        {TIPOS.map((t) => (
          <div key={t.id} className="comp">
            <div className="top">
              <span className="ico" style={{ background: 'var(--sec-c)', color: 'var(--secondary)' }}>
                <Icon id={t.icon} /></span>
              <h3>{t.nombre}</h3>
            </div>
            <p>{t.desc}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATOS.map((f) => {
                const key = `${t.id}-${f.id}`
                return (
                  <button key={f.id} className="cchip" disabled={busy === key}
                    style={{ font: 'inherit', cursor: busy === key ? 'wait' : 'pointer', opacity: busy === key ? .6 : 1 }}
                    onClick={() => descargar(t.id, f.id)}>
                    <Icon id="download" style={{ width: 14, height: 14 }} />
                    {busy === key ? 'Generando…' : f.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="note" style={{ marginTop: 14 }}>Los reportes se generan al momento a partir de la geodatabase en vivo. <b>Indicadores ambientales</b> aún no tiene mediciones cargadas — el reporte saldrá vacío hasta que existan registros.</div>
      <Footer />
    </>
  )
}
