/** Barra inferior con accesos al geoservicio, protocolo e importación (según rol). */
export default function Footer({ onImport }: { onImport?: () => void }) {
  return (
    <footer className="dash-footer">
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>📍</span> Geoservicio WFS del indicador
      </a>
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>🔗</span> Protocolo del indicador de calidad
      </a>
      {onImport && (
        <button className="footer-btn footer-btn-admin" onClick={onImport}>
          <span aria-hidden>📥</span> Importar datos
        </button>
      )}
    </footer>
  )
}
