-- ============================================================================
-- 20 · Operador de los valores bajo el límite de detección.
--
-- Los informes de laboratorio no siempre dan un número: cuando la
-- concentración queda por debajo de lo que el método puede medir, reportan
-- «<10», «<0,01», «<1,5». Con una sola columna numérica había que elegir
-- entre guardar 10 —que afirma una concentración que nadie midió— o 0 —que
-- afirma ausencia—. Las dos mienten, y en direcciones opuestas.
--
-- `operador` guarda el signo y `valor` el límite, de modo que la pantalla
-- pueda mostrar «< 10 mg/L». NULL significa medición directa.
-- ============================================================================
SET search_path TO eco_restauracion, public;

ALTER TABLE eco_restauracion.ficor_calidad_agua
    ADD COLUMN IF NOT EXISTS operador TEXT
    CHECK (operador IS NULL OR operador IN ('<', '>'));

ALTER TABLE eco_restauracion.ficor_calidad_sedimentos
    ADD COLUMN IF NOT EXISTS operador TEXT
    CHECK (operador IS NULL OR operador IN ('<', '>'));

COMMENT ON COLUMN eco_restauracion.ficor_calidad_agua.operador IS
    'Signo del límite de detección: «<» si el laboratorio reportó menor que `valor`. NULL = medición directa.';
COMMENT ON COLUMN eco_restauracion.ficor_calidad_sedimentos.operador IS
    'Signo del límite de detección: «<» si el laboratorio reportó menor que `valor`. NULL = medición directa.';

SELECT 'Migración 20 (operador de límite de detección) aplicada' AS mensaje;
