#!/usr/bin/env bash
# ============================================================
# Importa un Shapefile a eco_restauracion.capas_geograficas
# usando ogr2ogr (GDAL). Reproyecta a WGS84 (EPSG:4326).
#
# Uso:
#   ./import_shapefile.sh <archivo.shp> <nombre_capa> [srid_origen]
#
# Ejemplo (curvas de nivel del levantamiento):
#   ./import_shapefile.sh "Cruvas_nivel.shp" curvas_nivel 9377
#
# Variables:
#   DATABASE_URL  (opcional) cadena de conexión; por defecto el contenedor local.
# ============================================================
set -euo pipefail

SHP="${1:?Uso: import_shapefile.sh <archivo.shp> <nombre_capa> [srid_origen]}"
CAPA="${2:?Falta el nombre de la capa}"
SRID_SRC="${3:-}"
DB="${DATABASE_URL:-postgresql://eco_admin:EcoRest2024!@localhost:5432/restauracion_ecologica}"

command -v ogr2ogr >/dev/null 2>&1 || {
  echo "❌ Falta GDAL/ogr2ogr. Instálalo con:  brew install gdal"
  exit 1
}

echo "→ Cargando '$SHP' a tabla temporal…"
SRC_SRS=()
[ -n "$SRID_SRC" ] && SRC_SRS=(-s_srs "EPSG:${SRID_SRC}")

ogr2ogr -f PostgreSQL "PG:${DB}" "$SHP" \
  -nln eco_restauracion._import_tmp -overwrite \
  -t_srs EPSG:4326 "${SRC_SRS[@]}" \
  -lco GEOMETRY_NAME=geom -lco FID=id -nlt PROMOTE_TO_MULTI

echo "→ Normalizando a capas_geograficas (capa='${CAPA}')…"
psql "$DB" <<SQL
INSERT INTO eco_restauracion.capas_geograficas (capa, nombre, propiedades, origen, geom)
SELECT '${CAPA}',
       NULL,
       to_jsonb(t) - 'geom' - 'id',
       '$(basename "$SHP")',
       ST_SetSRID(geom, 4326)
FROM eco_restauracion._import_tmp t;
DROP TABLE IF EXISTS eco_restauracion._import_tmp;
SQL

echo "✅ Shapefile importado a la capa '${CAPA}'."
