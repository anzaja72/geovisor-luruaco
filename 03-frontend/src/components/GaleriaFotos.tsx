import { useState } from 'react'

/** Galería de fotos con miniatura + visor ampliado (lightbox) y navegación. */
export default function GaleriaFotos({ fotos }: { fotos: string[] }) {
  const [sel, setSel] = useState<number | null>(null)
  const ir = (d: number) =>
    setSel((s) => (s == null ? s : (s + d + fotos.length) % fotos.length))

  return (
    <>
      <div className="foto-grid">
        {fotos.map((src, i) => (
          <button key={src} type="button" className="foto-thumb" onClick={() => setSel(i)}>
            <img src={src} alt={`Evidencia fotográfica ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {sel !== null && (
        <div className="foto-lightbox" onClick={() => setSel(null)}>
          <button className="foto-close" onClick={() => setSel(null)} aria-label="Cerrar">×</button>
          <button
            className="foto-nav prev"
            onClick={(e) => { e.stopPropagation(); ir(-1) }}
            aria-label="Anterior"
          >‹</button>
          <img src={fotos[sel]} alt={`Evidencia ${sel + 1}`} onClick={(e) => e.stopPropagation()} />
          <button
            className="foto-nav next"
            onClick={(e) => { e.stopPropagation(); ir(1) }}
            aria-label="Siguiente"
          >›</button>
          <span className="foto-count">{sel + 1} / {fotos.length}</span>
        </div>
      )}
    </>
  )
}
