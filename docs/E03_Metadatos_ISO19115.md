# Catálogo de metadatos geográficos — ISO 19115

**Conjunto:** Geodatabase de restauración ecológica de la Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.1, literal f) — *«Elaborar y entregar metadatos técnicos completos de la información incorporada»*
**Norma:** ISO 19115 (núcleo) · perfil colombiano del IGAC
**Fecha del catálogo:** 6 de septiembre de 2026

---

## 1. Identificación del conjunto de datos

| Elemento ISO 19115 | Valor |
|---|---|
| Título | Geodatabase de restauración ecológica — Ciénaga de Luruaco |
| Resumen | Información espacial, tabular y documental del proyecto de restauración del humedal: coberturas vegetales, parcelas de monitoreo, técnicas aplicadas, aislamiento, censo forestal, fauna, vegetación acuática, ficorremediación y gobernanza ambiental |
| Propósito | Monitorear y dar trazabilidad temporal a las intervenciones de restauración, y sustentar los indicadores contractuales |
| Categoría temática | `environment`, `biota`, `imageryBaseMapsEarthCover` |
| Idioma | Español (spa) |
| Juego de caracteres | UTF-8 |
| Estado | En mantenimiento (`onGoing`) |
| Frecuencia de actualización | Por campaña de monitoreo |
| Responsable del dato | Corporación Autónoma Regional del Atlántico — C.R.A. (propietario) |
| Responsable técnico | MC Consultorías & Capacitación S.A.S. (procesamiento y publicación) |
| Punto de contacto | Ver [manual del administrador](E10_Manual_Administrador_Principal.md) |

### Extensión geográfica

| Límite | Coordenada |
|---|---|
| Norte | 10.612784° N |
| Sur | 10.596739° N |
| Este | −75.164818° W |
| Oeste | −75.180838° W |

Municipio de Luruaco, departamento del Atlántico, Colombia. Superficie analizada:
**48,01 ha**.

### Extensión temporal

Desde la línea base (julio de 2026) y en adelante, por campañas de monitoreo.

### Sistema de referencia

| SRID | Uso |
|---|---|
| **4326** — WGS 84 | Almacenamiento y publicación de todas las capas |
| 9377 — MAGNA-SIRGAS / Origen Nacional | Origen del levantamiento con dron (GPS, curvas de nivel, MDT/MDS) |
| 4674 — SIRGAS 2000 | Datum de los GeoTIFF entregados por el proveedor del vuelo |

La reproyección a 4326 se realiza en la importación (`ogr2ogr -t_srs EPSG:4326`).

### Restricciones

| Tipo | Condición |
|---|---|
| Acceso | Restringido: requiere cuenta en la plataforma |
| Uso | Derechos patrimoniales del contratante (cláusula séptima del contrato) |
| Legales | Información oficial del Contrato 324 de 2025 |

---

## 2. Metadatos por capa

Cada ficha recoge los elementos del núcleo ISO 19115 aplicables. La estructura de campos
de cada tabla está en el [diccionario de datos](E01_Diccionario_Datos_Principal.md).

### 2.1 Coberturas vegetales (Corine Land Cover)

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.coberturas_vegetales` |
| Tipo de geometría | MultiPolygon (4326) |
| Entidades | 24 |
| Escala de captura | Levantamiento con dron, resolución submétrica |
| Linaje | Fotointerpretación sobre ortofoto del dron, clasificada según la leyenda Corine Land Cover adaptada para Colombia |
| Atributos clave | `codigo_corine`, `descripcion`, `area_hectareas`, `porcentaje`, `clase_tematica` |
| Exactitud temática | Clases verificadas en campo por el equipo técnico del proyecto |
| Distribución | GeoJSON vía `GET /api/coberturas`; CSV/Excel/PDF vía reportes |

### 2.2 Parcelas de monitoreo

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.puntos_monitoreo` |
| Tipo de geometría | Point (4326) |
| Entidades | 20 |
| Linaje | Ubicación con GPS en campo; nomenclatura asignada por cobertura (BD = bosque denso, BR = bosque ripario, CU = cultivos, DD = tierras desnudas y degradadas, VS = vegetación secundaria) |
| Atributos clave | `codigo_punto` (nomenclatura), `nombre_punto`, `descripcion` (cobertura), `tipo_monitoreo` |
| Exactitud posicional | Determinada por el receptor GPS empleado en campo |
| Distribución | GeoJSON vía `GET /api/puntos` |

### 2.3 Técnicas de restauración aplicadas

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.tecnicas_restauracion` |
| Tipo de geometría | MultiPolygon (4326) |
| Entidades | 27 |
| Linaje | Digitalización de las áreas intervenidas sobre la ortofoto, con la herramienta de manejo del paisaje aplicada en cada una |
| Atributos clave | `tecnica` (tipo de restauración), `descripcion` (nombre de la HMP), `area_hectareas` |
| Distribución | GeoJSON vía `GET /api/tecnicas` |

### 2.4 Polígono de aislamiento del predio

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.poligonos_restauracion` |
| Tipo de geometría | Polygon (4326) |
| Entidades | 1 |
| Linaje | Cerramiento del predio levantado en campo |
| Distribución | GeoJSON vía `GET /api/zonas` |

### 2.5 Capas geográficas importadas

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.capas_geograficas` |
| Tipo de geometría | Geometry (4326), variable por capa |
| Entidades | 1.130 |
| Contenido | Aislamiento interno (cercas), polígonos de limpieza de vegetación acuática y curvas de nivel |
| Linaje | Importación desde shapefile y GeoJSON con reproyección a 4326 |
| Distribución | GeoJSON vía `GET /api/capas/geojson`; catálogo en `GET /api/capas` |

### 2.6 Censo forestal

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.arboles_monitoreo` |
| Tipo | Tabular, enlazada a parcelas por `id_parcela` ↔ `codigo_punto` |
| Registros | 75 individuos en la línea base |
| Linaje | Medición directa en parcela: especie, altura, número de fustes y DAP |
| Cálculos derivados | Densidad = N ÷ área muestreada · Área basal = Σ[π·(DAP/200)²] ÷ área muestreada · Shannon H′ = −Σ(pᵢ·ln pᵢ) |
| Supuesto declarado | Parcela = 0,1 ha (1,5 ha en 15 parcelas); pendiente de confirmación por el equipo técnico |
| Distribución | Indicadores vía `GET /api/restauracion/indicadores`; reporte tabular |

### 2.7 Observaciones de fauna

| Elemento | Valor |
|---|---|
| Identificador | `eco_restauracion.fauna_observaciones` |
| Tipo | Tabular |
| Registros | 119 |
| Linaje | Línea base de fauna: avistamiento directo, canto y cámaras trampa, por cobertura vegetal |
| Grupos | Aves, mamíferos, anfibios, reptiles |
| Distribución | `GET /api/fauna/observaciones` |

### 2.8 Estratos de vegetación y malezas

| Elemento | Valor |
|---|---|
| Identificadores | `eco_restauracion.estratos_vegetacion` (3) · `eco_restauracion.malezas` (2) |
| Tipo de geometría | MultiPolygon y Geometry (4326) |
| Linaje | Registro en campo. El campo `origen` distingue el dato levantado del de muestra |
| Distribución | `GET /api/estratos` · `GET /api/malezas` |

### 2.9 Ortofoto del predio

| Elemento | Valor |
|---|---|
| Identificador | Producto del levantamiento con dron, publicado como teselas XYZ en `/tiles/ortofoto/{z}/{x}/{y}.png` |
| Tipo | Ráster |
| Niveles de zum publicados | 14 a 18 |
| Datum de origen | SIRGAS 2000 (4674); publicada en Web Mercator para su despliegue |
| Linaje | Vuelo fotogramétrico, procesamiento del proveedor y teselado con `gdal2tiles` |
| Autoría | dronticom — Entregables predio 50 Ha |
| Catálogo asociado | `eco_restauracion.insumos_dron` (metadatos, formato, tamaño y estado de cada producto) |

### 2.10 Cartografía base institucional

| Elemento | Valor |
|---|---|
| Fuente | Instituto Geográfico Agustín Codazzi (IGAC) |
| Capas | Catastro predial, pendientes (30 m), agrología nacional |
| Acceso | Geoservicios WMS oficiales, consumidos en línea |
| Linaje | No se almacena copia: se consulta directamente del servicio del IGAC |

---

## 3. Capas con estructura publicada y sin datos cargados

Se declaran expresamente para que el catálogo refleje el estado real del conjunto:

| Capa | Estado |
|---|---|
| `monitoreos` | Estructura lista, sin registros |
| `fotografias` | Estructura lista, sin registros |
| Validación (metas y cumplimiento) | Sin sitios registrados |
| `ficor_calidad_agua`, `ficor_calidad_sedimentos`, `ficor_biota` | Variables definidas, sin mediciones |
| Campañas Monitoreo 1 a 4 del censo forestal | Filas previstas, sin mediciones de campo |

La plataforma las representa como «sin dato» y no las sustituye por ceros, para no
inducir a error en la lectura de los indicadores.

---

## 4. Calidad de la información

| Criterio ISO 19115 | Tratamiento |
|---|---|
| Exactitud posicional | Heredada del levantamiento con dron y del GPS de campo |
| Exactitud temática | Clases Corine verificadas por el equipo técnico |
| Consistencia lógica | Restricciones y llaves foráneas en la base; dominios controlados por `CHECK` |
| Completitud | Declarada capa por capa en este catálogo, incluidas las que están vacías |
| Linaje | Registrado por capa en el apartado 2 y en los scripts de importación versionados |

---

## 5. Mantenimiento del catálogo

Este documento se actualiza cuando se incorpore una capa nueva, cambie el linaje de una
existente o se carguen los datos de las capas hoy vacías. La estructura de campos se
mantiene en el [diccionario de datos](E01_Diccionario_Datos_Principal.md); los metadatos de
los productos del dron viven además en la tabla `insumos_dron`, en el campo `metadatos`
(JSONB), disponibles para su exportación.
