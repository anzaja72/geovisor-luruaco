// Ortofotos del dron de las jornadas de limpieza de maleza acuática, por mes.
// Los bounds son el wgs84Extent del GeoTIFF original de cada vuelo.
//
// Vivían dentro de OrtoComparador, donde solo servían al comparativo antes/después.
// Al pedirse que las ortofotos posteriores a limpieza se vean también en el mapa del
// componente, el catálogo pasó aquí para que mapa y comparativo lean lo mismo.

import limpiezaMensual from './limpiezaMensual.json'

export type Bounds = [[number, number], [number, number]]

export interface OrtoMes {
  mes: string
  antes: string
  antesBounds: Bounds
  despues?: string
  despuesBounds?: Bounds
}

export const ORTOS_MALEZA: OrtoMes[] = [
  {
    mes: 'Enero',
    antes: '/ortofotos/enero-antes.webp',
    antesBounds: [[10.607696, -75.151478], [10.612049, -75.146292]],
    despues: '/ortofotos/enero-despues.webp',
    despuesBounds: [[10.607694, -75.151507], [10.612060, -75.146269]],
  },
  {
    mes: 'Febrero',
    antes: '/ortofotos/febrero-antes.webp',
    antesBounds: [[10.604965, -75.152265], [10.608986, -75.144497]],
    despues: '/ortofotos/febrero-despues.webp',
    despuesBounds: [[10.6052965, -75.1522944], [10.6090092, -75.1449155]],
  },
  {
    mes: 'Mayo',
    antes: '/ortofotos/mayo-antes.webp',
    antesBounds: [[10.602133, -75.151200], [10.606596, -75.144456]],
    despues: '/ortofotos/mayo-despues.webp',
    despuesBounds: [[10.6021329, -75.1512003], [10.6065957, -75.1437571]],
  },
  {
    mes: 'Junio',
    antes: '/ortofotos/junio-antes.webp',
    antesBounds: [[10.5989563, -75.1550171], [10.6035666, -75.1476754]],
    despues: '/ortofotos/junio-despues.webp',
    despuesBounds: [[10.5989564, -75.1550171], [10.6035666, -75.1476752]],
  },
  {
    mes: 'Julio',
    antes: '/ortofotos/julio-antes.webp',
    antesBounds: [[10.5963969, -75.1634843], [10.6004053, -75.1538765]],
    despues: '/ortofotos/julio-despues.webp',
    despuesBounds: [[10.5966439, -75.1634843], [10.6004053, -75.1538763]],
  },
]

/** Meses con vuelo de dron, en orden cronológico. */
export const MESES_LIMPIEZA = ORTOS_MALEZA.map((o) => o.mes)

/** Ortofotos de un mes, o `undefined` si ese mes no tuvo vuelo. */
export const ortoDe = (mes: string): OrtoMes | undefined =>
  ORTOS_MALEZA.find((o) => o.mes === mes)

/** Envolvente de una geometría GeoJSON, en el orden [[sur,oeste],[norte,este]]
 *  que espera Leaflet (el GeoJSON viene en [lon,lat]). */
function envolvente(coords: unknown): Bounds | null {
  let s = 90, n = -90, o = 180, e = -180
  const recorrer = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
      const [lon, lat] = c as [number, number]
      if (lat < s) s = lat
      if (lat > n) n = lat
      if (lon < o) o = lon
      if (lon > e) e = lon
      return
    }
    if (Array.isArray(c)) c.forEach(recorrer)
  }
  recorrer(coords)
  return n > s && e > o ? [[s, o], [n, e]] : null
}

/** Área de intervención del mes: el polígono de limpieza si existe y, si no, la
 *  extensión del vuelo. Es a donde se acerca el mapa al elegir un monitoreo. */
export function boundsDelMes(mes: string): Bounds | null {
  const fc = limpiezaMensual as { features: { properties?: { mes?: string }; geometry?: { coordinates?: unknown } }[] }
  const poly = fc.features.find((f) => f.properties?.mes === mes)
  if (poly?.geometry?.coordinates) {
    const b = envolvente(poly.geometry.coordinates)
    if (b) return b
  }
  const orto = ortoDe(mes)
  return orto?.despuesBounds ?? orto?.antesBounds ?? null
}
