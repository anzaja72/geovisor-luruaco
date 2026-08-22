#!/usr/bin/env bash
# ============================================================================
# Tilea las ortofotos temporales (nueva data ago-2026) a XYZ para el visor.
# Correr en el SERVIDOR (o donde estén los .tif + GDAL). Los tiles resultantes
# van a tiles/ (ignorado por git) y los sirve Nginx/Vite en /tiles/<label>/.
#
# Uso:  ./tile_ortofotos_temporales.sh /ruta/a/GDB   [zmin] [zmax]
#   <GDB> = carpeta con los .tif (p.ej. la carpeta "nueva data/GDB")
# ============================================================================
set -euo pipefail

SRC="${1:?Uso: tile_ortofotos_temporales.sh <carpeta_con_tif> [zmin] [zmax]}"
ZMIN="${2:-13}"
ZMAX="${3:-21}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/tiles"

command -v gdal2tiles.py >/dev/null 2>&1 || { echo "❌ Falta GDAL (brew install gdal / apt install gdal-bin)"; exit 1; }

# Mapa: archivo .tif  ->  etiqueta (carpeta de tiles y capa en el visor)
declare -A MAP=(
  ["Enero Antes 4.103 ha.tif"]="enero-antes"
  ["Enero Despues.tif"]="enero-despues"
  ["Febrero antes 9.103 ha.tif"]="febrero-antes"
  ["Mayo Antes 9.162 ha.tif"]="mayo-antes"
)

for tif in "${!MAP[@]}"; do
  label="${MAP[$tif]}"
  in="$SRC/$tif"
  if [[ ! -f "$in" ]]; then echo "⚠️  No encontrado: $in (saltando)"; continue; fi
  echo "▶ Tileando '$tif' → tiles/$label (z$ZMIN-$ZMAX)"
  gdal2tiles.py -z "$ZMIN-$ZMAX" --xyz --processes=4 "$in" "$OUT/$label"
done

echo "✅ Listo. Añadir cada capa al visor como TileLayer:  /tiles/<label>/{z}/{x}/{y}.png"
echo "   (usar los bounds de cada ortofoto; ver MapView.tsx, patrón de la ortofoto del predio)"
