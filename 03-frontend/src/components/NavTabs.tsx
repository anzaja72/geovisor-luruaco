const TABS = ['Geovisor', 'Acerca de', 'Descarga de datos']

interface Props {
  active?: string
  onChange?: (tab: string) => void
}

/** Barra de navegación principal (la pestaña activa se resalta como pill). */
export default function NavTabs({ active = 'Geovisor', onChange }: Props) {
  return (
    <nav className="nav-tabs" aria-label="Secciones de la plataforma">
      {TABS.map((t) => (
        <button
          key={t}
          className={`nav-tab ${t === active ? 'active' : ''}`}
          aria-current={t === active ? 'page' : undefined}
          onClick={() => onChange?.(t)}
        >
          {t}
        </button>
      ))}
    </nav>
  )
}
