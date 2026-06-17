import { GeoJSON, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import type { Tematicas } from '../hooks/useGeoData'
import type { GeoFeature } from '../lib/types'
import {
  cap,
  colorCumplimiento,
  ESTRATO,
  MALEZA_ESTADO,
  TECNICA,
} from '../lib/tematicas'

type Props = Record<string, unknown>

function row(dl: HTMLElement, k: string, v: string) {
  const dt = document.createElement('dt')
  dt.textContent = k
  const dd = document.createElement('dd')
  dd.textContent = v
  dl.append(dt, dd)
}

function popup(titulo: string, color: string, etiqueta: string, pares: [string, string][], p: Props) {
  const el = document.createElement('div')
  el.className = 'popup'
  const h = document.createElement('h3')
  h.className = 'popup-title'
  h.textContent = titulo
  const chip = document.createElement('span')
  chip.className = 'popup-chip'
  chip.style.background = color
  chip.style.color = '#fff'
  chip.textContent = etiqueta
  const dl = document.createElement('dl')
  dl.className = 'popup-grid'
  for (const [k, v] of pares) if (v) row(dl, k, v)
  el.append(h, chip, dl)
  if (p.origen === 'muestra') {
    const s = document.createElement('p')
    s.className = 'popup-desc'
    s.textContent = '⚠️ Dato de muestra — pendiente de levantamiento en campo.'
    el.append(s)
  }
  return el
}

const fc = (features: GeoFeature[]) =>
  ({ type: 'FeatureCollection', features } as unknown as GeoJSON.GeoJsonObject)

/** Capas temáticas de restauración dentro del control de capas. */
export default function TematicasOverlays({ tematicas }: { tematicas: Tematicas }) {
  const { estratos, malezas, tecnicas, validacion } = tematicas

  return (
    <>
      {estratos.length > 0 && (
        <LayersControl.Overlay name="🌱 Restauración · Estratos">
          <GeoJSON
            key={`est-${estratos.length}`}
            data={fc(estratos)}
            style={(f) => {
              const e = (f?.properties as Props)?.estrato as keyof typeof ESTRATO
              return { color: '#fff', weight: 1, fillColor: ESTRATO[e]?.color ?? '#888', fillOpacity: 0.55 }
            }}
            onEachFeature={(f, layer) => {
              const p = f.properties as Props
              const e = p.estrato as keyof typeof ESTRATO
              layer.bindPopup(
                popup('Estrato de vegetación', ESTRATO[e]?.color ?? '#888',
                  (ESTRATO[e]?.label ?? '').toUpperCase(),
                  [['Cobertura', `${p.cobertura_pct ?? 0}%`], ['Altura', `${p.altura_m ?? 0} m`],
                   ['Fecha', String(p.fecha ?? '')]], p))
            }}
          />
        </LayersControl.Overlay>
      )}

      {tecnicas.length > 0 && (
        <LayersControl.Overlay name="🌱 Restauración · Técnicas aplicadas">
          <GeoJSON
            key={`tec-${tecnicas.length}`}
            data={fc(tecnicas)}
            style={(f) => {
              const t = (f?.properties as Props)?.tecnica as keyof typeof TECNICA
              return { color: '#fff', weight: 1, fillColor: TECNICA[t]?.color ?? '#888', fillOpacity: 0.5 }
            }}
            onEachFeature={(f, layer) => {
              const p = f.properties as Props
              const t = p.tecnica as keyof typeof TECNICA
              layer.bindPopup(
                popup('Técnica de restauración', TECNICA[t]?.color ?? '#888',
                  (TECNICA[t]?.label ?? '').toUpperCase(),
                  [['Fecha', String(p.fecha ?? '')], ['Área', `${p.area_hectareas ?? 0} ha`],
                   ['Responsable', String(p.responsable ?? '')]], p))
            }}
          />
        </LayersControl.Overlay>
      )}

      {malezas.length > 0 && (
        <LayersControl.Overlay name="🔴 Restauración · Malezas / invasoras">
          <GeoJSON
            key={`mal-${malezas.length}`}
            data={fc(malezas)}
            pointToLayer={(f, latlng) => {
              const est = (f.properties as Props)?.estado as keyof typeof MALEZA_ESTADO
              return L.circleMarker(latlng, {
                radius: 7, color: '#fff', weight: 2,
                fillColor: MALEZA_ESTADO[est]?.color ?? '#dc2626', fillOpacity: 1,
              })
            }}
            onEachFeature={(f, layer) => {
              const p = f.properties as Props
              const est = p.estado as keyof typeof MALEZA_ESTADO
              layer.bindPopup(
                popup(String(p.especie ?? 'Maleza'), MALEZA_ESTADO[est]?.color ?? '#dc2626',
                  (MALEZA_ESTADO[est]?.label ?? '').toUpperCase(),
                  [['Cobertura', `${p.cobertura_pct ?? 0}%`], ['Fecha', String(p.fecha ?? '')],
                   ['Observaciones', String(p.observaciones ?? '')]], p))
            }}
          />
        </LayersControl.Overlay>
      )}

      {validacion.length > 0 && (
        <LayersControl.Overlay checked name="✓ Sitios de validación (meta/cumplimiento)">
          <GeoJSON
            key={`val-${validacion.length}`}
            data={fc(validacion)}
            pointToLayer={(f, latlng) => {
              const pct = (f.properties as Props)?.cumplimiento as number | undefined
              return L.circleMarker(latlng, {
                radius: 9, color: '#fff', weight: 2,
                fillColor: colorCumplimiento(pct), fillOpacity: 1,
              })
            }}
            onEachFeature={(f, layer) => {
              const p = f.properties as Props
              const pct = p.cumplimiento as number | undefined
              layer.bindPopup(
                popup(String(p.codigo ?? 'Validación'), colorCumplimiento(pct),
                  pct != null ? `CUMPLIMIENTO ${pct}%` : 'SIN META',
                  [['Indicador', cap(String(p.indicador ?? ''))],
                   ['Valor', `${p.valor ?? ''} ${p.unidad ?? ''}`],
                   ['Meta', p.meta != null ? `${p.meta} ${p.unidad ?? ''}` : '—'],
                   ['Fecha', String(p.fecha ?? '')]], p))
            }}
          />
        </LayersControl.Overlay>
      )}
    </>
  )
}
