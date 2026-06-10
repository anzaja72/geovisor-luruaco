-- ============================================================
-- SEED 03: datos REALES del proyecto Luruaco
-- - Punto de control GPS real (PC Luruaco.csv), reproyectado
--   desde EPSG:9377 (MAGNA-SIRGAS / Origen-Nacional) a WGS84.
-- - Elimina las zonas de EJEMPLO del ANEXO_B (no son datos de campo).
-- Requiere: schema-completo.sql + 02_add_categoria_calidad.sql aplicados.
-- Idempotente.
-- ============================================================

SET search_path TO eco_restauracion, public;

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
-- LIMPIEZA: quitar zonas de EJEMPLO del ANEXO_B (datos no reales).
-- Primero se desvinculan los puntos que las referencien (FK).
-- ------------------------------------------------------------
UPDATE eco_restauracion.puntos_monitoreo
SET poligono_id = NULL
WHERE poligono_id IN (
    SELECT id FROM eco_restauracion.poligonos_restauracion
    WHERE codigo_proyecto IN ('LUR-2024-001', 'LUR-2024-002')
);

DELETE FROM eco_restauracion.poligonos_restauracion
WHERE codigo_proyecto IN ('LUR-2024-001', 'LUR-2024-002');

-- ------------------------------------------------------------
-- Punto de control GPS real (PC Luruaco.csv) — independiente.
-- CSV: GPS1, Norte=2730826.963, Este=4762570.153, Z=21.456 (EPSG:9377)
-- Se reproyecta a WGS84. ST_MakePoint(Este, Norte).
-- ------------------------------------------------------------
INSERT INTO eco_restauracion.puntos_monitoreo (
    poligono_id, codigo_punto, nombre_punto, descripcion, tipo_monitoreo,
    metodo_muestreo, estado_punto, longitud, latitud, elevacion,
    tecnico_responsable, geom
)
SELECT
    NULL, 'GPS1', 'Punto de control GPS - Luruaco',
    'Punto de control topográfico del levantamiento (origen EPSG:9377, PC Luruaco.csv).',
    'biodiversidad', 'punto_fijo', 'activo',
    ST_X(g.wgs84), ST_Y(g.wgs84), 21.456,
    'Levantamiento dronticom', g.wgs84
FROM (
    SELECT ST_Transform(
        ST_SetSRID(ST_MakePoint(4762570.153, 2730826.963), 9377), 4326
    ) AS wgs84
) g
WHERE NOT EXISTS (
    SELECT 1 FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto = 'GPS1'
);

SELECT 'Seed 03 (solo datos reales) aplicado' AS mensaje;
