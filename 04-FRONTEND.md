# 🗺️ Frontend Geovisor

Dashboard departamental (estilo ICAM) para la geodatabase de restauración ecológica
de la Ciénaga de Luruaco.

## Tecnologías
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Mapas:** Leaflet 1.9 + React-Leaflet 5
- **Gráficas:** SVG/CSS puro (sin dependencias de charting)
- **Estilos:** CSS puro con variables (sin framework UI)

## Estructura del Código

```
03-frontend/
├── index.html              # Entry (carga /src/main.tsx)
├── eslint.config.js        # Config flat de ESLint 9/10
├── vite.config.ts          # Plugins react() + mock de API en dev
├── .env.example            # Plantilla de variables
└── src/
    ├── main.tsx            # Punto de entrada
    ├── App.tsx             # Composición del dashboard
    ├── index.css           # Reset global + variables
    ├── styles/
    │   └── dashboard.css   # Layout completo del tablero ICAM
    ├── lib/
    │   ├── types.ts        # Tipos GeoJSON + Resumen
    │   ├── api.ts          # Cliente HTTP (con timeout)
    │   ├── quality.ts      # Escala de calidad (pesima..optima)
    │   └── aggregate.ts    # Cálculo de resumen en cliente (fallback)
    ├── hooks/
    │   └── useGeoData.ts   # useGeoData + useResumen
    ├── components/
    │   ├── BrandHeader.tsx       # Cabecera + escala de calidad
    │   ├── NavTabs.tsx           # Pestañas de navegación
    │   ├── SubHeader.tsx         # Título + selector de periodo
    │   ├── DepartmentSidebar.tsx # Lista de sitios seleccionable
    │   ├── MetricsPanel.tsx      # KPIs (visitados / reportados)
    │   ├── DonutChart.tsx        # Dona de proporción (SVG)
    │   ├── BarsChart.tsx         # Barras de cantidad (SVG/CSS)
    │   ├── MapView.tsx           # Mapa Leaflet (basemaps Esri)
    │   ├── FeaturePopup.tsx      # Popup como componente React
    │   └── Footer.tsx            # Accesos WFS / protocolo
    └── mock/
        └── mockApi.ts      # Datos demo servidos por Vite en dev
```

## Modelo de datos del visor

El front consume tres endpoints del backend Go:

| Endpoint | Uso |
|----------|-----|
| `GET /api/zonas` | Polígonos de restauración (FeatureCollection) |
| `GET /api/lotes` | Lotes de bioaumentación (FeatureCollection) |
| `GET /api/resumen?periodo=` | Totales y conteo/proporción por categoría |

Cada feature trae `categoria_calidad` (`pesima`, `inadecuada`, `aceptable`,
`adecuada`, `optima`) y `periodo` (ej. `2024-2`).

## Escala de calidad (ICAM)

| Categoría | Color |
|-----------|-------|
| Pésima | `#e8302a` |
| Inadecuada | `#f7941d` |
| Aceptable | `#f4e409` |
| Adecuada | `#7ac143` |
| Óptima | `#27aae1` |

Definida en `src/lib/quality.ts` y reutilizada por la cabecera, el mapa y las gráficas.

## Variables de entorno

```bash
# .env.local (dev) o .env.production (build)
VITE_API_URL=http://localhost:8080   # backend Go

# Si se deja vacío/sin definir en dev, el front usa el MOCK de /api/*
# (plugin de Vite) y muestra datos de demostración sin backend.
```

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo (http://localhost:5173)
npm run build      # build de producción (tsc -b && vite build) → dist/
npm run preview    # previsualizar el build
npm run lint       # eslint
```

## Notas

- **Mapa:** basemap por defecto Esri World Imagery (satélite), con alternativas
  Esri Ocean y OpenStreetMap vía control de capas.
- **Resiliencia:** las cargas usan `Promise.allSettled` + timeout de 6 s; si la
  API no responde, las gráficas caen a un cálculo local con lo disponible.
- **Sin riesgo XSS:** los popups son componentes React (no HTML inyectado).
- **Responsive:** 3 columnas en desktop, colapsa a 1 columna en móvil.
