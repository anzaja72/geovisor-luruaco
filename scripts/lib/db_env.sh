#!/usr/bin/env bash
# ============================================================================
# Origen de las credenciales de la geodatabase para los scripts de scripts/.
#
# Este archivo NO contiene secretos: la contraseña sale del entorno o de un
# .env (ignorado por git). Mismo criterio que el backend Go:
#   - el entorno manda sobre el .env (igual que godotenv.Load);
#   - no hay contraseña por defecto: si falta, el script falla de inmediato.
#
# Uso desde un script de scripts/:
#     . "$(dirname "$0")/lib/db_env.sh"
#
# Exporta: DB_HOST DB_PORT DB_USER DB_NAME PGPASSWORD DB_CONN
#   DB_CONN  cadena de conexión SIN contraseña —la toma libpq de PGPASSWORD—
#            para  psql "$DB_CONN"  y  ogr2ogr -f PostgreSQL "PG:$DB_CONN".
#            Así la contraseña tampoco aparece en la lista de procesos (ps).
#   Si DATABASE_URL está definida se usa tal cual, con su propia contraseña.
#
# Qué exportar antes de correr los scripts: ver scripts/README.md
# ============================================================================

# Carga un archivo .env sin pisar lo que ya viene del entorno.
_gdb_cargar_env() {
  local archivo="$1" linea clave valor
  [ -f "$archivo" ] || return 0
  while IFS= read -r linea || [ -n "$linea" ]; do
    linea="${linea%$'\r'}"                        # archivos con saltos CRLF
    linea="${linea#"${linea%%[![:space:]]*}"}"    # espacios a la izquierda
    case "$linea" in ''|'#'*) continue ;; esac
    linea="${linea#export }"
    case "$linea" in *=*) ;; *) continue ;; esac
    clave="${linea%%=*}"; valor="${linea#*=}"
    case "$clave" in ''|*[!A-Za-z0-9_]*) continue ;; esac
    case "$valor" in                              # comillas envolventes
      \"*\") valor="${valor#\"}"; valor="${valor%\"}" ;;
      \'*\') valor="${valor#\'}"; valor="${valor%\'}" ;;
    esac
    if [ -z "${!clave-}" ]; then export "$clave=$valor"; fi
  done < "$archivo"
}

_GDB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
_gdb_cargar_env "$_GDB_ROOT/.env"
_gdb_cargar_env "$_GDB_ROOT/02-backend/.env"

export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_USER="${DB_USER:-eco_admin}"
export DB_NAME="${DB_NAME:-restauracion_ecologica}"

if [ -n "${DATABASE_URL:-}" ]; then
  DB_CONN="$DATABASE_URL"
else
  export PGPASSWORD="${DB_PASSWORD:?definir DB_PASSWORD (expórtala o ponla en .env — ver scripts/README.md)}"
  DB_CONN="host=${DB_HOST} port=${DB_PORT} user=${DB_USER} dbname=${DB_NAME}"
fi
export DB_CONN
