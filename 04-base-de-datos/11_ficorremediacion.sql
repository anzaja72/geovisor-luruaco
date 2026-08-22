-- ============================================================================
-- 11 · Ficorremediación — puntos georreferenciados, calidad de agua/sedimentos
-- y biota (Variables Calidad de aguas.xlsx, Variables Calidad de sedimentos.xlsx).
-- Estructura lista para poblarse; sin resultados hasta que se carguen las
-- campañas de muestreo/laboratorio.
-- ============================================================================
SET search_path TO eco_restauracion, public;

-- ---------------------------------------------------------------------------
-- 5 puntos georreferenciados de ficorremediación (tipo_monitoreo='ficorremediacion').
-- Sin polígono asociado (no pertenecen a un predio de restauración).
-- ---------------------------------------------------------------------------
INSERT INTO eco_restauracion.puntos_monitoreo
    (codigo_punto, nombre_punto, tipo_monitoreo, metodo_muestreo, estado_punto, longitud, latitud, geom)
SELECT v.codigo, v.nombre, 'ficorremediacion', 'inoculacion', 'activo', v.lon, v.lat,
       ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326)
FROM (VALUES
    ('FICO-1', 'Punto 1', -75.148814, 10.605410),
    ('FICO-2', 'Punto 2', -75.153383, 10.615296),
    ('FICO-3', 'Punto 3', -75.163980, 10.613388),
    ('FICO-4', 'Punto 4', -75.160903, 10.599840),
    ('FICO-5', 'Punto 5', -75.157150, 10.607800)
) AS v(codigo, nombre, lon, lat)
WHERE NOT EXISTS (
    SELECT 1 FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto = v.codigo
);

-- ---------------------------------------------------------------------------
-- Calidad de agua: una fila por variable medida en un punto/fecha.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.ficor_calidad_agua (
    id         BIGSERIAL PRIMARY KEY,
    punto_id   BIGINT REFERENCES eco_restauracion.puntos_monitoreo(id) ON DELETE SET NULL,
    fecha      DATE,
    variable   TEXT NOT NULL,          -- 'pH', 'Oxígeno Disuelto', 'DBO5'…
    valor      NUMERIC(14,4),
    unidad     TEXT,                   -- 'mg/L', 'NMP/100 mL', 'ºC'…
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ficor_agua_punto_fecha ON eco_restauracion.ficor_calidad_agua (punto_id, fecha);

-- ---------------------------------------------------------------------------
-- Calidad de sedimentos: metales pesados y plaguicidas por punto/fecha.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.ficor_calidad_sedimentos (
    id         BIGSERIAL PRIMARY KEY,
    punto_id   BIGINT REFERENCES eco_restauracion.puntos_monitoreo(id) ON DELETE SET NULL,
    fecha      DATE,
    categoria  TEXT NOT NULL CHECK (categoria IN ('metal_pesado','plaguicida')),
    variable   TEXT NOT NULL,          -- 'Hg', 'Pb', 'Clorpirifos'…
    valor      NUMERIC(14,4),
    unidad     TEXT DEFAULT 'mg/kg',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ficor_sed_punto_fecha ON eco_restauracion.ficor_calidad_sedimentos (punto_id, fecha);

-- ---------------------------------------------------------------------------
-- Biota asociada al monitoreo de ficorremediación (tarjetas bajo el mapa).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.ficor_biota (
    id           BIGSERIAL PRIMARY KEY,
    punto_id     BIGINT REFERENCES eco_restauracion.puntos_monitoreo(id) ON DELETE SET NULL,
    fecha        DATE,
    grupo        TEXT NOT NULL CHECK (grupo IN (
                     'fitoplancton','zooplancton','ictioplancton',
                     'macroinvertebrados_bentonicos','perifiton','ictiofauna')),
    abundancia   INTEGER,
    riqueza      INTEGER,
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ficor_biota_punto_fecha ON eco_restauracion.ficor_biota (punto_id, fecha);

SELECT 'Migración 11 (ficorremediacion) aplicada' AS mensaje;
