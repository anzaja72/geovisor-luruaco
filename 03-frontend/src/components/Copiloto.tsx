import { useEffect, useRef, useState } from 'react'
import { API_URL, authHeaders } from '../lib/api'
import type { CompId } from '../geovisor/data'

// Copiloto del geovisor: panel lateral que responde preguntas sobre el proyecto
// con las cifras de la geodatabase y lleva al componente donde verlas.
// El backend resuelve los datos y, si hay proveedor configurado, la redacción;
// aquí solo se presenta y se ofrece la acción siguiente.

interface Respuesta {
  respuesta: string
  fuentes: string[]
  vistas: string[]
  modelo: string
  con_modelo: boolean
}

interface Turno {
  pregunta: string
  respuesta?: Respuesta
  error?: string
}

/** Sugerencias de arranque: preguntas del proyecto, no un «¿en qué te ayudo?». */
const SUGERENCIAS = [
  '¿Cuánta área se restauró de forma activa?',
  '¿Qué especies se censaron en la línea base?',
  '¿Cuántas parcelas de monitoreo hay y cómo se llaman?',
  '¿Qué datos de ficorremediación faltan?',
]

const NOMBRE_VISTA: Record<string, string> = {
  restauracion: 'Restauración Ecológica',
  maleza: 'Vegetación Acuática',
  ficorremediacion: 'Ficorremediación',
  fauna: 'Monitoreo de Fauna',
  gobernanza: 'Gobernanza Ambiental',
}

export default function Copiloto({
  abierto,
  onCerrar,
  onIrA,
}: {
  abierto: boolean
  onCerrar: () => void
  onIrA: (c: CompId) => void
}) {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)
  const hilo = useRef<HTMLDivElement>(null)

  // Al abrir, el cursor va a la entrada; Escape cierra.
  useEffect(() => {
    if (!abierto) return
    entrada.current?.focus()
    const cerrarConEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', cerrarConEsc)
    return () => window.removeEventListener('keydown', cerrarConEsc)
  }, [abierto, onCerrar])

  // El hilo se mantiene abajo a medida que llegan respuestas.
  useEffect(() => {
    hilo.current?.scrollTo({ top: hilo.current.scrollHeight, behavior: 'smooth' })
  }, [turnos, cargando])

  const preguntar = async (pregunta: string) => {
    const q = pregunta.trim()
    if (!q || cargando) return
    setTexto('')
    setTurnos((t) => [...t, { pregunta: q }])
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/copiloto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ pregunta: q }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || `HTTP ${res.status}`)
      }
      const data: Respuesta = await res.json()
      setTurnos((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, respuesta: data } : x)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo consultar'
      setTurnos((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: msg } : x)))
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <div className={`cop-velo${abierto ? ' on' : ''}`} onClick={onCerrar} aria-hidden />
      <aside className={`cop${abierto ? ' on' : ''}`} aria-label="Copiloto del geovisor">
        <header className="cop-h">
          <div>
            <b>Copiloto del geovisor</b>
            <small>Responde con los datos de la geodatabase</small>
          </div>
          <button className="cop-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        </header>

        <div className="cop-hilo" ref={hilo}>
          {turnos.length === 0 && (
            <div className="cop-inicio">
              <p>Pregunta sobre el proyecto y respondo con las cifras cargadas en la plataforma,
                indicando de dónde salen.</p>
              <div className="cop-sug">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => preguntar(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {turnos.map((t, i) => (
            <div key={i} className="cop-turno">
              <div className="cop-q">{t.pregunta}</div>

              {t.respuesta && (
                <div className="cop-a">
                  <p>{t.respuesta.respuesta}</p>

                  {t.respuesta.fuentes.length > 0 && (
                    <div className="cop-fuentes">
                      <em>Fuente:</em> {[...new Set(t.respuesta.fuentes)].join(' · ')}
                    </div>
                  )}

                  {t.respuesta.vistas.length > 0 && (
                    <div className="cop-acciones">
                      {t.respuesta.vistas.map((v) => (
                        <button key={v} type="button" onClick={() => { onIrA(v as CompId); onCerrar() }}>
                          Ver en {NOMBRE_VISTA[v] ?? v} →
                        </button>
                      ))}
                    </div>
                  )}

                  {!t.respuesta.con_modelo && (
                    <div className="cop-nota">Respuesta compuesta directamente con los datos:
                      el servicio de redacción no está configurado.</div>
                  )}
                </div>
              )}

              {t.error && <div className="cop-a cop-err">No se pudo responder: {t.error}</div>}
            </div>
          ))}

          {cargando && (
            <div className="cop-cargando"><span /><span /><span /> consultando la geodatabase…</div>
          )}
        </div>

        <form className="cop-entrada" onSubmit={(e) => { e.preventDefault(); preguntar(texto) }}>
          <input
            ref={entrada}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pregunta sobre el proyecto…"
            maxLength={500}
            aria-label="Pregunta para el copiloto"
          />
          <button type="submit" disabled={cargando || !texto.trim()} aria-label="Enviar">→</button>
        </form>

        <footer className="cop-pie">
          Respuestas generadas con inteligencia artificial a partir de los datos de la plataforma.
          Verifique con la Dirección del Proyecto antes de usarlas como soporte técnico.
        </footer>
      </aside>
    </>
  )
}
