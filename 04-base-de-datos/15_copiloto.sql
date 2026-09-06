-- ============================================================================
-- 15 · Registro de consultas al copiloto
-- Guarda lo que la gente pregunta al asistente del geovisor. Sirve para dos
-- cosas: saber qué información busca el usuario (y ajustar la plataforma a esa
-- demanda) y sustentar el informe de uso del sistema.
-- No almacena la respuesta: interesa la necesidad, no el texto generado.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.copiloto_consultas (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT REFERENCES eco_restauracion.usuarios(id) ON DELETE SET NULL,
    pregunta    TEXT        NOT NULL,
    con_modelo  BOOLEAN     NOT NULL DEFAULT false,  -- redactada por el proveedor o servida con datos
    modelo      TEXT,                                -- modelo usado, cuando lo hubo
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copiloto_fecha   ON eco_restauracion.copiloto_consultas (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_copiloto_usuario ON eco_restauracion.copiloto_consultas (usuario_id);

COMMENT ON TABLE eco_restauracion.copiloto_consultas IS
    'Preguntas hechas al copiloto del geovisor. Alimenta el análisis de uso de la plataforma.';

-- Preguntas más frecuentes del último mes, para el informe de uso.
CREATE OR REPLACE VIEW eco_restauracion.vw_copiloto_frecuentes AS
SELECT lower(trim(pregunta)) AS pregunta,
       count(*)              AS veces,
       max(creado_en)        AS ultima_vez
FROM eco_restauracion.copiloto_consultas
WHERE creado_en > now() - interval '30 days'
GROUP BY 1
ORDER BY veces DESC, ultima_vez DESC;
