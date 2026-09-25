-- ============================================================================
-- 21 · Muestreo 2 de ficorremediación — 22 variables de calidad de agua.
--
-- Valores tomados de «Matriz Calidad de aguas Muestreo 2- Luruaco.xlsx»
-- (25-sep-2026). El contratante advirtió que TODAVÍA SON DE PRUEBA: el
-- laboratorio no ha entregado resultados. Por eso entran con
-- es_demostracion = true, que es lo que enciende el aviso del tablero.
--
-- La CONDUCTIVIDAD no viene en la matriz y es una de las seis variables del
-- ICA del IDEAM. Las filas de conductividad que ya estaban sembradas se
-- conservan para que el índice siga calculando; hay que pedirla al
-- laboratorio antes de que lleguen los datos reales.
--
-- Los valores por debajo del límite de detección («<10», «<0,01») guardan el
-- límite en `valor` y el signo en `operador`: la pantalla muestra «< 10».
-- ============================================================================
SET search_path TO eco_restauracion, public;

DELETE FROM eco_restauracion.ficor_calidad_agua
 WHERE campana = 'Muestreo 2' AND es_demostracion AND variable <> 'Conductividad';

INSERT INTO eco_restauracion.ficor_calidad_agua
    (punto_id, campana, fecha, variable, valor, unidad, operador, es_demostracion)
SELECT p.id, 'Muestreo 2', DATE '2026-12-03', v.variable, v.valor, v.unidad, v.operador, true
FROM (VALUES
    ('FICO-1', 'pH', 8.96, 'Und. de H+', NULL),
    ('FICO-2', 'pH', 8.84, 'Und. de H+', NULL),
    ('FICO-3', 'pH', 8.77, 'Und. de H+', NULL),
    ('FICO-4', 'pH', 8.97, 'Und. de H+', NULL),
    ('FICO-5', 'pH', 8.88, 'Und. de H+', NULL),
    ('FICO-1', 'Temperatura', 37.1, 'ºC', NULL),
    ('FICO-2', 'Temperatura', 33.6, 'ºC', NULL),
    ('FICO-3', 'Temperatura', 32.2, 'ºC', NULL),
    ('FICO-4', 'Temperatura', 33.4, 'ºC', NULL),
    ('FICO-5', 'Temperatura', 33.6, 'ºC', NULL),
    ('FICO-1', 'Oxígeno disuelto', 4.52, 'mg/L', NULL),
    ('FICO-2', 'Oxígeno disuelto', 7.41, 'mg/L', NULL),
    ('FICO-3', 'Oxígeno disuelto', 7.61, 'mg/L', NULL),
    ('FICO-4', 'Oxígeno disuelto', 3.5, 'mg/L', NULL),
    ('FICO-5', 'Oxígeno disuelto', 7.36, 'mg/L', NULL),
    ('FICO-1', 'Salinidad', 0.37, '%', NULL),
    ('FICO-2', 'Salinidad', 0.37, '%', NULL),
    ('FICO-3', 'Salinidad', 0.37, '%', NULL),
    ('FICO-4', 'Salinidad', 0.37, '%', NULL),
    ('FICO-5', 'Salinidad', 0.37, '%', NULL),
    ('FICO-1', 'DQO', 150.0, 'mg O2/L', NULL),
    ('FICO-2', 'DQO', 140.0, 'mg O2/L', NULL),
    ('FICO-3', 'DQO', 160.0, 'mg O2/L', NULL),
    ('FICO-4', 'DQO', 190.0, 'mg O2/L', NULL),
    ('FICO-5', 'DQO', 80.0, 'mg O2/L', NULL),
    ('FICO-1', 'DBO5', 50.0, 'mg O2/L', NULL),
    ('FICO-2', 'DBO5', 48.0, 'mg O2/L', NULL),
    ('FICO-3', 'DBO5', 80.0, 'mg O2/L', NULL),
    ('FICO-4', 'DBO5', 85.0, 'mg O2/L', NULL),
    ('FICO-5', 'DBO5', 35.0, 'mg O2/L', NULL),
    ('FICO-1', 'SST', 10.0, 'mg/L', '<'),
    ('FICO-2', 'SST', 10.0, 'mg/L', '<'),
    ('FICO-3', 'SST', 10.0, 'mg/L', '<'),
    ('FICO-4', 'SST', 12.0, 'mg/L', NULL),
    ('FICO-5', 'SST', 10.0, 'mg/L', '<'),
    ('FICO-1', 'Sólidos totales', 531.0, 'mg/L', NULL),
    ('FICO-2', 'Sólidos totales', 523.0, 'mg/L', NULL),
    ('FICO-3', 'Sólidos totales', 521.0, 'mg/L', NULL),
    ('FICO-4', 'Sólidos totales', 531.0, 'mg/L', NULL),
    ('FICO-5', 'Sólidos totales', 521.0, 'mg/L', NULL),
    ('FICO-1', 'Grasas y aceites', 10.0, 'mg/L', '<'),
    ('FICO-2', 'Grasas y aceites', 10.0, 'mg/L', '<'),
    ('FICO-3', 'Grasas y aceites', 10.0, 'mg/L', '<'),
    ('FICO-4', 'Grasas y aceites', 10.0, 'mg/L', '<'),
    ('FICO-5', 'Grasas y aceites', 10.0, 'mg/L', '<'),
    ('FICO-1', 'Surfactantes aniónicos', 0.4, 'mg SAAM/L', NULL),
    ('FICO-2', 'Surfactantes aniónicos', 0.5, 'mg SAAM/L', NULL),
    ('FICO-3', 'Surfactantes aniónicos', 0.4, 'mg SAAM/L', NULL),
    ('FICO-4', 'Surfactantes aniónicos', 0.4, 'mg SAAM/L', NULL),
    ('FICO-5', 'Surfactantes aniónicos', 0.4, 'mg SAAM/L', NULL),
    ('FICO-1', 'Fósforo reactivo total', 1.0, 'mg P-PO4/L', '<'),
    ('FICO-2', 'Fósforo reactivo total', 1.0, 'mg P-PO4/L', '<'),
    ('FICO-3', 'Fósforo reactivo total', 1.0, 'mg P-PO4/L', '<'),
    ('FICO-4', 'Fósforo reactivo total', 1.0, 'mg P-PO4/L', '<'),
    ('FICO-5', 'Fósforo reactivo total', 1.0, 'mg P-PO4/L', '<'),
    ('FICO-1', 'Fósforo total', 1.8, 'mg P/L', NULL),
    ('FICO-2', 'Fósforo total', 1.9, 'mg P/L', NULL),
    ('FICO-3', 'Fósforo total', 2.1, 'mg P/L', NULL),
    ('FICO-4', 'Fósforo total', 2.3, 'mg P/L', NULL),
    ('FICO-5', 'Fósforo total', 2.5, 'mg P/L', NULL),
    ('FICO-1', 'Fosfatos', 0.8, 'mg PO4/L', NULL),
    ('FICO-2', 'Fosfatos', 0.9, 'mg PO4/L', NULL),
    ('FICO-3', 'Fosfatos', 0.75, 'mg PO4/L', NULL),
    ('FICO-4', 'Fosfatos', 0.65, 'mg PO4/L', NULL),
    ('FICO-5', 'Fosfatos', 0.55, 'mg PO4/L', NULL),
    ('FICO-1', 'Nitratos', 0.38, 'mg NO3-N/L', NULL),
    ('FICO-2', 'Nitratos', 0.35, 'mg NO3-N/L', NULL),
    ('FICO-3', 'Nitratos', 0.34, 'mg NO3-N/L', NULL),
    ('FICO-4', 'Nitratos', 0.34, 'mg NO3-N/L', NULL),
    ('FICO-5', 'Nitratos', 0.34, 'mg NO3-N/L', NULL),
    ('FICO-1', 'Nitritos', 0.01, 'mg NO2-N/L', '<'),
    ('FICO-2', 'Nitritos', 0.01, 'mg NO2-N/L', '<'),
    ('FICO-3', 'Nitritos', 0.01, 'mg NO2-N/L', '<'),
    ('FICO-4', 'Nitritos', 0.01, 'mg NO2-N/L', '<'),
    ('FICO-5', 'Nitritos', 0.01, 'mg NO2-N/L', '<'),
    ('FICO-1', 'Nitrógeno amoniacal', 1.8, 'mg NH3-N/L', NULL),
    ('FICO-2', 'Nitrógeno amoniacal', 2.0, 'mg NH3-N/L', NULL),
    ('FICO-3', 'Nitrógeno amoniacal', 1.8, 'mg NH3-N/L', NULL),
    ('FICO-4', 'Nitrógeno amoniacal', 1.9, 'mg NH3-N/L', NULL),
    ('FICO-5', 'Nitrógeno amoniacal', 2.5, 'mg NH3-N/L', NULL),
    ('FICO-1', 'Nitrógeno total', 2.18, 'mg N/L', NULL),
    ('FICO-2', 'Nitrógeno total', 2.35, 'mg N/L', NULL),
    ('FICO-3', 'Nitrógeno total', 2.14, 'mg N/L', NULL),
    ('FICO-4', 'Nitrógeno total', 2.24, 'mg N/L', NULL),
    ('FICO-5', 'Nitrógeno total', 2.84, 'mg N/L', NULL),
    ('FICO-1', 'Sulfatos', 31.0, 'mg SO4/L', NULL),
    ('FICO-2', 'Sulfatos', 30.0, 'mg SO4/L', NULL),
    ('FICO-3', 'Sulfatos', 30.0, 'mg SO4/L', NULL),
    ('FICO-4', 'Sulfatos', 29.0, 'mg SO4/L', NULL),
    ('FICO-5', 'Sulfatos', 29.0, 'mg SO4/L', NULL),
    ('FICO-1', 'Alcalinidad total', 258.3, 'mg CaCO3/L', NULL),
    ('FICO-2', 'Alcalinidad total', 257.5, 'mg CaCO3/L', NULL),
    ('FICO-3', 'Alcalinidad total', 260.5, 'mg CaCO3/L', NULL),
    ('FICO-4', 'Alcalinidad total', 259.5, 'mg CaCO3/L', NULL),
    ('FICO-5', 'Alcalinidad total', 258.9, 'mg CaCO3/L', NULL),
    ('FICO-1', 'Dureza total', 129.0, 'mg CaCO3/L', NULL),
    ('FICO-2', 'Dureza total', 130.0, 'mg CaCO3/L', NULL),
    ('FICO-3', 'Dureza total', 131.0, 'mg CaCO3/L', NULL),
    ('FICO-4', 'Dureza total', 138.0, 'mg CaCO3/L', NULL),
    ('FICO-5', 'Dureza total', 127.0, 'mg CaCO3/L', NULL),
    ('FICO-1', 'Coliformes totales', 60.0, 'NMP/100 mL', NULL),
    ('FICO-2', 'Coliformes totales', 80.0, 'NMP/100 mL', NULL),
    ('FICO-3', 'Coliformes totales', 60.0, 'NMP/100 mL', NULL),
    ('FICO-4', 'Coliformes totales', 120.0, 'NMP/100 mL', NULL),
    ('FICO-5', 'Coliformes totales', 80.0, 'NMP/100 mL', NULL),
    ('FICO-1', 'Coliformes termotolerantes', 120.0, 'NMP/100 mL', NULL),
    ('FICO-2', 'Coliformes termotolerantes', 160.0, 'NMP/100 mL', NULL),
    ('FICO-3', 'Coliformes termotolerantes', 180.0, 'NMP/100 mL', NULL),
    ('FICO-4', 'Coliformes termotolerantes', 260.0, 'NMP/100 mL', NULL),
    ('FICO-5', 'Coliformes termotolerantes', 120.0, 'NMP/100 mL', NULL)
) AS v(codigo, variable, valor, unidad, operador)
JOIN eco_restauracion.puntos_monitoreo p ON p.codigo_punto = v.codigo;

SELECT 'Migración 21 (muestreo 2 de ficorremediación) aplicada' AS mensaje;
