import '../styles/landing.css'

interface Props {
  onEnter: () => void
}

const FUNCIONES = [
  { icon: '🗺️', t: 'Geovisor interactivo', d: 'Ortofoto del dron, capas conmutables y consulta espacial sobre el predio.' },
  { icon: '🌱', t: 'Capas temáticas', d: 'Coberturas, estratos, técnicas de restauración y presencia de malezas.' },
  { icon: '🕒', t: 'Comparación temporal', d: 'Vista antes/después con mapas sincronizados por periodo.' },
  { icon: '📊', t: 'Monitoreo y validación', d: 'Indicadores con meta y porcentaje de cumplimiento por sitio.' },
  { icon: '📄', t: 'Reportes descargables', d: 'Exportación de la información en PDF, Excel y CSV.' },
  { icon: '🏛️', t: 'Capas oficiales IGAC', d: 'Catastro, pendientes y agrología vía geoservicios del IGAC.' },
]

const PREGUNTAS = [
  '¿Dónde se intervino?',
  '¿Qué técnica se aplicó?',
  '¿Cómo estaba antes y cómo está ahora?',
  '¿Qué evidencias demuestran que funciona?',
]

const INSUMOS = ['Ortofotomosaico', 'MDT / MDS', 'Coberturas Corine', 'Curvas de nivel', 'Puntos GPS']

/** Página de presentación previa al inicio de sesión. */
export default function LandingPage({ onEnter }: Props) {
  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-brand">
          <img src="/logo-proyecto.jpeg" alt="Restauración Luruaco" />
          <span>Restauración Luruaco</span>
        </div>
        <button className="lp-btn" onClick={onEnter}>
          Ingresar a la plataforma
        </button>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <img src="/logo-proyecto.jpeg" alt="Restauración Luruaco" className="lp-hero-logo" />
          <h1>Geovisor de Restauración Ecológica</h1>
          <p className="lp-hero-sub">Ciénaga de Luruaco — Departamento del Atlántico</p>
          <p className="lp-hero-lead">
            Sistema de información geográfica que almacena, visualiza y monitorea las
            intervenciones de restauración ecológica con evidencia georreferenciada y
            trazabilidad temporal.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn lp-btn-lg" onClick={onEnter}>
              Ingresar a la plataforma
            </button>
            <a className="lp-link" href="#funciones">
              Conocer más ↓
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section" id="funciones">
        <h2>¿Qué ofrece la plataforma?</h2>
        <div className="lp-cards">
          {FUNCIONES.map((f) => (
            <div className="lp-card" key={f.t}>
              <span className="lp-card-ico" aria-hidden>{f.icon}</span>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-preguntas">
        <h2>El geovisor responde cuatro preguntas clave</h2>
        <div className="lp-preg-grid">
          {PREGUNTAS.map((q, i) => (
            <div className="lp-preg" key={q}>
              <span className="lp-preg-num">{i + 1}</span>
              <p>{q}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-insumos">
        <h2>Insumos del levantamiento con dron integrados</h2>
        <div className="lp-chips">
          {INSUMOS.map((i) => (
            <span className="lp-chip" key={i}>{i}</span>
          ))}
        </div>
        <button className="lp-btn lp-btn-lg" onClick={onEnter}>
          Ingresar a la plataforma
        </button>
      </section>

      <footer className="lp-footer">
        <img src="/logo-cra.jpeg" alt="C.R.A." />
        <div>
          <strong>Proyecto financiado por la Corporación Autónoma Regional del Atlántico (C.R.A.)</strong>
          <span>Contrato 324 de 2025 · Responsable técnico: Ángel Zambrano Jaraba</span>
        </div>
      </footer>
    </div>
  )
}
