# 📝 Registro de cambios (junio 2026)

Refactorización, rediseño del visor (estilo ICAM), datos del proyecto y puesta a punto.

## Base de datos
- **Nuevos campos** `categoria_calidad` (escala ICAM) y `periodo` en
  `poligonos_restauracion` y `lotes_bioaumentacion` (`02_add_categoria_calidad.sql`).
- Vista `vw_resumen_calidad` y trigger `updated_at` para lotes.
- **Datos del proyecto** (`03_seed_proyecto.sql`):
  - Punto GPS real `GPS1` de `PC Luruaco.csv`, reproyectado de **EPSG:9377**
    (MAGNA-SIRGAS / Origen-Nacional) a WGS84 → `-75.170943, 10.606029`.
  - 2 zonas de restauración documentadas en el ANEXO_B del proyecto.
- Fuente de verdad del esquema documentada (ver `02-BASE-DE-DATOS.md`).

## Backend (Go)
- Endpoint nuevo `GET /api/resumen` (totales + proporción/cantidad por categoría).
- Refactor: helpers `scanZona`/`scanLote` (elimina duplicación), `c.UserContext()`.
- Seguridad: se elimina la contraseña por defecto; CORS configurable
  (`CORS_ALLOW_ORIGINS`); carga de `.env` con godotenv.
- Verificado: `go vet`, `go build` y prueba e2e contra PostGIS local.

## Frontend (React)
- **Reorganización a `src/`** (antes los fuentes estaban en la raíz y el entry
  `index.html → /src/main.tsx` estaba roto).
- **Rediseño a dashboard departamental tipo ICAM**: cabecera con escala de
  calidad, pestañas, selector de periodo, lista de sitios, KPIs, dona y barras
  (SVG puro), mapa Esri con puntos por categoría, footer.
- Correcciones: una sola capa GeoJSON, centrado por `getBounds` (no asume Polygon),
  popups como componentes React, `Promise.allSettled` + timeout, `eslint.config.js`
  que faltaba.
- Mock de API en dev (plugin Vite) para trabajar sin backend.
- Verificado: `npm run build`, `npm run lint` y screenshot contra backend real.

## Control de versiones
- `git init` + `.gitignore` (excluye `.env`, `node_modules`, binarios).

## Pendiente
- **Datos GDB (levantamiento dron):** curvas de nivel (`Cruvas_nivel.shp`) y nube
  de puntos LiDAR están en Drive en formato binario; pendientes de descargar a una
  carpeta local para ingerirlos con `ogr2ogr` → PostGIS/GeoJSON y visualizarlos.
- Cálculo automático de `area_hectareas` por trigger (hoy solo en el lote).
