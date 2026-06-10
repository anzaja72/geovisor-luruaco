import { useState } from 'react'
import { ESCALA } from '../lib/quality'
import { login, type Usuario } from '../lib/auth'

interface Props {
  onLogin: (u: Usuario) => void
}

/** Pantalla de inicio de sesión (acceso obligatorio a la plataforma). */
export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onLogin(await login(email.trim(), password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="login-logo" aria-hidden>🌿</span>
          <h1>Geovisor de Restauración Ecológica</h1>
          <p>Ciénaga de Luruaco, Atlántico</p>
        </div>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@entidad.gov.co"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="login-err">⚠️ {error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>

        <div className="login-scale" aria-hidden>
          {ESCALA.map((c) => (
            <span key={c.key} style={{ background: c.color }} />
          ))}
        </div>
        <p className="login-foot">Acceso restringido · roles: administrador, técnico, consulta</p>
      </form>
    </div>
  )
}
