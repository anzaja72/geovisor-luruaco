import { useEffect } from 'react'
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colorDe } from '../lib/quality'
import type { GeoFeature } from '../lib/types'
import FeaturePopup from './FeaturePopup'

const LURUACO_CENTER: [number, number] = [10.61, -75.1]

// Símbolo de punto de control topográfico (crosshair morado, fuera de la
// escala de calidad para que no se confunda con un "sitio").
const controlIcon = L.divIcon({
  className: 'control-pt',
  html:
    '<svg width="22" height="22" viewBox="0 0 22 22">' +
    '<circle cx="11" cy="11" r="8" fill="#fff" stroke="#7c3aed" stroke-width="2"/>' +
    '<path d="M11 2 V20 M2 11 H20" stroke="#7c3aed" stroke-width="1.4"/>' +
    '</svg>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

interface Props {
  features: GeoFeature[]
  puntos: GeoFeature[]
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
}

/** Devuelve el centro de cualquier geometría de forma segura (no asume Polygon). */
function centroOf(feature: GeoFeature): [number, number] | null {
  try {
    const b = L.geoJSON(feature as unknown as GeoJSON.GeoJsonObject).getBounds()
    if (!b.isValid()) return null
    const c = b.getCenter()
    return [c.lat, c.lng]
  } catch {
    return null
  }
}

/** Ajusta la vista al feature seleccionado (o a todo el conjunto). */
function FitController({
  selected,
  features,
}: {
  selected: GeoFeature | null
  features: GeoFeature[]
}) {
  const map = useMap()

  useEffect(() => {
    if (selected) {
      try {
        const b = L.geoJSON(selected as unknown as GeoJSON.GeoJsonObject).getBounds()
        if (b.isValid()) map.flyToBounds(b, { padding: [60, 60], maxZoom: 15 })
        return
      } catch {
        /* noop */
      }
    }
    if (features.length > 0) {
      try {
        const group = L.geoJSON(
          { type: 'FeatureCollection', features } as unknown as GeoJSON.GeoJsonObject,
        )
        const b = group.getBounds()
        if (b.isValid()) map.fitBounds(b, { padding: [40, 40] })
      } catch {
        /* noop */
      }
    }
  }, [selected, features, map])

  return null
}

export default function MapView({ features, puntos, selected, onSelect }: Props) {
  return (
    <MapContainer center={LURUACO_CENTER} zoom={13} className="map" zoomControl={false}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satélite (Esri)">
          <TileLayer
            attribution="&copy; Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Océano (Esri)">
          <TileLayer
            attribution="&copy; Esri, GEBCO, NOAA"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={13}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Calles (OSM)">
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Polígonos coloreados por categoría (capa de relleno sutil) */}
      {features.length > 0 && (
        <GeoJSON
          key={features.map((f) => f.properties.id).join('-')}
          data={{ type: 'FeatureCollection', features } as unknown as GeoJSON.GeoJsonObject}
          style={(feat) => {
            const cat = (feat?.properties as GeoFeature['properties'])?.categoria_calidad
            return {
              color: '#ffffff',
              weight: 1.5,
              fillColor: colorDe(cat),
              fillOpacity: 0.35,
            }
          }}
        />
      )}

      {/* Marcadores tipo "sitio" en el centroide, coloreados por categoría */}
      {features.map((f) => {
        const c = centroOf(f)
        if (!c) return null
        const isSel = selected?.properties.id === f.properties.id
        return (
          <CircleMarker
            key={`pt-${f.properties.id}`}
            center={c}
            radius={isSel ? 11 : 8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: colorDe(f.properties.categoria_calidad),
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(f) }}
          >
            <Popup>
              <FeaturePopup feature={f} />
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Puntos de control topográfico (datos reales del levantamiento) */}
      {puntos.map((pt) => {
        const coords = pt.geometry.coordinates as [number, number] | undefined
        if (!coords || coords.length < 2) return null
        const p = pt.properties
        return (
          <Marker key={`ctrl-${p.id}`} position={[coords[1], coords[0]]} icon={controlIcon}>
            <Popup>
              <div className="popup">
                <h3 className="popup-title">{p.codigo_punto ?? 'Punto'}</h3>
                <span className="popup-chip" style={{ background: '#7c3aed', color: '#fff' }}>
                  PUNTO DE CONTROL
                </span>
                <dl className="popup-grid">
                  {p.nombre_punto && (
                    <>
                      <dt>Nombre</dt>
                      <dd>{p.nombre_punto}</dd>
                    </>
                  )}
                  <dt>Coordenadas</dt>
                  <dd>{coords[1].toFixed(5)}, {coords[0].toFixed(5)}</dd>
                  {p.elevacion != null && (
                    <>
                      <dt>Elevación</dt>
                      <dd>{p.elevacion} m</dd>
                    </>
                  )}
                </dl>
                {p.descripcion && <p className="popup-desc">{p.descripcion}</p>}
              </div>
            </Popup>
          </Marker>
        )
      })}

      <FitController selected={selected} features={[...features, ...puntos]} />
    </MapContainer>
  )
}
