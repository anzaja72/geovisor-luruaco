import { ESCALA } from '../lib/quality'
import type { Usuario } from '../lib/auth'

interface Props {
  usuario?: Usuario | null
  onLogout?: () => void
}

/** Cabecera de marca con la escala de calificación y la sesión activa. */
export default function BrandHeader({ usuario, onLogout }: Props) {
  return (
    <header className="brand-header">
      <div className="brand-left">
        <div className="brand-logo" aria-hidden>🌿</div>
        <div className="brand-titles">
          <h1>Geovisor de Restauración Ecológica</h1>
          <p>Índice de Calidad — Ciénaga de Luruaco, Atlántico</p>
        </div>
      </div>

      <div className="brand-right">
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

        {usuario && (
          <div className="brand-user">
            <span className="user-name" title={usuario.email}>
              {usuario.nombre}
            </span>
            <span className={`user-rol rol-${usuario.rol}`}>{usuario.rol}</span>
            <button className="user-logout" onClick={onLogout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
