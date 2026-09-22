#!/usr/bin/env bash
# ============================================================================
# Respaldo diario de la geodatabase en producción (formato custom de pg_dump).
#
# Copia versionada del script que corre en el servidor desde junio de 2026 como
# /opt/geovisor/backups/run_backup.sh — la carpeta backups/ está fuera de git, así
# que sin esta copia se perdería al reinstalar. Programado en el crontab de root:
#
#     30 2 * * * /opt/geovisor/backups/run_backup.sh
#
# Para reinstalarlo:
#     install -m 755 scripts/respaldo_diario.sh /opt/geovisor/backups/run_backup.sh
#
# Si pg_dump falla no se borra ningún respaldo anterior: de lo contrario, tras
# 14 días de fallos no quedaría ninguno.
# ============================================================================
set -uo pipefail

DIR="${GEOVISOR_DIR:-/opt/geovisor}"
CONTENEDOR="${PG_CONTAINER:-geodb-postgis}"
RETENCION_DIAS="${RETENCION_DIAS:-14}"

cd "$DIR" || exit 1
mkdir -p backups
archivo="backups/geodb_$(date +%Y%m%d_%H%M).dump"

if docker exec "$CONTENEDOR" pg_dump -U eco_admin -d restauracion_ecologica -F c \
     > "$archivo.tmp" 2>>backups/backup.log; then
  mv "$archivo.tmp" "$archivo"
else
  echo "$(date '+%F %T') ERROR: pg_dump falló; se conservan los respaldos anteriores" >> backups/backup.log
  rm -f "$archivo.tmp"
  exit 1
fi

find backups -name 'geodb_*.dump' -mtime +"$RETENCION_DIAS" -delete
