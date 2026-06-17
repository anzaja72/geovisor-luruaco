import { LayersControl, WMSTileLayer } from 'react-leaflet'
import { IGAC_ATTRIBUTION, IGAC_WMS, wmsUrl } from '../lib/igac'

/** Capas oficiales del IGAC (catastro, pendientes, agrología) vía WMS. */
export default function IgacOverlays() {
  return (
    <>
      {IGAC_WMS.map((l) => (
        <LayersControl.Overlay key={l.id} name={`🏛 IGAC · ${l.nombre}`}>
          <WMSTileLayer
            url={wmsUrl(l.service)}
            layers={l.layers}
            format="image/png"
            transparent
            version="1.3.0"
            opacity={0.7}
            attribution={IGAC_ATTRIBUTION}
          />
        </LayersControl.Overlay>
      ))}
    </>
  )
}
