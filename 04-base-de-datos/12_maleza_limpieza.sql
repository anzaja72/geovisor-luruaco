-- ============================================================================
-- 12 · Registro de limpieza de maleza acuática (Vegetación Acuática)
-- Alimenta el KPI de hectáreas removidas por monitoreo desde el formulario.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.maleza_limpieza (
    id            BIGSERIAL PRIMARY KEY,
    fecha         TEXT NOT NULL,          -- 'Línea base','Marzo','Abril','Mayo'…
    area_ha       NUMERIC(12,3),          -- hectáreas removidas
    borde_km      NUMERIC(10,3),          -- borde de laguna intervenido (km)
    observaciones TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maleza_limpieza_fecha ON eco_restauracion.maleza_limpieza (fecha);

SELECT 'Migración 12 (maleza_limpieza) aplicada' AS mensaje;
