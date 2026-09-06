import { useEffect, useState } from 'react'
import { API_URL, authHeaders } from '../lib/api'
import type { Usuario } from '../lib/auth'

// Ajustes de la cuenta: datos de la sesión y cambio de la propia contraseña.
// La administración de usuarios (alta, cambio de rol y baja) se hace por API,
// como documenta el manual del administrador.

interface UsuarioListado {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  ultimo_acceso?: string
}

const ROL_TEXTO: Record<string, string> = {
  administrador: 'Administrador · control total',
  tecnico: 'Técnico · carga y edición de datos',
  consulta: 'Consulta · solo lectura',
}

export default function AjustesModal({
  onClose,
  usuario,
}: {
  onClose: () => void
  usuario: Usuario
}) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [estado, setEstado] = useState<{ ok?: string; error?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioListado[] | null>(null)

  // El administrador ve el listado de cuentas para saber quién tiene acceso.
  useEffect(() => {
    if (usuario.rol !== 'administrador') return
    const ac = new AbortController()
    fetch(`${API_URL}/api/usuarios`, { headers: authHeaders(), signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.usuarios) setUsuarios(d.usuarios) })
      .catch(() => { /* el listado es informativo: si falla, no se muestra */ })
    return () => ac.abort()
  }, [usuario.rol])

  const cambiar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado({})
    if (nueva.length < 8) return setEstado({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' })
    if (nueva !== repetir) return setEstado({ error: 'La confirmación no coincide con la nueva contraseña.' })
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ actual, nueva }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || `HTTP ${res.status}`)
      }
      setEstado({ ok: 'Contraseña actualizada.' })
      setActual(''); setNueva(''); setRepetir('')
    } catch (err) {
      setEstado({ error: err instanceof Error ? err.message : 'No se pudo actualizar' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="ov on" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="info" style={{ maxWidth: 560, width: '100%' }}>
        <div className="ih">
          <h3>Ajustes de la cuenta</h3>
          <button className="x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="ib">
          <dl className="aj-datos">
            <dt>Usuario</dt><dd>{usuario.nombre}</dd>
            <dt>Correo</dt><dd>{usuario.email}</dd>
            <dt>Rol</dt><dd>{ROL_TEXTO[usuario.rol] ?? usuario.rol}</dd>
          </dl>

          <h4 className="aj-t">Cambiar contraseña</h4>
          <form className="aj-form" onSubmit={cambiar}>
            <label>Contraseña actual
              <input type="password" value={actual} onChange={(e) => setActual(e.target.value)}
                autoComplete="current-password" required />
            </label>
            <label>Nueva contraseña
              <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                autoComplete="new-password" minLength={8} required />
            </label>
            <label>Repetir la nueva
              <input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)}
                autoComplete="new-password" minLength={8} required />
            </label>
            {estado.error && <p className="aj-error">{estado.error}</p>}
            {estado.ok && <p className="aj-ok">{estado.ok}</p>}
            <button type="submit" className="aj-guardar" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>

          {usuario.rol === 'administrador' && usuarios && (
            <>
              <h4 className="aj-t">Cuentas con acceso ({usuarios.length})</h4>
              <table className="fauna-table aj-tabla">
                <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th></tr></thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}<br /><small style={{ color: 'var(--muted)' }}>{u.email}</small></td>
                      <td style={{ textTransform: 'capitalize' }}>{u.rol}</td>
                      <td>{u.activo ? 'Activa' : 'Inactiva'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="aj-nota">El alta, el cambio de rol y la baja de cuentas se realizan por API;
                el procedimiento está en el manual del administrador.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
