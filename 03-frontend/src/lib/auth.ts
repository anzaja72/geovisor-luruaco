// Sesión y autenticación (JWT en localStorage).
import { API_URL } from './api'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'administrador' | 'tecnico' | 'consulta'
}

const TOKEN_KEY = 'gdb_token'
const USER_KEY = 'gdb_usuario'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUsuario(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export function setSesion(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function login(email: string, password: string): Promise<Usuario> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  setSesion(data.token as string, data.usuario as Usuario)
  return data.usuario as Usuario
}

/** true si el rol puede cargar/editar datos. */
export function puedeEditar(u: Usuario | null): boolean {
  return u != null && (u.rol === 'administrador' || u.rol === 'tecnico')
}
