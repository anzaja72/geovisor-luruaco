import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  ImageOverlay,
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
import limpiezaMensual from '../geovisor/limpiezaMensual.json'
import { ORTOS_MALEZA } from '../geovisor/ortofotosMaleza'
import { CAPAS_POR_COMPONENTE } from '../lib/capasVisor'

const LURUACO_CENTER: [number, number] = [10.61, -75.1]
// Límites de la ortofoto del predio (vuelo de septiembre de 2026, «Ortofoto #1.1»).
// El encuadre anterior abarcaba 311 ha para un predio de 90: era la huella del vuelo
// antiguo, no la del predio. Este ajusta al aislamiento externo con ~40 m de margen.
/** Vuelo del que salen las teselas del predio. Al cambiarlas, cambiar esto. */
const VUELO_PREDIO = '2026-09'

const PREDIO_BOUNDS: [[number, number], [number, number]] = [
  [10.6013802, -75.1735691],
  [10.6119370, -75.1652677],
]
// Borde de la ciénaga intervenido: envolvente de los cinco polígonos de limpieza
// (enero, febrero, mayo, junio y julio). Área de interés de Vegetación Acuática.
const CIENAGA_BOUNDS: [[number, number], [number, number]] = [
  [10.5960, -75.1640],
  [10.6135, -75.1430],
]
// Puntos de ficorremediación (FICO-1…FICO-5) con margen alrededor.
const FICOR_BOUNDS: [[number, number], [number, number]] = [
  [10.5965, -75.1665],
  [10.6180, -75.1460],
]

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

/** Props de datos comunes a los componentes con mapa (todas las vistas reciben el mismo paquete;
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
  /** Mes de limpieza activo (Vegetación Acuática): filtra polígonos y ortofotos.
   *  undefined o 'Todos' = se muestran todos los meses. */
  mesLimpieza?: string
  /** Encuadre pedido desde la vista (p. ej. el polígono del mes elegido). Manda
   *  sobre el encuadre automático, pero no sobre el elemento seleccionado. */
  focus?: [[number, number], [number, number]] | null
  className?: string
}

/** Cómo se comporta el mapa en cada componente. Antes los cuatro compartían el mismo
 *  mapa: la ortofoto del predio salía encendida en todos, el mapa base siempre
 *  arrancaba en satelital y la vista por defecto siempre era el predio, de modo que
 *  Vegetación Acuática y Ficorremediación abrían mirando a otro lado. */
interface ConfigComponente {
  /** Mapa base activo al abrir el componente (id de BASEMAPS). */
  basemap: string
  /** Mapas base ofrecidos. Sin definir = todos los del catálogo. */
  basemaps?: string[]
  /** Si se superpone la ortofoto del dron del predio de restauración. */
  ortofotoPredio: boolean
  /** Encuadre por defecto cuando no hay nada seleccionado. */
  aoi: [[number, number], [number, number]]
  /** Si se dibujan las coberturas Corine del levantamiento. */
  coberturas: boolean
}

const CONFIG_COMPONENTE: Record<ComponenteGeovisor, ConfigComponente> = {
  // Solo el satelital: el resto de mapas base satura y no aporta sobre la ortofoto.
  restauracion: { basemap: 's2', basemaps: ['s2'], ortofotoPredio: true, aoi: PREDIO_BOUNDS, coberturas: true },
  maleza: { basemap: 's2', ortofotoPredio: false, aoi: CIENAGA_BOUNDS, coberturas: false },
  // Calles (OSM) por pedido expreso: el contexto urbano ubica los puntos de muestreo.
  ficorremediacion: { basemap: 'calles', ortofotoPredio: false, aoi: FICOR_BOUNDS, coberturas: false },
  // El monitoreo de fauna se lee contra las coberturas del área de restauración.
  fauna: { basemap: 's2', ortofotoPredio: false, aoi: PREDIO_BOUNDS, coberturas: true },
}

const CAPA_LABEL: Record<string, string> = {
  aislamiento_interno: '🚧 Aislamiento interno (cercas)',
  maleza_acuatica: '🟢 Polígonos de limpieza de maleza',
  herpetos: '🐸 Herpetofauna',
  fauna_aves_camaras: '🐦 Aves y cámaras',
}

// Paleta para capas importadas (distinta de la escala de calidad).
const CAPA_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#ec4899']
// Color fijo por capa (sobre el color rotativo por índice) — aislamiento interno en rojo.
const CAPA_COLOR_FIJO: Record<string, string> = {
  aislamiento_interno: '#dc2626',
  herpetos: '#16a34a',
  fauna_aves_camaras: '#2563eb',
}

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

/** Ajusta la vista, por orden de prioridad: elemento seleccionado → encuadre pedido
 *  por la vista → conjunto de datos dibujados → área de interés del componente. */
function FitController({
  selected,
  all,
  aoi,
  focus,
}: {
  selected: GeoFeature | null
  all: GeoFeature[]
  aoi: [[number, number], [number, number]]
  focus?: [[number, number], [number, number]] | null
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
    if (focus) {
      try {
        map.flyToBounds(focus, { padding: [50, 50], maxZoom: 17 })
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
    // Sin datos pertinentes: encuadrar el área de interés del componente
    // (nunca heredar la vista de otro componente).
    try {
      map.fitBounds(aoi, { padding: [20, 20], animate: false })
    } catch {
      map.setView(LURUACO_CENTER, 13)
    }
  }, [selected, all, aoi, focus, map])
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
  mesLimpieza,
  focus,
  className = 'map',
}: Props) {
  const cfg = CONFIG_COMPONENTE[componente]
  // Solo Restauración tiene aislamiento/predio (zonas).
  const zonasRel = componente === 'restauracion' ? zonas : []
  // Restauración muestra todas sus parcelas; Ficorremediación solo sus propios puntos
  // georreferenciados (tipo_monitoreo='ficorremediacion').
  const puntosRel =
    componente === 'restauracion'
      ? puntos.filter((p) => p.properties?.tipo_monitoreo !== 'ficorremediacion')
      : componente === 'ficorremediacion'
        ? puntos.filter((p) => p.properties?.tipo_monitoreo === 'ficorremediacion')
        : []
  const coberturasRel = cfg.coberturas ? coberturas : []
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

  // Mapas base ofrecidos en este componente (ver ConfigComponente.basemaps).
  const basemapsRel = useMemo(
    () => (cfg.basemaps ? BASEMAPS.filter((b) => cfg.basemaps!.includes(b.id)) : BASEMAPS),
    [cfg.basemaps],
  )

  // Limpieza de maleza: polígonos y ortofotos del mes activo ('Todos' = todos).
  const todosLosMeses = !mesLimpieza || mesLimpieza === 'Todos'
  const limpiezaRel = useMemo(() => {
    const fc = limpiezaMensual as { features: { properties: { mes?: string } }[] }
    const features = todosLosMeses
      ? fc.features
      : fc.features.filter((f) => f.properties?.mes === mesLimpieza)
    return { type: 'FeatureCollection', features } as unknown as GeoJSON.GeoJsonObject
  }, [mesLimpieza, todosLosMeses])
  const ortosRel = useMemo(
    () =>
      ORTOS_MALEZA.filter((o) => o.despues && (todosLosMeses || o.mes === mesLimpieza)),
    [mesLimpieza, todosLosMeses],
  )

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
        {basemapsRel.map((b) => (
          <LayersControl.BaseLayer key={b.id} checked={b.id === cfg.basemap} name={b.nombre}>
            <TileLayer
              url={b.url}
              attribution={b.attribution}
              maxZoom={b.maxZoom}
              {...(b.maxNativeZoom ? { maxNativeZoom: b.maxNativeZoom } : {})}
              {...(b.subdomains ? { subdomains: b.subdomains } : {})}
            />
          </LayersControl.BaseLayer>
        ))}

        {/* Ortofoto del dron servida como tiles XYZ (/tiles en dev y prod). Es del
            predio de restauración: solo se superpone donde corresponde. */}
        {cfg.ortofotoPredio && (
          <LayersControl.Overlay checked name="🛩 Ortofoto dron (predio)">
            <TileLayer
              // La versión del vuelo va en la URL: nginx sirve las teselas como
              // «immutable» por 30 días, así que sin esto un navegador que ya
              // cargó la ortofoto anterior nunca pide la nueva.
              url={`/tiles/ortofoto/{z}/{x}/{y}.png?v=${VUELO_PREDIO}`}
              minNativeZoom={13}
              maxNativeZoom={20}
              maxZoom={22}
              bounds={PREDIO_BOUNDS}
              attribution="Ortofoto © dronticom — Entregables predio 50 Ha"
            />
          </LayersControl.Overlay>
        )}

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
                          {/* Nomenclatura de la parcela (BD1, BR1, CU1, DD4…) */}
                          {p.codigo_punto && (
                            <>
                              <dt>{esFicor ? 'Código' : 'Nomenclatura'}</dt>
                              <dd>{p.codigo_punto}</dd>
                            </>
                          )}
                          {!esFicor && p.descripcion && (
                            <>
                              <dt>Cobertura</dt>
                              <dd>{p.descripcion}</dd>
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
                        {esFicor && p.descripcion && <p className="popup-desc">{p.descripcion}</p>}
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

        {/* Ortofotos posteriores a la limpieza, por mes — solo Vegetación Acuática.
            Se dibujan bajo los polígonos para que el borde intervenido quede encima. */}
        {componente === 'maleza' &&
          ortosRel.map((o) => (
            <LayersControl.Overlay checked key={`orto-${o.mes}`} name={`🛩 Ortofoto ${o.mes} (después)`}>
              <ImageOverlay url={o.despues!} bounds={o.despuesBounds ?? o.antesBounds} />
            </LayersControl.Overlay>
          ))}

        {/* Polígonos de limpieza por mes (capa estática) — solo Vegetación Acuática */}
        {componente === 'maleza' && (
          <LayersControl.Overlay checked name="🟩 Polígonos de limpieza">
            <GeoJSON
              key={`limpieza-${mesLimpieza ?? 'todos'}`}
              data={limpiezaRel}
              style={{ color: '#15803d', weight: 2.5, fillColor: '#22c55e', fillOpacity: 0.3 }}
              onEachFeature={(f, layer) => {
                const p = (f.properties || {}) as Record<string, unknown>
                const el = document.createElement('div')
                el.className = 'popup'
                const t = document.createElement('strong')
                t.textContent = `Limpieza — ${String(p.mes ?? '')}`
                const d = document.createElement('div')
                d.textContent = [p.area, p.perimetro].filter(Boolean).join(' · ')
                el.append(t, d)
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
      <FitController selected={selected} all={all} aoi={cfg.aoi} focus={focus} />
    </MapContainer>
  )
}
