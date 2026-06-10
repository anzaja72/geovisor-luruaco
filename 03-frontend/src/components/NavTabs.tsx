const TABS = [
  'Acerca de',
  'Escala nacional',
  'Escala departamental',
  'Escala estación',
  'Reporte de meta',
  'Descarga de datos',
]

interface Props {
  active?: string
  onChange?: (tab: string) => void
}

/** Barra de navegación principal (la pestaña activa se resalta como pill). */
export default function NavTabs({ active = 'Escala departamental', onChange }: Props) {
  return (
    <nav className="nav-tabs" aria-label="Escalas del visor">
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
