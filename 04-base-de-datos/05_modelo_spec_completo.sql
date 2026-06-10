-- ============================================================
-- MIGRACIÓN 05: Modelo de datos completo (Especificación Maestra §3 y §4)
-- SIG Restauración Ecológica – Ciénaga de Luruaco
--
-- Añade: parcelas, monitoreos, coberturas_vegetales (Corine),
-- indicadores_ambientales, fotografias, documentos, insumos_dron,
-- y la vista unificada de áreas de intervención.
-- Idempotente. Fecha: 2026-06-10
-- ============================================================

SET search_path TO eco_restauracion, public;

-- ------------------------------------------------------------
-- 0. Tipo de intervención en polígonos (restauracion | recuperacion | conservacion)
-- ------------------------------------------------------------
ALTER TABLE eco_restauracion.poligonos_restauracion
    ADD COLUMN IF NOT EXISTS tipo_intervencion VARCHAR(50) DEFAULT 'restauracion';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_intervencion_pol') THEN
        ALTER TABLE eco_restauracion.poligonos_restauracion
            ADD CONSTRAINT chk_tipo_intervencion_pol CHECK (
                tipo_intervencion IN ('restauracion','recuperacion','conservacion','bioaumentacion')
            );
    END IF;
END$$;

-- ------------------------------------------------------------
-- 1. PARCELAS (spec §3)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.parcelas (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(255) NOT NULL,
    codigo         VARCHAR(50) UNIQUE,
    area_hectareas DECIMAL(12,4),
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    descripcion    TEXT,
    geom           GEOMETRY(MultiPolygon, 4326),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcelas_geom ON eco_restauracion.parcelas USING GIST(geom);
COMMENT ON TABLE eco_restauracion.parcelas IS 'Parcelas de trabajo/monitoreo dentro del predio (spec §3).';

-- ------------------------------------------------------------
-- 2. MONITOREOS (mediciones asociadas a estaciones = puntos_monitoreo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.monitoreos (
    id           BIGSERIAL PRIMARY KEY,
    estacion_id  BIGINT REFERENCES eco_restauracion.puntos_monitoreo(id) ON DELETE SET NULL,
    parcela_id   BIGINT REFERENCES eco_restauracion.parcelas(id) ON DELETE SET NULL,
    fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
    indicador    VARCHAR(120) NOT NULL,     -- ej: pH, oxigeno_disuelto, cobertura_vegetal
    valor        DECIMAL(14,4),
    unidad       VARCHAR(40),               -- ej: mg/L, %, m
    responsable  VARCHAR(255),
    observaciones TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monitoreos_fecha ON eco_restauracion.monitoreos(fecha);
CREATE INDEX IF NOT EXISTS idx_monitoreos_indicador ON eco_restauracion.monitoreos(indicador);
CREATE INDEX IF NOT EXISTS idx_monitoreos_estacion ON eco_restauracion.monitoreos(estacion_id);
COMMENT ON TABLE eco_restauracion.monitoreos IS 'Mediciones de monitoreo: fecha, indicador, valor, unidad, responsable (spec §3).';

-- ------------------------------------------------------------
-- 3. COBERTURAS VEGETALES — Corine Land Cover (spec §3 y §4)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.coberturas_vegetales (
    id             BIGSERIAL PRIMARY KEY,
    codigo_corine  VARCHAR(20) NOT NULL,      -- ej: 3.1.1, 2.3.3
    descripcion    VARCHAR(255),
    area_hectareas DECIMAL(12,4),
    porcentaje     DECIMAL(6,3),
    fecha          DATE,                      -- fecha de la clasificación (línea base / seguimiento)
    periodo        VARCHAR(20),               -- para comparación temporal
    fuente         VARCHAR(255),              -- ej: vuelo dron 2026-05
    geom           GEOMETRY(MultiPolygon, 4326),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coberturas_geom ON eco_restauracion.coberturas_vegetales USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_coberturas_corine ON eco_restauracion.coberturas_vegetales(codigo_corine);
CREATE INDEX IF NOT EXISTS idx_coberturas_periodo ON eco_restauracion.coberturas_vegetales(periodo);
COMMENT ON TABLE eco_restauracion.coberturas_vegetales IS 'Coberturas clasificación Corine Land Cover; soporta comparación temporal por periodo (spec §3/§5).';

-- ------------------------------------------------------------
-- 4. INDICADORES AMBIENTALES (spec §3 y §6)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.indicadores_ambientales (
    id        BIGSERIAL PRIMARY KEY,
    categoria VARCHAR(40) NOT NULL CHECK (categoria IN
              ('calidad_agua','vegetacion','biodiversidad','restauracion','cumplimiento')),
    nombre    VARCHAR(150) NOT NULL,
    valor     DECIMAL(14,4),
    unidad    VARCHAR(40),
    fecha     DATE DEFAULT CURRENT_DATE,
    periodo   VARCHAR(20),
    fuente    VARCHAR(255),
    notas     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_indicadores_cat ON eco_restauracion.indicadores_ambientales(categoria);
CREATE INDEX IF NOT EXISTS idx_indicadores_periodo ON eco_restauracion.indicadores_ambientales(periodo);

-- ------------------------------------------------------------
-- 5. FOTOGRAFÍAS GEORREFERENCIADAS (spec §3)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.fotografias (
    id          BIGSERIAL PRIMARY KEY,
    fecha       DATE,
    descripcion TEXT,
    ruta_archivo VARCHAR(500),               -- ruta local o URL (Drive/S3)
    drive_id    VARCHAR(100),
    geom        GEOMETRY(Point, 4326),
    parcela_id  BIGINT REFERENCES eco_restauracion.parcelas(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fotografias_geom ON eco_restauracion.fotografias USING GIST(geom);

-- ------------------------------------------------------------
-- 6. DOCUMENTOS ASOCIADOS (spec §3): informes, protocolos, actas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.documentos (
    id         BIGSERIAL PRIMARY KEY,
    tipo       VARCHAR(40) NOT NULL CHECK (tipo IN ('informe','protocolo','acta','otro')),
    titulo     VARCHAR(255) NOT NULL,
    fecha      DATE,
    ruta_archivo VARCHAR(500),
    drive_id   VARCHAR(100),
    drive_url  VARCHAR(500),
    notas      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. INSUMOS DRON (spec §4) — catálogo con metadatos (ISO 19115 básico)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.insumos_dron (
    id            BIGSERIAL PRIMARY KEY,
    tipo          VARCHAR(40) NOT NULL CHECK (tipo IN
                  ('ortofotomosaico','mdt','mds','cobertura_raster','cobertura_vector',
                   'estadisticas_cobertura','nube_puntos','imagenes_originales',
                   'informe_vuelo','punto_control','curvas_nivel','otro')),
    nombre        VARCHAR(255) NOT NULL,
    formato       VARCHAR(40),               -- GeoTIFF, SHP, LAS/LAZ, CSV...
    tamano_bytes  BIGINT,
    drive_id      VARCHAR(100),
    drive_url     VARCHAR(500),
    ruta_local    VARCHAR(500),              -- si fue descargado al servidor
    srid_origen   INTEGER,
    fecha_captura DATE,
    estado        VARCHAR(30) DEFAULT 'catalogado'
                  CHECK (estado IN ('catalogado','descargado','importado','publicado')),
    metadatos     JSONB,                     -- linaje, resolución, EPSG, responsable (ISO 19115 básico)
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_insumos_tipo ON eco_restauracion.insumos_dron(tipo);
COMMENT ON TABLE eco_restauracion.insumos_dron IS 'Catálogo de productos del levantamiento dron (spec §4) con metadatos y referencia a Drive.';

-- ------------------------------------------------------------
-- 8. VISTA: áreas de intervención unificadas (spec §3.A)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW eco_restauracion.vw_areas_intervencion AS
SELECT id, nombre, codigo_proyecto AS codigo,
       COALESCE(tipo_intervencion,'restauracion') AS tipo_intervencion,
       estado_restauracion AS estado, area_hectareas,
       categoria_calidad, periodo, geom
FROM eco_restauracion.poligonos_restauracion
UNION ALL
SELECT id + 100000, nombre, codigo_lote,
       'bioaumentacion', estado, area_hectareas,
       categoria_calidad, periodo, geom
FROM eco_restauracion.lotes_bioaumentacion;

-- ------------------------------------------------------------
-- 9. SEED: catálogo real de "Entregables predio 50 Ha" (Drive)
-- ------------------------------------------------------------
INSERT INTO eco_restauracion.insumos_dron
    (tipo, nombre, formato, tamano_bytes, drive_id, drive_url, srid_origen, estado, metadatos)
SELECT * FROM (VALUES
    ('ortofotomosaico','Ortofoto predio completo 100 Ha','GeoTIFF', 8904571068::bigint,
     '1eH4Dj18L-9AJS_ECRaJNZLQEJxpG6pEq',
     'https://drive.google.com/file/d/1eH4Dj18L-9AJS_ECRaJNZLQEJxpG6pEq/view',
     NULL::int, 'catalogado',
     '{"carpeta":"Ortofoto Tiff","proveedor":"dronticom","proyecto":"Entregables predio 50 Ha","nota":"Base cartográfica principal; servir como tiles XYZ (gdal2tiles) en producción"}'::jsonb),
    ('ortofotomosaico','Ortofoto #2','GeoTIFF', 2673358148::bigint,
     '1GrE-tyujiPctuf5XwzgbmMLcH3d52Twl',
     'https://drive.google.com/file/d/1GrE-tyujiPctuf5XwzgbmMLcH3d52Twl/view',
     NULL, 'catalogado',
     '{"carpeta":"Ortofoto Tiff","proveedor":"dronticom"}'::jsonb),
    ('mdt','Modelo digital de terreno MDT','GeoTIFF', 4712606::bigint,
     '121tu6oH3p1plA81cc3FObk-1e_ANLf5h',
     'https://drive.google.com/file/d/121tu6oH3p1plA81cc3FObk-1e_ANLf5h/view',
     NULL, 'catalogado',
     '{"carpeta":"Modelo digital de Terreno MDT","uso":"pendientes, hidrología, análisis espacial"}'::jsonb),
    ('mds','Modelo digital de superficie DSM','GeoTIFF', 4712606::bigint,
     '1QbSYss78MxuysPsmM5TB3Kbg8KyYTNh8',
     'https://drive.google.com/file/d/1QbSYss78MxuysPsmM5TB3Kbg8KyYTNh8/view',
     NULL, 'catalogado',
     '{"carpeta":"Modelo digital de superficie DSM","uso":"alturas, vegetación"}'::jsonb),
    ('curvas_nivel','Curvas de nivel (Cruvas_nivel.shp)','Shapefile', 3785060::bigint,
     '1gltsRBhez4KIiCkxXAFseHWfh541Ujvq',
     'https://drive.google.com/file/d/1gltsRBhez4KIiCkxXAFseHWfh541Ujvq/view',
     9377, 'catalogado',
     '{"nota":"Requiere archivos hermanos .dbf/.shx/.prj para atributos; importable con scripts/import_shapefile.sh"}'::jsonb),
    ('cobertura_vector','Clasificación de coberturas (Corine Land Cover)','carpeta', NULL,
     '1sr6mUNyDAPJCAtqlao9wyqWew8NviA3n',
     'https://drive.google.com/drive/folders/1sr6mUNyDAPJCAtqlao9wyqWew8NviA3n',
     NULL, 'catalogado',
     '{"nota":"Carpeta Drive; cargar shapefiles a coberturas_vegetales y estadísticas a tabla"}'::jsonb),
    ('nube_puntos','Nube de puntos Clasificada','LAS/LAZ', NULL,
     '1WWAuRLM6jSNBR8N4zHRdUI51wiFjkYwl',
     'https://drive.google.com/drive/folders/1WWAuRLM6jSNBR8N4zHRdUI51wiFjkYwl',
     NULL, 'catalogado',
     '{"nota":"Se almacena fuera de la BD; referenciada aquí (spec §4)"}'::jsonb),
    ('punto_control','Punto de control GPS (PC Luruaco.csv)','CSV', NULL,
     '1jZSOGYJoSMjO3Sc8XhLFb0I9cQmb3lyl',
     'https://drive.google.com/file/d/1jZSOGYJoSMjO3Sc8XhLFb0I9cQmb3lyl/view',
     9377, 'importado',
     '{"importado_como":"puntos_monitoreo GPS1","wgs84":"-75.170943, 10.606029"}'::jsonb)
) AS v(tipo,nombre,formato,tamano_bytes,drive_id,drive_url,srid_origen,estado,metadatos)
WHERE NOT EXISTS (
    SELECT 1 FROM eco_restauracion.insumos_dron i WHERE i.drive_id = v.drive_id
);

SELECT 'Migración 05 (modelo spec completo + catálogo insumos) aplicada' AS mensaje;
