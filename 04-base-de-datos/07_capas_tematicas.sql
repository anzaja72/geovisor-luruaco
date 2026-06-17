-- ============================================================
-- MIGRACIÓN 07: capas temáticas de restauración (componentes interventoría)
-- Estratos de vegetación, malezas, técnicas, validación (meta/cumplimiento),
-- homologación temática de coberturas. Datos de MUESTRA marcados (origen='muestra').
-- Fecha: 2026-06-17
-- ============================================================

SET search_path TO eco_restauracion, public;

-- ------------------------------------------------------------
-- 1. ESTRATOS DE VEGETACIÓN (herbáceo / arbustivo / arbóreo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.estratos_vegetacion (
    id            BIGSERIAL PRIMARY KEY,
    estrato       VARCHAR(20) NOT NULL CHECK (estrato IN ('herbaceo','arbustivo','arboreo')),
    cobertura_pct DECIMAL(5,2),
    altura_m      DECIMAL(6,2),
    fecha         DATE,
    periodo       VARCHAR(20),
    origen        VARCHAR(30) DEFAULT 'muestra',
    descripcion   TEXT,
    geom          GEOMETRY(MultiPolygon, 4326),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estratos_geom ON eco_restauracion.estratos_vegetacion USING GIST(geom);

-- ------------------------------------------------------------
-- 2. MALEZAS / ESPECIES INVASORAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.malezas (
    id            BIGSERIAL PRIMARY KEY,
    especie       VARCHAR(150) NOT NULL,
    cobertura_pct DECIMAL(5,2),
    estado        VARCHAR(30) DEFAULT 'monitoreo'
                  CHECK (estado IN ('requiere_control','en_control','controlada','monitoreo')),
    fecha         DATE,
    origen        VARCHAR(30) DEFAULT 'muestra',
    observaciones TEXT,
    geom          GEOMETRY(Geometry, 4326),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_malezas_geom ON eco_restauracion.malezas USING GIST(geom);

-- ------------------------------------------------------------
-- 3. TÉCNICAS DE RESTAURACIÓN
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.tecnicas_restauracion (
    id             BIGSERIAL PRIMARY KEY,
    tecnica        VARCHAR(40) NOT NULL CHECK (tecnica IN
                   ('revegetalizacion','bioaumentacion','siembra','control_malezas',
                    'recuperacion_suelo','restauracion_pasiva')),
    descripcion    TEXT,
    fecha          DATE,
    area_hectareas DECIMAL(12,4),
    responsable    VARCHAR(255),
    origen         VARCHAR(30) DEFAULT 'muestra',
    geom           GEOMETRY(MultiPolygon, 4326),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tecnicas_geom ON eco_restauracion.tecnicas_restauracion USING GIST(geom);

-- ------------------------------------------------------------
-- 4. VALIDACIÓN: meta y % de cumplimiento en monitoreos
-- ------------------------------------------------------------
ALTER TABLE eco_restauracion.monitoreos
    ADD COLUMN IF NOT EXISTS meta DECIMAL(14,4),
    ADD COLUMN IF NOT EXISTS es_validacion BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------
-- 5. Homologación temática (provisional) de coberturas Corine
-- ------------------------------------------------------------
ALTER TABLE eco_restauracion.coberturas_vegetales
    ADD COLUMN IF NOT EXISTS clase_tematica VARCHAR(60),
    ADD COLUMN IF NOT EXISTS estado VARCHAR(40);

UPDATE eco_restauracion.coberturas_vegetales SET
    clase_tematica = CASE codigo_corine
        WHEN 'clase_1'  THEN 'Vegetación densa'
        WHEN 'clase_12' THEN 'Cuerpo de agua'
        WHEN 'clase_10' THEN 'Vegetación abierta / pastos'
        WHEN 'clase_11' THEN 'Suelo desnudo'
        WHEN 'clase_7'  THEN 'Vegetación arbustiva'
        WHEN 'clase_2'  THEN 'Vegetación arbustiva'
        ELSE 'Otras coberturas'
    END,
    estado = 'línea base 2026'
WHERE clase_tematica IS NULL;

-- ------------------------------------------------------------
-- 6. DATOS DE MUESTRA (marcados origen='muestra') alrededor del lote
--    Lote Luruaco ~ (-75.15, 10.607)
-- ------------------------------------------------------------
DO $$
DECLARE cx DOUBLE PRECISION := -75.150; cy DOUBLE PRECISION := 10.607;
BEGIN
IF NOT EXISTS (SELECT 1 FROM eco_restauracion.estratos_vegetacion) THEN
  INSERT INTO eco_restauracion.estratos_vegetacion (estrato, cobertura_pct, altura_m, fecha, periodo, descripcion, geom) VALUES
   ('arboreo', 35.0, 6.5, '2026-05-20','2026-1','Dato de muestra — estrato arbóreo',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx-0.008, cy+0.004),4326), 0.004))),
   ('arbustivo', 45.0, 1.8, '2026-05-20','2026-1','Dato de muestra — estrato arbustivo',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx+0.004, cy+0.002),4326), 0.005))),
   ('herbaceo', 20.0, 0.4, '2026-05-20','2026-1','Dato de muestra — estrato herbáceo',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx+0.002, cy-0.006),4326), 0.0045)));
END IF;

IF NOT EXISTS (SELECT 1 FROM eco_restauracion.malezas) THEN
  INSERT INTO eco_restauracion.malezas (especie, cobertura_pct, estado, fecha, observaciones, geom) VALUES
   ('Typha domingensis (enea)', 35.0, 'requiere_control', '2026-05-18','Dato de muestra — invasora en borde de ciénaga',
     ST_SetSRID(ST_MakePoint(cx-0.012, cy-0.003),4326)),
   ('Eichhornia crassipes (buchón)', 22.0, 'en_control', '2026-05-18','Dato de muestra — control mecánico',
     ST_SetSRID(ST_MakePoint(cx+0.009, cy-0.001),4326));
END IF;

IF NOT EXISTS (SELECT 1 FROM eco_restauracion.tecnicas_restauracion) THEN
  INSERT INTO eco_restauracion.tecnicas_restauracion (tecnica, descripcion, fecha, area_hectareas, responsable, geom) VALUES
   ('revegetalizacion','Dato de muestra — siembra de nativas','2026-04-10', 1.8,'Equipo técnico',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx-0.006, cy+0.001),4326), 0.0035))),
   ('bioaumentacion','Dato de muestra — aplicación de microorganismos','2026-04-12', 1.5,'Equipo técnico',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx+0.006, cy+0.004),4326), 0.003))),
   ('control_malezas','Dato de muestra — control de invasoras','2026-04-15', 0.9,'Equipo técnico',
     ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(cx-0.001, cy-0.005),4326), 0.0025)));
END IF;

-- Estaciones de validación + monitoreos con meta/cumplimiento (muestra)
IF NOT EXISTS (SELECT 1 FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto='VAL-001') THEN
  INSERT INTO eco_restauracion.puntos_monitoreo
     (codigo_punto, nombre_punto, tipo_monitoreo, estado_punto, longitud, latitud, geom, tecnico_responsable)
  VALUES
   ('VAL-001','Sitio de validación 1','vegetacion','activo', cx-0.005, cy+0.003,
     ST_SetSRID(ST_MakePoint(cx-0.005, cy+0.003),4326),'Equipo técnico'),
   ('VAL-002','Sitio de validación 2','agua','activo', cx+0.007, cy-0.004,
     ST_SetSRID(ST_MakePoint(cx+0.007, cy-0.004),4326),'Equipo técnico');

  INSERT INTO eco_restauracion.monitoreos (estacion_id, fecha, indicador, valor, unidad, meta, es_validacion, responsable, observaciones)
  SELECT id, '2026-05-25','cobertura_vegetal', 72.0, '%', 70.0, TRUE, 'Equipo técnico','Dato de muestra'
  FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto='VAL-001';
  INSERT INTO eco_restauracion.monitoreos (estacion_id, fecha, indicador, valor, unidad, meta, es_validacion, responsable, observaciones)
  SELECT id, '2026-05-25','oxigeno_disuelto', 6.4, 'mg/L', 5.0, TRUE, 'Equipo técnico','Dato de muestra'
  FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto='VAL-002';
END IF;
END$$;

SELECT 'Migración 07 (capas temáticas + muestra) aplicada' AS mensaje;
