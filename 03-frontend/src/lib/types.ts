// Tipos compartidos del visor.

export type Categoria =
  | 'pesima'
  | 'inadecuada'
  | 'aceptable'
  | 'adecuada'
  | 'optima'

export interface FeatureProps {
  id: number
  nombre: string
  descripcion?: string
  codigo_proyecto?: string
  codigo_lote?: string
  tipo_ecosistema?: string
  estado_restauracion?: string
  estado?: string
  tipo_intervencion?: string
  area_hectareas?: number
  area_metros_cuadrados?: number
  perimetro_metros?: number
  organizacion_responsable?: string
  responsable_tecnico?: string
  fecha_inicio_restauracion?: string
  categoria_calidad?: Categoria
  periodo?: string
}

export interface GeoFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties: FeatureProps
}

export interface FeatureCollection {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

// Respuesta de GET /api/resumen
export interface CategoriaResumen {
  categoria: Categoria
  cantidad: number
  porcentaje: number
}

export interface Resumen {
  periodo: string
  sitios_visitados: number
  sitios_reportados: number
  categorias: CategoriaResumen[]
}
