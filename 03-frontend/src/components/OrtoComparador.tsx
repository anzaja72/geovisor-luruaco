import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, ImageOverlay, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, Map as LeafletMap } from 'leaflet'
import type { GeoFeature } from '../lib/types'

// Ortofotos del dron por mes (georreferenciadas como ImageOverlay). Bounds = wgs84Extent
// del GeoTIFF original. Febrero y Mayo aún no tienen imagen "después".
type B = [[number, number], [number, number]]
interface OrtoMes {
  antes: string
  antesBounds: B
  despues?: string
  despuesBounds?: B
}

const ORTOS: Record<string, OrtoMes> = {
  Enero: {
    antes: '/ortofotos/enero-antes.webp',
    antesBounds: [[10.607696, -75.151478], [10.612049, -75.146292]],
    despues: '/ortofotos/enero-despues.webp',
    despuesBounds: [[10.607694, -75.151507], [10.612060, -75.146269]],
  },
  Febrero: {
    antes: '/ortofotos/febrero-antes.webp',
    antesBounds: [[10.604965, -75.152265], [10.608986, -75.144497]],
    despues: '/ortofotos/febrero-despues.webp',
    despuesBounds: [[10.6052965, -75.1522944], [10.6090092, -75.1449155]],
  },
  Mayo: {
    antes: '/ortofotos/mayo-antes.webp',
    antesBounds: [[10.602133, -75.151200], [10.606596, -75.144456]],
    despues: '/ortofotos/mayo-despues.webp',
    despuesBounds: [[10.6021329, -75.1512003], [10.6065957, -75.1437571]],
  },
}
const MESES = Object.keys(ORTOS)

/** Registra el mapa y propaga sus movimientos al mapa hermano (misma vista). */
function Sync({
  selfRef,
  otherRef,
  lockRef,
}: {
  selfRef: React.MutableRefObject<LeafletMap | null>
  otherRef: React.MutableRefObject<LeafletMap | null>
  lockRef: React.MutableRefObject<boolean>
}) {
  const map = useMap()
  useEffect(() => {
    selfRef.current = map
    const onMove = () => {
      if (lockRef.current || !otherRef.current) return
      lockRef.current = true
      otherRef.current.setView(map.getCenter(), map.getZoom(), { animate: false })
      lockRef.current = false
    }
    map.on('move', onMove)
    return () => {
      map.off('move', onMove)
      selfRef.current = null
    }
  }, [map, selfRef, otherRef, lockRef])
  return null
}

function Lado({
  titulo,
  img,
  bounds,
  fit,
  polys,
  pdf,
  selfRef,
  otherRef,
  lockRef,
}: {
  titulo: string
  img?: string
  bounds?: B
  fit: B
  polys: GeoFeature[]
  pdf?: string
  selfRef: React.MutableRefObject<LeafletMap | null>
  otherRef: React.MutableRefObject<LeafletMap | null>
  lockRef: React.MutableRefObject<boolean>
}) {
  return (
    <div className="compare-side">
      <div className="compare-head"><span>{titulo}</span></div>
      <MapContainer
        bounds={fit as LatLngBoundsExpression}
        className="compare-map"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg"
          maxNativeZoom={16}
          maxZoom={20}
        />
        {img && bounds && <ImageOverlay url={img} bounds={bounds as LatLngBoundsExpression} />}
        {polys.length > 0 && (
          <GeoJSON
            key={`${img ?? 'x'}-${polys.length}`}
            data={{ type: 'FeatureCollection', features: polys } as unknown as GeoJSON.GeoJsonObject}
            style={{ color: '#eab308', weight: 2.5, fill: false }}
          />
        )}
        <Sync selfRef={selfRef} otherRef={otherRef} lockRef={lockRef} />
      </MapContainer>
      {!img && <div className="compare-empty">Sin imagen «después» para este mes</div>}
      {img && pdf && (
        <a className="orto-pdf" href={pdf} target="_blank" rel="noopener" download>
          ⬇ Descargar salida gráfica ({titulo.toLowerCase()}, PDF)
        </a>
      )}
    </div>
  )
}

/** Comparativo antes/después de las intervenciones con las ortofotos del dron. */
export default function OrtoComparador({ poligonos }: { poligonos: GeoFeature[] }) {
  const [mes, setMes] = useState('Enero')
  const orto = ORTOS[mes]
  const mapA = useRef<LeafletMap | null>(null)
  const mapB = useRef<LeafletMap | null>(null)
  const lockRef = useRef(false)
  const polys = useMemo(
    () => poligonos.filter((p) => String((p.properties as unknown as Record<string, unknown>)?.mes ?? '') === mes),
    [poligonos, mes],
  )

  return (
    <>
      <div className="filters" style={{ margin: '4px 12px 10px' }}>
        <div className="fl">
          <span className="lab">Mes</span>
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            {MESES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <span className="badge-soft">Mueve o acerca un mapa y el otro lo sigue</span>
      </div>
      <div className="compare-wrap" key={mes}>
        <Lado
          titulo="ANTES"
          img={orto.antes}
          bounds={orto.antesBounds}
          fit={orto.antesBounds}
          polys={polys}
          pdf={`/salidas/${mes.toLowerCase()}-antes.pdf`}
          selfRef={mapA}
          otherRef={mapB}
          lockRef={lockRef}
        />
        <Lado
          titulo="DESPUÉS"
          img={orto.despues}
          bounds={orto.despuesBounds ?? orto.antesBounds}
          fit={orto.antesBounds}
          polys={polys}
          pdf={`/salidas/${mes.toLowerCase()}-despues.pdf`}
          selfRef={mapB}
          otherRef={mapA}
          lockRef={lockRef}
        />
      </div>
    </>
  )
}
