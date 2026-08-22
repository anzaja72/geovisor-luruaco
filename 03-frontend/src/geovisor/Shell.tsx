import type { CSSProperties, ReactNode } from 'react'
import { COMPONENTES, type CompId } from './data'
import type { Usuario } from '../lib/auth'

const SPRITE = `
<symbol id="leaf" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></symbol>
<symbol id="sprout" viewBox="0 0 24 24"><path d="M7 20h10"/><path d="M12 20c0-6 0-8 6-9"/><path d="M12 13C9 13 6 11 6 7c4 0 6 2 6 6Z"/></symbol>
<symbol id="tree" viewBox="0 0 24 24"><path d="M12 3 7 10h2l-4 6h6v5h2v-5h6l-4-6h2Z"/></symbol>
<symbol id="target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/></symbol>
<symbol id="shield" viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6Z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M17 4a4 4 0 0 1 0 8"/><path d="M22 20a7 7 0 0 0-5-6.7"/></symbol>
<symbol id="waves" viewBox="0 0 24 24"><path d="M2 6c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3-1.5 5 0"/><path d="M2 12c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3-1.5 5 0"/><path d="M2 18c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3-1.5 5 0"/></symbol>
<symbol id="flask" viewBox="0 0 24 24"><path d="M9 3h6"/><path d="M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3"/><path d="M7 16h10"/></symbol>
<symbol id="paw" viewBox="0 0 24 24"><circle cx="6.5" cy="11" r="1.8"/><circle cx="10" cy="7" r="1.8"/><circle cx="14" cy="7" r="1.8"/><circle cx="17.5" cy="11" r="1.8"/><path d="M8.5 16.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.5 3-3.5 3-3.5-1-3.5-3Z"/></symbol>
<symbol id="grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol>
<symbol id="plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
<symbol id="settings" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></symbol>
<symbol id="help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></symbol>
<symbol id="search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
<symbol id="bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></symbol>
<symbol id="user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></symbol>
<symbol id="calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
<symbol id="ruler" viewBox="0 0 24 24"><path d="M3 15 15 3l6 6L9 21Z"/><path d="M7 11l2 2M11 7l2 2"/></symbol>
<symbol id="activity" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></symbol>
<symbol id="layers" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></symbol>
<symbol id="download" viewBox="0 0 24 24"><path d="M12 3v12M7 11l5 4 5-4"/><path d="M5 21h14"/></symbol>
<symbol id="droplet" viewBox="0 0 24 24"><path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z"/></symbol>
<symbol id="pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></symbol>
<symbol id="camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3.2"/></symbol>
<symbol id="trend" viewBox="0 0 24 24"><path d="M22 7l-8.5 8.5-4-4L2 19"/><path d="M16 7h6v6"/></symbol>
<symbol id="scale" viewBox="0 0 24 24"><path d="M7 21h10M12 3v18M3 7h4c2 0 5-1 8-1s6 1 8 1"/><path d="M2 14 5 8l3 6c-1.7 1.3-4.3 1.3-6 0Z"/><path d="M16 14l3-6 3 6c-1.7 1.3-4.3 1.3-6 0Z"/></symbol>
<symbol id="bird" viewBox="0 0 24 24"><path d="M16 7h.01"/><path d="M20 7c0 9-7 13-7 13l-2-4-4-2s4-7 13-7Z"/><path d="M9 14 3 20"/></symbol>
<symbol id="logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></symbol>
<symbol id="frog" viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="7" ry="5"/><circle cx="7.5" cy="8" r="2.2"/><circle cx="16.5" cy="8" r="2.2"/><circle cx="7.5" cy="8" r=".4"/><circle cx="16.5" cy="8" r=".4"/><path d="M8 19l-2 2M16 19l2 2"/></symbol>
<symbol id="snake" viewBox="0 0 24 24"><path d="M4 19c0-3 3-3 3-6s-3-3-3-6 3-3 6-3 3 3 6 3 3-3 5-1"/><circle cx="19.2" cy="6.2" r=".6"/></symbol>
`

export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SPRITE }} />
  )
}

export function Icon({ id, style }: { id: string; style?: CSSProperties }) {
  return <svg className="i" style={style}><use href={`#${id}`} /></svg>
}

function TopBar({ usuario, onLogout }: { usuario: Usuario; onLogout: () => void }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="mark">CRA</div>
        <div><h1>Geovisor de Restauración Ecológica</h1><small>Ciénaga de Luruaco · Atlántico</small></div>
      </div>
      <div className="topnav">
        <div className="search"><Icon id="search" style={{ width: 18, height: 18 }} />
          <input placeholder="Buscar predio, parcela o especie…" /></div>
        <button className="iconbtn" title="Notificaciones"><Icon id="bell" /></button>
        <button className="iconbtn" title={usuario.nombre}><Icon id="user" /></button>
        <button className="iconbtn" title="Cerrar sesión" onClick={onLogout}><Icon id="logout" /></button>
      </div>
    </header>
  )
}

function Sidebar({
  active, onNav, onMonitoreo,
}: { active: CompId; onNav: (c: CompId) => void; onMonitoreo?: () => void }) {
  return (
    <aside className="side">
      <div className="sh"><b>Gestión Ambiental</b><span>Ciénaga de Luruaco</span></div>
      <nav className="nav">
        <div className="sep">Componentes</div>
        {COMPONENTES.filter(([id]) => id !== 'reportes').map(([id, label, ic]) => (
          <a key={id} href="#" className={id === active ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNav(id) }}>
            <Icon id={ic} /> {label}
          </a>
        ))}
        <div className="sep">Herramientas</div>
        {COMPONENTES.filter(([id]) => id === 'reportes').map(([id, label, ic]) => (
          <a key={id} href="#" className={id === active ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNav(id) }}>
            <Icon id={ic} /> {label}
          </a>
        ))}
      </nav>
      <div className="foot">
        <button className="btn-primary" onClick={onMonitoreo} disabled={!onMonitoreo}>
          <Icon id="plus" /> Registrar Monitoreo</button>
        <div style={{ height: 8 }} />
        <a className="nav-mini" href="#" onClick={(e) => e.preventDefault()}>
          <Icon id="settings" style={{ width: 18, height: 18 }} /> Ajustes</a>
        <a className="nav-mini" href="#" onClick={(e) => e.preventDefault()}>
          <Icon id="help" style={{ width: 18, height: 18 }} /> Soporte</a>
      </div>
    </aside>
  )
}

export default function Shell({
  usuario, onLogout, active, onNav, onMonitoreo, children,
}: {
  usuario: Usuario
  onLogout: () => void
  active: CompId
  onNav: (c: CompId) => void
  onMonitoreo?: () => void
  children: ReactNode
}) {
  return (
    <>
      <Sprite />
      <TopBar usuario={usuario} onLogout={onLogout} />
      <div className="shell">
        <Sidebar active={active} onNav={onNav} onMonitoreo={onMonitoreo} />
        <main className="main">{children}</main>
      </div>
    </>
  )
}

export function Footer() {
  return (
    <div className="foot-bar">
      <div className="cred"><b>C.R.A.</b> — Financiado por la Corporación Autónoma Regional del Atlántico · Contrato 324 de 2025</div>
      <div className="links">
        <a href="#" onClick={(e) => e.preventDefault()}>Importar datos</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Exportar GeoJSON</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Contacto</a>
      </div>
    </div>
  )
}
