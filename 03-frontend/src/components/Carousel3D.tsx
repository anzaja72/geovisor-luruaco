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

const Cilindro = memo(function Cilindro({
  handleClick,
  controls,
  cards,
  isCarouselActive,
}: {
  handleClick: (foto: Foto) => void
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
        onDrag={(_, info) => isCarouselActive && rotation.set(rotation.get() + info.offset.x * 0.05)}
        onDragEnd={(_, info) =>
          isCarouselActive &&
          controls.start({
            rotateY: rotation.get() + info.velocity.x * 0.05,
            transition: { type: 'spring', stiffness: 100, damping: 30, mass: 0.1 },
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
            onClick={() => handleClick(foto)}
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
  const [activa, setActiva] = useState<Foto | null>(null)
  const [isActive, setIsActive] = useState(true)
  const controls = useAnimation()
  const cards = useMemo<Foto[]>(
    () => images.map((f) => (typeof f === 'string' ? { src: f } : f)),
    [images],
  )

  const handleClick = (foto: Foto) => { setActiva(foto); setIsActive(false); controls.stop() }
  const handleClose = () => { setActiva(null); setIsActive(true) }

  return (
    <motion.div layout style={{ position: 'relative' }}>
      <AnimatePresence mode="sync">
        {activa && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activa.src}`}
            layout="position"
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex',
              flexDirection: 'column', gap: 12,
              alignItems: 'center', justifyContent: 'center', zIndex: 1000, margin: '2.5rem',
              borderRadius: 24, willChange: 'opacity', cursor: 'zoom-out',
            }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.img
              layoutId={`img-${activa.src}`}
              src={activa.src}
              alt={activa.label ?? 'Fotografía de la actividad'}
              style={{ maxWidth: '100%', maxHeight: activa.label ? '86%' : '100%', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {activa.label && <div className="carousel3d-cap lg">{activa.label}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden' }}>
        <Cilindro handleClick={handleClick} controls={controls} cards={cards} isCarouselActive={isActive} />
      </div>
    </motion.div>
  )
}
