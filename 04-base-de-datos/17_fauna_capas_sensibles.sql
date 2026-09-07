-- ============================================================================
-- 17 · Capas de fauna en la geodatabase y marca de sensibilidad
--
-- Los puntos de cámaras trampa y los transectos de herpetofauna estaban
-- incrustados en el código del navegador, de modo que se descargaban sin
-- autenticación. Pasan a la geodatabase y se marcan como sensibles: el backend
-- las excluye para el rol de consulta.
-- ============================================================================
SET search_path TO eco_restauracion, public;

ALTER TABLE eco_restauracion.capas_geograficas
    ADD COLUMN IF NOT EXISTS sensible BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN eco_restauracion.capas_geograficas.sensible IS
    'Capa con ubicaciones que no se entregan al rol de consulta (p. ej. cámaras trampa y transectos de fauna).';

DELETE FROM eco_restauracion.capas_geograficas WHERE capa IN ('fauna_aves_camaras','herpetos');

INSERT INTO eco_restauracion.capas_geograficas (capa, nombre, propiedades, origen, geom) VALUES
  ('fauna_aves_camaras', 'A2', '{"cod": "A2", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1667267651084, 10.605081649116]}'), 4326)),
  ('fauna_aves_camaras', 'A3', '{"cod": "A3", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1704472960103, 10.6056131308942]}'), 4326)),
  ('fauna_aves_camaras', 'A4', '{"cod": "A4", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1682082798367, 10.6075414013657]}'), 4326)),
  ('fauna_aves_camaras', 'A1', '{"cod": "A1", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1702638024555, 10.6031688794388]}'), 4326)),
  ('fauna_aves_camaras', 'A5', '{"cod": "A5", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1705172269242, 10.6075440439391]}'), 4326)),
  ('fauna_aves_camaras', 'A6', '{"cod": "A6", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1660711830253, 10.608101713084]}'), 4326)),
  ('fauna_aves_camaras', 'A7', '{"cod": "A7", "tipo": "Aves"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Point", "coordinates": [-75.1670782947869, 10.6100651787326]}'), 4326)),
  ('herpetos', 'H1', '{"codigo": "H1", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1700270297753, 10.60433478688], [-75.1700365180357, 10.6047867668184]]]}'), 4326)),
  ('herpetos', 'H2', '{"codigo": "H2", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1663705397089, 10.6105524046094], [-75.1663737227016, 10.611004471944]]]}'), 4326)),
  ('herpetos', 'H3', '{"codigo": "H3", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1657244573073, 10.6042859214296], [-75.1657276374287, 10.6047379891377]]]}'), 4326)),
  ('herpetos', 'H4', '{"codigo": "H4", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1715982947012, 10.6025152438356], [-75.171601482899, 10.6029673098285]]]}'), 4326)),
  ('herpetos', 'H5', '{"codigo": "H5", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1670545086452, 10.6046170735111], [-75.1670576908204, 10.6050691408104]]]}'), 4326)),
  ('herpetos', 'H6', '{"codigo": "H6", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1681918491307, 10.6063426010016], [-75.1681950335052, 10.6067946679096]]]}'), 4326)),
  ('herpetos', 'H7', '{"codigo": "H7", "clase": "Herpetos"}'::jsonb, 'Levantamiento de fauna', ST_SetSRID(ST_GeomFromGeoJSON('{"type": "MultiLineString", "coordinates": [[[-75.1678042155068, 10.6083617019649], [-75.1678073999323, 10.6088137689315]]]}'), 4326));

UPDATE eco_restauracion.capas_geograficas
   SET sensible = TRUE
 WHERE capa IN ('fauna_aves_camaras','herpetos');

SELECT 'Migración 17 (capas de fauna y sensibilidad) aplicada' AS mensaje,
       count(*) FILTER (WHERE sensible) AS entidades_sensibles
  FROM eco_restauracion.capas_geograficas;
