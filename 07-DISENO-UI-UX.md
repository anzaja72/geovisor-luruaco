# 🎨 Diseño UI/UX - Referencias y Guía

## Diseño Actual del Geovisor

### Paleta de Colores Ecológica

| Elemento | Color | Hex |
|----------|-------|-----|
| Bosque Nativo | Verde Esmeralda | #059669 |
| Bosque Secundario | Verde | #10b981 |
| Humedal | Azul Cielo | #0ea5e9 |
| Pradera | Lima | #84cc16 |
| Matorral | Amarillo | #ca8a04 |
| Área Protegida | Violeta | #7c3aed |
| **Bioaumentación** | **Ámbar** | **#f59e0b** |

### Estilos de UI

#### Glassmorphism
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

#### Tarjetas
```css
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  padding: 24px;
}
```

#### Botones
```css
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 9999px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
}
```

## Referencias de Geovisores Modernos

### 1. **Mapbox GL JS**
- **URL:** https://docs.mapbox.com/mapbox-gl-js/
- **Características:** Mapas vectoriales 3D, estilos personalizables
- **Uso:** Ideal para visualizaciones avanzadas

### 2. **CesiumJS**
- **URL:** https://cesium.com/platform/cesiumjs/
- **Características:** Globo 3D, datos satelitales
- **Uso:** Visualización 3D de terreno

### 3. **Kepler.gl**
- **URL:** https://kepler.gl/
- **Características:** Análisis geoespacial, capas múltiples
- **Uso:** Dashboards de datos geoespaciales

### 4. **GeoNode**
- **URL:** https://geonode.org/
- **Características:** CMS geoespacial completo
- **Uso:** Portales de datos geoespaciales

### 5. **OpenLayers**
- **URL:** https://openlayers.org/
- **Características:** Mapas interactivos avanzados
- **Uso:** Alternativa a Leaflet con más features

## Inspiración de Diseño

### Dashboards Modernos
1. **Material Design Maps**
   - Tarjetas flotantes con sombras suaves
   - Tipografía Roboto/Inter
   - Colores planos con acentos

2. **Apple Maps Style**
   - Minimalismo extremo
   - Información contextual
   - Animaciones fluidas

3. **Google Earth Studio**
   - Transiciones cinematográficas
   - Capas de información progresivas
   - Paleta natural

### Elementos Recomendados

#### Header
```
┌─────────────────────────────────────────┐
│ 🌿 EcoRestore    Zonas: 3  Área: 206ha │
└─────────────────────────────────────────┘
```

#### Sidebar
```
┌─────────────┐
│ Panel       │
├─────────────┤
│ 🌱 Leyenda  │
│ 📊 Estados  │
│ 📍 Zonas    │
│ 🏭 Lotes    │
└─────────────┘
```

#### Popup de Información
```
┌─────────────────────┐
│ 🌿 Nombre del Lote  │
├─────────────────────┤
│ Código: LUR-BIO-001 │
│ Área: 132.56 ha     │
│ Estado: Activo      │
│                     │
│ [Ver Detalles]      │
└─────────────────────┘
```

## Mejoras Sugeridas

### 1. Tema Oscuro
```css
.dark-theme {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;
}
```

### 2. Animaciones
- Entrada de polígonos: fade + scale
- Hover: elevación + brillo
- Transiciones entre vistas: slide

### 3. Responsive
- Móvil: Sidebar colapsable
- Tablet: Layout dividido
- Desktop: Sidebar fija

### 4. Accesibilidad
- Contraste WCAG AA
- Navegación por teclado
- ARIA labels
- Modo alto contraste

## Recursos de Diseño

### Iconografía
- **Lucide React:** https://lucide.dev/
- **Heroicons:** https://heroicons.com/
- **Phosphor Icons:** https://phosphoricons.com/

### Tipografía
- **Inter:** https://rsms.me/inter/
- **Poppins:** https://fonts.google.com/specimen/Poppins
- **JetBrains Mono:** Para código

### Gradientes
```css
.eco-gradient {
  background: linear-gradient(135deg, #059669 0%, #0ea5e9 100%);
}

.sunset-gradient {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}
```
