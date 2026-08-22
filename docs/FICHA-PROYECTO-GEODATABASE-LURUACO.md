# Geodatabase Luruaco

Plataforma geoespacial para monitoreo y trazabilidad de la restauración ecológica de la Ciénaga de Luruaco.

## 1. Descripción de la Operación

Geodatabase Luruaco integra información geoespacial, biológica, ambiental y operativa de los cinco componentes del proyecto de restauración ecológica (Restauración, Vegetación Acuática, Ficorremediación, Fauna y Gobernanza) en una plataforma única, accesible vía web y orientada a la trazabilidad de las intervenciones en la Ciénaga de Luruaco, Atlántico, Colombia. La plataforma permite a la entidad contratante visualizar, consultar y reportar el avance del proyecto con base en datos reales georreferenciados en PostGIS.

## 2. Sub-sistemas del Núcleo Integrados

- Geodatabase PostGIS oficial con 21 tablas activas y datos reales integrados de los cinco componentes del proyecto
- Geovisor institucional con mapa base satelital (Esri/Maxar), ortofoto del dron y filtros por componente y tipo de capa
- Módulo de monitoreo biológico con curvas de diversidad, KPIs y registros de campo por estación
- Módulo de reportes abiertos (CSV, Excel, PDF) para zonas, capas, coberturas, monitoreos e indicadores
- Autenticación con tres roles (administrador, técnico, consulta) y trazabilidad por usuario responsable
- Importador de datos consolidados (capas vectoriales reproyectadas vía GDAL/OGR + censo forestal desde Excel) hacia PostGIS
- Ortofoto de alta resolución del dron como capa de tiles XYZ sobre el predio

### BACKEND GEOESPACIAL (GO + POSTGRESQL/POSTGIS)
- API REST en Go con framework Fiber, CORS restringido al dominio productivo
- Persistencia en PostgreSQL 16 con extensión PostGIS 3.4 (SRID 4326, geometrías validadas)
- Autenticación JWT con bcrypt para contraseñas y middlewares de acceso por rol (lectura / edición / administrador)
- Modelo de datos geográficos por componente, con tablas específicas para árboles, capas, coberturas, fauna y ficorremediación
- Vistas materializadas para indicadores agregados (restauración, fauna, gobernanza, calidad)

### FRONTEND GEOVISOR (REACT + LEAFLET)
- SPA en React 19 + TypeScript con Vite 8 como build tool
- Mapas interactivos con Leaflet 1.9 + React-Leaflet 5, capas conmutables, herramienta de medición y ortofoto del dron
- Dashboard transversal con escala de calidad, KPIs, dona y barras (SVG puro)
- Vistas dedicadas por componente (Restauración, Maleza/Vegetación Acuática, Ficorremediación, Fauna, Gobernanza) más un módulo de reportes
- Diseño responsive mobile-first con sidebar colapsable y popups optimizados para touch

### DATOS Y GEOPROCESAMIENTO (GEOSPATIAL DATA STACK)
- Almacenamiento de geometrías PostGIS con SRID 4326 (WGS84) y validación topológica
- Catálogo de insumos dron (ortofoto, MDT/DSM, curvas de nivel)
- Procesamiento raster y vectorial con GDAL/OGR (reproyección, tileado de la ortofoto con gdal2tiles)
- Pipeline de ingestión de capas consolidadas con respaldo previo automático de la base de datos
- Exportación de reportes en CSV, Excel (XLSX) y PDF directamente desde el backend

### INFRAESTRUCTURA PRODUCTIVA (DEVOPS)
- VPS Hetzner (Ubuntu 22.04) con contenedores Docker y orquestación docker-compose
- Enrutamiento con Traefik (TLS automático vía Let's Encrypt) hacia el contenedor del frontend
- PostGIS y backend sin exposición pública, accesibles solo en la red interna del compose
- Backup diario de la base de datos con retención de 14 días (servicio dedicado del compose)
- Dominio institucional geodatabase.mcconsultorias.com.co con TLS válido

## 3. Componentes del Proyecto Cubiertos

- **Restauración Ecológica**: polígonos de restauración, puntos de monitoreo, censo forestal, indicadores de densidad y cobertura
- **Vegetación Acuática**: polígonos de maleza acuática y técnicas de restauración asociadas
- **Ficorremediación**: 5 puntos georreferenciados, lote de bioaumentación (capa restringida, no expuesta en el geovisor), tableros de calidad de agua, sedimentos y biota
- **Monitoreo de Fauna**: estructura lista para KPIs de riqueza/abundancia y curvas de diversidad, pendiente de carga de datos de campo
- **Gobernanza Ambiental**: 7 actividades reales y completas (socializaciones, talleres, capacitaciones, jornadas, negocios verdes)

## 4. Estándar de Cumplimiento

La plataforma se estructura conforme a los lineamientos del IGAC para gestión de información geoespacial en Colombia y a la normatividad ambiental aplicable al proyecto de restauración. Está pendiente, como parte del avance contractual en curso, la integración formal de cartografía base institucional oficial del IGAC (hoy se usa imagen satelital de referencia) y la depuración de metadatos bajo ISO 19115. La trazabilidad de los datos se preserva mediante versionamiento del esquema (migraciones SQL) y bitácora de cambios del repositorio.

## 5. Datos de Referencia

| Campo | Valor |
|---|---|
| Contrato | UTL:001 — Unión Temporal Restauración Luruaco |
| Contratista | MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8) |
| Plazo | 22 meses (02-mar-2026 → 02-ene-2028) |
| Componentes | 5 (Restauración · Vegetación Acuática · Ficorremediación · Fauna · Gobernanza) |
| URL de producción | https://geodatabase.mcconsultorias.com.co |
| Stack | Go + Fiber · React 19 + TypeScript · PostgreSQL 16 + PostGIS 3.4 |
| Filas reales en BD | 1.352 distribuidas en 9 tablas con datos reales del proyecto (más estructura lista, aún sin datos, para Fauna y Ficorremediación) |
