-- ============================================
-- 01_init_schema.sql
-- Esquema de Base de Datos Espacial para
-- Proyectos de Restauración Ecológica
-- Basado en el modelo NENA NG911 GIS Data Model
-- SRID: 4326 (WGS84) para compatibilidad global
-- ============================================

-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Habilitar extensión PostGIS Topology
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Crear esquema para organizar las tablas
CREATE SCHEMA IF NOT EXISTS eco_restauracion;

-- ============================================
-- TABLA: poligonos_restauracion
-- Descripción: Áreas poligonales designadas para
-- proyectos de restauración ecológica
-- ============================================

CREATE TABLE eco_restauracion.poligonos_restauracion (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificadores y metadatos
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    codigo_proyecto VARCHAR(50) UNIQUE,
    
    -- Clasificación del área
    tipo_ecosistema VARCHAR(100) NOT NULL,  -- bosque, humedal, pradera, etc.
    estado_restauracion VARCHAR(50) NOT NULL DEFAULT 'planificado',  -- planificado, en_progreso, completado, monitoreo
    
    -- Fechas importantes
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_restauracion DATE,
    fecha_estimada_fin DATE,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Responsables
    organizacion_responsable VARCHAR(255),
    responsable_tecnico VARCHAR(255),
    contacto_email VARCHAR(255),
    
    -- Atributos espaciales y físicos
    area_hectareas DECIMAL(12, 4),
    altitud_minima DECIMAL(8, 2),
    altitud_maxima DECIMAL(8, 2),
    
    -- Campos de auditoría (patrón NENA)
    fecha_actualizacion_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_actualizacion VARCHAR(100),
    
    -- Identificador único global (NGUID - NENA Global Unique ID pattern)
    guid UUID DEFAULT gen_random_uuid(),
    
    -- Geometría: Polígono con SRID 4326 (WGS84)
    geom GEOMETRY(POLYGON, 4326),
    
    -- Restricciones
    CONSTRAINT chk_estado_restauracion CHECK (
        estado_restauracion IN ('planificado', 'en_progreso', 'completado', 'monitoreo', 'abandonado')
    ),
    CONSTRAINT chk_tipo_ecosistema CHECK (
        tipo_ecosistema IN (
            'bosque_nativo', 'bosque_secundario', 'humedal', 'pradera', 
            'matorral', 'manglar', 'ecosistema_acuatico', 'suelo_degradado',
            'area_protegida', 'corredor_biologico', 'otro'
        )
    )
);

-- Comentarios en la tabla (documentación inline)
COMMENT ON TABLE eco_restauracion.poligonos_restauracion IS 
    'Áreas poligonales para proyectos de restauración ecológica. Basado en el modelo NENA NG911 GIS.';
COMMENT ON COLUMN eco_restauracion.poligonos_restauracion.geom IS 
    'Geometría poligonal en coordenadas geográficas WGS84 (SRID 4326)';
COMMENT ON COLUMN eco_restauracion.poligonos_restauracion.guid IS 
    'Identificador único global compatible con estándar NENA NGUID';

-- ============================================
-- TABLA: puntos_monitoreo
-- Descripción: Puntos de muestreo y monitoreo
-- dentro de las áreas de restauración
-- ============================================

CREATE TABLE eco_restauracion.puntos_monitoreo (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relación con el polígono de restauración
    poligono_id BIGINT NOT NULL,
    
    -- Identificadores
    codigo_punto VARCHAR(50) UNIQUE NOT NULL,
    nombre_punto VARCHAR(255),
    descripcion TEXT,
    
    -- Tipo de punto de monitoreo
    tipo_monitoreo VARCHAR(100) NOT NULL,  -- vegetacion, fauna, suelo, agua, climatico
    metodo_muestreo VARCHAR(100),  -- cuadrante, transecto, punto_fijo, etc.
    
    -- Fechas
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_primera_medicion DATE,
    fecha_ultima_medicion DATE,
    frecuencia_monitoreo VARCHAR(50),  -- mensual, trimestral, semestral, anual
    
    -- Coordenadas explícitas (patrón NENA)
    longitud DECIMAL(11, 7) NOT NULL,
    latitud DECIMAL(10, 7) NOT NULL,
    elevacion DECIMAL(9, 3),
    
    -- Estado del punto
    estado_punto VARCHAR(50) DEFAULT 'activo',  -- activo, inactivo, abandonado
    
    -- Responsables
    tecnico_responsable VARCHAR(255),
    equipo_monitoreo VARCHAR(255),
    
    -- Campos de auditoría (patrón NENA)
    fecha_actualizacion_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_actualizacion VARCHAR(100),
    
    -- Identificador único global
    guid UUID DEFAULT gen_random_uuid(),
    
    -- Geometría: Punto con SRID 4326 (WGS84)
    geom GEOMETRY(POINT, 4326),
    
    -- Restricciones
    CONSTRAINT fk_poligono FOREIGN KEY (poligono_id) 
        REFERENCES eco_restauracion.poligonos_restauracion(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_tipo_monitoreo CHECK (
        tipo_monitoreo IN (
            'vegetacion', 'fauna', 'suelo', 'agua', 'climatico', 
            'biodiversidad', 'calidad_aire', 'hidrologico', 'otro'
        )
    ),
    CONSTRAINT chk_estado_punto CHECK (
        estado_punto IN ('activo', 'inactivo', 'abandonado', 'completado')
    ),
    CONSTRAINT chk_frecuencia CHECK (
        frecuencia_monitoreo IN ('semanal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'unica')
    )
);

-- Comentarios
COMMENT ON TABLE eco_restauracion.puntos_monitoreo IS 
    'Puntos de muestreo y monitoreo dentro de áreas de restauración ecológica.';
COMMENT ON COLUMN eco_restauracion.puntos_monitoreo.geom IS 
    'Geometría puntual en coordenadas geográficas WGS84 (SRID 4326)';

-- ============================================
-- ÍNDICES ESPACIALES GIST
-- ============================================

-- Índice espacial GIST para poligonos_restauracion
CREATE INDEX idx_poligonos_geom 
    ON eco_restauracion.poligonos_restauracion 
    USING GIST (geom);

-- Índice espacial GIST para puntos_monitoreo
CREATE INDEX idx_puntos_geom 
    ON eco_restauracion.puntos_monitoreo 
    USING GIST (geom);

-- ============================================
-- ÍNDICES ADICIONALES PARA BÚSQUEDAS FRECUENTES
-- ============================================

-- Índices para poligonos_restauracion
CREATE INDEX idx_poligonos_estado 
    ON eco_restauracion.poligonos_restauracion(estado_restauracion);
CREATE INDEX idx_poligonos_tipo_ecosistema 
    ON eco_restauracion.poligonos_restauracion(tipo_ecosistema);
CREATE INDEX idx_poligonos_organizacion 
    ON eco_restauracion.poligonos_restauracion(organizacion_responsable);
CREATE INDEX idx_poligonos_codigo 
    ON eco_restauracion.poligonos_restauracion(codigo_proyecto);
CREATE INDEX idx_poligonos_fecha 
    ON eco_restauracion.poligonos_restauracion(fecha_inicio_restauracion);

-- Índices para puntos_monitoreo
CREATE INDEX idx_puntos_poligono_id 
    ON eco_restauracion.puntos_monitoreo(poligono_id);
CREATE INDEX idx_puntos_tipo 
    ON eco_restauracion.puntos_monitoreo(tipo_monitoreo);
CREATE INDEX idx_puntos_estado 
    ON eco_restauracion.puntos_monitoreo(estado_punto);
CREATE INDEX idx_puntos_codigo 
    ON eco_restauracion.puntos_monitoreo(codigo_punto);
CREATE INDEX idx_puntos_coordenadas 
    ON eco_restauracion.puntos_monitoreo(latitud, longitud);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de resumen de polígonos con conteo de puntos de monitoreo
CREATE VIEW eco_restauracion.v_resumen_poligonos AS
SELECT 
    p.id,
    p.nombre,
    p.codigo_proyecto,
    p.tipo_ecosistema,
    p.estado_restauracion,
    p.area_hectareas,
    p.organizacion_responsable,
    COUNT(pm.id) AS total_puntos_monitoreo,
    ST_AsGeoJSON(p.geom) AS geojson
FROM eco_restauracion.poligonos_restauracion p
LEFT JOIN eco_restauracion.puntos_monitoreo pm ON p.id = pm.poligono_id
GROUP BY p.id, p.nombre, p.codigo_proyecto, p.tipo_ecosistema, 
         p.estado_restauracion, p.area_hectareas, p.organizacion_responsable, p.geom;

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función para actualizar automáticamente fecha_actualizacion_registro
CREATE OR REPLACE FUNCTION eco_restauracion.actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion_registro = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para poligonos_restauracion
CREATE TRIGGER trg_poligonos_actualizacion
    BEFORE UPDATE ON eco_restauracion.poligonos_restauracion
    FOR EACH ROW
    EXECUTE FUNCTION eco_restauracion.actualizar_fecha_modificacion();

-- Trigger para puntos_monitoreo
CREATE TRIGGER trg_puntos_actualizacion
    BEFORE UPDATE ON eco_restauracion.puntos_monitoreo
    FOR EACH ROW
    EXECUTE FUNCTION eco_restauracion.actualizar_fecha_modificacion();

-- ============================================
-- DATOS DE EJEMPLO (Opcional - comentado)
-- ============================================
/*
-- Ejemplo de inserción de polígono
INSERT INTO eco_restauracion.poligonos_restauracion (
    nombre, descripcion, codigo_proyecto, tipo_ecosistema,
    estado_restauracion, area_hectareas, organizacion_responsable,
    geom
) VALUES (
    'Reserva Bosque Nativo',
    'Área de restauración de bosque nativo en la cuenca del río',
    'RES-2024-001',
    'bosque_nativo',
    'en_progreso',
    125.50,
    'Fundación Verde',
    ST_SetSRID(ST_MakePolygon(ST_GeomFromText(
        'LINESTRING(-74.05 4.65, -74.03 4.65, -74.03 4.67, -74.05 4.67, -74.05 4.65)'
    )), 4326)
);

-- Ejemplo de inserción de punto de monitoreo
INSERT INTO eco_restauracion.puntos_monitoreo (
    poligono_id, codigo_punto, nombre_punto, tipo_monitoreo,
    longitud, latitud, geom
) VALUES (
    1,
    'PM-001',
    'Estación Central',
    'vegetacion',
    -74.04,
    4.66,
    ST_SetSRID(ST_MakePoint(-74.04, 4.66), 4326)
);
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 'Esquema eco_restauracion creado exitosamente' AS mensaje;
SELECT 
    table_name,
    'Creada' AS estado
FROM information_schema.tables 
WHERE table_schema = 'eco_restauracion'
ORDER BY table_name;