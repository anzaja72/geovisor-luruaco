import { useEffect, useState } from 'react'
import { Footer, Icon } from './Shell'
import { API_URL, authHeaders } from '../lib/api'
import type { Usuario } from '../lib/auth'

// Administración de cuentas: alta con el rol que corresponda, cambio de rol,
// activación y restablecimiento de contraseña. Solo la ve el administrador.
// Las cuentas de consulta también pueden crearse solas desde la página de inicio;
// la columna «origen» distingue unas de otras.

interface Cuenta {
  id: number
  nombre: string
  email: string
  rol: 'administrador' | 'tecnico' | 'consulta'
  activo: boolean
  origen?: string
  creado_en?: string
  ultimo_acceso?: string
}

const ROLES = [
  { id: 'consulta', nombre: 'Consulta', desc: 'Solo consulta, sin descargas ni capas sensibles' },
  { id: 'tecnico', nombre: 'Técnico', desc: 'Todo salvo administrar cuentas y borrar registros' },
  { id: 'administrador', nombre: 'Administrador', desc: 'Control total' },
] as const

const ORIGEN_TEXTO: Record<string, string> = {
  administrador: 'Asignada',
  registro_publico: 'Registro público',
  inicial: 'Inicial del despliegue',
}

export default function AdminUsuariosView({ usuario }: { usuario: Usuario }) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Formulario de alta
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<'consulta' | 'tecnico' | 'administrador'>('tecnico')
  const [creando, setCreando] = useState(false)

  /** Se incrementa para releer el listado tras crear o modificar una cuenta. */
  const [tick, setTick] = useState(0)
  const cargar = () => setTick((n) => n + 1)

  useEffect(() => {
    const ac = new AbortController()
    fetch(`${API_URL}/api/usuarios`, { headers: authHeaders(), signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { setCuentas(d.usuarios ?? []); setError(null) })
      .catch((e) => { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar las cuentas') })
      .finally(() => { if (!ac.signal.aborted) setCargando(false) })
    return () => ac.abort()
  }, [tick])

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setAviso(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    setCreando(true)
    try {
      const res = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password, rol }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`)
      setAviso(`Cuenta creada para ${email.trim()} con rol ${rol}.`)
      setNombre(''); setEmail(''); setPassword('')
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta')
    } finally {
      setCreando(false)
    }
  }

  /** Cambio de rol o de estado sobre una cuenta existente. */
  const actualizar = async (c: Cuenta, cambio: Partial<Pick<Cuenta, 'rol' | 'activo'>>) => {
    setError(null); setAviso(null)
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(cambio),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || `HTTP ${res.status}`)
      }
      setAviso(`Cuenta de ${c.nombre} actualizada.`)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar')
    }
  }

  const restablecer = async (c: Cuenta) => {
    const nueva = window.prompt(`Nueva contraseña para ${c.nombre} (mínimo 8 caracteres):`)
    if (nueva == null) return
    if (nueva.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setError(null); setAviso(null)
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ password: nueva }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAviso(`Contraseña restablecida para ${c.nombre}. Comuníquesela por un medio seguro.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer')
    }
  }

  const porRol = (r: string) => cuentas.filter((c) => c.rol === r).length

  return (
    <>
      <div className="page-title">
        <h2><Icon id="users" /> Administración de cuentas</h2>
        <span className="badge-soft">Solo administrador</span>
      </div>

      <div className="kpis k4" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="users" /></span><span className="lab">Cuentas</span></div><div className="val num">{cuentas.length}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="shield" /></span><span className="lab">Administradores</span></div><div className="val num">{porRol('administrador')}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="sprout" /></span><span className="lab">Técnicos</span></div><div className="val num">{porRol('tecnico')}</div></div>
        <div className="kpi"><div className="top"><span className="chip"><Icon id="search" /></span><span className="lab">Consulta</span></div><div className="val num">{porRol('consulta')}</div></div>
      </div>

      {error && <div className="note" style={{ borderColor: 'var(--poor)', color: 'var(--poor)', marginBottom: 12 }}>⚠️ {error}</div>}
      {aviso && <div className="note" style={{ borderColor: 'var(--secondary)', color: 'var(--on-sec-c)', marginBottom: 12 }}>{aviso}</div>}

      <div className="grid2">
        <div className="panel">
          <div className="ph"><h3><Icon id="plus" /> Crear cuenta</h3></div>
          <div className="chart-b">
            <form className="aj-form" onSubmit={crear}>
              <label>Nombre completo
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </label>
              <label>Correo electrónico
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@entidad.gov.co" required />
              </label>
              <label>Contraseña provisional
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  minLength={8} autoComplete="new-password" required />
              </label>
              <label>Rol
                <select value={rol} onChange={(e) => setRol(e.target.value as typeof rol)}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre} — {r.desc}</option>)}
                </select>
              </label>
              <button type="submit" className="aj-guardar" disabled={creando}>
                {creando ? 'Creando…' : 'Crear cuenta'}
              </button>
            </form>
            <p className="aj-nota">Entregue la contraseña provisional por un medio seguro; la
              persona puede cambiarla desde <b>Ajustes</b> al entrar.</p>
          </div>
        </div>

        <div className="panel">
          <div className="ph"><h3><Icon id="shield" /> Qué puede hacer cada rol</h3></div>
          <div className="chart-b" style={{ padding: 0 }}>
            <table className="fauna-table">
              <thead><tr><th>Operación</th><th>Consulta</th><th>Técnico</th><th>Admin.</th></tr></thead>
              <tbody>
                <tr><td>Ver componentes, mapas e indicadores</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td>Preguntar al copiloto</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td>Ver capas sensibles (cámaras y transectos)</td><td>—</td><td>✓</td><td>✓</td></tr>
                <tr><td>Descargar reportes y datos</td><td>—</td><td>✓</td><td>✓</td></tr>
                <tr><td>Registrar monitoreos en campo</td><td>—</td><td>✓</td><td>✓</td></tr>
                <tr><td>Importar capas</td><td>—</td><td>✓</td><td>✓</td></tr>
                <tr><td>Eliminar registros</td><td>—</td><td>—</td><td>✓</td></tr>
                <tr><td>Administrar cuentas</td><td>—</td><td>—</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph"><h3><Icon id="users" /> Cuentas registradas</h3>
          <span className="badge-soft">{cuentas.length} cuenta(s)</span></div>
        <div className="chart-b" style={{ padding: 0 }}>
          {cargando ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>Cargando…</p>
          ) : (
            <table className="fauna-table">
              <thead>
                <tr><th>Persona</th><th>Rol</th><th>Origen</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {cuentas.map((c) => {
                  const yo = c.id === usuario.id
                  return (
                    <tr key={c.id}>
                      <td>{c.nombre}{yo && <span className="badge-soft" style={{ marginLeft: 6 }}>usted</span>}
                        <br /><small style={{ color: 'var(--muted)' }}>{c.email}</small></td>
                      <td>
                        <select value={c.rol} disabled={yo}
                          onChange={(e) => actualizar(c, { rol: e.target.value as Cuenta['rol'] })}>
                          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                      </td>
                      <td><small>{ORIGEN_TEXTO[c.origen ?? 'administrador'] ?? c.origen}</small></td>
                      <td>{c.activo ? 'Activa' : 'Inactiva'}</td>
                      <td><small>{c.ultimo_acceso ? new Date(c.ultimo_acceso).toLocaleDateString('es-CO') : '—'}</small></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="cchip" onClick={() => restablecer(c)}>Contraseña</button>
                          <button className="cchip" disabled={yo}
                            onClick={() => actualizar(c, { activo: !c.activo })}>
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="note" style={{ marginTop: 14 }}>
        <b>Registro público.</b> Cualquier persona puede crear su propia cuenta desde la página
        de inicio, y siempre se crea con permiso de <b>consulta</b>: el rol lo fija el servidor,
        no el formulario. Los roles de técnico y administrador solo se asignan desde esta pantalla.
        Una cuenta desactivada deja de poder iniciar sesión, pero conserva su historial.
        <br /><br />
        El rol de consulta ve los componentes y los indicadores, pero no descarga información,
        no registra datos de campo y no recibe las capas con ubicaciones sensibles —cámaras
        trampa y transectos de fauna—, que el servidor excluye de su respuesta.
      </div>

      <Footer />
    </>
  )
}
