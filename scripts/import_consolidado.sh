#!/usr/bin/env bash
# ============================================================================
# Importa los datos consolidados del proyecto Luruaco (Brandon/Yurani) a PostGIS.
# - 5 capas vectoriales (reproyectadas a EPSG:4326) → tablas del esquema
# - Censo forestal (arboles_resumen.xlsx) → eco_restauracion.arboles_monitoreo
# Reemplaza los datos de muestra. Hace respaldo previo del dump.
#
# Uso:  scripts/import_consolidado.sh "/ruta/a/Data Py Geodatabase"
# Requiere: GDAL (ogr2ogr), Docker con el contenedor postgis-eco-restauracion,
#           python3 con openpyxl (para el Excel).
# ============================================================================
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"

DATA="${1:-/Users/angelzambrano/Downloads/Data Py Geodatabase}"
CTN="postgis-eco-restauracion"
DB="restauracion_ecologica"; USER="eco_admin"; PASS="EcoRest2024!"
PG="PG:host=localhost port=5432 dbname=${DB} user=${USER} password=${PASS} active_schema=eco_restauracion"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql_sql(){ docker exec -i "$CTN" psql -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 "$@"; }
ogr(){ ogr2ogr -f PostgreSQL "$PG" -t_srs EPSG:4326 -overwrite -lco GEOMETRY_NAME=geom "$@"; }

[ -d "$DATA" ] || { echo "✗ No existe la carpeta: $DATA"; exit 1; }
echo "▶ Datos: $DATA"

# 0) Respaldo previo --------------------------------------------------------
mkdir -p "$ROOT/backups"
BK="$ROOT/backups/pre_import_$(date +%Y%m%d_%H%M%S).sql"
echo "▶ Respaldo → $BK"
docker exec "$CTN" pg_dump -U "$USER" -d "$DB" > "$BK" && echo "  ✓ respaldo ok ($(du -h "$BK" | cut -f1))"

# 1) Migración tabla de censo ----------------------------------------------
echo "▶ Migración arboles_monitoreo"
psql_sql < "$ROOT/04-base-de-datos/08_arboles_monitoreo.sql" >/dev/null
echo "  ✓ tabla/vista listas"

# 2) Censo forestal (xlsx → csv → COPY) ------------------------------------
XLSX="$HOME/Downloads/arboles_resumen (1).xlsx"
if [ -f "$XLSX" ]; then
  echo "▶ Censo forestal: $XLSX"
  CSV="/tmp/arboles_monitoreo.csv"
  python3 - "$XLSX" "$CSV" <<'PY'
import openpyxl, csv, sys
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
# Elegir la hoja del censo crudo (cabecera que empieza por 'Fecha'), no la dinámica.
ws = next((w for w in wb.worksheets
           if str(next(w.iter_rows(values_only=True), [None])[0]).strip().lower() == 'fecha'),
          wb.worksheets[0])
rows = list(ws.iter_rows(values_only=True))
out = csv.writer(open(sys.argv[2], 'w', newline=''))
out.writerow(['fecha','cobertura','id_parcela','id_arbol','especie','nombre_comun',
              'altura_max','n_fustes','dap_eq','area_basal_arbol','categoria_arbol'])
for r in rows[1:]:
    if r[0] is None: continue
    out.writerow(['' if c is None else c for c in r[:11]])
PY
  psql_sql -c "TRUNCATE eco_restauracion.arboles_monitoreo RESTART IDENTITY;" >/dev/null
  docker exec -i "$CTN" psql -U "$USER" -d "$DB" -c \
    "\copy eco_restauracion.arboles_monitoreo (fecha,cobertura,id_parcela,id_arbol,especie,nombre_comun,altura_max,n_fustes,dap_eq,area_basal_arbol,categoria_arbol) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')" < "$CSV"
  echo "  ✓ censo cargado"
else
  echo "  ⚠ No se encontró $XLSX — se omite el censo"
fi

# 3) Capas vectoriales → staging -------------------------------------------
SP="$DATA/Shapes Proyecto Luruaco"
echo "▶ Cargando capas vectoriales (reproyección a 4326)…"
ogr "$SP/Cobertura CLC/Coberturas_clc.shp"            -nln _stg_cob    -nlt MULTIPOLYGON
ogr "$SP/Parcelas de monitoreo/Parcelas de monitoreo.shp" -nln _stg_parc -nlt POINT
ogr "$SP/Tecnicas de restauraci"*/Tecnicas.gpkg       -nln _stg_tec    -nlt MULTIPOLYGON
ogr "$SP/Aislamiento/Aislamiento_Externo.shp"         -nln _stg_aiext  -nlt MULTIPOLYGON
ogr "$SP/Aislamiento/Aislamiento_Interno.shp"         -nln _stg_aiint  -nlt MULTILINESTRING
ogr "$DATA/Poligonos de limpieza laguna/Poligonos.shp" -nln _stg_malz  -nlt MULTIPOLYGON
echo "  ✓ staging cargado"

# 4) Mapear staging → tablas finales (reemplaza datos de muestra) ----------
echo "▶ Mapeando a tablas finales…"
psql_sql <<'SQL'
BEGIN;
SET search_path TO eco_restauracion, public;

-- Coberturas vegetales (reemplaza las clases espectrales)
DELETE FROM coberturas_vegetales;
INSERT INTO coberturas_vegetales (codigo_corine, descripcion, area_hectareas, porcentaje, periodo, fuente, clase_tematica, estado, geom)
SELECT split_part(clc, ' ', 1), left(niv3, 255), area_ha,
       round((area_ha / NULLIF(SUM(area_ha) OVER (), 0) * 100)::numeric, 2),
       'Línea base', 'Censo Brandon 2024', left(niv1, 60), 'analizada',
       ST_Multi(ST_Force2D(geom))
FROM _stg_cob;

-- Parcelas de monitoreo (puntos) → puntos_monitoreo
DELETE FROM monitoreos;
DELETE FROM puntos_monitoreo;
INSERT INTO puntos_monitoreo (codigo_punto, nombre_punto, descripcion, tipo_monitoreo, estado_punto, longitud, latitud, geom)
SELECT nomenclatu, "nombre de", cobertura, 'parcela', 'activo',
       ST_X(ST_Force2D(geom)), ST_Y(ST_Force2D(geom)), ST_Force2D(geom)
FROM _stg_parc;

-- Técnicas de restauración
DELETE FROM tecnicas_restauracion;
INSERT INTO tecnicas_restauracion (tecnica, descripcion, area_hectareas, origen, geom)
SELECT CASE WHEN niv3 ILIKE '%bosque%' THEN 'restauracion_pasiva' ELSE 'revegetalizacion' END,
       COALESCE(NULLIF(niv4,''), niv3), area_ha, 'Brandon 2024', ST_Multi(ST_Force2D(geom))
FROM _stg_tec;

-- Aislamiento externo → polígono de restauración (conservación)
DELETE FROM poligonos_restauracion;
INSERT INTO poligonos_restauracion (nombre, descripcion, tipo_ecosistema, tipo_intervencion, estado_restauracion, area_hectareas, periodo, geom)
SELECT 'Aislamiento externo (cerramiento)', 'Cerca de aislamiento del predio',
       'Humedal', 'conservacion', 'conservacion', area2_ha, 'Línea base',
       ST_Force2D((ST_Dump(geom)).geom)
FROM _stg_aiext;

-- Aislamiento interno (líneas) + Polígonos de limpieza → capas_geograficas
DELETE FROM capas_geograficas WHERE capa IN ('aislamiento_interno','maleza_acuatica');
INSERT INTO capas_geograficas (capa, nombre, origen, geom)
SELECT 'aislamiento_interno', 'Aislamiento interno '||row_number() OVER (), 'Brandon 2024', ST_Force2D(geom)
FROM _stg_aiint;
INSERT INTO capas_geograficas (capa, nombre, origen, geom)
SELECT 'maleza_acuatica', COALESCE(NULLIF(name,''),'Polígono limpieza'), 'Limpieza laguna', ST_Force2D(geom)
FROM _stg_malz;

-- Limpieza de staging
DROP TABLE IF EXISTS _stg_cob, _stg_parc, _stg_tec, _stg_aiext, _stg_aiint, _stg_malz;
COMMIT;
SQL
echo "  ✓ mapeo completo"

# 5) Verificación -----------------------------------------------------------
echo "▶ Verificación:"
psql_sql -t -c "
SET search_path TO eco_restauracion, public;
SELECT '  coberturas_vegetales: '||count(*)||' ('||round(sum(area_hectareas)::numeric,2)||' ha)' FROM coberturas_vegetales
UNION ALL SELECT '  puntos_monitoreo (parcelas): '||count(*) FROM puntos_monitoreo
UNION ALL SELECT '  tecnicas_restauracion: '||count(*) FROM tecnicas_restauracion
UNION ALL SELECT '  poligonos_restauracion: '||count(*) FROM poligonos_restauracion
UNION ALL SELECT '  capas (aislam.+maleza): '||count(*) FROM capas_geograficas WHERE capa IN ('aislamiento_interno','maleza_acuatica')
UNION ALL SELECT '  arboles_monitoreo: '||count(*) FROM arboles_monitoreo;"
echo "▶ Indicadores (vista, Línea base):"
psql_sql -t -c "SET search_path TO eco_restauracion,public; SELECT '  '||fecha||' → riqueza '||riqueza||', densidad '||densidad_ha||' ind/ha, área basal '||area_basal_ha||' m²/ha, '||individuos||' individuos' FROM vw_indicadores_restauracion WHERE fecha='Linea base';"
echo "▶ Centroides (deben caer cerca de 10.6, -75.15):"
psql_sql -t -c "SET search_path TO eco_restauracion,public; SELECT '  coberturas centroide: '||round(ST_Y(ST_Centroid(ST_Collect(geom)))::numeric,3)||', '||round(ST_X(ST_Centroid(ST_Collect(geom)))::numeric,3) FROM coberturas_vegetales;"
echo "✓ Importación completa. Respaldo en: $BK"
