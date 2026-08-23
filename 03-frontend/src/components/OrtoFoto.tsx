import { ImageOverlay, MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

/** Muestra una ortofoto del dron georreferenciada (ImageOverlay) sobre un mapa. */
export default function OrtoFoto({
  src,
  bounds,
  height = 420,
}: {
  src: string
  bounds: [[number, number], [number, number]]
  height?: number
}) {
  return (
    <MapContainer
      bounds={bounds as LatLngBoundsExpression}
      style={{ height, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg"
        maxNativeZoom={16}
        maxZoom={20}
        attribution="© EOX · Copernicus (ESA)"
      />
      <ImageOverlay url={src} bounds={bounds as LatLngBoundsExpression} />
    </MapContainer>
  )
}
