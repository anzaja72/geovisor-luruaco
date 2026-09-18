import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from 'framer-motion'

// Carrusel 3D de fotos (adaptado del componente shadcn/Tailwind a CSS inline propio).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false),
  )
  useIsomorphicLayoutEffect(() => {
    const mm = window.matchMedia(query)
    const handler = () => setMatches(mm.matches)
    handler()
    mm.addEventListener('change', handler)
    return () => mm.removeEventListener('change', handler)
  }, [query])
  return matches
}

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1] as const }

/** Una foto del carrusel: ruta y (opcional) el texto que la referencia. */
export interface Foto {
  src: string
  label?: string
}

// Ancho de cada foto en el cilindro (px). Antes se repartía el ancho total entre
// todas las caras, así que con 25 fotos cada una quedaba en ~70 px.
const FACE_W_SM = 210
const FACE_W = 320
// Relación perspectiva/radio: fija la escala de la cara frontal (2.6 → ×1,63)
// sea cual sea el número de fotos.
const PERSPECTIVA = 2.6

// Sensibilidad del giro. Con el valor anterior (0.05 en arrastre e inercia) el
// cilindro salía disparado y las fotos pasaban demasiado rápido para verlas.
const SENS_ARRASTRE = 0.022
const SENS_INERCIA = 0.015

const Cilindro = memo(function Cilindro({
  handleClick,
  controls,
  cards,
  isCarouselActive,
}: {
  handleClick: (i: number) => void
  controls: ReturnType<typeof useAnimation>
  cards: Foto[]
  isCarouselActive: boolean
}) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const faceCount = Math.max(cards.length, 1)
  // La cara tiene un ancho fijo y el cilindro crece con el número de fotos (no al revés).
  const faceWidth = isSm ? FACE_W_SM : FACE_W
  const cylinderWidth = faceWidth * faceCount
  const radius = cylinderWidth / (2 * Math.PI)
  const rotation = useMotionValue(0)
  const transform = useTransform(rotation, (v) => `rotate3d(0, 1, 0, ${v}deg)`)

  return (
    <div
      style={{
        display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center',
        perspective: `${Math.round(radius * PERSPECTIVA)}px`,
        transformStyle: 'preserve-3d', willChange: 'transform',
      }}
    >
      <motion.div
        drag={isCarouselActive ? 'x' : false}
        className="carousel3d-track"
        style={{
          display: 'flex', height: '100%', transformOrigin: 'center', justifyContent: 'center',
          cursor: 'grab', transform, rotateY: rotation, width: cylinderWidth, transformStyle: 'preserve-3d',
        }}
        onDrag={(_, info) => isCarouselActive && rotation.set(rotation.get() + info.offset.x * SENS_ARRASTRE)}
        onDragEnd={(_, info) =>
          isCarouselActive &&
          controls.start({
            rotateY: rotation.get() + info.velocity.x * SENS_INERCIA,
            transition: { type: 'spring', stiffness: 60, damping: 42, mass: 0.3 },
          })
        }
        animate={controls}
      >
        {cards.map((foto, i) => (
          <motion.div
            key={`card-${i}`}
            style={{
              position: 'absolute', display: 'flex', height: '100%', transformOrigin: 'center',
              alignItems: 'center', justifyContent: 'center', padding: '0 14px',
              width: `${faceWidth}px`,
              // Sin esto, las caras de la mitad trasera del cilindro se traslucen sobre las
              // del frente y ensucian la escena.
              backfaceVisibility: 'hidden',
              transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
            }}
            onClick={() => handleClick(i)}
          >
            <div style={{ width: '100%' }}>
              <motion.img
                src={foto.src}
                alt={foto.label ?? `Foto ${i + 1}`}
                layoutId={`img-${foto.src}`}
                style={{
                  pointerEvents: 'none', width: '100%', display: 'block', borderRadius: 12,
                  objectFit: 'cover', aspectRatio: '4 / 3',
                  background: '#0f172a',
                  boxShadow: '0 6px 18px rgba(0,0,0,.25)',
                }}
                initial={{ filter: 'blur(4px)' }}
                layout="position"
                animate={{ filter: 'blur(0px)' }}
                transition={transition}
              />
              {/* Referencia de la foto (index.json de la carpeta de gobernanza) */}
              {foto.label && <div className="carousel3d-cap">{foto.label}</div>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
})

/** Carrusel 3D de fotos. `images` = rutas, o `{ src, label }` para mostrar la
 *  referencia de cada foto bajo la miniatura y en la vista ampliada. */
export default function Carousel3D({
  images,
  height = 560,
}: {
  images: (string | Foto)[]
  height?: number
}) {
  // Índice, no la foto: la vista ampliada necesita saber cuál sigue y cuál viene antes.
  const [activa, setActiva] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(true)
  const controls = useAnimation()
  const cards = useMemo<Foto[]>(
    () => images.map((f) => (typeof f === 'string' ? { src: f } : f)),
    [images],
  )

  const handleClick = (i: number) => { setActiva(i); setIsActive(false); controls.stop() }
  const handleClose = () => { setActiva(null); setIsActive(true) }
  const ir = (d: number) =>
    setActiva((s) => (s == null ? s : (s + d + cards.length) % cards.length))

  // Flechas y Escape: antes había que cerrar la foto y volver a abrir otra para
  // seguir viendo el registro.
  useEffect(() => {
    if (activa == null) return
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1) }
      else if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
    // `ir` usa setState funcional, así que solo necesita el número de fotos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa == null, cards.length])

  const foto = activa == null ? null : cards[activa]

  return (
    <motion.div layout style={{ position: 'relative' }}>
      <AnimatePresence mode="sync">
        {foto && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layout="position"
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex',
              flexDirection: 'column', gap: 12,
              alignItems: 'center', justifyContent: 'center', zIndex: 1000, margin: '2.5rem',
              borderRadius: 24, willChange: 'opacity',
            }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <button className="foto-close" onClick={handleClose} aria-label="Cerrar">×</button>
            <button
              className="foto-nav prev"
              onClick={(e) => { e.stopPropagation(); ir(-1) }}
              aria-label="Foto anterior"
            >‹</button>
            <img
              key={foto.src}
              src={foto.src}
              alt={foto.label ?? `Fotografía ${(activa ?? 0) + 1} del registro de actividades`}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: foto.label ? '82%' : '90%', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}
            />
            <button
              className="foto-nav next"
              onClick={(e) => { e.stopPropagation(); ir(1) }}
              aria-label="Foto siguiente"
            >›</button>
            {foto.label && <div className="carousel3d-cap lg">{foto.label}</div>}
            <span className="foto-count">{(activa ?? 0) + 1} / {cards.length}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden' }}>
        <Cilindro handleClick={handleClick} controls={controls} cards={cards} isCarouselActive={isActive} />
      </div>
    </motion.div>
  )
}
