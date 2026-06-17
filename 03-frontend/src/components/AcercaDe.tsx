/** Sección "Acerca de": información institucional del proyecto. */
export default function AcercaDe() {
  return (
    <div className="acerca">
      <div className="acerca-hero">
        <img src="/logo-proyecto.jpeg" alt="Restauración Luruaco" className="acerca-logo" />
        <div>
          <h2>Restauración Ecológica y Resiliencia Climática</h2>
          <p>Ciénaga de Luruaco — Departamento del Atlántico</p>
        </div>
      </div>

      <p className="acerca-intro">
        Plataforma web geoespacial integrada con una geodatabase ambiental que permite
        almacenar, visualizar, analizar y monitorear la evolución de las intervenciones de
        restauración ecológica en la Ciénaga de Luruaco, con trazabilidad temporal.
      </p>

      <div className="acerca-grid">
        <div className="acerca-card">
          <h3>El proyecto</h3>
          <dl>
            <dt>Contrato</dt><dd>No. 324 de 2025</dd>
            <dt>Objeto</dt><dd>Servicio tecnológico para la creación y diseño de Geodatabase</dd>
            <dt>Ubicación</dt><dd>Ciénaga de Luruaco, Atlántico, Colombia</dd>
            <dt>Responsable técnico</dt><dd>Ángel Zambrano Jaraba</dd>
          </dl>
        </div>

        <div className="acerca-card">
          <h3>¿Qué puede hacer?</h3>
          <ul>
            <li>Visualizar áreas de intervención, coberturas, estratos, técnicas y malezas</li>
            <li>Consultar puntos de monitoreo y sitios de validación (meta / cumplimiento)</li>
            <li>Comparar el estado antes y después de las intervenciones</li>
            <li>Integrar insumos del dron (ortofoto, MDT, MDS, curvas, Corine)</li>
            <li>Generar reportes en PDF, Excel y CSV</li>
          </ul>
        </div>
      </div>

      <div className="acerca-entidad">
        <img src="/logo-cra.jpeg" alt="Corporación Autónoma Regional del Atlántico" />
        <div>
          <strong>Entidad financiadora</strong>
          <span>Corporación Autónoma Regional del Atlántico — C.R.A.</span>
        </div>
      </div>
    </div>
  )
}
