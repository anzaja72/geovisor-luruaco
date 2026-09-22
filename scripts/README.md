# Scripts de la geodatabase

Utilidades de importación, respaldo y teselado. **Ninguna contiene
credenciales**: la contraseña de PostgreSQL sale del entorno o de un archivo
`.env` (ignorado por git). Si falta, el script se detiene antes de tocar la
base de datos con un mensaje explícito.

## Variables de entorno

| Variable | Obligatoria | Por defecto | Para qué |
|---|---|---|---|
| `DB_PASSWORD` | **Sí** (salvo con `DATABASE_URL`) | — sin valor por defecto | Contraseña del usuario de PostgreSQL |
| `DATABASE_URL` | No | — | Cadena de conexión completa; reemplaza a las `DB_*` |
| `DB_HOST` | No | `localhost` | Host de PostGIS |
| `DB_PORT` | No | `5432` | Puerto |
| `DB_USER` | No | `eco_admin` | Usuario |
| `DB_NAME` | No | `restauracion_ecologica` | Base de datos |
| `PG_CONTAINER` | No | `postgis-eco-restauracion` | Contenedor Docker, cuando se entra por `docker exec` |

`import_consolidado.sh` usa siempre las variables `DB_*` (no lee
`DATABASE_URL`), porque arma la cadena de conexión de GDAL con
`active_schema=eco_restauracion`.

## Cómo definirlas

**Opción A — exportarlas en la terminal** (no quedan en ningún archivo):

```bash
read -rs -p "Contraseña de PostgreSQL: " DB_PASSWORD && export DB_PASSWORD && echo
scripts/import_consolidado.sh "/ruta/a/Data Py Geodatabase"
```

**Opción B — archivo `.env`** (el mismo que usa el backend). Se busca primero
`.env` en la raíz del repositorio y luego `02-backend/.env`. El entorno tiene
prioridad sobre el archivo, igual que `godotenv` en el backend Go:

```bash
cp 02-backend/.env.example .env
$EDITOR .env          # rellenar DB_PASSWORD
scripts/import_ogr.sh datos.gpkg
```

`.gitignore` ya excluye `.env` y `.env.*` (menos los `.env.example`). Verifica
antes de confirmar cambios que no estás subiendo secretos:

```bash
git status --short && git diff --cached | grep -iE 'password|secret|token'
```

## Qué necesita cada script

| Script | Credenciales | Otros requisitos |
|---|---|---|
| `import_consolidado.sh` | `DB_PASSWORD` (para `ogr2ogr`) | GDAL, Docker, `python3` con `openpyxl` |
| `import_ogr.sh` | `DB_PASSWORD` o `DATABASE_URL` | GDAL (`ogr2ogr`, `ogrinfo`) |
| `import_shapefile.sh` | `DB_PASSWORD` o `DATABASE_URL` | GDAL, `psql` |
| `backup_db.sh` | ninguna — entra por `docker exec` | Docker |
| `tile_ortofotos_temporales.sh` | ninguna | GDAL (`gdal2tiles.py`) |

La contraseña viaja en la variable `PGPASSWORD` que libpq lee de forma
automática, así que tampoco aparece en la lista de procesos (`ps`) mientras
corre la importación.

## Dónde vive la lógica

`lib/db_env.sh` es el único lugar que resuelve las credenciales: carga el
`.env`, aplica los valores por defecto y exige `DB_PASSWORD`. Los scripts lo
cargan con `. "$(dirname "$0")/lib/db_env.sh"` y reciben `DB_CONN` (cadena de
conexión sin contraseña) más las variables `DB_*` ya normalizadas.
