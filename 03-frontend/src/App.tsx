import { useEffect, useState } from 'react'
import './styles/dashboard.css'
import './styles/geovisor.css'
import LoginPage from './components/LoginPage'
import Geovisor from './geovisor/Geovisor'
import { cerrarSesion, getUsuario, type Usuario } from './lib/auth'

// Sesión de demostración SOLO en desarrollo (?demo=1) para previsualizar sin backend.
const DEMO: Usuario = { id: 0, nombre: 'Demo', email: 'demo@cra.gov.co', rol: 'administrador' }
const demoDev = (): Usuario | null => {
  if (!import.meta.env.DEV) return null
  return new URLSearchParams(window.location.search).get('demo') === '1' ? DEMO : null
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getUsuario() ?? demoDev())
  const quiereEntrar =
    new URLSearchParams(window.location.search).get('entrar') === '1'

  // Sin sesión y sin venir desde la landing → mostrar la landing institucional.
  useEffect(() => {
    if (!usuario && !quiereEntrar) window.location.replace('/landing-cra.html')
  }, [usuario, quiereEntrar])

  if (!usuario) {
    return quiereEntrar ? <LoginPage onLogin={setUsuario} /> : null
  }
  return (
    <Geovisor
      usuario={usuario}
      onLogout={() => {
        cerrarSesion()
        setUsuario(null)
      }}
    />
  )
}
