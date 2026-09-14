#!/usr/bin/env bash
# ============================================================================
# Convierte una ortofoto .ecw a GeoTIFF para poder tilearla.
#
# POR QUÉ EXISTE
# El GDAL que instala Homebrew (y el de conda, y el de los paquetes de Linux)
# NO trae el driver ECW: el SDK es propietario de Hexagon/ERDAS y no se puede
# redistribuir. Como gdal2tiles.py abre el ráster con GDAL, sin ese driver la
# cadena de publicación se corta en el primer paso.
#
# La salida es una imagen de Docker que sí trae el driver compilado, y que se
# usa solo para este paso. El resto del proceso (tileado, COG) sigue con el
# GDAL local, que es mucho más moderno.
#
# LÍMITE CONOCIDO
# Esa imagen trae el SDK 3.x, que lee ECW versión 2. Si dronticom exportó con
# un ERDAS reciente puede haber generado ECW versión 3, que el SDK 3.x no abre.
# El script lo detecta y te lo dice antes de intentar convertir.
#
# Uso:  ./ecw_a_geotiff.sh <entrada.ecw> [salida.tif]
# ============================================================================
set -euo pipefail

IMAGEN="sirap/gdal-ecw"
ENTRADA="${1:?Uso: ecw_a_geotiff.sh <entrada.ecw> [salida.tif]}"

[[ -f "$ENTRADA" ]] || { echo "❌ No existe: $ENTRADA"; exit 1; }

DIR="$(cd "$(dirname "$ENTRADA")" && pwd)"
BASE="$(basename "$ENTRADA")"
SALIDA="${2:-${BASE%.*}.tif}"
SALIDA_BASE="$(basename "$SALIDA")"

docker info >/dev/null 2>&1 || {
  echo "❌ Docker no está corriendo. Abre Docker Desktop y vuelve a intentar."
  exit 1
}

# La imagen es amd64; en Apple Silicon corre emulada (más lenta, pero sirve).
DK=(docker run --rm --platform linux/amd64 -v "$DIR":/data "$IMAGEN")

echo "▶ Leyendo la cabecera de «$BASE»…"
if ! INFO="$("${DK[@]}" gdalinfo "/data/$BASE" 2>&1)"; then
  echo "❌ El SDK no pudo abrir el archivo. Suele ser ECW versión 3."
  echo "   Pídele a Brandon que reexporte en JPEG 2000 (.jp2) o GeoTIFF."
  echo
  echo "$INFO" | head -5
  exit 1
fi

echo "$INFO" | grep -E "^Size is|^Upper Left|^Lower Right" | sed 's/^/   /'

# El ECW puede no llevar el CRS adentro; por eso viene con un .prj al lado.
# Ojo: el GDAL del contenedor es 1.11 y escribe WKT viejo (PROJCS/GEOGCS),
# no el WKT2 de GDAL 3 (PROJCRS/GEOGCRS). Hay que aceptar los dos.
PRJ="${BASE%.*}.prj"
SRS=()
if ! echo "$INFO" | grep -qE '^\s*(PROJCS|GEOGCS|PROJCRS|GEOGCRS)\['; then
  if [[ -f "$DIR/$PRJ" ]]; then
    echo "⚠️  El ECW no trae sistema de coordenadas; se toma de $PRJ"
    SRS=(-a_srs "/data/$PRJ")
  else
    echo "⚠️  El ECW no trae sistema de coordenadas y no hay $PRJ al lado."
    echo "   La ortofoto quedará sin georreferenciar. Pide el .prj."
  fi
fi

echo "▶ Convirtiendo a GeoTIFF (LZW, teselado, BigTIFF)…"
# ${SRS[@]+…}: macOS trae bash 3.2, donde `set -u` revienta con un array vacío.
"${DK[@]}" gdal_translate -of GTiff \
  -co COMPRESS=LZW -co TILED=YES -co BIGTIFF=YES \
  ${SRS[@]+"${SRS[@]}"} "/data/$BASE" "/data/$SALIDA_BASE"

echo "▶ Verificando con el GDAL local…"
gdalinfo "$DIR/$SALIDA_BASE" | grep -E "^Size is|^Driver|Upper Left|Lower Right" | sed 's/^/   /'

echo
echo "✅ Listo: $DIR/$SALIDA_BASE"
echo
echo "   Siguiente paso — generar las teselas del visor:"
echo "     gdal2tiles.py -z 13-21 --xyz --processes=4 \"$DIR/$SALIDA_BASE\" tiles/<etiqueta>"
echo
echo "   Y anotar en MapView.tsx los bounds que imprimió gdalinfo arriba."
