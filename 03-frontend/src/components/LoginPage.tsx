import { useState } from 'react'
import { ESCALA } from '../lib/quality'
import { login, registrarse, type Usuario } from '../lib/auth'

interface Props {
  onLogin: (u: Usuario) => void
}

/** Pantalla de inicio de sesión (acceso obligatorio a la plataforma). */
export default function LoginPage({ onLogin }: Props) {
  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const registrando = modo === 'registro'

  const cambiarModo = (m: 'entrar' | 'registro') => {
    setModo(m); setError(null); setPassword('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onLogin(registrando
        ? await registrarse(nombre.trim(), email.trim(), password)
        : await login(email.trim(), password))
    } catch (err) {
      setError(err instanceof Error ? err.message
        : registrando ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <img src="/logo-proyecto.jpeg" alt="Restauración Luruaco" className="login-logo-img" />
          <h1>Geovisor de Restauración Ecológica</h1>
          <p>Ciénaga de Luruaco, Atlántico</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!registrando}
            className={registrando ? '' : 'on'} onClick={() => cambiarModo('entrar')}>Ingresar</button>
          <button type="button" role="tab" aria-selected={registrando}
            className={registrando ? 'on' : ''} onClick={() => cambiarModo('registro')}>Crear cuenta</button>
        </div>

        {registrando && (
          <label>
            Nombre completo
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              autoComplete="name"
              required
            />
          </label>
        )}

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
            autoComplete={registrando ? 'new-password' : 'current-password'}
            minLength={registrando ? 8 : undefined}
            required
          />
        </label>

        {registrando && (
          <p className="login-nota">La cuenta se crea con permiso de <b>consulta</b>: permite ver
            los componentes y descargar reportes. Para registrar información en campo, solicite
            el rol de técnico al administrador.</p>
        )}

        {error && <p className="login-err">⚠️ {error}</p>}

        <button type="submit" disabled={busy}>
          {busy
            ? (registrando ? 'Creando cuenta…' : 'Ingresando…')
            : (registrando ? 'Crear cuenta de consulta' : 'Ingresar')}
        </button>

        <div className="login-scale" aria-hidden>
          {ESCALA.map((c) => (
            <span key={c.key} style={{ background: c.color }} />
          ))}
        </div>
        <div className="login-cra">
          <img src="/logo-cra.svg" alt="Corporación Autónoma Regional del Atlántico — C.R.A." />
          <span>Proyecto financiado por la Corporación Autónoma Regional del Atlántico</span>
        </div>
        <p className="login-foot">Consulta abierta · los roles de técnico y administrador los asigna la entidad</p>
      </form>
    </div>
  )
}
