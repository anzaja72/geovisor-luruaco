-- ============================================================================
-- 18 · Catálogo de capas sensibles, aplicado por la propia base de datos
--
-- La marca `sensible` de la migración 17 vivía en cada fila, y el importador
-- de GeoJSON/CSV inserta sin ella. El 18-sep-2026 se reimportaron las capas de
-- fauna desde la interfaz y las cámaras trampa quedaron visibles para el rol de
-- consulta, que cualquiera puede crear desde la portada.
--
-- Desde aquí la sensibilidad es de la CAPA, no de la fila: un disparador marca
-- toda fila de una capa catalogada, venga del importador, de un script o de SQL
-- a mano. Para proteger una capa nueva (p. ej. los puntos de mamíferos):
--
--     INSERT INTO eco_restauracion.capas_sensibles (capa, motivo)
--     VALUES ('<nombre de la capa>', '<por qué>');
--     UPDATE eco_restauracion.capas_geograficas SET sensible = TRUE
--      WHERE capa = '<nombre de la capa>';
--
-- Idempotente: re-ejecutarla no borra ni duplica nada.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.capas_sensibles (
    capa    TEXT PRIMARY KEY,
    motivo  TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eco_restauracion.capas_sensibles IS
    'Capas cuyas ubicaciones no se entregan al rol de consulta. El disparador trg_capa_sensible marca sus filas.';

INSERT INTO eco_restauracion.capas_sensibles (capa, motivo) VALUES
  ('fauna_aves_camaras', 'Cámaras trampa y puntos de aves: su divulgación facilita la sustracción de equipos y la presión sobre la fauna'),
  ('herpetos',           'Transectos de herpetofauna')
ON CONFLICT (capa) DO NOTHING;

CREATE OR REPLACE FUNCTION eco_restauracion.fn_capa_sensible()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM eco_restauracion.capas_sensibles WHERE capa = NEW.capa) THEN
        NEW.sensible := TRUE;
    END IF;
    RETURN NEW;
END $$;

-- También en UPDATE: desmarcar una capa catalogada exige sacarla del catálogo,
-- que es una decisión explícita y no un efecto colateral.
DROP TRIGGER IF EXISTS trg_capa_sensible ON eco_restauracion.capas_geograficas;
CREATE TRIGGER trg_capa_sensible
    BEFORE INSERT OR UPDATE OF capa, sensible ON eco_restauracion.capas_geograficas
    FOR EACH ROW EXECUTE FUNCTION eco_restauracion.fn_capa_sensible();

-- Corrige las filas que ya entraron sin la marca.
UPDATE eco_restauracion.capas_geograficas g
   SET sensible = TRUE
  FROM eco_restauracion.capas_sensibles s
 WHERE g.capa = s.capa AND NOT g.sensible;

SELECT 'Migración 18 (catálogo de capas sensibles) aplicada' AS mensaje,
       (SELECT count(*) FROM eco_restauracion.capas_sensibles)                     AS capas_catalogadas,
       (SELECT count(*) FROM eco_restauracion.capas_geograficas WHERE sensible)    AS entidades_sensibles;
