import { useEffect } from 'react'
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
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

interface Props {
  features: GeoFeature[]
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

export default function MapView({ features, selected, onSelect }: Props) {
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

      <FitController selected={selected} features={features} />
    </MapContainer>
  )
}
