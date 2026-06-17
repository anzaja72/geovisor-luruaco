# 📝 Registro de cambios (junio 2026)

Refactorización, rediseño del visor (estilo ICAM), datos del proyecto y puesta a punto.

## Base de datos
- **Nuevos campos** `categoria_calidad` (escala ICAM) y `periodo` en
  `poligonos_restauracion` y `lotes_bioaumentacion` (`02_add_categoria_calidad.sql`).
- Vista `vw_resumen_calidad` y trigger `updated_at` para lotes.
- **Datos del proyecto — SOLO datos reales** (`03_seed_proyecto.sql`):
  - Punto GPS real `GPS1` de `PC Luruaco.csv`, reproyectado de **EPSG:9377**
    (MAGNA-SIRGAS / Origen-Nacional) a WGS84 → `-75.170943, 10.606029`.
  - Se eliminaron las 2 zonas de **ejemplo** del ANEXO_B (no eran datos de campo);
    quedan únicamente el lote de bioaumentación (real) y el punto GPS.
- Fuente de verdad del esquema documentada (ver `02-BASE-DE-DATOS.md`).

## Backend (Go)
- Endpoint nuevo `GET /api/resumen` (totales + proporción/cantidad por categoría).
- Endpoint nuevo `GET /api/puntos` (todos los puntos de monitoreo/control).
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
- Capa de **puntos de control** en el mapa (crosshair morado), separada de los
  "sitios" (no afecta KPIs ni gráficas).
- Mock de API en dev (plugin Vite) para trabajar sin backend.
- Verificado: `npm run build`, `npm run lint` y screenshot contra backend real.

## Geovisor — Fase F1 (completar visualización)
- **Capas conmutables (overlays):** Zonas, Lotes y Puntos de control se pueden
  encender/apagar de forma independiente (`LayersControl.Overlay`).
- **Filtros:** por categoría de calidad y tipo de ecosistema; afectan mapa,
  listado y gráficas (`FiltersPanel`).
- **Búsqueda geográfica:** por nombre de sitio (filtra el listado) y por lugar
  mediante geocodificación Nominatim/OSM con *flyTo* en el mapa.

## Control de versiones
- `git init` + `.gitignore` (excluye `.env`, `node_modules`, binarios).

## Pendiente
- **Datos GDB (levantamiento dron):** curvas de nivel (`Cruvas_nivel.shp`) y nube
  de puntos LiDAR están en Drive en formato binario; pendientes de descargar a una
  carpeta local para ingerirlos con `ogr2ogr` → PostGIS/GeoJSON y visualizarlos.
- Cálculo automático de `area_hectareas` por trigger (hoy solo en el lote).

## Cierre de brechas contractuales (Especificación Maestra, jun-2026)
- **Geodatabase completa (§3):** parcelas, monitoreos, coberturas Corine,
  indicadores, fotografías, documentos, catálogo de insumos dron (mig. 05).
- **Insumos del dron (§4):** 8 productos de "Entregables predio 50 Ha"
  catalogados con metadatos; MDT/DSM descargados; **1106 curvas de nivel
  importadas a PostGIS** (EPSG:9377→WGS84) y visibles en el visor.
- **Autenticación (§8):** JWT + roles administrador/técnico/consulta,
  login obligatorio, CRUD de usuarios, admin inicial por entorno (mig. 06).
- **Reportes (§7):** CSV/Excel/PDF para sitios, coberturas, monitoreos,
  indicadores e insumos; pestaña "Descarga de datos".
- **Geovisor (§5):** medición de distancia/área y comparación temporal
  ANTES/DESPUÉS con mapas sincronizados.
- **Implementación (§9):** Dockerfiles, Nginx, docker-compose.prod.yml,
  backups automáticos; `10-INFRAESTRUCTURA-PRODUCCION.md` (operación 1 año).
- **Documentación (§10-11):** manuales usuario/administrador, diccionario
  de datos, plan de capacitación (4 talleres).

## CRUD de monitoreos y clave autoservicio (jun-2026)
- Backend: `GET/POST/PUT /api/monitoreos` (admin/técnico) y `DELETE` (solo admin);
  `PUT /api/auth/password` (cambio de contraseña del propio usuario).
- Frontend: modal **"Registrar monitoreo"** (estación, fecha, indicador con
  sugerencias, valor/unidad, observaciones; responsable = usuario autenticado).
- Verificado e2e: creación por técnico, 403 al eliminar, reporte de monitoreos
  refleja las mediciones, cambio de clave + relogin.

## Ortofoto del dron publicada en el visor (jun-2026)
- GeoTIFF "Ortofoto predio completo 100 Ha" (8.9 GB, EPSG:4326, 3.1 cm/px)
  tileado con gdal2tiles (`--xyz`, z13–20): 2378 tiles / 259 MB en `tiles/ortofoto`.
- Visor: overlay "🛩 Ortofoto dron (predio)" (TileLayer con bounds del predio);
  en dev la sirve Vite (plugin /tiles) y en producción Nginx (misma ruta).
- Catálogo: insumo marcado como 'publicado'. La carpeta Corine sigue en descarga.

## Coberturas Corine en la geodatabase y el visor (jun-2026)
- Ráster clasificado `isoc_12` (ArcInfo GRID, 3.4 cm/px, 12 clases, EPSG:9377)
  procesado: remuestreo a 0.5 m (moda) → sieve → vectorización (20.057 polígonos).
- Cargado a `coberturas_vegetales`: 11 clases consolidadas con área (96.3 ha) y
  porcentaje por clase; periodo 2026-1. Leyenda temática Corine por homologar
  con el consultor (clases espectrales de isocluster).
- Endpoint `GET /api/coberturas` (geometría simplificada ~1 m) y overlay
  "🌿 Coberturas (Corine)" en el visor con paleta de 12 clases y popup ha/%.
- El reporte de coberturas (CSV/Excel/PDF) ahora contiene datos reales.

## Geovisor: capas temáticas + UX + IGAC (jun-2026, inspirado en Colombia en Mapas)
- **Capas temáticas de restauración** (mig. 07): estratos, malezas, técnicas y
  sitios de validación (con % de cumplimiento valor/meta); homologación temática
  provisional de coberturas Corine. Datos de muestra marcados.
- **Quick wins UX:** 7 mapas base (satelital, topográfico, terreno, océano,
  calles, lona negra, lona clara), compartir vista por enlace (#z/lat/lon),
  imprimir/exportar mapa (PDF/imagen), descargar capas en GeoJSON, coordenada en vivo.
- **Capas oficiales IGAC vía WMS:** catastro predial, pendientes (30 m) y
  agrología nacional (consumidas del geoservicio, sin almacenar datos).
