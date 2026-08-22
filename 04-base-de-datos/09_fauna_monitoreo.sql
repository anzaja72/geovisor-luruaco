-- ============================================================================
-- 09 · Monitoreo de Fauna — abundancia/riqueza por grupo, puntos de muestreo
-- y curvas de diversidad verdadera (Q0, Q1, Q2 — Hill numbers / iNEXT).
-- Estructura lista para poblarse; sin datos reales hasta que se suba el
-- muestreo de campo (grupos: aves, anfibios, mamíferos, reptiles).
-- ============================================================================
SET search_path TO eco_restauracion, public;

-- ---------------------------------------------------------------------------
-- Resumen de abundancia y riqueza por grupo taxonómico y fecha de monitoreo.
-- Alimenta las tarjetas KPI y la tabla "Resumen de Abundancias" del front.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.fauna_grupos_resumen (
    id          BIGSERIAL PRIMARY KEY,
    fecha       TEXT NOT NULL,                 -- 'Línea base', 'Monitoreo 1'…
    grupo       TEXT NOT NULL CHECK (grupo IN ('aves','anfibios','mamiferos','reptiles')),
    abundancia  INTEGER,                       -- número de individuos reportados
    riqueza     INTEGER,                       -- número de especies reportadas
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (fecha, grupo)
);

-- Vista "Total de especies" (tarjeta agregada) por fecha.
CREATE OR REPLACE VIEW eco_restauracion.vw_fauna_total AS
SELECT fecha,
       sum(abundancia) AS abundancia_total,
       sum(riqueza)    AS riqueza_total
FROM eco_restauracion.fauna_grupos_resumen
GROUP BY fecha;

-- ---------------------------------------------------------------------------
-- Curvas de diversidad verdadera (rarefacción/extrapolación) por orden q.
-- Un registro = un punto de la curva (eje x = n° de individuos).
-- tipo_segmento distingue el tramo observado (rarefacción, línea continua)
-- del proyectado (extrapolación, línea discontinua); n_observado marca el
-- punto donde termina la muestra real (el marcador circular de la gráfica).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eco_restauracion.fauna_diversidad_curvas (
    id                BIGSERIAL PRIMARY KEY,
    fecha             TEXT NOT NULL,
    grupo             TEXT NOT NULL CHECK (grupo IN ('aves','anfibios','mamiferos','reptiles')),
    orden_q           SMALLINT NOT NULL CHECK (orden_q IN (0,1,2)),
    n_individuos      NUMERIC(10,2) NOT NULL,   -- eje x
    riqueza_estimada  NUMERIC(10,3) NOT NULL,   -- eje y (curva central)
    riqueza_ic_inf    NUMERIC(10,3),            -- límite inferior IC 95%
    riqueza_ic_sup    NUMERIC(10,3),            -- límite superior IC 95%
    tipo_segmento     TEXT NOT NULL CHECK (tipo_segmento IN ('rarefaccion','extrapolacion')),
    n_observado       NUMERIC(10,2),            -- tamaño de muestra real (marcador)
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fauna_curvas_fecha_grupo
    ON eco_restauracion.fauna_diversidad_curvas (fecha, grupo, orden_q);

-- ---------------------------------------------------------------------------
-- Puntos de monitoreo de fauna: reutiliza la tabla genérica puntos_monitoreo
-- (tipo_monitoreo = 'fauna'); metodo_muestreo distingue el símbolo en el mapa:
--   'punto_muestreo'  -> cuadrado  (puntos muestreados / transectos)
--   'camara_trampa'   -> triángulo (estaciones de cámara trampa)
--   'canto_aves'      -> círculo   (puntos de conteo por canto)
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN eco_restauracion.puntos_monitoreo.metodo_muestreo IS
    'Para tipo_monitoreo=fauna: punto_muestreo | camara_trampa | canto_aves (define el símbolo en el geovisor).';

SELECT 'Migración 09 (fauna_monitoreo) aplicada' AS mensaje;
