-- ============================================================
-- CARGA DE LOTE PLANTA BIOAUMENTACIÓN - CIÉNAGA DE LURUACO
-- Fecha: 2026-05-29
-- Fuente: KML de Google Earth
-- ============================================================

-- 1. Crear tabla para lotes de bioaumentación (si no existe)
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
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- 2. Insertar el polígono del lote (5 puntos en orden)
-- Orden de puntos: 1 → 2 → 3 → 4 → 5 → 1 (cerrar polígono)
INSERT INTO eco_restauracion.lotes_bioaumentacion (
    nombre,
    codigo_lote,
    descripcion,
    tipo_intervencion,
    estado,
    geom,
    puntos_referencia,
    metadata
) VALUES (
    'Lote Planta Bioaumentación - Ciénaga de Luruaco',
    'LUR-BIO-001',
    'Lote destinado a la planta de bioaumentación para restauración ecológica de la Ciénaga de Luruaco. Incluye área de instalaciones, tanques de procesamiento y zona de distribución.',
    'bioaumentacion',
    'activo',
    ST_GeomFromText(
        'POLYGON((
            -75.14881428024212 10.60541028503447,
            -75.15338331409582 10.61529649011891,
            -75.16398014817067 10.61338799024021,
            -75.16090274977961 10.59983979204723,
            -75.15715750829533 10.60780006733479,
            -75.14881428024212 10.60541028503447
        ))',
        4326
    ),
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

-- 3. Calcular área y perímetro
UPDATE eco_restauracion.lotes_bioaumentacion
SET 
    area_metros_cuadrados = ST_Area(geom::geography),
    area_hectareas = ST_Area(geom::geography) / 10000,
    perimetro_metros = ST_Perimeter(geom::geography)
WHERE codigo_lote = 'LUR-BIO-001';

-- 4. Verificar resultado
SELECT 
    nombre,
    codigo_lote,
    area_hectareas,
    area_metros_cuadrados,
    perimetro_metros,
    tipo_intervencion,
    estado,
    ST_AsGeoJSON(geom) as geojson
FROM eco_restauracion.lotes_bioaumentacion
WHERE codigo_lote = 'LUR-BIO-001';
