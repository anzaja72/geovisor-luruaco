#!/usr/bin/env bash
# Backup manual de la geodatabase (formato custom de pg_dump).
# Uso: ./scripts/backup_db.sh [directorio_destino]
set -euo pipefail
DEST="${1:-./backups}"
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d_%H%M)
docker exec gdb-postgis pg_dump -U eco_admin -d restauracion_ecologica -F c \
  > "$DEST/gdb_${STAMP}.dump" 2>/dev/null \
  || docker exec postgis-eco-restauracion pg_dump -U eco_admin -d restauracion_ecologica -F c \
  > "$DEST/gdb_${STAMP}.dump"
echo "✅ Backup: $DEST/gdb_${STAMP}.dump ($(du -h "$DEST/gdb_${STAMP}.dump" | cut -f1))"
# Restaurar:  pg_restore -h <host> -U eco_admin -d restauracion_ecologica --clean <archivo.dump>
