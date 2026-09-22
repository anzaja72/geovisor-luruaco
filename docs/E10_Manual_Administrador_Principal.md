# Manual del administrador — Geovisor de Restauración Ecológica

**Entidad:** Corporación Autónoma Regional del Atlántico — C.R.A. · Contrato 324 de 2025
**Producción:** https://geodatabase.mcconsultorias.com.co

---

## 1. Cómo está desplegado

Todo el sistema vive en un único servidor, en contenedores Docker:

| Contenedor | Servicio | Puerto |
|---|---|---|
| `geodb-frontend` | Nginx con la aplicación compilada y los tiles de la ortofoto | 80 (interno) |
| `geodb-backend` | API en Go (Fiber) | 8080 (interno) |
| `geodb-postgis` | PostgreSQL 16 + PostGIS 3.4 | 5432 (interno) |

Ninguno publica puertos al exterior: **Traefik** recibe el tráfico, resuelve el
certificado con Let's Encrypt y enruta el dominio al frontend, que a su vez pasa `/api`
al backend.

| Elemento | Valor |
|---|---|
| Directorio del proyecto | `/opt/geovisor` |
| Archivo de composición | `docker-compose.vps.yml` |
| Proyecto de Compose | `geovisor` |
| Secretos | `/opt/geovisor/.env` (no se versiona) |

> Los comandos de este manual usan `-p geovisor -f docker-compose.vps.yml`. Omitir
> cualquiera de los dos crea un juego de contenedores paralelo en vez de actualizar el
> que está sirviendo.

---

## 2. Actualizar la plataforma

El código está en `https://github.com/anzaja72/geovisor-luruaco`. Para publicar cambios:

```bash
cd /opt/geovisor && git pull origin main
```

Solo cambió la interfaz:

```bash
cd /opt/geovisor && docker compose -p geovisor -f docker-compose.vps.yml up -d --build frontend
```

Cambió también la API (archivos `.go`):

```bash
cd /opt/geovisor && docker compose -p geovisor -f docker-compose.vps.yml up -d --build backend frontend
```

Comprobación posterior:

```bash
curl -s https://geodatabase.mcconsultorias.com.co/health && docker compose -p geovisor -f docker-compose.vps.yml ps
```

---

## 3. Migraciones de base de datos

Las migraciones están en `04-base-de-datos/`, numeradas por orden de aplicación. Se
aplican contra el contenedor de PostGIS:

```bash
cd /opt/geovisor && docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica -v ON_ERROR_STOP=1 < 04-base-de-datos/18_capas_sensibles_catalogo.sql
```

Todas se pueden volver a aplicar sin perder datos: crean con `IF NOT EXISTS`, las que
siembran datos de ejemplo (03 y 14) solo reemplazan sus propias filas, y la 17 siembra
las capas de fauna únicamente si están vacías. La última es la **18**.

El detalle de cada tabla está en el [diccionario de datos](E01_Diccionario_Datos_Principal.md).

---

## 4. Gestión de usuarios

El primer administrador se crea solo al arrancar el backend, con `ADMIN_EMAIL` y
`ADMIN_PASSWORD` del `.env`. El resto se administra por API.

Obtener un token leyendo las credenciales del propio `.env`, sin escribirlas en la terminal:

```bash
cd /opt/geovisor && set -a && . ./.env && set +a && TOKEN=$(curl -s -X POST https://geodatabase.mcconsultorias.com.co/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
```

Crear una cuenta (roles: `administrador`, `tecnico`, `consulta`):

```bash
curl -X POST https://geodatabase.mcconsultorias.com.co/api/usuarios -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"nombre":"Nombre Apellido","email":"correo@entidad.gov.co","password":"********","rol":"tecnico"}'
```

Listar, cambiar rol o desactivar:

```bash
curl -s https://geodatabase.mcconsultorias.com.co/api/usuarios -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X PUT https://geodatabase.mcconsultorias.com.co/api/usuarios/3 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"rol":"consulta","activo":true}'
```

Restablecer una contraseña olvidada: `PUT /api/usuarios/:id` con `{"password":"nueva"}`.
Cada usuario puede cambiar la suya desde **Ajustes**, en la propia plataforma.

El token dura 24 horas y queda solo en la variable de shell de esa sesión.

**Desactivar una cuenta o cambiarle el rol surte efecto de inmediato.** El servidor
consulta la cuenta en cada petición, así que no hay que esperar a que venza el token de
esa persona: su siguiente acción ya se evalúa con el estado nuevo.

**Intentos fallidos.** Tras 10 inicios de sesión fallidos desde una misma dirección IP, el
acceso desde esa IP queda bloqueado 15 minutos. El bloqueo es por IP: no afecta al resto
de usuarios ni impide entrar a la persona legítima desde otra red.

---

## 5. Carga de datos

| Vía | Quién | Cómo |
|---|---|---|
| GeoJSON | técnico / admin | Botón *Importar datos*, o `POST /api/import/geojson?capa=nombre` |
| CSV de puntos | técnico / admin | Mismo botón (columnas lon/lat o este/norte y `?srid=`, p. ej. 9377) |
| Formularios de campo | técnico / admin | Botón *Registrar Monitoreo* dentro de cada componente |
| Shapefile | admin (servidor) | `./scripts/import_shapefile.sh archivo.shp nombre_capa 9377` |
| Paquete consolidado | admin (servidor) | `./scripts/import_consolidado.sh "/ruta/Data Py Geodatabase"` |
| GeoTIFF (ortofoto, MDT, MDS) | admin (servidor) | `gdal2tiles.py` — ver [10-INFRAESTRUCTURA-PRODUCCION.md](../10-INFRAESTRUCTURA-PRODUCCION.md) §4 |

Toda capa importada queda en `capas_geograficas`, pero **el visor solo dibuja las capas
asignadas a un componente**, en `03-frontend/src/lib/capasVisor.ts`. Una capa con un nombre
nuevo queda guardada y se puede descargar por la API, pero no aparece en ningún mapa
hasta que se le asigne componente y se despliegue el frontend. Los productos del dron se
catalogan en `insumos_dron`.

### Capas sensibles

Las ubicaciones de cámaras trampa y transectos de fauna no se entregan al rol de
consulta. La sensibilidad es de la **capa**: la tabla `capas_sensibles` las enumera y un
disparador de la base marca cada fila nueva de esas capas, venga del botón *Importar
datos*, de un script o de SQL. Reimportar una capa de fauna no la expone.

Para proteger una capa nueva —por ejemplo, los puntos de mamíferos cuando lleguen—:

```bash
docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica <<'SQL'
INSERT INTO eco_restauracion.capas_sensibles (capa, motivo) VALUES ('mamiferos', 'Puntos de monitoreo de mamíferos');
UPDATE eco_restauracion.capas_geograficas SET sensible = TRUE WHERE capa = 'mamiferos';
SQL
```

Para comprobar qué ve el rol de consulta, basta con que ninguna fila de una capa
catalogada tenga `sensible = false`:

```bash
docker exec geodb-postgis psql -U eco_admin -d restauracion_ecologica -c "SELECT g.capa, count(*) FILTER (WHERE NOT g.sensible) AS expuestas FROM eco_restauracion.capas_geograficas g JOIN eco_restauracion.capas_sensibles s USING (capa) GROUP BY 1"
```

La columna `expuestas` debe dar 0 en todas.

Los tiles de la ortofoto se sirven desde `/opt/geovisor/tiles`, montado en el contenedor
del frontend. **No están en el repositorio**: si se recrea el servidor hay que regenerarlos.

---

## 6. El copiloto y su proveedor de modelo

El asistente responde con las cifras de la geodatabase. El modelo de lenguaje solo
redacta; si no hay proveedor configurado, la respuesta se compone con los mismos datos y
la plataforma sigue funcionando.

Para conectarlo, añada al `.env`:

```bash
cd /opt/geovisor && printf 'LLM_BASE_URL=https://integrate.api.nvidia.com/v1\nLLM_API_KEY=<clave>\nLLM_MODEL=meta/llama-3.3-70b-instruct\n' >> .env
```

y recree el backend (sección 2). Para comprobar que el contenedor la recibió:

```bash
docker exec geodb-backend printenv | grep LLM_
```

El proveedor debe hablar el protocolo de OpenAI —lo hacen NVIDIA NIM y DeepSeek, entre
otros—, de modo que cambiar de uno a otro es cuestión de esas tres variables.

**La clave vive solo en el `.env` del servidor.** Nunca debe copiarse al frontend: quedaría
expuesta a cualquiera que abra el inspector del navegador.

El uso queda registrado en `copiloto_consultas`; la vista `vw_copiloto_frecuentes` resume
las preguntas más repetidas de los últimos 30 días.

---

## 7. Respaldo y restauración

**El respaldo es automático.** Todos los días a las 2:30 a. m. el servidor genera una
copia completa de la geodatabase en `/opt/geovisor/backups/geodb_AAAAMMDD_HHMM.dump`
(formato *custom* de `pg_dump`) y borra las de más de 14 días. Está programado en el
`crontab` de root:

```bash
30 2 * * * /opt/geovisor/backups/run_backup.sh
```

El script está versionado en [`scripts/respaldo_diario.sh`](../scripts/respaldo_diario.sh):
la carpeta `backups/` está fuera de git, así que al reinstalar el servidor hay que copiarlo
de nuevo (`install -m 755 scripts/respaldo_diario.sh /opt/geovisor/backups/run_backup.sh`)
y volver a agregar la línea al `crontab`. Si una copia falla, no se borra ninguna anterior
y el error queda en `backups/backup.log`.

Comprobar que existe la copia de anoche y que es legible:

```bash
ls -lh /opt/geovisor/backups/ | tail -3
```

```bash
f=$(ls -t /opt/geovisor/backups/geodb_*.dump | head -1); docker exec -i geodb-postgis pg_restore --list < "$f" | grep -c 'TABLE DATA'
```

La segunda orden debe devolver el número de tablas de la geodatabase.

Copia manual, por ejemplo antes de una actualización:

```bash
cd /opt/geovisor && ./scripts/backup_db.sh backups
```

**Restaurar.** Primero en una base de prueba, para comprobar la copia sin tocar la real:

```bash
docker exec geodb-postgis createdb -U eco_admin prueba_restauracion
```

```bash
docker exec -i geodb-postgis pg_restore -U eco_admin -d prueba_restauracion < /opt/geovisor/backups/geodb_AAAAMMDD_HHMM.dump
```

Y solo si hay que recuperar la base en producción:

```bash
docker exec -i geodb-postgis pg_restore -U eco_admin -d restauracion_ecologica --clean --if-exists < /opt/geovisor/backups/geodb_AAAAMMDD_HHMM.dump
```

**Las copias están en el mismo disco que la base.** Protegen frente a errores de operación
—un borrado, una migración fallida—, pero no frente a la pérdida del servidor. Se
recomienda sacar una copia fuera de él (`rclone sync` a un almacenamiento externo) y probar
la restauración al menos una vez por trimestre: un respaldo que nunca se restauró no es un
respaldo.

---

## 8. Variables de entorno

| Variable | Uso | Obligatoria |
|---|---|---|
| `DB_PASSWORD` | Contraseña de PostGIS | Sí |
| `JWT_SECRET` | Firma de los tokens de sesión | Sí |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrador inicial | Sí |
| `CORS_ALLOW_ORIGINS` | Dominios autorizados | Recomendada |
| `PORT` | Puerto interno del backend (8080) | No |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | Proveedor del copiloto | No |

Sin `JWT_SECRET` el backend genera uno efímero y **las sesiones se invalidan en cada
reinicio**; en producción debe estar definida.

---

## 9. Operación diaria

```bash
cd /opt/geovisor && docker compose -p geovisor -f docker-compose.vps.yml ps
```

```bash
cd /opt/geovisor && docker compose -p geovisor -f docker-compose.vps.yml logs -f --tail=100 backend
```

Consultar la base directamente:

```bash
docker exec -it geodb-postgis psql -U eco_admin -d restauracion_ecologica
```

**Certificado TLS.** Lo renueva Traefik automáticamente. Conviene comprobar la vigencia
antes de cada vencimiento:

```bash
echo | openssl s_client -connect geodatabase.mcconsultorias.com.co:443 2>/dev/null | openssl x509 -noout -dates
```

**Espacio en disco.** Los tiles y los respaldos crecen; revise con `df -h /` y limpie
imágenes viejas con `docker system prune -f` antes de una reconstrucción grande.

---

## 10. Atención de incidencias

El procedimiento de registro y clasificación está en
[E08_Registro_Incidencias.md](E08_Registro_Incidencias.md). Los usuarios reportan desde
**Soporte**, dentro de la plataforma, con la versión y el navegador ya incluidos en el
mensaje. Compromiso de respuesta: **4 horas** desde el envío del correo.
