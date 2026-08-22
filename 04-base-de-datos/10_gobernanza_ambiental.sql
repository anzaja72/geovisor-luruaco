-- ============================================================================
-- 10 · Gobernanza Ambiental (COMPONENTE GOBERNAZA AMBIENTAL.xlsx)
-- Registro de actividades de participación comunitaria: socializaciones,
-- talleres, capacitaciones, jornadas de limpieza, recorridos guiados,
-- negocios verdes y sensibilización ciudadana.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.gobernanza_actividades (
    id           BIGSERIAL PRIMARY KEY,
    actividad    TEXT NOT NULL,                 -- 'Socializaciones', 'Talleres acuerdo social'…
    cantidad     INTEGER NOT NULL DEFAULT 0,    -- número de eventos realizados
    participantes INTEGER NOT NULL DEFAULT 0,   -- total de personas que asistieron
    ubicacion    TEXT,                          -- sitio o "georreferenciada en la foto"
    fecha        TEXT,                          -- 'Línea base', 'Monitoreo 1'… (NULL = sin fecha asignada)
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (actividad)
);

CREATE INDEX IF NOT EXISTS idx_gobernanza_actividad ON eco_restauracion.gobernanza_actividades (actividad);

-- Vista de totales para las tarjetas KPI del front.
CREATE OR REPLACE VIEW eco_restauracion.vw_gobernanza_resumen AS
SELECT count(*)                                   AS tipos_actividad,
       coalesce(sum(cantidad), 0)                  AS actividades_totales,
       coalesce(sum(participantes), 0)             AS participantes_totales,
       round(coalesce(sum(participantes), 0)::numeric
             / greatest(coalesce(sum(cantidad), 0), 1), 1) AS promedio_participantes
FROM eco_restauracion.gobernanza_actividades;

-- Datos reales (COMPONENTE GOBERNAZA AMBIENTAL.xlsx).
INSERT INTO eco_restauracion.gobernanza_actividades (actividad, cantidad, participantes, ubicacion) VALUES
    ('Socializaciones', 3, 63, 'Biblioteca Luruaco'),
    ('Talleres acuerdo social', 2, 51, 'Biblioteca Luruaco'),
    ('Capacitaciones - cursos sostenibilidad y resiliencia climática', 3, 252, 'Casa de la Cultura Luruaco'),
    ('Jornadas de limpieza', 2, 48, 'Localización georreferenciada en la foto'),
    ('Recorrido guiado', 2, 55, 'Localización georreferenciada en la foto'),
    ('Negocios verdes', 5, 25, 'Casa de la Cultura Luruaco'),
    ('Talleres de sensibilización y ciudadanos ambientales', 1, 23, 'Institución Educativa Técnica Agropecuaria de Luruaco')
ON CONFLICT (actividad) DO NOTHING;

SELECT 'Migración 10 (gobernanza_ambiental) aplicada' AS mensaje;
