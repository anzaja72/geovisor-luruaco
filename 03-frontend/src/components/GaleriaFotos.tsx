import { useState } from 'react'

/** Una foto, o —cuando la galería es una leyenda numerada— su número y pie. */
export interface FotoGaleria {
  src: string
  numero?: string
  caption?: string
}

type Entrada = string | FotoGaleria

const normalizar = (f: Entrada): FotoGaleria => (typeof f === 'string' ? { src: f } : f)

/** Galería de fotos con miniatura + visor ampliado (lightbox) y navegación.
 *  Si las entradas traen `numero`, cada miniatura lleva su insignia y el visor
 *  muestra el pie de foto completo — para leyendas numeradas (p. ej. el
 *  registro fotográfico de siembra, asociado a la leyenda del informe). */
export default function GaleriaFotos({ fotos }: { fotos: Entrada[] }) {
  const items = fotos.map(normalizar)
  const [sel, setSel] = useState<number | null>(null)
  const ir = (d: number) =>
    setSel((s) => (s == null ? s : (s + d + items.length) % items.length))
  const actual = sel != null ? items[sel] : null

  return (
    <>
      <div className="foto-grid">
        {items.map((f, i) => (
          <button key={f.src} type="button" className="foto-thumb" onClick={() => setSel(i)}>
            {f.numero && <span className="foto-num">{f.numero}</span>}
            <img src={f.src} alt={f.caption ?? `Evidencia fotográfica ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {actual && (
        <div className="foto-lightbox" onClick={() => setSel(null)}>
          <button className="foto-close" onClick={() => setSel(null)} aria-label="Cerrar">×</button>
          <button
            className="foto-nav prev"
            onClick={(e) => { e.stopPropagation(); ir(-1) }}
            aria-label="Anterior"
          >‹</button>
          <div className="foto-lightbox-cont" onClick={(e) => e.stopPropagation()}>
            <img src={actual.src} alt={actual.caption ?? `Evidencia ${(sel ?? 0) + 1}`} />
            {actual.caption && (
              <p className="foto-caption">
                {actual.numero && <b>{actual.numero}. </b>}
                {actual.caption}
              </p>
            )}
          </div>
          <button
            className="foto-nav next"
            onClick={(e) => { e.stopPropagation(); ir(1) }}
            aria-label="Siguiente"
          >›</button>
          <span className="foto-count">{(sel ?? 0) + 1} / {items.length}</span>
        </div>
      )}
    </>
  )
}
