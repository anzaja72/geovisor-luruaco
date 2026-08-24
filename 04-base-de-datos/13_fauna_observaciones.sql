-- ============================================================================
-- 13 · Registros de observación de fauna (formulario de Monitoreo de Fauna)
-- Un registro = un avistamiento, con los campos definidos por el equipo de campo.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.fauna_observaciones (
    id                BIGSERIAL PRIMARY KEY,
    nombre_comun      TEXT,
    nombre_cientifico TEXT,
    cobertura_vegetal TEXT,
    n_individuos      INTEGER,
    lugar_percha      TEXT,
    habito            TEXT,
    comportamiento    TEXT,
    fecha             DATE,
    hora              TEXT,
    observacion       TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fauna_obs_fecha ON eco_restauracion.fauna_observaciones (fecha);

SELECT 'Migración 13 (fauna_observaciones) aplicada' AS mensaje;
