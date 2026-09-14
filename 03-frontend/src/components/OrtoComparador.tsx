import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, ImageOverlay, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, Map as LeafletMap } from 'leaflet'
import type { GeoFeature } from '../lib/types'
import { MESES_LIMPIEZA, ortoDe, type Bounds as B } from '../geovisor/ortofotosMaleza'

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

/** Comparativo antes/después de las intervenciones con las ortofotos del dron.
 *  `mes` y `onMes` lo sincronizan con la línea de tiempo de la vista: si arriba se
 *  elige un monitoreo, el comparativo lo sigue, y al revés. */
export default function OrtoComparador({
  poligonos,
  mes,
  onMes,
}: {
  poligonos: GeoFeature[]
  mes?: string
  onMes?: (m: string) => void
}) {
  // La línea de tiempo puede estar en «Todos», que no es un mes comparable: en ese
  // caso el comparativo conserva su propia selección.
  const [interno, setInterno] = useState(MESES_LIMPIEZA[0])
  const activo = mes && MESES_LIMPIEZA.includes(mes) ? mes : interno
  const elegir = (m: string) => { setInterno(m); onMes?.(m) }
  const orto = ortoDe(activo)!
  const mapA = useRef<LeafletMap | null>(null)
  const mapB = useRef<LeafletMap | null>(null)
  const lockRef = useRef(false)
  const polys = useMemo(
    () => poligonos.filter((p) => String((p.properties as unknown as Record<string, unknown>)?.mes ?? '') === activo),
    [poligonos, activo],
  )

  return (
    <>
      <div className="filters" style={{ margin: '4px 12px 10px' }}>
        <div className="fl">
          <span className="lab">Mes</span>
          <select value={activo} onChange={(e) => elegir(e.target.value)}>
            {MESES_LIMPIEZA.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <span className="badge-soft">Mueve o acerca un mapa y el otro lo sigue</span>
      </div>
      <div className="compare-wrap" key={activo}>
        <Lado
          titulo="ANTES"
          img={orto.antes}
          bounds={orto.antesBounds}
          fit={orto.antesBounds}
          polys={polys}
          pdf={`/salidas/${activo.toLowerCase()}-antes.pdf`}
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
          pdf={`/salidas/${activo.toLowerCase()}-despues.pdf`}
          selfRef={mapB}
          otherRef={mapA}
          lockRef={lockRef}
        />
      </div>
    </>
  )
}
