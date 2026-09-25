-- ============================================================================
-- 22 · Las fotografías se guardan en la base, no en disco.
--
-- `fotografias` solo guardaba una ruta (`ruta_archivo`) o un identificador de
-- Drive: el archivo vivía fuera y la base apuntaba a él. Eso significa que un
-- respaldo de la base no incluye las fotos, y que una copia del sistema a otro
-- servidor las pierde. Por decisión del contratante la imagen pasa a la base.
--
-- Contrapartida: los respaldos crecen. Por eso el tamaño se limita en el
-- backend y se guarda declarado, para poder auditarlo sin leer los binarios.
-- ============================================================================
SET search_path TO eco_restauracion, public;

ALTER TABLE eco_restauracion.fotografias
    ADD COLUMN IF NOT EXISTS imagen         BYTEA,
    ADD COLUMN IF NOT EXISTS mime           TEXT,
    ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
    ADD COLUMN IF NOT EXISTS tamano_bytes   INTEGER,
    ADD COLUMN IF NOT EXISTS observacion_id BIGINT
        REFERENCES eco_restauracion.fauna_observaciones(id) ON DELETE CASCADE;

-- Solo los formatos que el navegador muestra sin plugins.
ALTER TABLE eco_restauracion.fotografias
    DROP CONSTRAINT IF EXISTS fotografias_mime_check;
ALTER TABLE eco_restauracion.fotografias
    ADD CONSTRAINT fotografias_mime_check
    CHECK (mime IS NULL OR mime IN ('image/jpeg', 'image/png', 'image/webp'));

CREATE INDEX IF NOT EXISTS idx_fotografias_observacion
    ON eco_restauracion.fotografias (observacion_id)
    WHERE observacion_id IS NOT NULL;

COMMENT ON COLUMN eco_restauracion.fotografias.imagen IS
    'Contenido del archivo. NULL en las filas antiguas, que apuntan a ruta_archivo o drive_id.';
COMMENT ON COLUMN eco_restauracion.fotografias.observacion_id IS
    'Observación de fauna que documenta esta foto. Al borrar la observación se borra la foto.';

SELECT 'Migración 22 (fotografías en la base) aplicada' AS mensaje;
