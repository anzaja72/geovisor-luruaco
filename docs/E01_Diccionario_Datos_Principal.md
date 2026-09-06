# 📚 Diccionario de Datos — Geodatabase `eco_restauracion`

**Motor:** PostgreSQL 16 + PostGIS 3.4 · **SRID:** 4326 (WGS84) · **Esquema:** `eco_restauracion`
Scripts fuente (orden de aplicación): `schema-completo.sql` → migraciones `02…15` de `04-base-de-datos/`.
Actualizado a la migración 15.

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

## Tablas por componente técnico

Las tablas anteriores forman el núcleo espacial de la geodatabase. Las siguientes
sostienen cada componente del geovisor y se incorporaron en las migraciones 07 a 15.

### Restauración ecológica

#### estratos_vegetacion (mig. 07)
id PK · **estrato** (herbaceo · arbustivo · arboreo) · cobertura_pct · altura_m · fecha ·
periodo · **origen** (muestra · campo) · descripcion · **geom MultiPolygon GIST**.

#### malezas (mig. 07)
id PK · especie · cobertura_pct · **estado** (requiere_control · en_control · controlada ·
monitoreo) · fecha · origen · observaciones · **geom Geometry GIST**.

#### tecnicas_restauracion (mig. 07) — herramientas de manejo del paisaje aplicadas
id PK · **tecnica** (revegetalizacion · bioaumentacion · siembra · control_malezas ·
recuperacion_suelo · restauracion_pasiva) · **descripcion** (nombre de la HMP: sistema
agroforestal, núcleos de vegetación…) · fecha · area_hectareas · responsable · origen ·
**geom MultiPolygon GIST**.

> El campo `tecnica` guarda el tipo de restauración y `descripcion` el nombre de la
> herramienta aplicada. El geovisor muestra `descripcion` como título del elemento.

#### arboles_monitoreo (mig. 08) — censo forestal
id PK · **fecha** (campaña: 'Linea base', 'Monitoreo 1'…) · cobertura · **id_parcela**
(enlaza `puntos_monitoreo.codigo_punto`) · id_arbol · especie · nombre_comun ·
altura_max · n_fustes · dap_eq · area_basal_arbol · categoria_arbol (Brinzal · Latizal ·
Fustal) · created_at. Un registro = un individuo medido.

### Monitoreo de fauna

#### fauna_observaciones (mig. 13)
id PK · grupo · nombre_comun · nombre_cientifico · cobertura_vegetal · n_individuos ·
lugar_percha · habito · comportamiento · fecha · hora · observacion · created_at.

#### fauna_grupos_resumen (mig. 09)
id PK · fecha · **grupo** (aves · anfibios · mamiferos · reptiles) · abundancia · riqueza.

#### fauna_diversidad_curvas (mig. 09) — curvas de rarefacción
id PK · fecha · grupo · n_individuos (eje x) · riqueza_estimada (eje y) · riqueza_ic_inf ·
riqueza_ic_sup · **tipo_segmento** (rarefaccion · extrapolacion) · n_observado.

### Vegetación acuática

#### maleza_limpieza (mig. 12)
id PK · **fecha** (campaña) · area_ha removidas · borde_km intervenidos · observaciones.

### Ficorremediación

#### ficor_calidad_agua (mig. 11)
id PK · fecha · **variable** (pH, Oxígeno Disuelto, DBO5…) · valor · unidad.

#### ficor_calidad_sedimentos (mig. 11)
id PK · fecha · **categoria** (metal_pesado · plaguicida) · variable · valor · unidad (mg/kg).

#### ficor_biota (mig. 11)
id PK · fecha · grupo · abundancia · riqueza.

### Gobernanza ambiental

#### gobernanza_actividades (mig. 10)
id PK · actividad · cantidad de eventos · participantes · ubicacion · fecha.

### Plataforma

#### copiloto_consultas (mig. 15) — registro de uso del asistente
id PK · usuario_id FK→usuarios · pregunta · **con_modelo** (redactada por el proveedor o
compuesta con los datos) · modelo · creado_en. No almacena la respuesta: interesa la
necesidad de información, no el texto generado.

## Vistas
| Vista | Contenido |
|---|---|
| vw_areas_intervencion | unión polígonos+lotes con tipo de intervención (mig. 05) |
| vw_resumen_calidad | agregado por periodo/categoría (mig. 02) |
| vw_capas_inventario | capa, tipo de geometría, total (mig. 04) |
| vw_lotes_resumen / vw_lotes_centroides | resúmenes de lotes (schema base) |
| v_resumen_poligonos | conteo y superficie de polígonos por tipo de ecosistema y estado (schema base) |
| vw_indicadores_restauracion | riqueza, densidad/ha, área basal/ha, altura media y Shannon por campaña, desde el censo (mig. 08) |
| vw_fauna_total | abundancia y riqueza agregadas por campaña (mig. 09) |
| vw_gobernanza_resumen | eventos y participantes por tipo de actividad (mig. 10) |
| vw_copiloto_frecuentes | preguntas más repetidas al copiloto en los últimos 30 días (mig. 15) |

## Relaciones
```
poligonos_restauracion 1—N puntos_monitoreo 1—N monitoreos N—1 parcelas
parcelas 1—N fotografias
puntos_monitoreo.codigo_punto —— arboles_monitoreo.id_parcela   (enlace por código, sin FK)
usuarios 1—N copiloto_consultas

Sin dependencias entre sí, unidas por el campo de campaña (`fecha`) o por `periodo`:
  coberturas_vegetales · capas_geograficas · lotes_bioaumentacion · estratos_vegetacion
  malezas · tecnicas_restauracion · fauna_* · ficor_* · maleza_limpieza · gobernanza_actividades
```

## Sistemas de referencia
| SRID | Uso |
|---|---|
| 4326 (WGS84) | almacenamiento y visualización |
| 9377 (MAGNA-SIRGAS Origen Nacional) | origen del levantamiento dron (GPS, curvas, MDT/DSM); registrado en `spatial_ref_sys` por la mig. 03 |
| 4674 (SIRGAS 2000) | datum de los GeoTIFF del dron |
