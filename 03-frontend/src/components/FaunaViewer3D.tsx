import { useEffect, useRef, useState } from 'react'
import type { FichaGrupo, PuntoEspecie } from '../geovisor/faunaFichas'

// Visor 3D de los especímenes de fauna (modelos .glb del anexo de línea base).
// three.js se carga bajo demanda: solo entra al bundle cuando se abre Monitoreo
// de Fauna, no en la carga inicial del geovisor.

/** Tamaño al que se ajusta el modelo. Las posiciones de los puntos de
 *  faunaFichas.ts están en este mismo espacio normalizado. */
const FIT_SIZE = 3.8

/** Escena viva; se guarda en un ref para poder liberarla al desmontar. */
interface Escena {
  destruir: () => void
  cargar: (url: string, puntos: PuntoEspecie[]) => Promise<void>
  autoRotar: (on: boolean) => void
  reencuadrar: () => void
}

export default function FaunaViewer3D({
  ficha,
  alto = 380,
}: {
  ficha: FichaGrupo
  alto?: number
}) {
  const lienzo = useRef<HTMLDivElement>(null)
  const escena = useRef<Escena | null>(null)
  // Los puntos se posicionan escribiendo el estilo directamente en cada frame:
  // pasar por el estado de React 60 veces por segundo dispararía otros tantos renders.
  const dots = useRef<(HTMLButtonElement | null)[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [rotando, setRotando] = useState(true)
  const [error, setError] = useState(false)
  /** Se incrementa para forzar otro intento de carga del mismo espécimen. */
  const [intento, setIntento] = useState(0)

  // Montaje de la escena (una sola vez). El modelo se carga en el efecto siguiente.
  useEffect(() => {
    const host = lienzo.current
    if (!host) return
    let vivo = true

    const montar = async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
      if (!vivo) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)
      Object.assign(renderer.domElement.style, {
        width: '100%', height: '100%', display: 'block', cursor: 'grab',
      })

      renderer.domElement.addEventListener('webglcontextlost', (ev) => {
        ev.preventDefault()   // permite que el navegador restaure el contexto
        console.warn('[FaunaViewer3D] contexto WebGL perdido')
        if (vivo) { setError(true); setCargando(false) }
      })

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
      camera.position.set(0, 0.55, 6.9)

      // Luz suave y cenital, en la línea del resto de la interfaz (fondo claro).
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbcc6cf, 2.1))
      const key = new THREE.DirectionalLight(0xffffff, 2.2)
      key.position.set(3.5, 6, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xdfe9f2, 0.9)
      fill.position.set(-4, 1.5, -3)
      scene.add(fill)

      // Disco de apoyo: da suelo al espécimen sin cargar la escena.
      const plinto = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 64),
        new THREE.MeshBasicMaterial({ color: 0x1b6d24, transparent: true, opacity: 0.07 }),
      )
      plinto.rotation.x = -Math.PI / 2
      plinto.position.y = -2.15
      scene.add(plinto)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = false
      controls.minDistance = 3.6
      controls.maxDistance = 11
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.9

      const pivot = new THREE.Group()
      scene.add(pivot)

      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)

      let anclas: InstanceType<typeof THREE.Vector3>[] = []
      let raf = 0
      let peticion = 0

      const medir = () => {
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      medir()
      const ro = new ResizeObserver(() => { medir(); dibujar() })
      ro.observe(host)

      // Proyección de los puntos a coordenadas de pantalla; los que quedan en la
      // cara opuesta del modelo se atenúan y dejan de recibir clics.
      const proyector = new THREE.Vector3()
      const haciaCamara = new THREE.Vector3()
      const normal = new THREE.Vector3()
      const colocarPuntos = () => {
        for (let i = 0; i < anclas.length; i += 1) {
          const el = dots.current[i]
          if (!el) continue
          proyector.copy(anclas[i])
          pivot.localToWorld(proyector)
          haciaCamara.copy(camera.position).sub(proyector).normalize()
          normal.copy(anclas[i]).normalize()
          const frente = normal.dot(haciaCamara) > -0.15
          proyector.project(camera)
          el.style.left = `${(proyector.x * 0.5 + 0.5) * 100}%`
          el.style.top = `${(-proyector.y * 0.5 + 0.5) * 100}%`
          el.style.opacity = frente ? '1' : '0.18'
          el.style.pointerEvents = frente ? 'auto' : 'none'
        }
      }

      /** Un fotograma suelto: se usa al cargar y al redimensionar, para que la
       *  vista sea correcta aunque el bucle aún no haya corrido. */
      const dibujar = () => {
        controls.update()
        renderer.render(scene, camera)
        colocarPuntos()
      }

      const bucle = () => {
        raf = requestAnimationFrame(bucle)
        dibujar()
      }
      bucle()

      /** Libera geometría, materiales y texturas de un subárbol. Sin esto la
       *  memoria de vídeo se acumula a cada cambio de espécimen. */
      const liberar = (raiz: InstanceType<typeof THREE.Object3D>) => {
        raiz.traverse((o) => {
          const m = o as InstanceType<typeof THREE.Mesh>
          m.geometry?.dispose()
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
          for (const mat of mats) {
            for (const valor of Object.values(mat as unknown as Record<string, unknown>)) {
              const tex = valor as { isTexture?: boolean; dispose?: () => void }
              if (tex?.isTexture) tex.dispose?.()
            }
            ;(mat as { dispose?: () => void }).dispose?.()
          }
        })
      }

      /** Lleva cada punto al vértice más cercano de la malla, para que se apoye
       *  sobre la superficie y no flote dentro o fuera del modelo. */
      const pegarASuperficie = (puntos: PuntoEspecie[], mallas: InstanceType<typeof THREE.Mesh>[]) => {
        const objetivos = puntos.map((p) => new THREE.Vector3(...p.position))
        const mejores = objetivos.map((o) => ({ punto: o.clone(), dist: Infinity }))
        const v = new THREE.Vector3()
        for (const malla of mallas) {
          const pos = malla.geometry.getAttribute('position')
          if (!pos) continue
          malla.updateWorldMatrix(true, false)
          for (let i = 0; i < pos.count; i += 1) {
            v.fromBufferAttribute(pos, i).applyMatrix4(malla.matrixWorld)
            for (let h = 0; h < objetivos.length; h += 1) {
              const d = v.distanceToSquared(objetivos[h])
              if (d < mejores[h].dist) { mejores[h].dist = d; mejores[h].punto.copy(v) }
            }
          }
        }
        return mejores.map((m) => m.punto)
      }

      escena.current = {
        destruir: () => {
          cancelAnimationFrame(raf)
          ro.disconnect()
          controls.dispose()
          scene.traverse((o) => {
            const m = o as InstanceType<typeof THREE.Mesh>
            if (m.geometry) m.geometry.dispose()
            const mat = m.material as { dispose?: () => void } | undefined
            if (mat?.dispose) mat.dispose()
          })
          renderer.dispose()
          renderer.domElement.remove()
        },
        autoRotar: (on: boolean) => { controls.autoRotate = on },
        reencuadrar: () => {
          camera.position.set(0, 0.55, 6.9)
          controls.target.set(0, 0, 0)
          dibujar()
        },
        cargar: async (url, puntos) => {
          const mia = ++peticion
          const gltf = await loader.loadAsync(url)
          // Otra carga arrancó mientras esta descargaba: la nueva manda.
          if (!vivo || mia !== peticion) return
          // Fuera el modelo anterior, con sus geometrías, materiales y texturas.
          for (const hijo of [...pivot.children]) {
            pivot.remove(hijo)
            liberar(hijo)
          }
          const modelo = gltf.scene
          const caja = new THREE.Box3().setFromObject(modelo)
          const tam = caja.getSize(new THREE.Vector3())
          const centro = caja.getCenter(new THREE.Vector3())
          const escala = FIT_SIZE / Math.max(tam.x, tam.y, tam.z, 0.001)
          modelo.scale.setScalar(escala)
          modelo.position.copy(centro.multiplyScalar(-escala))
          pivot.add(modelo)

          const mallas: InstanceType<typeof THREE.Mesh>[] = []
          modelo.traverse((o) => {
            const m = o as InstanceType<typeof THREE.Mesh>
            if (m.isMesh) mallas.push(m)
          })
          pivot.updateWorldMatrix(true, true)
          anclas = pegarASuperficie(puntos, mallas)
          dibujar()
        },
      }
    }

    montar().catch((e) => {
      console.warn('[FaunaViewer3D] no se pudo iniciar la escena 3D', e)
      if (vivo) { setError(true); setCargando(false) }
    })

    return () => {
      vivo = false
      escena.current?.destruir()
      escena.current = null
    }
  }, [])

  // Al cambiar de grupo se reinicia la selección durante el render, no en un
  // efecto: así el primer pintado ya muestra el estado del grupo nuevo.
  const [grupoPrevio, setGrupoPrevio] = useState(ficha.id)
  if (grupoPrevio !== ficha.id) {
    setGrupoPrevio(ficha.id)
    setSel(null)
    setCargando(true)
    setError(false)   // un fallo anterior no debe condenar al resto de grupos
  }

  // Carga del modelo del grupo activo.
  useEffect(() => {
    let vivo = true
    const intentar = async (reintentos = 50): Promise<void> => {
      if (!vivo) return
      if (!escena.current) {
        if (reintentos <= 0) { setError(true); setCargando(false); return }
        await new Promise((r) => setTimeout(r, 100))
        return intentar(reintentos - 1)
      }
      try {
        await escena.current.cargar(ficha.modelo, ficha.puntos)
        if (vivo) setCargando(false)
      } catch (e) {
        console.warn('[FaunaViewer3D] no se pudo cargar', ficha.modelo, e)
        if (vivo) { setError(true); setCargando(false) }
      }
    }
    intentar()
    return () => { vivo = false }
  }, [ficha, intento])

  const alternarRotacion = () => {
    const on = !rotando
    setRotando(on)
    escena.current?.autoRotar(on)
  }

  const punto = ficha.puntos.find((p) => p.id === sel) ?? null

  return (
    <div className="f3d" style={{ height: alto }}>
      <div ref={lienzo} className="f3d-canvas" />

      {/* Puntos de especies emblemáticas, proyectados sobre el modelo */}
      {!error && ficha.puntos.map((p, i) => (
        <button
          key={p.id}
          ref={(el) => { dots.current[i] = el }}
          type="button"
          className={`f3d-dot${sel === p.id ? ' on' : ''}`}
          style={{ background: p.color, opacity: cargando ? 0 : 1 }}
          title={p.label}
          aria-label={p.label}
          onClick={() => setSel(sel === p.id ? null : p.id)}
        />
      ))}

      {punto && (
        <div className="f3d-card" style={{ borderLeftColor: punto.color }}>
          <b>{punto.label}</b>
          <small>{punto.detail}</small>
        </div>
      )}

      {cargando && !error && (
        <div className="f3d-estado"><span className="f3d-spin" /> Cargando espécimen…</div>
      )}

      {error && (
        // Sin WebGL (o si falla la carga) queda la lámina de estudio del grupo.
        <div className="f3d-fallback">
          <img src={ficha.foto} alt={`${ficha.nombre} — ${ficha.especieModelo}`} />
          <span>No se pudo mostrar el modelo 3D · lámina de {ficha.especieModelo}</span>
          <button
            type="button"
            className="f3d-reintentar"
            onClick={() => { setError(false); setCargando(true); setIntento((n) => n + 1) }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!error && (
        <div className="f3d-tools">
          <button type="button" onClick={alternarRotacion} title={rotando ? 'Pausar giro' : 'Girar automáticamente'}>
            {rotando ? '❚❚' : '▶'}
          </button>
          <button type="button" onClick={() => escena.current?.reencuadrar()} title="Reencuadrar">⤢</button>
        </div>
      )}

      <span className="f3d-hint">Arrastra para girar · rueda para acercar · toca un punto</span>
    </div>
  )
}
