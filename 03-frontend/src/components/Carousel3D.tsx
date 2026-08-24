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

const Cilindro = memo(function Cilindro({
  handleClick,
  controls,
  cards,
  isCarouselActive,
}: {
  handleClick: (imgUrl: string) => void
  controls: ReturnType<typeof useAnimation>
  cards: string[]
  isCarouselActive: boolean
}) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const cylinderWidth = isSm ? 1100 : 1800
  const faceCount = cards.length
  const faceWidth = cylinderWidth / Math.max(faceCount, 1)
  const radius = cylinderWidth / (2 * Math.PI)
  const rotation = useMotionValue(0)
  const transform = useTransform(rotation, (v) => `rotate3d(0, 1, 0, ${v}deg)`)

  return (
    <div
      style={{
        display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center',
        perspective: '1000px', transformStyle: 'preserve-3d', willChange: 'transform',
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
        {cards.map((imgUrl, i) => (
          <motion.div
            key={`card-${i}`}
            style={{
              position: 'absolute', display: 'flex', height: '100%', transformOrigin: 'center',
              alignItems: 'center', justifyContent: 'center', padding: 8,
              width: `${faceWidth}px`,
              transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
            }}
            onClick={() => handleClick(imgUrl)}
          >
            <motion.img
              src={imgUrl}
              alt={`Foto ${i + 1}`}
              layoutId={`img-${imgUrl}`}
              style={{
                pointerEvents: 'none', width: '100%', borderRadius: 12,
                objectFit: 'cover', aspectRatio: '1 / 1',
                boxShadow: '0 6px 18px rgba(0,0,0,.25)',
              }}
              initial={{ filter: 'blur(4px)' }}
              layout="position"
              animate={{ filter: 'blur(0px)' }}
              transition={transition}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
})

/** Carrusel 3D de fotos. `images` = rutas de las imágenes. */
export default function Carousel3D({ images, height = 460 }: { images: string[]; height?: number }) {
  const [activeImg, setActiveImg] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const controls = useAnimation()
  const cards = useMemo(() => images, [images])

  const handleClick = (imgUrl: string) => { setActiveImg(imgUrl); setIsActive(false); controls.stop() }
  const handleClose = () => { setActiveImg(null); setIsActive(true) }

  return (
    <motion.div layout style={{ position: 'relative' }}>
      <AnimatePresence mode="sync">
        {activeImg && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activeImg}`}
            layout="position"
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000, margin: '2.5rem',
              borderRadius: 24, willChange: 'opacity', cursor: 'zoom-out',
            }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.img
              layoutId={`img-${activeImg}`}
              src={activeImg}
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden' }}>
        <Cilindro handleClick={handleClick} controls={controls} cards={cards} isCarouselActive={isActive} />
      </div>
    </motion.div>
  )
}
