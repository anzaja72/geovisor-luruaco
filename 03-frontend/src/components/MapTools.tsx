import { useEffect, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

/** Coordenada bajo el cursor (esquina inferior). */
export function CoordsControl() {
  const [c, setC] = useState<[number, number] | null>(null)
  useMapEvents({
    mousemove(e) {
      setC([e.latlng.lat, e.latlng.lng])
    },
    mouseout() {
      setC(null)
    },
  })
  return (
    <div className="coords-ctl">
      {c ? `${c[0].toFixed(5)}, ${c[1].toFixed(5)}` : 'lat, lon'}
    </div>
  )
}

/** Sincroniza la vista con el hash de la URL y permite copiar el enlace. */
function ShareButton() {
  const map = useMap()
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const m = window.location.hash.replace('#', '').match(/^(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
    if (m) map.setView([parseFloat(m[2]), parseFloat(m[3])], parseInt(m[1]))
    const onMove = () => {
      const c = map.getCenter()
      window.history.replaceState(
        null,
        '',
        `#${map.getZoom()}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`,
      )
    }
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
    }
  }, [map])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      /* noop */
    }
  }
  return (
    <button onClick={copiar} title="Copiar enlace de esta vista">
      {copiado ? '✓ Copiado' : '🔗 Compartir'}
    </button>
  )
}

interface Props {
  onDownload: () => void
}

/** Barra de herramientas del mapa: compartir, imprimir, descargar. */
export function MapToolbar({ onDownload }: Props) {
  return (
    <div className="map-tools">
      <ShareButton />
      <button onClick={() => window.print()} title="Imprimir / exportar a PDF">
        🖨 Imprimir
      </button>
      <button onClick={onDownload} title="Descargar capas del proyecto en GeoJSON">
        ⬇ GeoJSON
      </button>
    </div>
  )
}
