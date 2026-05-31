-- ============================================================
-- SCHEMA COMPLETO - GEODATABASE LURUACO
-- Restauración Ecológica - Ciénaga de Luruaco
-- Fecha: 2026-05-29
-- Responsable: Ángel Zambrano Jaraba
-- ============================================================

-- Crear extensión PostGIS (si no existe)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Crear esquema
CREATE SCHEMA IF NOT EXISTS eco_restauracion;

-- ============================================================
-- TABLA: poligonos_restauracion
-- ============================================================
CREATE TABLE IF NOT EXISTS eco_restauracion.poligonos_restauracion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    codigo_proyecto VARCHAR(50) UNIQUE,
    tipo_ecosistema VARCHAR(100) NOT NULL,
    estado_restauracion VARCHAR(50) NOT NULL DEFAULT 'planificado',
    area_hectareas DECIMAL(12,4),
    geom GEOMETRY(POLYGON, 4326),
    organizacion_responsable VARCHAR(255),
    responsable_tecnico VARCHAR(255),
    contacto_email VARCHAR(255),
    fecha_inicio_restauracion DATE,
    fecha_estimada_fin DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_poligonos_geom 
ON eco_restauracion.poligonos_restauracion USING GIST(geom);

-- ============================================================
-- TABLA: lotes_bioaumentacion
-- ============================================================
CREATE TABLE IF NOT EXISTS eco_restauracion.lotes_bioaumentacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo_lote VARCHAR(50) UNIQUE,
    descripcion TEXT,
    area_hectareas DECIMAL(12,4),
    area_metros_cuadrados DECIMAL(12,2),
    perimetro_metros DECIMAL(12,2),
    tipo_intervencion VARCHAR(100) DEFAULT 'bioaumentacion',
    estado VARCHAR(50) DEFAULT 'activo',
    geom GEOMETRY(POLYGON, 4326),
    puntos_referencia JSONB,
    metadata JSONB,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_lotes_geom 
ON eco_restauracion.lotes_bioaumentacion USING GIST(geom);

-- ============================================================
-- TABLA: puntos_monitoreo
-- ============================================================
CREATE TABLE IF NOT EXISTS eco_restauracion.puntos_monitoreo (
    id BIGSERIAL PRIMARY KEY,
    poligono_id BIGINT REFERENCES eco_restauracion.poligonos_restauracion(id),
    codigo_punto VARCHAR(50) NOT NULL,
    nombre_punto VARCHAR(255),
    descripcion TEXT,
    tipo_monitoreo VARCHAR(100) NOT NULL,
    metodo_muestreo VARCHAR(100),
    estado_punto VARCHAR(50) DEFAULT 'activo',
    longitud DECIMAL(10,8) NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    elevacion DECIMAL(10,2),
    geom GEOMETRY(POINT, 4326),
    tecnico_responsable VARCHAR(255),
    equipo_monitoreo VARCHAR(255),
    fecha_monitoreo DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_puntos_geom 
ON eco_restauracion.puntos_monitoreo USING GIST(geom);

-- ============================================================
-- DATOS: Lote Planta Bioaumentación
-- ============================================================
INSERT INTO eco_restauracion.lotes_bioaumentacion (
    nombre, codigo_lote, descripcion, tipo_intervencion, estado,
    geom, puntos_referencia, metadata
) VALUES (
    'Lote Planta Bioaumentación - Ciénaga de Luruaco',
    'LUR-BIO-001',
    'Lote destinado a la planta de bioaumentación para restauración ecológica de la Ciénaga de Luruaco. Incluye área de instalaciones, tanques de procesamiento y zona de distribución.',
    'bioaumentacion',
    'activo',
    ST_GeomFromText('POLYGON((
        -75.14881428024212 10.60541028503447,
        -75.15338331409582 10.61529649011891,
        -75.16398014817067 10.61338799024021,
        -75.16090274977961 10.59983979204723,
        -75.15715750829533 10.60780006733479,
        -75.14881428024212 10.60541028503447
    ))', 4326),
    '[
        {"nombre": "Punto 1", "lon": -75.148814, "lat": 10.605410, "alt": 23.89},
        {"nombre": "Punto 2", "lon": -75.153383, "lat": 10.615296, "alt": 23.89},
        {"nombre": "Punto 3", "lon": -75.163980, "lat": 10.613388, "alt": 23.92},
        {"nombre": "Punto 4", "lon": -75.160903, "lat": 10.599840, "alt": 23.97},
        {"nombre": "Punto 5", "lon": -75.157158, "lat": 10.607800, "alt": 26.34}
    ]'::jsonb,
    '{
        "fuente": "Google Earth - KML",
        "fecha_extraccion": "2026-05-29",
        "responsable": "Angel Zambrano",
        "proyecto": "Restauracion Ecologica - Cienaga de Luruaco",
        "municipio": "Luruaco",
        "departamento": "Atlantico",
        "pais": "Colombia"
    }'::jsonb
)
ON CONFLICT (codigo_lote) DO UPDATE SET
    geom = EXCLUDED.geom,
    puntos_referencia = EXCLUDED.puntos_referencia,
    metadata = EXCLUDED.metadata,
    fecha_actualizacion = NOW();

-- Calcular área y perímetro
UPDATE eco_restauracion.lotes_bioaumentacion
SET 
    area_metros_cuadrados = ST_Area(geom::geography),
    area_hectareas = ST_Area(geom::geography) / 10000,
    perimetro_metros = ST_Perimeter(geom::geography)
WHERE codigo_lote = 'LUR-BIO-001';

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista de resumen de lotes
CREATE OR REPLACE VIEW eco_restauracion.vw_lotes_resumen AS
SELECT 
    id,
    nombre,
    codigo_lote,
    area_hectareas,
    area_metros_cuadrados,
    perimetro_metros,
    tipo_intervencion,
    estado,
    fecha_creacion
FROM eco_restauracion.lotes_bioaumentacion;

-- Vista de centroides
CREATE OR REPLACE VIEW eco_restauracion.vw_lotes_centroides AS
SELECT 
    id,
    nombre,
    codigo_lote,
    ST_Centroid(geom) as centroide,
    ST_X(ST_Centroid(geom)) as longitud_centroide,
    ST_Y(ST_Centroid(geom)) as latitud_centroide
FROM eco_restauracion.lotes_bioaumentacion;

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para calcular área en hectáreas
CREATE OR REPLACE FUNCTION eco_restauracion.calcular_area_hectareas(geom GEOMETRY)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Area(geom::geography) / 10000;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un punto está dentro de un lote
CREATE OR REPLACE FUNCTION eco_restauracion.punto_dentro_lote(
    p_longitud DECIMAL, 
    p_latitud DECIMAL, 
    p_codigo_lote VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_geom GEOMETRY;
    v_punto GEOMETRY;
BEGIN
    SELECT geom INTO v_geom 
    FROM eco_restauracion.lotes_bioaumentacion 
    WHERE codigo_lote = p_codigo_lote;
    
    v_punto := ST_SetSRID(ST_MakePoint(p_longitud, p_latitud), 4326);
    
    RETURN ST_Contains(v_geom, v_punto);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERMISOS
-- ============================================================

GRANT USAGE ON SCHEMA eco_restauracion TO eco_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA eco_restauracion TO eco_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA eco_restauracion TO eco_admin;
