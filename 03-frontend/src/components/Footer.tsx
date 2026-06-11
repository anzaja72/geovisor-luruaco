interface Props {
  onImport?: () => void
  onMonitoreo?: () => void
}

/** Barra inferior con accesos al geoservicio, protocolo y acciones por rol. */
export default function Footer({ onImport, onMonitoreo }: Props) {
  return (
    <footer className="dash-footer">
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>📍</span> Geoservicio WFS del indicador
      </a>
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>🔗</span> Protocolo del indicador de calidad
      </a>
      {onMonitoreo && (
        <button className="footer-btn footer-btn-admin" onClick={onMonitoreo}>
          <span aria-hidden>📝</span> Registrar monitoreo
        </button>
      )}
      {onImport && (
        <button className="footer-btn footer-btn-admin" onClick={onImport}>
          <span aria-hidden>📥</span> Importar datos
        </button>
      )}
    </footer>
  )
}
