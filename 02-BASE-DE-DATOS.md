# 🗄️ Base de Datos PostGIS

## Esquema: eco_restauracion

### Tablas

#### 1. poligonos_restauracion
Almacena áreas poligonales de proyectos de restauración.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL PK | Identificador único |
| nombre | VARCHAR(255) | Nombre del proyecto |
| descripcion | TEXT | Descripción detallada |
| codigo_proyecto | VARCHAR(50) | Código único |
| tipo_ecosistema | VARCHAR(100) | bosque_nativo, humedal, etc. |
| estado_restauracion | VARCHAR(50) | planificado, en_progreso, completado |
| area_hectareas | DECIMAL(12,4) | Superficie en hectáreas |
| geom | GEOMETRY(POLYGON, 4326) | Geometría espacial WGS84 |
| organizacion_responsable | VARCHAR(255) | Entidad ejecutora |
| responsable_tecnico | VARCHAR(255) | Profesional a cargo |
| fecha_inicio_restauracion | DATE | Fecha de inicio |
| categoria_calidad | VARCHAR(20) | Escala ICAM: pesima/inadecuada/aceptable/adecuada/optima (migración 02) |
| periodo | VARCHAR(20) | Periodo de reporte, ej. `2024-2` (migración 02) |

#### 2. lotes_bioaumentacion
Almacena lotes para bioaumentación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL PK | Identificador único |
| nombre | VARCHAR(255) | Nombre del lote |
| codigo_lote | VARCHAR(50) | Código único |
| descripcion | TEXT | Descripción detallada |
| area_hectareas | DECIMAL(12,4) | Área en hectáreas |
| area_metros_cuadrados | DECIMAL(12,2) | Área en m² |
| perimetro_metros | DECIMAL(12,2) | Perímetro en metros |
| tipo_intervencion | VARCHAR(100) | Tipo de intervención |
| estado | VARCHAR(50) | Estado del lote |
| geom | GEOMETRY(POLYGON, 4326) | Geometría espacial |
| puntos_referencia | JSONB | Puntos de referencia |
| metadata | JSONB | Metadatos adicionales |
| categoria_calidad | VARCHAR(20) | Escala ICAM (migración 02) |
| periodo | VARCHAR(20) | Periodo de reporte (migración 02) |

#### 3. puntos_monitoreo
Puntos de muestreo dentro de las zonas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL PK | Identificador único |
| poligono_id | BIGINT FK | Referencia a zona |
| codigo_punto | VARCHAR(50) | Código único |
| tipo_monitoreo | VARCHAR(100) | vegetacion, fauna, suelo, agua |
| longitud/latitud | DECIMAL | Coordenadas geográficas |
| geom | GEOMETRY(POINT, 4326) | Geometría espacial |

## Scripts y orden de aplicación

La fuente de verdad del esquema son estos scripts (aplicar en orden):

| Orden | Archivo | Contenido |
|-------|---------|-----------|
| 1 | `schema-completo.sql` | Esquema base (tablas, índices, lote LUR-BIO-001, vistas, funciones) |
| 2 | `04-base-de-datos/02_add_categoria_calidad.sql` | Migración: `categoria_calidad` + `periodo`, índices, trigger de lotes, vista de resumen |
| 3 | `04-base-de-datos/03_seed_proyecto.sql` | Datos del proyecto: 2 zonas (ANEXO_B) + punto GPS real (EPSG:9377→WGS84) |

> Nota: `04-base-de-datos/01_init_schema.sql` es una variante histórica del esquema
> (patrón NENA). El backend Go usa la estructura de `schema-completo.sql`.

```bash
docker compose -f 04-base-de-datos/docker-compose.yml up -d
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < schema-completo.sql
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < 04-base-de-datos/02_add_categoria_calidad.sql
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < 04-base-de-datos/03_seed_proyecto.sql
```

## Datos Cargados

### Punto de control GPS (PC Luruaco.csv)
Origen del levantamiento topográfico en **EPSG:9377** (MAGNA-SIRGAS / Origen-Nacional),
reproyectado a WGS84 por PostGIS:

| Código | Norte (9377) | Este (9377) | Lon (WGS84) | Lat (WGS84) |
|--------|--------------|-------------|-------------|-------------|
| GPS1 | 2730826.963 | 4762570.153 | -75.170943 | 10.606029 |

> EPSG:9377 no viene en algunas imágenes de PostGIS; `03_seed_proyecto.sql` lo
> registra en `spatial_ref_sys` antes de reproyectar.

### Lote Planta Bioaumentación (LUR-BIO-001)

**Área:** 132.56 hectáreas  
**Perímetro:** 5,838.73 metros  
**Tipo:** Bioaumentación  
**Estado:** Activo

**Puntos de Referencia:**
| Punto | Longitud | Latitud | Altitud |
|-------|----------|---------|---------|
| Punto 1 | -75.148814 | 10.605410 | 23.89m |
| Punto 2 | -75.153383 | 10.615296 | 23.89m |
| Punto 3 | -75.163980 | 10.613388 | 23.92m |
| Punto 4 | -75.160903 | 10.599840 | 23.97m |
| Punto 5 | -75.157158 | 10.607800 | 26.34m |

## Comandos Útiles

```sql
-- Ver todos los lotes
SELECT * FROM eco_restauracion.lotes_bioaumentacion;

-- Calcular área
SELECT ST_Area(geom::geography) / 10000 as hectareas 
FROM eco_restauracion.lotes_bioaumentacion 
WHERE codigo_lote = 'LUR-BIO-001';

-- Exportar a GeoJSON
SELECT ST_AsGeoJSON(geom) FROM eco_restauracion.lotes_bioaumentacion;
```
