import { useState } from 'react'
import { CircleMarker, Polygon, Polyline, useMapEvents } from 'react-leaflet'

type Pt = [number, number] // [lat, lng]

const R = 6371008.8 // radio terrestre medio (m)
const rad = (d: number) => (d * Math.PI) / 180

/** Distancia haversine en metros. */
function dist(a: Pt, b: Pt): number {
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Área esférica (m²) de un anillo de puntos [lat,lng]. */
function area(pts: Pt[]): number {
  if (pts.length < 3) return 0
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    s += rad(p2[1] - p1[1]) * (2 + Math.sin(rad(p1[0])) + Math.sin(rad(p2[0])))
  }
  return Math.abs((s * R * R) / 2)
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`
}
function fmtArea(m2: number): string {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  return `${m2.toFixed(0)} m²`
}

interface Props {
  modo: 'off' | 'distancia' | 'area'
  onModo: (m: 'off' | 'distancia' | 'area') => void
}

/** Herramienta de medición de distancia y área (spec §5). */
export default function MeasureTool({ modo, onModo }: Props) {
  const [pts, setPts] = useState<Pt[]>([])

  useMapEvents({
    click(e) {
      if (modo !== 'off') setPts((p) => [...p, [e.latlng.lat, e.latlng.lng]])
    },
  })

  const totalDist = pts.slice(1).reduce((acc, p, i) => acc + dist(pts[i], p), 0)
  const totalArea = modo === 'area' ? area(pts) : 0

  const cambiar = (m: 'off' | 'distancia' | 'area') => {
    setPts([])
    onModo(m === modo ? 'off' : m)
  }

  return (
    <>
      <div className="measure-ctl">
        <button
          className={modo === 'distancia' ? 'active' : ''}
          onClick={() => cambiar('distancia')}
          title="Medir distancia"
        >
          📏
        </button>
        <button
          className={modo === 'area' ? 'active' : ''}
          onClick={() => cambiar('area')}
          title="Medir área"
        >
          ⬠
        </button>
        {modo !== 'off' && pts.length > 0 && (
          <span className="measure-out">
            {modo === 'distancia'
              ? fmtDist(totalDist)
              : `${fmtArea(totalArea)} · ${fmtDist(totalDist)}`}
            <button className="measure-clear" onClick={() => setPts([])} title="Borrar">
              ✕
            </button>
          </span>
        )}
      </div>

      {pts.map((p, i) => (
        <CircleMarker
          key={`m-${i}`}
          center={p}
          radius={4}
          pathOptions={{ color: '#fff', weight: 1.5, fillColor: '#e8302a', fillOpacity: 1 }}
        />
      ))}
      {modo === 'distancia' && pts.length > 1 && (
        <Polyline positions={pts} pathOptions={{ color: '#e8302a', weight: 3, dashArray: '6 6' }} />
      )}
      {modo === 'area' && pts.length > 2 && (
        <Polygon
          positions={pts}
          pathOptions={{ color: '#e8302a', weight: 2, dashArray: '6 6', fillOpacity: 0.15 }}
        />
      )}
      {modo === 'area' && pts.length === 2 && (
        <Polyline positions={pts} pathOptions={{ color: '#e8302a', weight: 2, dashArray: '6 6' }} />
      )}
    </>
  )
}
