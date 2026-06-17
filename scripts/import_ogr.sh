#!/usr/bin/env bash
# ============================================================
# Importa CUALQUIER fuente vectorial soportada por GDAL/OGR
# (GeoPackage .gpkg, Shapefile .shp, KML, GeoJSON, GML, FileGDB…)
# a eco_restauracion.capas_geograficas, reproyectando a WGS84.
#
# GeoPackage puede contener varias capas: se importan TODAS,
# una "capa" por cada tabla del .gpkg.
#
# Uso:
#   ./import_ogr.sh <archivo> [prefijo_capa] [srid_origen]
#
# Ejemplos:
#   ./import_ogr.sh coberturas.gpkg                 # todas las capas del gpkg
#   ./import_ogr.sh predios.gpkg catastro 9377      # prefijo + SRID origen
#   ./import_ogr.sh parcelas.geojson parcelas
#
# Variables:
#   DATABASE_URL  (opcional) cadena de conexión; por defecto el contenedor local.
# ============================================================
set -euo pipefail

SRC="${1:?Uso: import_ogr.sh <archivo> [prefijo_capa] [srid_origen]}"
PREFIJO="${2:-}"
SRID_SRC="${3:-}"
DB="${DATABASE_URL:-postgresql://eco_admin:EcoRest2024!@localhost:5432/restauracion_ecologica}"

command -v ogr2ogr >/dev/null 2>&1 || { echo "❌ Falta GDAL/ogr2ogr (brew install gdal)"; exit 1; }

# psql local si existe; si no, vía el contenedor Docker de PostGIS.
PG_CONTAINER="${PG_CONTAINER:-postgis-eco-restauracion}"
run_sql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DB"
  elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${PG_CONTAINER}$"; then
    docker exec -i "$PG_CONTAINER" psql -U eco_admin -d restauracion_ecologica
  else
    echo "❌ No hay 'psql' local ni el contenedor '${PG_CONTAINER}' en ejecución." >&2
    exit 1
  fi
}

SRC_SRS=()
[ -n "$SRID_SRC" ] && SRC_SRS=(-s_srs "EPSG:${SRID_SRC}")

# Listar las capas (tablas) del archivo de origen.
CAPAS=$(ogrinfo -ro -q --config SHAPE_RESTORE_SHX YES "$SRC" 2>/dev/null \
        | sed -n 's/^[0-9]*: \([^ (]*\).*/\1/p')
[ -z "$CAPAS" ] && { echo "❌ No se encontraron capas en $SRC"; exit 1; }

echo "→ Capas encontradas: $(echo "$CAPAS" | tr '\n' ' ')"

for LYR in $CAPAS; do
  NOMBRE="${PREFIJO:+${PREFIJO}_}${LYR}"
  echo "→ Importando capa '$LYR'  →  capas_geograficas (capa='${NOMBRE}')…"

  ogr2ogr -f PostgreSQL "PG:${DB}" "$SRC" "$LYR" \
    -nln eco_restauracion._import_tmp -overwrite \
    -t_srs EPSG:4326 ${SRC_SRS[@]+"${SRC_SRS[@]}"} \
    -lco GEOMETRY_NAME=geom -lco FID=id -nlt PROMOTE_TO_MULTI \
    --config SHAPE_RESTORE_SHX YES

  run_sql <<SQL
DELETE FROM eco_restauracion.capas_geograficas WHERE capa = '${NOMBRE}';
INSERT INTO eco_restauracion.capas_geograficas (capa, nombre, propiedades, origen, geom)
SELECT '${NOMBRE}', NULL,
       to_jsonb(t) - 'geom' - 'id',
       '$(basename "$SRC")',
       ST_SetSRID(geom, 4326)
FROM eco_restauracion._import_tmp t
WHERE geom IS NOT NULL;
DROP TABLE IF EXISTS eco_restauracion._import_tmp;
SQL
done

echo "✅ Importación finalizada. Las capas aparecen en el visor (control de capas)."
