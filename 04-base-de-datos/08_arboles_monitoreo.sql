-- ============================================================================
-- 08 · Censo forestal de monitoreo (arboles_resumen.xlsx)
-- Alimenta los indicadores del componente de Restauración: riqueza, densidad/ha,
-- área basal/ha, abundancia por especie, etc. Un registro = un individuo (árbol)
-- medido en una parcela permanente, por fecha de monitoreo.
-- ============================================================================
SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.arboles_monitoreo (
    id                 BIGSERIAL PRIMARY KEY,
    fecha              TEXT    NOT NULL,            -- 'Linea base', 'Monitoreo 1'…
    cobertura          TEXT,                        -- clase CLC de la parcela
    id_parcela         TEXT    NOT NULL,            -- BD1, BR1, CU1… (enlaza puntos_monitoreo.codigo_punto)
    id_arbol           INTEGER,
    especie            TEXT,                        -- nombre científico
    nombre_comun       TEXT,
    altura_max         NUMERIC(6,2),                -- m
    n_fustes           INTEGER,
    dap_eq             NUMERIC(8,3),                -- cm
    area_basal_arbol   NUMERIC(12,8),               -- m² = π·(DAP/200)²
    categoria_arbol    TEXT,                        -- Brinzal/Latizal/Fustal
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arboles_fecha    ON eco_restauracion.arboles_monitoreo (fecha);
CREATE INDEX IF NOT EXISTS idx_arboles_parcela  ON eco_restauracion.arboles_monitoreo (id_parcela);
CREATE INDEX IF NOT EXISTS idx_arboles_cobertura ON eco_restauracion.arboles_monitoreo (cobertura);

-- Vista de indicadores por fecha (parcela estándar = 0,1 ha → 1,5 ha en 15 parcelas).
-- Ajustar :area_parcela cuando Yurani confirme el tamaño real de parcela.
CREATE OR REPLACE VIEW eco_restauracion.vw_indicadores_restauracion AS
WITH base AS (
  SELECT fecha,
         count(*) FILTER (WHERE especie IS NOT NULL)                AS individuos,
         count(DISTINCT especie) FILTER (WHERE especie IS NOT NULL) AS riqueza,
         coalesce(sum(n_fustes), 0)                                 AS fustes,
         coalesce(sum(area_basal_arbol), 0)                         AS area_basal_total,
         avg(altura_max) FILTER (WHERE altura_max IS NOT NULL)      AS altura_media,
         count(DISTINCT id_parcela)                                 AS parcelas
  FROM eco_restauracion.arboles_monitoreo
  GROUP BY fecha
)
SELECT fecha, individuos, riqueza, fustes,
       round(area_basal_total, 4)                       AS area_basal_total_m2,
       round((individuos / (parcelas * 0.1))::numeric, 1) AS densidad_ha,
       round((area_basal_total / (parcelas * 0.1))::numeric, 2) AS area_basal_ha,
       round(altura_media::numeric, 1)                  AS altura_media,
       parcelas
FROM base;
