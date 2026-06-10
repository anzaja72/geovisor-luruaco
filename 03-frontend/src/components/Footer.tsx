/** Barra inferior con accesos al geoservicio y protocolo (estilo ICAM). */
export default function Footer() {
  return (
    <footer className="dash-footer">
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>📍</span> Geoservicio WFS del indicador
      </a>
      <a className="footer-btn" href="#" onClick={(e) => e.preventDefault()}>
        <span aria-hidden>🔗</span> Protocolo del indicador de calidad
      </a>
    </footer>
  )
}
