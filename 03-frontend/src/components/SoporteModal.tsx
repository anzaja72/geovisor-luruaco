// Soporte: acuerdo de nivel de servicio, canal de reporte y datos de la versión
// desplegada. Cubre el acompañamiento técnico de la cláusula 5.6 del contrato.

/** Buzón de soporte. Provisional: se sustituirá por la cuenta institucional del proyecto. */
export const CORREO_SOPORTE = 'angelzambranojaraba@gmail.com'

/** Tiempo de respuesta comprometido, en horas hábiles desde el envío del correo. */
const ANS_HORAS = 4

/** Datos de la versión desplegada, inyectados por Vite en el build. */
const VERSION = {
  fecha: new Date(__BUILD_DATE__).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  }),
  commit: __BUILD_COMMIT__,
}

export default function SoporteModal({ onClose }: { onClose: () => void }) {
  const asunto = encodeURIComponent('Geovisor Luruaco — reporte de incidencia')
  const cuerpo = encodeURIComponent(
    `Descripción de lo ocurrido:\n\n\n` +
    `Componente donde sucede:\n\n` +
    `Pasos para reproducirlo:\n1.\n2.\n\n` +
    `Versión: ${VERSION.commit} (${VERSION.fecha})\n` +
    `Navegador: ${navigator.userAgent}\n`,
  )

  return (
    <div className="ov on" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="info" style={{ maxWidth: 560, width: '100%' }}>
        <div className="ih">
          <h3>Soporte técnico</h3>
          <button className="x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="ib">
          <div className="sop-ans">
            <b>Respuesta en {ANS_HORAS} horas</b>
            <span>Las solicitudes se atienden por correo electrónico y se responden dentro de las
              {' '}{ANS_HORAS} horas siguientes al envío del mensaje.</span>
          </div>

          <p>La plataforma cuenta con acompañamiento técnico durante la ejecución del contrato
            y un año más, conforme a la cláusula 5.6.</p>

          <h4 className="aj-t">Reportar una incidencia</h4>
          <p>Describa qué ocurrió, en qué componente y cómo reproducirlo. El correo se abre con
            esos campos y con la versión y el navegador ya incluidos, que es lo primero que se
            necesita para revisarlo.</p>
          <a className="aj-guardar" style={{ display: 'inline-block', textDecoration: 'none' }}
            href={`mailto:${CORREO_SOPORTE}?subject=${asunto}&body=${cuerpo}`}>
            Escribir reporte de incidencia
          </a>

          <h4 className="aj-t">Contactos</h4>
          <dl className="aj-datos">
            <dt>Soporte técnico</dt>
            <dd>MC Consultorías &amp; Capacitación S.A.S.<br />
              <a href={`mailto:${CORREO_SOPORTE}`}>{CORREO_SOPORTE}</a></dd>
            <dt>Dirección del proyecto</dt>
            <dd>Unión Temporal Restauración Luruaco</dd>
            <dt>Entidad</dt>
            <dd>Corporación Autónoma Regional del Atlántico — C.R.A.<br />
              <a href="https://www.crautonoma.gov.co" target="_blank" rel="noreferrer">crautonoma.gov.co</a></dd>
          </dl>

          <h4 className="aj-t">Documentación</h4>
          <p>Los manuales de usuario y de administrador, el diccionario de datos y la
            especificación de la API se entregan con el repositorio del proyecto, en la
            carpeta <code>docs/</code>.</p>

          <dl className="aj-datos">
            <dt>Versión</dt><dd>{VERSION.commit}</dd>
            <dt>Publicada</dt><dd>{VERSION.fecha}</dd>
            <dt>Contrato</dt><dd>324 de 2025 · C.R.A.</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}
