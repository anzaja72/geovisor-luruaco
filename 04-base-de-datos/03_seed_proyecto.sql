-- ============================================================
-- SEED 03: datos del proyecto Luruaco
-- - Punto de control GPS real (PC Luruaco.csv), reproyectado
--   desde EPSG:9377 (MAGNA-SIRGAS / Origen-Nacional) a WGS84.
-- - Zonas de restauración documentadas en el ANEXO_B del proyecto.
-- Requiere: schema-completo.sql + 02_add_categoria_calidad.sql aplicados.
-- Idempotente por codigo_proyecto / codigo_punto.
-- ============================================================

SET search_path TO eco_restauracion, public;

-- ------------------------------------------------------------
-- Zonas de restauración (fuente: ANEXO_B del proyecto)
-- ------------------------------------------------------------
INSERT INTO eco_restauracion.poligonos_restauracion (
    nombre, descripcion, codigo_proyecto, tipo_ecosistema, estado_restauracion,
    organizacion_responsable, responsable_tecnico, contacto_email,
    fecha_inicio_restauracion, categoria_calidad, periodo, geom
) VALUES
(
    'Reserva Natural Luruaco Norte',
    'Restauración de bosque seco tropical: recuperación de especies nativas y conectividad de fragmentos de bosque.',
    'LUR-2024-001', 'bosque_nativo', 'en_progreso',
    'Fundación ProNature', 'Ing. María Rodríguez', 'mrodriguez@pronature.org',
    '2024-01-15', 'adecuada', '2024-2',
    ST_SetSRID(ST_GeomFromText('POLYGON((-75.12 10.61, -75.10 10.61, -75.10 10.63, -75.12 10.63, -75.12 10.61))'), 4326)
),
(
    'Humedal Laguna de Luruaco',
    'Restauración de ecosistema húmedo y protección de aves migratorias; recuperación de vegetación ribereña y control de invasoras.',
    'LUR-2024-002', 'humedal', 'planificado',
    'Corp. Ambiental del Atlántico', 'Biol. Carlos Pérez', 'cperez@ca-atlantico.gov.co',
    '2024-03-01', 'aceptable', '2024-2',
    ST_SetSRID(ST_GeomFromText('POLYGON((-75.08 10.59, -75.06 10.59, -75.06 10.605, -75.08 10.605, -75.08 10.59))'), 4326)
)
ON CONFLICT (codigo_proyecto) DO UPDATE SET
    categoria_calidad = EXCLUDED.categoria_calidad,
    periodo = EXCLUDED.periodo;

-- ------------------------------------------------------------
-- Registrar EPSG:9377 (MAGNA-SIRGAS / Origen-Nacional) si la imagen
-- de PostGIS no lo incluye, para poder reproyectar a WGS84.
-- ------------------------------------------------------------
INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext)
SELECT 9377, 'EPSG', 9377,
    '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    'PROJCS["MAGNA-SIRGAS 2018 / Origen-Nacional"]'
WHERE NOT EXISTS (SELECT 1 FROM spatial_ref_sys WHERE srid = 9377);

-- ------------------------------------------------------------
-- Punto de control GPS real (PC Luruaco.csv)
-- CSV: GPS1, Norte=2730826.963, Este=4762570.153, Z=21.456 (EPSG:9377)
-- Se reproyecta a WGS84. ST_MakePoint(Este, Norte).
-- ------------------------------------------------------------
INSERT INTO eco_restauracion.puntos_monitoreo (
    poligono_id, codigo_punto, nombre_punto, descripcion, tipo_monitoreo,
    metodo_muestreo, estado_punto, longitud, latitud, elevacion,
    tecnico_responsable, geom
)
SELECT
    p.id, 'GPS1', 'Punto de control GPS - Luruaco',
    'Punto de control topográfico del levantamiento (origen EPSG:9377, PC Luruaco.csv).',
    'biodiversidad', 'punto_fijo', 'activo',
    ST_X(g.wgs84), ST_Y(g.wgs84), 21.456,
    'Levantamiento dronticom', g.wgs84
FROM (
    SELECT ST_Transform(
        ST_SetSRID(ST_MakePoint(4762570.153, 2730826.963), 9377), 4326
    ) AS wgs84
) g
JOIN eco_restauracion.poligonos_restauracion p ON p.codigo_proyecto = 'LUR-2024-001'
WHERE NOT EXISTS (
    SELECT 1 FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto = 'GPS1'
);

SELECT 'Seed 03 (proyecto Luruaco) aplicado' AS mensaje;
