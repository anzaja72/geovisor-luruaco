import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  LayerGroup,
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

// Símbolo de punto de control topográfico (crosshair morado).
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
  zonas: GeoFeature[]
  lotes: GeoFeature[]
  puntos: GeoFeature[]
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
}

/** Centro seguro de cualquier geometría (no asume Polygon). */
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

/** Capa de "sitios" (polígonos + marcador de centroide por categoría). */
function FeatureLayer({
  features,
  selected,
  onSelect,
}: {
  features: GeoFeature[]
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
}) {
  if (features.length === 0) return null
  return (
    <LayerGroup>
      <GeoJSON
        key={features.map((f) => f.properties.id).join('-')}
        data={{ type: 'FeatureCollection', features } as unknown as GeoJSON.GeoJsonObject}
        style={(feat) => {
          const cat = (feat?.properties as GeoFeature['properties'])?.categoria_calidad
          return { color: '#ffffff', weight: 1.5, fillColor: colorDe(cat), fillOpacity: 0.35 }
        }}
      />
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
    </LayerGroup>
  )
}

/** Ajusta la vista al feature seleccionado (o a todo el conjunto). */
function FitController({
  selected,
  all,
}: {
  selected: GeoFeature | null
  all: GeoFeature[]
}) {
  const map = useMap()
  useEffect(() => {
    const fc = (fs: GeoFeature[]) =>
      L.geoJSON({ type: 'FeatureCollection', features: fs } as unknown as GeoJSON.GeoJsonObject)
    if (selected) {
      try {
        const b = fc([selected]).getBounds()
        if (b.isValid()) map.flyToBounds(b, { padding: [60, 60], maxZoom: 15 })
        return
      } catch {
        /* noop */
      }
    }
    if (all.length > 0) {
      try {
        const b = fc(all).getBounds()
        if (b.isValid()) map.fitBounds(b, { padding: [40, 40] })
      } catch {
        /* noop */
      }
    }
  }, [selected, all, map])
  return null
}

/** Búsqueda de lugar (geocodificación Nominatim) con flyTo. */
function SearchControl() {
  const map = useMap()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    setErr(false)
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(q)
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const data: Array<{ lat: string; lon: string }> = await res.json()
      if (data.length > 0) {
        map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 14)
      } else {
        setErr(true)
      }
    } catch {
      setErr(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="map-search" onSubmit={buscar}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar lugar…"
        aria-label="Buscar lugar"
      />
      <button type="submit" disabled={busy}>
        {busy ? '…' : '🔍'}
      </button>
      {err && <span className="map-search-err">Sin resultados</span>}
    </form>
  )
}

export default function MapView({ zonas, lotes, puntos, selected, onSelect }: Props) {
  const all = useMemo(() => [...zonas, ...lotes, ...puntos], [zonas, lotes, puntos])
  return (
    <MapContainer center={LURUACO_CENTER} zoom={13} className="map">
      <SearchControl />
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

        <LayersControl.Overlay checked name="Zonas de restauración">
          <FeatureLayer features={zonas} selected={selected} onSelect={onSelect} />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Lotes de bioaumentación">
          <FeatureLayer features={lotes} selected={selected} onSelect={onSelect} />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Puntos de control">
          <LayerGroup>
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
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <FitController selected={selected} all={all} />
    </MapContainer>
  )
}
