import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import L from 'leaflet'

// Fix para los íconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Coordenadas de Luruaco, Atlántico, Colombia
const LURUACO_CENTER: [number, number] = [10.61, -75.10]

interface ZonaFeature {
  type: string
  geometry: {
    type: string
    coordinates: number[][][]
  }
  properties: {
    id: number
    nombre: string
    descripcion?: string
    codigo_proyecto?: string
    codigo_lote?: string
    tipo_ecosistema: string
    estado_restauracion?: string
    estado?: string
    tipo_intervencion?: string
    area_hectareas?: number
    area_metros_cuadrados?: number
    perimetro_metros?: number
    organizacion_responsable?: string
    responsable_tecnico?: string
    fecha_inicio_restauracion?: string
  }
}

interface FeatureCollection {
  type: string
  features: ZonaFeature[]
}

// Componente para centrar el mapa
function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

function App() {
  const [zonas, setZonas] = useState<FeatureCollection | null>(null)
  const [lotes, setLotes] = useState<FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedZona, setSelectedZona] = useState<ZonaFeature | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos desde la API del backend
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        console.log('🌐 Cargando datos desde API:', `${API_URL}/api/zonas`)
        
        // Cargar zonas y lotes en paralelo
        const [zonasResponse, lotesResponse] = await Promise.all([
          fetch(`${API_URL}/api/zonas?t=${Date.now()}`),
          fetch(`${API_URL}/api/lotes?t=${Date.now()}`)
        ])
        
        if (!zonasResponse.ok) {
          throw new Error(`Error HTTP zonas: ${zonasResponse.status}`)
        }
        if (!lotesResponse.ok) {
          throw new Error(`Error HTTP lotes: ${lotesResponse.status}`)
        }
        
        const zonasData: FeatureCollection = await zonasResponse.json()
        const lotesData: FeatureCollection = await lotesResponse.json()
        
        setZonas(zonasData)
        setLotes(lotesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Paleta de colores ecológica moderna
  const getPolygonStyle = (feature: any) => {
    const props = feature.properties as ZonaFeature['properties']
    const tipo = props.tipo_ecosistema
    const estado = props.estado_restauracion
    
    // Colores ecológicos modernos
    const colors: Record<string, string> = {
      'bosque_nativo': '#059669',      // Emerald 600
      'bosque_secundario': '#10b981',   // Emerald 500
      'humedal': '#0ea5e9',             // Sky 500
      'pradera': '#84cc16',             // Lime 500
      'matorral': '#ca8a04',            // Yellow 600
      'manglar': '#047857',             // Emerald 700
      'ecosistema_acuatico': '#0284c7', // Sky 600
      'suelo_degradado': '#a16207',     // Yellow 700
      'area_protegida': '#7c3aed',      // Violet 600
      'corredor_biologico': '#dc2626',  // Red 600
      'bioaumentacion': '#f59e0b',      // Amber 500 - NUEVO
      'otro': '#6b7280'                 // Gray 500
    }

    // Opacidad según estado
    const opacity = estado === 'completado' ? 0.85 : 
                    estado === 'en_progreso' ? 0.7 : 0.55

    return {
      fillColor: colors[tipo] || '#6b7280',
      weight: 3,
      opacity: 1,
      color: '#ffffff',
      dashArray: estado === 'planificado' ? '8, 6' : undefined,
      fillOpacity: opacity
    }
  }

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties as ZonaFeature['properties']
    
    layer.on({
      click: () => {
        setSelectedZona(feature as ZonaFeature)
      },
      mouseover: (e) => {
        const target = e.target
        target.setStyle({
          weight: 4,
          color: '#fbbf24',
          fillOpacity: 0.9
        })
      },
      mouseout: (e) => {
        const target = e.target
        target.setStyle(getPolygonStyle(feature))
      }
    })

    const popupContent = `
      <div style="
        font-family: 'Inter', system-ui, sans-serif;
        min-width: 280px;
        padding: 4px;
      ">
        <h3 style="
          margin: 0 0 12px 0;
          color: #064e3b;
          font-size: 18px;
          font-weight: 700;
          border-bottom: 3px solid #10b981;
          padding-bottom: 8px;
        ">
          🌿 ${props.nombre}
        </h3>
        <div style="display: grid; gap: 8px; font-size: 14px; color: #374151;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #6b7280;">Código:</span>
            <span>${props.codigo_proyecto || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #6b7280;">Tipo:</span>
            <span style="text-transform: capitalize;">${props.tipo_ecosistema.replace('_', ' ')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #6b7280;">Estado:</span>
            <span style="
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              background-color: ${props.estado_restauracion === 'en_progreso' ? '#d1fae5' : 
                                 props.estado_restauracion === 'planificado' ? '#fef3c7' : '#dbeafe'};
              color: ${props.estado_restauracion === 'en_progreso' ? '#065f46' : 
                      props.estado_restauracion === 'planificado' ? '#92400e' : '#1e40af'};
            ">${(props.estado_restauracion || 'activo').replace('_', ' ')}</span>
          </div>
          ${props.area_hectareas ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #6b7280;">Área:</span>
            <span style="font-weight: 700; color: #059669;">${props.area_hectareas} ha</span>
          </div>` : ''}
          ${props.organizacion_responsable ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #6b7280;">Organización:</span>
            <span>${props.organizacion_responsable}</span>
          </div>` : ''}
          ${props.responsable_tecnico ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #6b7280;">Técnico:</span>
            <span>${props.responsable_tecnico}</span>
          </div>` : ''}
        </div>
        ${props.descripcion ? `
        <p style="
          margin: 12px 0 0 0;
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
          line-height: 1.5;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        ">${props.descripcion}</p>` : ''}
      </div>
    `
    layer.bindPopup(popupContent)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Cargando geovisor</h2>
          <p>Conectando con el servidor de datos espaciales...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Error de conexión</h2>
          <p>{error}</p>
          <p className="error-hint">
            Asegúrate de que el servidor backend esté corriendo en<br/>
            <code>http://localhost:8080</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header Moderno */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🌿</div>
            <div className="logo-text">
              <h1>EcoRestore</h1>
              <span>Luruaco, Atlántico</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{zonas?.features?.length || 0}</span>
              <span className="stat-label">Zonas</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{lotes?.features?.length || 0}</span>
              <span className="stat-label">Lotes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {((zonas?.features?.reduce((acc, z) => acc + (z.properties.area_hectareas || 0), 0) || 0) + 
                  (lotes?.features?.reduce((acc, z) => acc + (z.properties.area_hectareas || 0), 0) || 0)).toFixed(1)}
              </span>
              <span className="stat-label">Hectáreas Total</span>
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
          <button 
            className="toggle-sidebar"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? '◀' : '▶'}
          </button>
          
          <div className="sidebar-content">
            <h3>Panel de Control</h3>
            
            {/* Leyenda de Ecosistemas */}
            <div className="panel-section">
              <h4>🌱 Tipos de Ecosistema</h4>
              <div className="legend-list">
                {[
                  { color: '#059669', label: 'Bosque Nativo' },
                  { color: '#10b981', label: 'Bosque Secundario' },
                  { color: '#0ea5e9', label: 'Humedal' },
                  { color: '#84cc16', label: 'Pradera' },
                  { color: '#ca8a04', label: 'Matorral' },
                  { color: '#7c3aed', label: 'Área Protegida' },
                  { color: '#f59e0b', label: 'Bioaumentación' },
                ].map((item, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                    <span className="legend-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leyenda de Estados */}
            <div className="panel-section">
              <h4>📊 Estado de Restauración</h4>
              <div className="legend-list">
                <div className="legend-item">
                  <span className="legend-indicator" style={{ opacity: 0.85 }}></span>
                  <span className="legend-label">Completado</span>
                </div>
                <div className="legend-item">
                  <span className="legend-indicator" style={{ opacity: 0.7 }}></span>
                  <span className="legend-label">En Progreso</span>
                </div>
                <div className="legend-item">
                  <span className="legend-indicator dashed" style={{ opacity: 0.55 }}></span>
                  <span className="legend-label">Planificado</span>
                </div>
              </div>
            </div>

            {/* Lista de Zonas */}
            <div className="panel-section zonas-list">
              <h4>📍 Zonas de Restauración</h4>
              {zonas?.features?.map((zona, index) => (
                <div 
                  key={`zona-list-${index}`}
                  className={`zona-card ${selectedZona?.properties.id === zona.properties.id ? 'selected' : ''}`}
                  onClick={() => setSelectedZona(zona)}
                >
                  <div className="zona-header">
                    <span className="zona-icon">
                      {zona.properties.tipo_ecosistema === 'humedal' ? '💧' : 
                       zona.properties.tipo_ecosistema === 'bosque_nativo' ? '🌳' : '🌿'}
                    </span>
                    <span className="zona-name">{zona.properties.nombre}</span>
                  </div>
                  <div className="zona-meta">
                    <span className={`zona-status status-${zona.properties.estado_restauracion || 'activo'}`}>
                      {(zona.properties.estado_restauracion || 'activo').replace('_', ' ')}
                    </span>
                    {zona.properties.area_hectareas && (
                      <span className="zona-area">{zona.properties.area_hectareas} ha</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Lista de Lotes de Bioaumentación */}
            <div className="panel-section zonas-list">
              <h4>🏭 Lotes de Bioaumentación</h4>
              {lotes?.features?.map((lote, index) => (
                <div 
                  key={`lote-list-${index}`}
                  className={`zona-card ${selectedZona?.properties.id === lote.properties.id ? 'selected' : ''}`}
                  onClick={() => setSelectedZona(lote as ZonaFeature)}
                >
                  <div className="zona-header">
                    <span className="zona-icon">🏭</span>
                    <span className="zona-name">{lote.properties.nombre}</span>
                  </div>
                  <div className="zona-meta">
                    <span className="zona-status status-activo">
                      {lote.properties.estado || 'activo'}
                    </span>
                    {lote.properties.area_hectareas && (
                      <span className="zona-area">{lote.properties.area_hectareas} ha</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Mapa */}
        <main className="map-container">
          <MapContainer
            center={LURUACO_CENTER}
            zoom={13}
            className="map"
          >
            <MapController center={selectedZona ? 
              [selectedZona.geometry.coordinates[0][0][1], selectedZona.geometry.coordinates[0][0][0]] as [number, number] 
              : LURUACO_CENTER} 
            />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Renderizar Zonas de Restauración */}
            {zonas && zonas.features && zonas.features.map((feature, index) => (
              <GeoJSON
                key={`zona-${index}`}
                data={feature as any}
                style={() => getPolygonStyle(feature)}
                onEachFeature={onEachFeature}
              />
            ))}
            
            {/* Renderizar Lotes de Bioaumentación */}
            {lotes && lotes.features && lotes.features.map((feature, index) => (
              <GeoJSON
                key={`lote-${index}`}
                data={feature as any}
                style={() => ({
                  fillColor: '#f59e0b',
                  weight: 4,
                  opacity: 1,
                  color: '#d97706',
                  fillOpacity: 0.6
                })}
                onEachFeature={(feature, layer) => {
                  const props = feature.properties
                  layer.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; min-width: 280px; padding: 4px;">
                      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                        🏭 ${props.nombre}
                      </h3>
                      <div style="display: grid; gap: 8px; font-size: 14px;">
                        <div><strong>Código:</strong> ${props.codigo_lote || 'N/A'}</div>
                        <div><strong>Tipo:</strong> Bioaumentación</div>
                        <div><strong>Área:</strong> ${props.area_hectareas ? props.area_hectareas + ' ha' : 'N/A'}</div>
                        <div><strong>Perímetro:</strong> ${props.perimetro_metros ? props.perimetro_metros.toFixed(0) + ' m' : 'N/A'}</div>
                        <div><strong>Estado:</strong> ${props.estado || 'N/A'}</div>
                      </div>
                      ${props.descripcion ? `<p style="margin-top: 12px; font-size: 13px; color: #6b7280;">${props.descripcion}</p>` : ''}
                    </div>
                  `)
                }}
              />
            ))}

            <Marker position={LURUACO_CENTER}>
              <Popup>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <strong style={{ fontSize: '16px', color: '#064e3b' }}>Luruaco, Atlántico</strong>
                  <br />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Municipio de la región Caribe colombiana
                  </span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Overlay de Información */}
          {selectedZona && (
            <div className="info-overlay">
              <button className="close-overlay" onClick={() => setSelectedZona(null)}>×</button>
              <h3>{selectedZona.properties.nombre}</h3>
              <p className="zona-description">{selectedZona.properties.descripcion}</p>
              <div className="zona-details">
                <div className="detail-item">
                  <span className="detail-label">Código</span>
                  <span className="detail-value">{selectedZona.properties.codigo_proyecto}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Área</span>
                  <span className="detail-value">{selectedZona.properties.area_hectareas} ha</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Organización</span>
                  <span className="detail-value">{selectedZona.properties.organizacion_responsable}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App