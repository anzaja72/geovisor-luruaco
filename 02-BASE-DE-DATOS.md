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

## Datos Cargados

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
