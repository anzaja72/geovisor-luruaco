# 🗺️ Frontend Geovisor

## Tecnologías
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Mapas:** Leaflet + React-Leaflet
- **Estilos:** CSS puro con variables CSS

## Estructura del Código

```
frontend/
├── src/
│   ├── App.tsx       # Componente principal
│   ├── App.css       # Estilos con design system
│   └── main.tsx      # Punto de entrada
├── public/
├── dist/             # Build de producción
├── .env.production   # Variables de entorno prod
└── package.json
```

## Componentes Principales

### MapContainer
Contenedor del mapa Leaflet centrado en Luruaco.

### GeoJSON
Renderizado de polígonos con estilos dinámicos según tipo de ecosistema.

### Sidebar
Panel de control lateral con:
- Leyenda de tipos de ecosistema
- Leyenda de estados de restauración
- Lista de zonas clickeables
- Lista de lotes de bioaumentación

### ZonaCard
Tarjetas de información de zonas con iconos y estado.

## Paleta de Colores

### Tipos de Ecosistema
| Tipo | Color |
|------|-------|
| Bosque Nativo | #059669 |
| Bosque Secundario | #10b981 |
| Humedal | #0ea5e9 |
| Pradera | #84cc16 |
| Matorral | #ca8a04 |
| Área Protegida | #7c3aed |
| **Bioaumentación** | **#f59e0b** |

### Estados de Restauración
| Estado | Opacidad | Estilo |
|--------|----------|--------|
| Completado | 0.85 | Sólido |
| En Progreso | 0.7 | Sólido |
| Planificado | 0.55 | Línea punteada |

## Diseño UI/UX

- **Glassmorphism:** Efecto cristal en paneles
- **Responsive:** Adaptable a móviles
- **Micro-interacciones:** Hover effects, transiciones
- **Tipografía:** Inter (Google Fonts)

## Variables de Entorno

```bash
# .env.production
VITE_API_URL=http://187.77.4.10:8080
```

## Comandos

```bash
# Desarrollo
npm run dev

# Producción
npm run build

# Preview
npm run preview
```

## Build de Producción

Los archivos compilados se encuentran en `dist/` y se sirven mediante Python HTTP Server en puerto 8081.
