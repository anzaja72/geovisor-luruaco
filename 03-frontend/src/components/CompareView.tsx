import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { colorDe } from '../lib/quality'
import type { GeoFeature } from '../lib/types'

const CENTER: [number, number] = [10.61, -75.1]

/** Registra la instancia del mapa y propaga movimientos al mapa hermano. */
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
  features,
  periodo,
  periodos,
  onPeriodo,
  selfRef,
  otherRef,
  lockRef,
}: {
  titulo: string
  features: GeoFeature[]
  periodo: string
  periodos: string[]
  onPeriodo: (p: string) => void
  selfRef: React.MutableRefObject<LeafletMap | null>
  otherRef: React.MutableRefObject<LeafletMap | null>
  lockRef: React.MutableRefObject<boolean>
}) {
  const visibles = useMemo(
    () => features.filter((f) => !f.properties.periodo || f.properties.periodo === periodo),
    [features, periodo],
  )
  return (
    <div className="compare-side">
      <div className="compare-head">
        <span>{titulo}</span>
        <select value={periodo} onChange={(e) => onPeriodo(e.target.value)}>
          {(periodos.length ? periodos : [periodo]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="compare-count">{visibles.length} sitios</span>
      </div>
      <MapContainer center={CENTER} zoom={13} className="compare-map">
        <TileLayer
          attribution="&copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        {visibles.length > 0 && (
          <GeoJSON
            key={`${periodo}-${visibles.length}`}
            data={
              { type: 'FeatureCollection', features: visibles } as unknown as GeoJSON.GeoJsonObject
            }
            style={(f) => ({
              color: '#fff',
              weight: 1.5,
              fillColor: colorDe((f?.properties as GeoFeature['properties'])?.categoria_calidad),
              fillOpacity: 0.55,
            })}
          />
        )}
        <Sync selfRef={selfRef} otherRef={otherRef} lockRef={lockRef} />
      </MapContainer>
    </div>
  )
}

/** Comparación temporal ANTES / DESPUÉS con mapas sincronizados (spec §5). */
export default function CompareView({
  features,
  periodos,
}: {
  features: GeoFeature[]
  periodos: string[]
}) {
  const [pA, setPA] = useState(periodos[periodos.length - 1] ?? '2024-2')
  const [pB, setPB] = useState(periodos[0] ?? '2024-2')
  const mapA = useRef<LeafletMap | null>(null)
  const mapB = useRef<LeafletMap | null>(null)
  const lockRef = useRef(false)

  return (
    <div className="compare-wrap">
      <Lado
        titulo="ANTES"
        features={features}
        periodo={pA}
        periodos={periodos}
        onPeriodo={setPA}
        selfRef={mapA}
        otherRef={mapB}
        lockRef={lockRef}
      />
      <Lado
        titulo="DESPUÉS"
        features={features}
        periodo={pB}
        periodos={periodos}
        onPeriodo={setPB}
        selfRef={mapB}
        otherRef={mapA}
        lockRef={lockRef}
      />
    </div>
  )
}
