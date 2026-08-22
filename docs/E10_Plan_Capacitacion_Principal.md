# 🎓 Plan de Capacitación (Especificación §11)

4 talleres de 2 horas, presenciales o virtuales, con práctica guiada sobre la plataforma.

## Taller 1 — Geodatabase (dirigido a: técnico y administrador)
- Modelo de datos (`docs/DICCIONARIO-DATOS.md`): tablas, relaciones, SRID.
- Insumos del dron y su catálogo (`insumos_dron`): estados y metadatos.
- Práctica: consultar la BD con psql/QGIS; conectar QGIS a PostGIS.
- Material: `02-BASE-DE-DATOS.md`, diccionario de datos.

## Taller 2 — Geovisor (dirigido a: todos los roles)
- Ingreso y roles; navegación del tablero.
- Capas, filtros, búsqueda, consulta por clic.
- Medición de distancia/área; comparación temporal antes/después.
- Práctica: localizar el lote de bioaumentación, medir su perímetro, comparar periodos.
- Material: `docs/MANUAL-USUARIO.md`.

## Taller 3 — Reportes (dirigido a: consulta y técnico)
- Módulo "Descarga de datos": tipos de reporte y formatos (CSV/Excel/PDF).
- Interpretación de KPIs e indicadores del dashboard.
- Práctica: generar el reporte de coberturas en Excel y el consolidado en PDF.

## Taller 4 — Administración (dirigido a: administrador)
- Gestión de usuarios y roles; recuperación de contraseñas.
- Importación de datos (GeoJSON/CSV desde el visor; Shapefile y GeoTIFF en servidor).
- Backups, restauración y monitoreo; despliegue con Docker.
- Material: `docs/MANUAL-ADMINISTRADOR.md`, `10-INFRAESTRUCTURA-PRODUCCION.md`.

**Evidencias de capacitación:** lista de asistencia + acta (cargar como `documentos` tipo `acta` en la geodatabase).
