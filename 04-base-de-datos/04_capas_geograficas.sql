-- ============================================================
-- MIGRACIÓN 04: capas_geograficas (datos importados)
-- Tabla genérica para alojar capas importadas (GeoJSON, CSV,
-- Shapefile vía ogr2ogr) con cualquier tipo de geometría.
-- Idempotente.
-- Fecha: 2026-06-10
-- ============================================================

SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.capas_geograficas (
    id           BIGSERIAL PRIMARY KEY,
    capa         VARCHAR(120) NOT NULL,            -- nombre de la capa importada
    nombre       VARCHAR(255),                     -- etiqueta del elemento
    propiedades  JSONB,                            -- atributos originales del feature
    origen       VARCHAR(255),                     -- archivo / fuente
    geom         GEOMETRY(Geometry, 4326) NOT NULL,-- cualquier tipo (Point/Line/Polygon)
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_capas_geom
    ON eco_restauracion.capas_geograficas USING GIST(geom);

-- Índice por nombre de capa (filtros del visor)
CREATE INDEX IF NOT EXISTS idx_capas_nombre
    ON eco_restauracion.capas_geograficas(capa);

COMMENT ON TABLE eco_restauracion.capas_geograficas IS
    'Capas geográficas importadas (GeoJSON/CSV/Shapefile). Geometría genérica WGS84.';

-- Vista de inventario de capas (para el visor: nombre, tipo, conteo)
CREATE OR REPLACE VIEW eco_restauracion.vw_capas_inventario AS
SELECT
    capa,
    GeometryType(geom)      AS tipo_geometria,
    COUNT(*)                AS total,
    MIN(created_at)         AS importada
FROM eco_restauracion.capas_geograficas
GROUP BY capa, GeometryType(geom)
ORDER BY capa;

SELECT 'Migración 04 (capas_geograficas) aplicada' AS mensaje;
