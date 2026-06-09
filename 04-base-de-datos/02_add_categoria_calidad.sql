-- ============================================================
-- MIGRACIÓN 02: categoria_calidad + periodo
-- Añade la dimensión de "calidad" (escala tipo ICAM) y el
-- periodo de reporte para alimentar el visor departamental.
-- Idempotente: se puede ejecutar varias veces sin error.
-- Fecha: 2026-05-31
-- ============================================================

SET search_path TO eco_restauracion, public;

-- ------------------------------------------------------------
-- 1. Nuevas columnas en poligonos_restauracion
-- ------------------------------------------------------------
ALTER TABLE eco_restauracion.poligonos_restauracion
    ADD COLUMN IF NOT EXISTS categoria_calidad VARCHAR(20),
    ADD COLUMN IF NOT EXISTS periodo VARCHAR(20);

-- ------------------------------------------------------------
-- 2. Nuevas columnas en lotes_bioaumentacion
-- ------------------------------------------------------------
ALTER TABLE eco_restauracion.lotes_bioaumentacion
    ADD COLUMN IF NOT EXISTS categoria_calidad VARCHAR(20),
    ADD COLUMN IF NOT EXISTS periodo VARCHAR(20);

-- ------------------------------------------------------------
-- 3. Restricción de dominio para categoria_calidad (escala ICAM)
--    pesima | inadecuada | aceptable | adecuada | optima
--    Se añade solo si no existe previamente.
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_categoria_calidad_pol'
    ) THEN
        ALTER TABLE eco_restauracion.poligonos_restauracion
            ADD CONSTRAINT chk_categoria_calidad_pol CHECK (
                categoria_calidad IS NULL OR categoria_calidad IN
                ('pesima', 'inadecuada', 'aceptable', 'adecuada', 'optima')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_categoria_calidad_lote'
    ) THEN
        ALTER TABLE eco_restauracion.lotes_bioaumentacion
            ADD CONSTRAINT chk_categoria_calidad_lote CHECK (
                categoria_calidad IS NULL OR categoria_calidad IN
                ('pesima', 'inadecuada', 'aceptable', 'adecuada', 'optima')
            );
    END IF;
END$$;

-- ------------------------------------------------------------
-- 4. Índices para los filtros del visor (categoría / periodo)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_poligonos_categoria
    ON eco_restauracion.poligonos_restauracion(categoria_calidad);
CREATE INDEX IF NOT EXISTS idx_poligonos_periodo
    ON eco_restauracion.poligonos_restauracion(periodo);
CREATE INDEX IF NOT EXISTS idx_lotes_categoria
    ON eco_restauracion.lotes_bioaumentacion(categoria_calidad);
CREATE INDEX IF NOT EXISTS idx_lotes_periodo
    ON eco_restauracion.lotes_bioaumentacion(periodo);

-- ------------------------------------------------------------
-- 5. Trigger updated_at para lotes_bioaumentacion
--    (poligonos ya tiene uno en 01_init_schema.sql; los lotes no)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION eco_restauracion.set_fecha_actualizacion_lote()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lotes_actualizacion ON eco_restauracion.lotes_bioaumentacion;
CREATE TRIGGER trg_lotes_actualizacion
    BEFORE UPDATE ON eco_restauracion.lotes_bioaumentacion
    FOR EACH ROW
    EXECUTE FUNCTION eco_restauracion.set_fecha_actualizacion_lote();

-- ------------------------------------------------------------
-- 6. Semilla de datos demo (solo para filas sin categoría)
--    Permite que el visor muestre gráficas con contenido aunque
--    aún no se hayan clasificado las zonas reales.
-- ------------------------------------------------------------
UPDATE eco_restauracion.lotes_bioaumentacion
SET categoria_calidad = 'adecuada',
    periodo = COALESCE(periodo, '2024-2')
WHERE categoria_calidad IS NULL;

-- Distribución de ejemplo para polígonos sin clasificar:
-- alterna categorías para que la gráfica tenga variedad.
UPDATE eco_restauracion.poligonos_restauracion p
SET categoria_calidad = CASE (p.id % 4)
        WHEN 0 THEN 'adecuada'
        WHEN 1 THEN 'aceptable'
        WHEN 2 THEN 'inadecuada'
        ELSE 'optima'
    END,
    periodo = COALESCE(p.periodo, '2024-2')
WHERE p.categoria_calidad IS NULL;

-- ------------------------------------------------------------
-- 7. Vista de resumen por periodo (alimenta /api/resumen)
--    Une polígonos y lotes en una sola dimensión de "sitios".
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW eco_restauracion.vw_resumen_calidad AS
WITH sitios AS (
    SELECT periodo, categoria_calidad, geom
    FROM eco_restauracion.poligonos_restauracion
    UNION ALL
    SELECT periodo, categoria_calidad, geom
    FROM eco_restauracion.lotes_bioaumentacion
)
SELECT
    COALESCE(periodo, 'sin_periodo')        AS periodo,
    COUNT(*)                                AS sitios_visitados,
    COUNT(categoria_calidad)                AS sitios_reportados,
    categoria_calidad,
    COUNT(categoria_calidad)                AS cantidad
FROM sitios
GROUP BY ROLLUP (periodo, categoria_calidad);

SELECT 'Migración 02 (categoria_calidad + periodo) aplicada' AS mensaje;
