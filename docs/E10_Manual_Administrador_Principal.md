# 🛡️ Manual del Administrador — Geovisor Luruaco

## 1. Gestión de usuarios (API)
El primer administrador se crea automáticamente al arrancar el backend
(variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

```bash
TOKEN=$(curl -s -X POST https://<dominio>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@...","password":"..."}' | jq -r .token)

# Crear usuario (roles: administrador | tecnico | consulta)
curl -X POST https://<dominio>/api/usuarios -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Juan Pérez","email":"jperez@entidad.gov.co","password":"********","rol":"tecnico"}'

# Listar / actualizar / desactivar / eliminar
curl https://<dominio>/api/usuarios -H "Authorization: Bearer $TOKEN"
curl -X PUT https://<dominio>/api/usuarios/3 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"rol":"consulta","activo":true}'
curl -X DELETE https://<dominio>/api/usuarios/3 -H "Authorization: Bearer $TOKEN"
```

Recuperación de contraseña: el administrador asigna una nueva con
`PUT /api/usuarios/:id {"password":"nueva"}`.

## 2. Carga de datos
| Vía | Quién | Cómo |
|---|---|---|
| **GeoJSON** | técnico/admin | botón *Importar datos* del visor, o `POST /api/import/geojson?capa=nombre` |
| **CSV de puntos** | técnico/admin | mismo botón (columnas lon/lat o este/norte + SRID, ej. 9377) |
| **Shapefile** | admin (servidor) | `./scripts/import_shapefile.sh archivo.shp nombre_capa 9377` |
| **GeoTIFF (ortofoto/MDT/MDS)** | admin (servidor) | pipeline `gdal2tiles` (ver `10-INFRAESTRUCTURA-PRODUCCION.md` §4) |

Toda capa importada queda en `eco_restauracion.capas_geograficas` y aparece
automáticamente en el control de capas del visor. Los productos del dron se
catalogan en `eco_restauracion.insumos_dron` (metadatos + URL Drive + estado).

## 3. Respaldo y restauración
- Automático: contenedor `backup` (diario, retención 14 días, carpeta `./backups`).
- Manual: `./scripts/backup_db.sh`.
- Restaurar: `pg_restore -h <host> -U eco_admin -d restauracion_ecologica --clean backups/gdb_YYYYMMDD.dump`.
- Copia externa semanal: `rclone sync ./backups <remoto>` (configurar en cron).

## 4. Variables de entorno del backend
| Variable | Uso |
|---|---|
| `DATABASE_URL` o `DB_*` | conexión PostGIS |
| `JWT_SECRET` | firma de tokens (obligatoria en producción) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin inicial |
| `CORS_ALLOW_ORIGINS` | dominio(s) permitidos |
| `PORT` | puerto HTTP (8080) |

## 5. Despliegue y operación
Ver `10-INFRAESTRUCTURA-PRODUCCION.md` (procedimiento completo, TLS, monitoreo,
rutina anual). Comandos del día a día:

```bash
docker compose -f docker-compose.prod.yml up -d --build   # desplegar/actualizar
docker compose -f docker-compose.prod.yml logs -f backend # logs
docker compose -f docker-compose.prod.yml ps              # estado
```
