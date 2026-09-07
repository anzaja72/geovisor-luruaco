-- ============================================================================
-- 16 · Registro público de cuentas de consulta
-- Añade la procedencia de cada cuenta, para distinguir las creadas por un
-- administrador de las que se registran desde la página de inicio.
-- ============================================================================
SET search_path TO eco_restauracion, public;

ALTER TABLE eco_restauracion.usuarios
    ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'administrador'
        CHECK (origen IN ('administrador', 'registro_publico', 'inicial'));

COMMENT ON COLUMN eco_restauracion.usuarios.origen IS
    'Cómo se creó la cuenta: la asignó un administrador, se registró desde la página pública o es el administrador inicial del despliegue.';

-- Cuentas de consulta registradas en los últimos 30 días, para seguimiento de uso.
CREATE OR REPLACE VIEW eco_restauracion.vw_registros_publicos AS
SELECT date_trunc('day', creado_en) AS dia,
       count(*)                     AS cuentas
FROM eco_restauracion.usuarios
WHERE origen = 'registro_publico'
  AND creado_en > now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

SELECT 'Migración 16 (registro público) aplicada' AS mensaje;
