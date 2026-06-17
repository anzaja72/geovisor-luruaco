interface Props {
  onImport?: () => void
  onMonitoreo?: () => void
}

/** Barra inferior: créditos institucionales y acciones por rol. */
export default function Footer({ onImport, onMonitoreo }: Props) {
  return (
    <footer className="dash-footer">
      <div className="footer-credito">
        <img src="/logo-cra.jpeg" alt="C.R.A." className="footer-cra" />
        <span>
          Proyecto financiado por la <strong>Corporación Autónoma Regional del Atlántico (C.R.A.)</strong>
          {' · '}Contrato 324 de 2025
        </span>
      </div>
      <div className="footer-actions">
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
      </div>
    </footer>
  )
}
