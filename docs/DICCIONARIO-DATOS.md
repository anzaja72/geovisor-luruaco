# 📚 Diccionario de Datos — Geodatabase `eco_restauracion`

**Motor:** PostgreSQL 16 + PostGIS 3.4 · **SRID:** 4326 (WGS84) · **Esquema:** `eco_restauracion`
Scripts fuente (orden de aplicación): `schema-completo.sql` → migraciones `02…06` de `04-base-de-datos/`.

## Tablas

### poligonos_restauracion — áreas de intervención (restauración/recuperación/conservación)
| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGSERIAL PK | identificador |
| nombre / descripcion | VARCHAR/TEXT | identificación del área |
| codigo_proyecto | VARCHAR(50) UNIQUE | ej. LUR-2024-001 |
| tipo_ecosistema | VARCHAR(100) | bosque_nativo, humedal… |
| tipo_intervencion | VARCHAR(50) | restauracion · recuperacion · conservacion (mig. 05) |
| estado_restauracion | VARCHAR(50) | planificado · en_progreso · completado |
| area_hectareas | DECIMAL(12,4) | superficie |
| categoria_calidad | VARCHAR(20) | pesima…optima (mig. 02) |
| periodo | VARCHAR(20) | ej. 2024-2 (mig. 02) |
| geom | GEOMETRY(Polygon,4326) | índice GIST |
| organizacion_responsable / responsable_tecnico / contacto_email | VARCHAR | responsables |
| fecha_inicio_restauracion / fecha_estimada_fin | DATE | cronograma |

### lotes_bioaumentacion — lotes de bioaumentación
id PK · nombre · codigo_lote UNIQUE · descripcion · area_hectareas · area_metros_cuadrados ·
perimetro_metros · tipo_intervencion · estado · **geom Polygon GIST** · puntos_referencia JSONB ·
metadata JSONB · categoria_calidad · periodo · fecha_creacion/actualizacion (trigger).

### puntos_monitoreo — estaciones de monitoreo / puntos de control
id PK · poligono_id FK→poligonos · codigo_punto · nombre_punto · tipo_monitoreo ·
metodo_muestreo · estado_punto · longitud/latitud DECIMAL · elevacion · **geom Point GIST** ·
tecnico_responsable · equipo_monitoreo.

### monitoreos (mig. 05) — mediciones
id PK · estacion_id FK→puntos_monitoreo · parcela_id FK→parcelas · **fecha** ·
**indicador** · valor DECIMAL(14,4) · unidad · responsable · observaciones.

### parcelas (mig. 05)
id PK · nombre · codigo UNIQUE · area_hectareas · fecha_creacion · descripcion ·
**geom MultiPolygon GIST**.

### coberturas_vegetales (mig. 05) — Corine Land Cover
id PK · **codigo_corine** · descripcion · area_hectareas · porcentaje · fecha ·
**periodo** (comparación temporal) · fuente · **geom MultiPolygon GIST**.

### indicadores_ambientales (mig. 05)
id PK · **categoria** (calidad_agua · vegetacion · biodiversidad · restauracion · cumplimiento) ·
nombre · valor · unidad · fecha · periodo · fuente · notas.

### fotografias (mig. 05) — fotografías georreferenciadas
id PK · fecha · descripcion · ruta_archivo · drive_id · **geom Point GIST** · parcela_id FK.

### documentos (mig. 05)
id PK · **tipo** (informe · protocolo · acta · otro) · titulo · fecha · ruta_archivo ·
drive_id · drive_url · notas.

### insumos_dron (mig. 05) — catálogo de productos del levantamiento
id PK · **tipo** (ortofotomosaico · mdt · mds · cobertura_raster/vector · estadisticas_cobertura ·
nube_puntos · imagenes_originales · informe_vuelo · punto_control · curvas_nivel) · nombre ·
formato · tamano_bytes · drive_id · drive_url · ruta_local · srid_origen · fecha_captura ·
**estado** (catalogado → descargado → importado → publicado) · **metadatos JSONB** (ISO 19115 básico).

### capas_geograficas (mig. 04) — capas importadas (GeoJSON/CSV/Shapefile)
id PK · **capa** (nombre lógico) · nombre · propiedades JSONB · origen ·
**geom Geometry(4326) GIST** · created_at. *Contiene: curvas_nivel (1106 líneas).*

### usuarios (mig. 06)
id PK · nombre · **email UNIQUE** · password_hash (bcrypt) ·
**rol** (administrador · tecnico · consulta) · activo · creado_en · ultimo_acceso.

## Vistas
| Vista | Contenido |
|---|---|
| vw_areas_intervencion | unión polígonos+lotes con tipo de intervención (mig. 05) |
| vw_resumen_calidad | agregado por periodo/categoría (mig. 02) |
| vw_capas_inventario | capa, tipo de geometría, total (mig. 04) |
| vw_lotes_resumen / vw_lotes_centroides | resúmenes de lotes (schema base) |

## Relaciones
```
poligonos_restauracion 1—N puntos_monitoreo 1—N monitoreos N—1 parcelas
parcelas 1—N fotografias
(lotes_bioaumentacion, coberturas_vegetales, capas_geograficas: independientes, unidas por periodo)
```

## Sistemas de referencia
| SRID | Uso |
|---|---|
| 4326 (WGS84) | almacenamiento y visualización |
| 9377 (MAGNA-SIRGAS Origen Nacional) | origen del levantamiento dron (GPS, curvas, MDT/DSM); registrado en `spatial_ref_sys` por la mig. 03 |
| 4674 (SIRGAS 2000) | datum de los GeoTIFF del dron |
