import { ESCALA } from '../lib/quality'

/** Cabecera de marca con la escala de calificación de índice (estilo ICAM). */
export default function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-left">
        <div className="brand-logo" aria-hidden>🌿</div>
        <div className="brand-titles">
          <h1>Geovisor de Restauración Ecológica</h1>
          <p>Índice de Calidad — Ciénaga de Luruaco, Atlántico</p>
        </div>
      </div>

      <div className="brand-scale">
        <span className="scale-caption">Escala de calificación de índice</span>
        <div className="scale-chips">
          {ESCALA.map((c) => (
            <span
              key={c.key}
              className="scale-chip"
              style={{ background: c.color, color: c.text }}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
