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
import { BASEMAPS } from '../lib/basemaps'
import type { GeoFeature } from '../lib/types'
import type { Tematicas } from '../hooks/useGeoData'
import FeaturePopup from './FeaturePopup'
import MeasureTool from './MeasureTool'
import TematicasOverlays from './TematicasOverlays'
import IgacOverlays from './IgacOverlays'
import { CoordsControl, MapToolbar } from './MapTools'

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

export type ComponenteGeovisor = 'restauracion' | 'maleza' | 'ficorremediacion' | 'fauna'

/** Props de datos comunes a los 4 geovisores (todas las vistas reciben el mismo paquete;
 *  MapView decide internamente qué es pertinente según `componente`). */
export interface GeovisorMapProps {
  zonas: GeoFeature[]
  puntos: GeoFeature[]
  capas: GeoFeature[]
  coberturas: GeoFeature[]
  tematicas: Tematicas
  selected: GeoFeature | null
  onSelect: (f: GeoFeature) => void
}

interface Props extends GeovisorMapProps {
  /** Qué componente está mostrando este mapa — determina qué capas de datos son pertinentes. */
  componente: ComponenteGeovisor
  /** Claves de cobertura visibles (ver claseCobertura). undefined = todas visibles. */
  coberturasActivas?: Set<string>
  className?: string
}

// Capas importadas (capas_geograficas) pertinentes por componente. curvas_nivel se omite
// siempre (satura el mapa). "aislamiento_interno" es de Restauración; "maleza_acuatica" de Maleza.
const CAPAS_POR_COMPONENTE: Record<ComponenteGeovisor, string[]> = {
  restauracion: ['aislamiento_interno'],
  maleza: ['maleza_acuatica'],
  ficorremediacion: [],
  fauna: [],
}

const CAPA_LABEL: Record<string, string> = {
  aislamiento_interno: '🚧 Aislamiento interno (cercas)',
  maleza_acuatica: '🟢 Polígonos de limpieza de maleza',
}

// Paleta para capas importadas (distinta de la escala de calidad).
const CAPA_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#ec4899']
// Color fijo por capa (sobre el color rotativo por índice) — aislamiento interno en rojo.
const CAPA_COLOR_FIJO: Record<string, string> = { aislamiento_interno: '#dc2626' }

// Clave estable de clase Corine (compartida con los chips de filtro del front).
export function claseCobertura(s: string): string {
  const x = s.toLowerCase()
  if (x.includes('mosaico') || x.includes('cultivo')) return 'mosaico'
  if (x.includes('denso')) return 'denso'
  if (x.includes('galer') || x.includes('ripario')) return 'galeria'
  if (x.includes('secundaria')) return 'secundaria'
  if (x.includes('desnud') || x.includes('degrad')) return 'desnuda'
  return 'otro'
}

export const CLASE_COLOR: Record<string, string> = {
  mosaico: '#e7c878', denso: '#2f7d3a', galeria: '#7cc47f',
  secundaria: '#c0e39a', desnuda: '#bcbcbc', otro: '#94a3b8',
}

// Color de cobertura por clase Corine real (descripcion / clase_tematica / código CLC).
function coberturaColor(p: Record<string, unknown>): string {
  const s = `${p?.descripcion ?? ''} ${p?.clase_tematica ?? ''} ${p?.codigo_corine ?? ''}`
  return CLASE_COLOR[claseCobertura(s)]
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
        if (b.isValid()) {
          map.fitBounds(b, { padding: [40, 40], animate: false })
          return
        }
      } catch {
        /* noop */
      }
    }
    // Sin datos pertinentes (p. ej. Ficorremediación/Fauna sin geometría aún): vista
    // por defecto del proyecto, nunca la vista heredada de otro componente (hash/share).
    map.setView(LURUACO_CENTER, 13)
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

export default function MapView({
  componente,
  zonas,
  puntos,
  capas,
  coberturas,
  tematicas,
  selected,
  onSelect,
  coberturasActivas,
  className = 'map',
}: Props) {
  // Solo Restauración tiene aislamiento/predio (zonas) y coberturas Corine.
  const zonasRel = componente === 'restauracion' ? zonas : []
  // Restauración muestra todas sus parcelas; Ficorremediación solo sus propios puntos
  // georreferenciados (tipo_monitoreo='ficorremediacion').
  const puntosRel =
    componente === 'restauracion'
      ? puntos
      : componente === 'ficorremediacion'
        ? puntos.filter((p) => p.properties?.tipo_monitoreo === 'ficorremediacion')
        : []
  const coberturasRel = componente === 'restauracion' ? coberturas : []
  // Estratos/malezas son datos de muestra (origen='muestra') — nunca se muestran.
  // Técnicas/validación son reales y pertinentes solo a Restauración.
  const tematicasRel: Tematicas =
    componente === 'restauracion'
      ? { estratos: [], malezas: [], tecnicas: tematicas.tecnicas, validacion: tematicas.validacion }
      : { estratos: [], malezas: [], tecnicas: [], validacion: [] }

  const [medir, setMedir] = useState<'off' | 'distancia' | 'area'>('off')

  // Agrupar capas importadas pertinentes a este componente (se omiten siempre las curvas
  // de nivel, que saturan visualmente el mapa).
  const capasGroups = useMemo(() => {
    const permitidas = new Set(CAPAS_POR_COMPONENTE[componente])
    const m = new Map<string, GeoFeature[]>()
    for (const f of capas) {
      const k = f.properties.capa ?? 'capa'
      if (!permitidas.has(k)) continue
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(f)
    }
    return Array.from(m.entries())
  }, [capas, componente])

  // Todo lo que este geovisor muestra realmente — usado para encuadrar la vista inicial.
  const all = useMemo(
    () => [...zonasRel, ...puntosRel, ...coberturasRel, ...capasGroups.flatMap(([, feats]) => feats)],
    [zonasRel, puntosRel, coberturasRel, capasGroups],
  )

  const descargarGeoJSON = () => {
    const capasFeats = capasGroups.flatMap(([, feats]) => feats)
    const features = [
      ...zonasRel, ...puntosRel, ...coberturasRel, ...capasFeats,
      ...tematicasRel.tecnicas, ...tematicasRel.validacion,
    ]
    const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features })], {
      type: 'application/geo+json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `geovisor_${componente}_${new Date().toISOString().slice(0, 10)}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <MapContainer key={componente} center={LURUACO_CENTER} zoom={13} className={className}>
      <SearchControl />
      <LayersControl position="topright">
        {BASEMAPS.map((b, i) => (
          <LayersControl.BaseLayer key={b.id} checked={i === 0} name={b.nombre}>
            <TileLayer
              url={b.url}
              attribution={b.attribution}
              maxZoom={b.maxZoom}
              {...(b.maxNativeZoom ? { maxNativeZoom: b.maxNativeZoom } : {})}
              {...(b.subdomains ? { subdomains: b.subdomains } : {})}
            />
          </LayersControl.BaseLayer>
        ))}

        {/* Ortofoto del dron servida como tiles XYZ (/tiles en dev y prod) */}
        <LayersControl.Overlay name="🛩 Ortofoto dron (predio)">
          <TileLayer
            url="/tiles/ortofoto/{z}/{x}/{y}.png"
            minNativeZoom={13}
            maxNativeZoom={20}
            maxZoom={22}
            bounds={[
              [10.596738552237106, -75.18083778075173],
              [10.612784062684298, -75.16481760326494],
            ]}
            attribution="Ortofoto © dronticom — Entregables predio 50 Ha"
          />
        </LayersControl.Overlay>

        {zonasRel.length > 0 && (
          <LayersControl.Overlay checked name="Predio / Aislamiento">
            <FeatureLayer features={zonasRel} selected={selected} onSelect={onSelect} />
          </LayersControl.Overlay>
        )}
        {puntosRel.length > 0 && (
          <LayersControl.Overlay checked name="Parcelas de monitoreo">
            <LayerGroup>
              {puntosRel.map((pt) => {
                const coords = pt.geometry.coordinates as [number, number] | undefined
                if (!coords || coords.length < 2) return null
                const p = pt.properties
                const esFicor = p.tipo_monitoreo === 'ficorremediacion'
                return (
                  <Marker key={`ctrl-${p.id}`} position={[coords[1], coords[0]]} icon={controlIcon}>
                    <Popup>
                      <div className="popup">
                        <h3 className="popup-title">{p.nombre_punto ?? p.codigo_punto ?? 'Punto'}</h3>
                        <span className="popup-chip" style={{ background: esFicor ? '#00838f' : '#7c3aed', color: '#fff' }}>
                          {esFicor ? 'PUNTO DE FICORREMEDIACIÓN' : 'PARCELA DE MONITOREO'}
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
        )}

        {/* Coberturas vegetales (Corine) del levantamiento dron — solo Restauración */}
        {coberturasRel.length > 0 && (
          <LayersControl.Overlay checked name="🌿 Coberturas (Corine)">
            <GeoJSON
              key={`cob-${coberturasRel.length}-${coberturasActivas ? [...coberturasActivas].sort().join(',') : 'all'}`}
              data={
                { type: 'FeatureCollection', features: coberturasRel } as unknown as GeoJSON.GeoJsonObject
              }
              style={(f) => {
                const p = (f?.properties ?? {}) as Record<string, unknown>
                const key = claseCobertura(`${p?.descripcion ?? ''} ${p?.clase_tematica ?? ''} ${p?.codigo_corine ?? ''}`)
                const activa = !coberturasActivas || coberturasActivas.has(key)
                return {
                  color: '#ffffff',
                  weight: 0.6,
                  fillColor: coberturaColor(p),
                  fillOpacity: activa ? 0.65 : 0.05,
                }
              }}
              onEachFeature={(f, layer) => {
                const p = (f.properties || {}) as Record<string, unknown>
                // Popup con TODOS los atributos de la cobertura (solo los que tengan valor).
                const val = (v: unknown) => (v == null || v === '' ? '' : String(v))
                const pares: [string, string][] = [
                  ['Código Corine', val(p.codigo_corine)],
                  ['Área', p.area_hectareas != null ? `${Number(p.area_hectareas).toFixed(2)} ha` : ''],
                  ['% del total', p.porcentaje != null ? `${Number(p.porcentaje).toFixed(2)} %` : ''],
                  ['Clase temática', val(p.clase_tematica)],
                  ['Periodo', val(p.periodo)],
                  ['Fuente', val(p.fuente)],
                  ['Estado', val(p.estado)],
                ]
                const el = document.createElement('div')
                el.className = 'popup'
                const h = document.createElement('h3')
                h.className = 'popup-title'
                h.textContent = String(p.descripcion || p.codigo_corine || 'Cobertura')
                const chip = document.createElement('span')
                chip.className = 'popup-chip'
                chip.style.background = coberturaColor(p)
                chip.style.color = '#fff'
                chip.textContent = String(p.codigo_corine ?? 'Corine')
                const dl = document.createElement('dl')
                dl.className = 'popup-grid'
                for (const [k, v] of pares) {
                  if (!v) continue
                  const dt = document.createElement('dt')
                  dt.textContent = k
                  const dd = document.createElement('dd')
                  dd.textContent = v
                  dl.append(dt, dd)
                }
                el.append(h, chip, dl)
                layer.bindPopup(el)
              }}
            />
          </LayersControl.Overlay>
        )}

        {/* Capas temáticas de restauración (estratos, malezas, técnicas, validación) */}
        <TematicasOverlays tematicas={tematicasRel} />

        {/* Capas importadas pertinentes a este componente (ver CAPAS_POR_COMPONENTE) */}
        {capasGroups.map(([nombre, feats], i) => {
          const color = CAPA_COLOR_FIJO[nombre] ?? CAPA_COLORS[i % CAPA_COLORS.length]
          const etiqueta = CAPA_LABEL[nombre] ?? nombre
          return (
            <LayersControl.Overlay key={`capa-${nombre}`} checked name={etiqueta}>
              <GeoJSON
                key={`capa-data-${nombre}-${feats.length}`}
                data={
                  { type: 'FeatureCollection', features: feats } as unknown as GeoJSON.GeoJsonObject
                }
                style={{ color, weight: 2, fillColor: color, fillOpacity: 0.25 }}
                pointToLayer={(_f, latlng) =>
                  L.circleMarker(latlng, {
                    radius: 5,
                    color: '#fff',
                    weight: 1.5,
                    fillColor: color,
                    fillOpacity: 1,
                  })
                }
                onEachFeature={(f, layer) => {
                  const p = (f.properties || {}) as Record<string, unknown>
                  const el = document.createElement('div')
                  el.className = 'popup'
                  const title = document.createElement('strong')
                  title.textContent = nombre
                  el.appendChild(title)
                  const nom = p.nombre ?? p.name
                  if (nom) {
                    const sub = document.createElement('div')
                    sub.textContent = String(nom)
                    el.appendChild(sub)
                  }
                  layer.bindPopup(el)
                }}
              />
            </LayersControl.Overlay>
          )
        })}
        {/* Capas de referencia oficiales del IGAC (WMS) */}
        <IgacOverlays />
      </LayersControl>

      <MeasureTool modo={medir} onModo={setMedir} />
      <CoordsControl />
      <MapToolbar onDownload={descargarGeoJSON} />
      <FitController selected={selected} all={all} />
    </MapContainer>
  )
}
