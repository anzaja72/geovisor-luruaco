// Cola de registros pendientes en el navegador (soporte offline del formulario).
// Cuando no hay internet, los envíos se guardan en localStorage y se suben solos
// al recuperar la conexión.
import { postForm } from './api'

const KEY = 'gdb_cola_offline'

export interface ItemCola {
  id: string
  path: string
  body: unknown
  ts: number
}

function cargar(): ItemCola[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ItemCola[]
  } catch {
    return []
  }
}
function guardar(items: ItemCola[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function pendientes(): number {
  return cargar().length
}

/** Detecta si un error es de red (sin conexión) y no de validación del servidor. */
export function esErrorDeRed(e: unknown): boolean {
  if (!navigator.onLine) return true
  return e instanceof Error && /fetch|network|failed|load/i.test(e.message)
}

/** Guarda un envío en el navegador para subirlo después. */
export function encolar(path: string, body: unknown): number {
  const items = cargar()
  const id = (crypto.randomUUID?.() ?? String(Date.now() + Math.random()))
  items.push({ id, path, body, ts: Date.now() })
  guardar(items)
  return items.length
}

/** Intenta subir todos los pendientes. Se detiene si vuelve a fallar por red. */
export async function sincronizar(): Promise<{ enviados: number; pendientes: number }> {
  let items = cargar()
  let enviados = 0
  for (const it of [...items]) {
    try {
      await postForm(it.path, it.body)
      items = items.filter((x) => x.id !== it.id)
      guardar(items)
      enviados++
    } catch (e) {
      if (esErrorDeRed(e)) break // sigue sin red: reintentar más tarde
      // Error de validación: se descarta para no atascar la cola.
      items = items.filter((x) => x.id !== it.id)
      guardar(items)
    }
  }
  return { enviados, pendientes: items.length }
}

/** Sincroniza al cargar (si hay red) y cada vez que vuelve la conexión. */
export function iniciarAutoSync(onCambio?: () => void): () => void {
  const run = () => sincronizar().then((r) => { if (r.enviados > 0) onCambio?.() })
  window.addEventListener('online', run)
  if (navigator.onLine && pendientes() > 0) run()
  return () => window.removeEventListener('online', run)
}
