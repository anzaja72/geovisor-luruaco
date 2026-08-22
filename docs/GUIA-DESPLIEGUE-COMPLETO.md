# 🚀 Guía Completa de Despliegue — Backend en Hostinger + Frontend en Netlify

**Fecha:** 2 de julio de 2026 · **Versión:** 1.0
**Alcance:** desplegar el backend Go + PostGIS en un VPS de Hostinger, y el frontend (SPA) en Netlify, conectándolos bajo el dominio `geodatabase.mcconsultorias.com.co`.

---

## 0. Visión general

La arquitectura objetivo es:

```
┌─────────────────────────────────────────────────────────────┐
│                  USUARIO FINAL (navegador)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Netlify (CDN global) — Frontend SPA React/Vite              │
│  https://geodatabase.mcconsultorias.com.co/                  │
│                                                              │
│  Reglas de proxy:                                            │
│    /api/*  → https://geodatabase.mcconsultorias.com.co/api/* │
│    /health → https://geodatabase.mcconsultorias.com.co/health│
│    /tiles/* → https://geodatabase.mcconsultorias.com.co/... │
│    /*      → /index.html (SPA)                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (proxy)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Hostinger VPS (srv1668992.hstgr.cloud)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Nginx + Traefik (TLS vía Let's Encrypt)              │   │
│  │   /api/*  → backend:8080                              │   │
│  │   /tiles/* → volumen persistente /usr/share/nginx...│   │
│  │   /       → frontend:80 (Nginx estático, opcional)   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  backend   │  │  postgis   │  │  frontend  │             │
│  │  Go/Fiber  │  │ PostGIS 3.4│  │ Nginx (UI) │             │
│  │  port 8080 │  │ port 5432  │  │ port 80    │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

**3 contenedores Docker en el VPS de Hostinger:**
- `geodb-postgis` — PostgreSQL 15 + PostGIS 3.4 (red interna)
- `geodb-backend` — Go/Fiber API (puerto 8080, red interna)
- `geodb-frontend` — Nginx con el build estático (puerto 80)

**1 servicio externo:**
- Netlify — solo sirve la SPA estática + proxy al backend

---

## PARTE I — DESPLEGAR EL BACKEND EN HOSTINGER

### 1. Pre-requisitos del VPS de Hostinger

Antes de empezar, asegúrate de tener:

| Requisito | Verificación |
|-----------|--------------|
| VPS activo en Hostinger (srv1668992.hstgr.cloud) | Panel hPanel → VPS |
| Acceso SSH al VPS | `ssh -p <puerto> root@srv1668992.hstgr.cloud` |
| Dominio `geodatabase.mcconsultorias.com.co` apuntando al VPS | DNS A record → 2.24.97.152 |
| Ubuntu 22.04 LTS o Debian 12 | `lsb_release -a` |
| Al menos 4 GB de RAM y 40 GB de disco libre | `free -h && df -h` |
| Privilegios de `root` o `sudo` | `sudo -v` |

### 2. Instalación inicial del VPS (one-time)

Conectarse al VPS por SSH y ejecutar:

```bash
# 1. Actualizar el sistema
apt update && apt upgrade -y

# 2. Instalar dependencias básicas
apt install -y curl wget git nano ufw ca-certificates gnupg lsb-release

# 3. Instalar Docker y Docker Compose (método oficial)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Agregar tu usuario al grupo docker (opcional, para no usar sudo)
usermod -aG docker $USER

# 5. Configurar el firewall (UFW)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# 6. Verificar Docker
docker --version
docker compose version
```

### 3. Clonar el repositorio del proyecto

```bash
# Crear directorio de la app
mkdir -p /opt/geodatabase
cd /opt/geodatabase

# Clonar el repo (reemplaza <tu-usuario> y <nombre-repo> con los reales)
git clone https://github.com/<tu-usuario>/geovisor-luruaco.git .

# Verificar la estructura
ls -la
# Debes ver: 02-backend/  03-frontend/  04-base-de-datos/  docker-compose.vps.yml  ...
```

### 4. Crear el archivo `.env` con las credenciales

```bash
cd /opt/geodatabase

# Crear el archivo .env en la raíz del proyecto
cat > .env <<'EOF'
# === Base de datos (PostgreSQL + PostGIS) ===
DB_PASSWORD=CAMBIAR_POR_CONTRASEÑA_SEGURA_DE_32_CARACTERES

# === Autenticación JWT ===
JWT_SECRET=CAMBIAR_POR_SECRETO_JWT_ALEATORIO_DE_64_CARACTERES

# === Usuario administrador inicial ===
ADMIN_EMAIL=admin@mcconsultorias.com.co
ADMIN_PASSWORD=CAMBIAR_POR_CONTRASEÑA_FUERTE_DEL_ADMIN

# === CORS ===
# Permitir el dominio público (y localhost para debugging)
CORS_ALLOW_ORIGINS=https://geodatabase.mcconsultorias.com.co,http://localhost:5173
EOF

# Proteger el archivo (contiene secretos)
chmod 600 .env
```

**Cómo generar los secretos:**

```bash
# DB_PASSWORD (32 caracteres alfanuméricos)
openssl rand -hex 16
# Ejemplo de salida: 4f8a2b9c1d3e5f7a9b1c3d5e7f9a1b3c

# JWT_SECRET (64 caracteres alfanuméricos)
openssl rand -hex 32
# Ejemplo: 8a2f... (64 chars)

# ADMIN_PASSWORD (contraseña fuerte, mínimo 16 caracteres)
openssl rand -base64 24
```

**Importante:** anota estos valores en un lugar seguro (gestor de contraseñas). Si pierdes `JWT_SECRET`, todos los tokens emitidos quedan invalidados. Si pierdes `DB_PASSWORD`, no podrás conectarte a la base de datos.

### 5. Compilar e iniciar los contenedores

```bash
cd /opt/geodatabase

# Construir las imágenes (backend Go + frontend estático)
docker compose -f docker-compose.vps.yml build

# Levantar los servicios en segundo plano
docker compose -f docker-compose.vps.yml up -d

# Verificar el estado
docker compose -f docker-compose.vps.yml ps

# Salida esperada:
# NAME                STATUS              PORTS
# geodb-postgis       Up (healthy)        5432/tcp
# geodb-backend       Up                  8080/tcp
# geodb-frontend      Up                  80/tcp
```

### 6. Ejecutar las migraciones de la base de datos

Las migraciones SQL están en `04-base-de-datos/`. Hay que ejecutarlas en orden:

```bash
# Esperar a que PostGIS esté listo
sleep 10
docker exec geodb-postgis pg_isready -U eco_admin -d restauracion_ecologica

# Ejecutar cada migración en orden
for f in /opt/geodatabase/04-base-de-datos/0*.sql; do
  echo "Aplicando $f..."
  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica < "$f"
done

# Verificar las tablas creadas
docker exec geodb-postgis psql -U eco_admin -d restauracion_ecologica -c "\dt"
```

### 7. Instalar y configurar Traefik (reverse proxy con TLS automático)

Traefik se encarga de enrutar el tráfico y emitir certificados TLS vía Let's Encrypt.

```bash
# Crear red compartida para Traefik + servicios
docker network create web

# Crear directorio de configuración
mkdir -p /opt/traefik
cd /opt/traefik

# Crear el archivo acme.json (almacena los certificados)
touch acme.json
chmod 600 acme.json

# Crear docker-compose.yml para Traefik
cat > docker-compose.yml <<'EOF'
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    command:
      - "--api.dashboard=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=web"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=angelzambranojaraba@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - web
    restart: unless-stopped

networks:
  web:
    external: true
EOF

# Iniciar Traefik
docker compose up -d

# Conectar el frontend a la red 'web' (donde escucha Traefik)
docker network connect web geodb-frontend
```

### 8. Configurar DNS

En el panel DNS de Hostinger (o en el panel del registrador del dominio), asegúrate de que:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | geodatabase | 2.24.97.152 (IP del VPS) |
| A | @ | 2.24.97.152 (opcional, para el dominio raíz) |

Verificar la propagación:
```bash
nslookup geodatabase.mcconsultorias.com.co
# Debe resolver a 2.24.97.152
```

### 9. Verificación del backend en Hostinger

```bash
# Health check interno
curl -s http://localhost:8080/health
# Esperado: {"status":"ok","message":"Luruaco API funcionando","timestamp":"..."}

# Health check externo (vía Nginx/Traefik)
curl -s https://geodatabase.mcconsultorias.com.co/health
# Esperado: igual al anterior

# API de resumen
curl -s https://geodatabase.mcconsultorias.com.co/api/resumen
# Esperado: JSON con sitios visitados, reportados, categorías

# Login con el usuario admin
curl -X POST https://geodatabase.mcconsultorias.com.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mcconsultorias.com.co","password":"<tu-contraseña>"}'
# Esperado: {"token":"eyJ...","user":{...}}

# Verificar tiles de la ortofoto
curl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png
# Esperado: HTTP/1.1 200 OK, content-type: image/png
```

**Si los curls externos fallan:**
- Esperar 2-3 minutos (Traefik está emitiendo el certificado TLS)
- Verificar logs: `docker logs traefik`
- Verificar que el firewall permite 80/443: `ufw status`

---

## PARTE II — DESPLEGAR EL FRONTEND EN NETLIFY

### 10. Pre-requisitos para Netlify

| Requisito | Verificación |
|-----------|--------------|
| Backend accesible públicamente en Hostinger | `curl https://geodatabase.mcconsultorias.com.co/health` |
| Repositorio del proyecto en GitHub/GitLab | https://github.com/<user>/geovisor-luruaco |
| Cuenta en Netlify | https://app.netlify.com |
| `netlify.toml` ya commiteado en el repo | `cat 03-frontend/netlify.toml` |

### 11. Conectar el repositorio a Netlify

1. Ir a https://app.netlify.com/start
2. Click en **"Add new site → Import an existing project"**
3. Seleccionar el proveedor Git (GitHub/GitLab/Bitbucket) y autorizar
4. Buscar y seleccionar el repositorio `geovisor-luruaco`
5. Netlify detectará automáticamente la configuración de `netlify.toml`:

| Campo | Valor |
|-------|-------|
| Base directory | `03-frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Branch to deploy | `main` |

6. Click en **"Deploy site"**

Netlify ejecutará el build (tarda 1-3 min) y publicará la SPA en una URL temporal tipo `https://random-name-12345.netlify.app`.

### 12. Verificar que el frontend en Netlify se conecta al backend

Una vez que el deploy termina en verde, abrir la URL temporal en el navegador:
- La SPA debe cargar.
- En la consola del navegador (F12 → Console) no debe haber errores CORS ni 404.
- El login debe funcionar: probar `admin@mcconsultorias.com.co` + contraseña.

Si hay errores CORS:
```bash
# En el VPS, verificar el .env
cat /opt/geodatabase/.env | grep CORS

# Debe incluir: CORS_ALLOW_ORIGINS=https://geodatabase.mcconsultorias.com.co
# Si está en otro valor, corregir y reiniciar:
cd /opt/geodatabase
docker compose -f docker-compose.vps.yml restart backend
```

### 13. Configurar el dominio custom `geodatabase.mcconsultorias.com.co`

**Importante:** si el DNS actual apunta el dominio al VPS de Hostinger, hay que cambiarlo para que apunte a Netlify.

1. En Netlify: **Site settings → Domain management → Add custom domain**
2. Escribir `geodatabase.mcconsultorias.com.co`
3. Netlify te preguntará cómo gestionar el DNS:
   - **Opción A — Netlify DNS (recomendado):** migrar la zona DNS a Netlify. Más simple.
   - **Opción B — External DNS:** dejar el DNS en Hostinger y agregar un CNAME.

#### Opción A — Netlify DNS (recomendado)

4. Netlify te mostrará 4 nameservers (`dns1.p01.nsone.com`, `dns2.p01.nsone.com`, etc.).
5. En el panel DNS de Hostinger (o el registrador del dominio), cambiar los nameservers del subdominio `geodatabase` por los de Netlify.
6. Esperar la propagación (1-24 horas, usualmente 1-2 horas).
7. Netlify provisionará automáticamente el certificado TLS (Let's Encrypt).
8. En Netlify: **HTTPS → Verify DNS** (botón verde).

#### Opción B — DNS externo (Hostinger)

4. En el panel DNS de Hostinger, agregar un registro:
   - Tipo: `CNAME`
   - Nombre: `geodatabase`
   - Valor: `<tu-sitio>.netlify.app` (Netlify te lo muestra en el panel)
5. Esperar la propagación.
6. En Netlify: **HTTPS → Verify DNS** (botón verde).

### 14. Verificación final end-to-end

Una vez que Netlify muestra el certificado TLS como activo:

```bash
# 1. Frontend en Netlify
curl -I https://geodatabase.mcconsultorias.com.co/
# Esperado: HTTP/2 200, server: Netlify

# 2. Proxy de la API
curl -I https://geodatabase.mcconsultorias.com.co/api/zonas
# Esperado: HTTP/2 200 (proxy al backend de Hostinger)

# 3. Health check
curl -s https://geodatabase.mcconsultorias.com.co/health
# Esperado: {"status":"ok",...}

# 4. Tiles
curl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png
# Esperado: HTTP/2 200, content-type: image/png

# 5. Login (en el navegador)
# https://geodatabase.mcconsultorias.com.co/
# Usuario: admin@mcconsultorias.com.co
# Contraseña: <la que pusiste en ADMIN_PASSWORD>
# Esperado: dashboard del geovisor carga con datos
```

**Si todo funciona: despliegue completo.** 🎉

---

## PARTE III — OPERACIÓN Y MANTENIMIENTO

### 15. Operaciones frecuentes en el VPS

```bash
# Ver logs del backend
docker logs -f geodb-backend

# Reiniciar el backend (después de cambiar .env)
cd /opt/geodatabase
docker compose -f docker-compose.vps.yml restart backend

# Ver uso de disco
docker system df
df -h

# Backup de la base de datos
docker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \
  | gzip > /opt/backups/db-$(date +%Y%m%d-%H%M%S).sql.gz

# Listar backups
ls -lh /opt/backups/

# Restaurar un backup
gunzip -c /opt/backups/db-20260702-120000.sql.gz | \
  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica
```

### 16. Backups automáticos (cron)

```bash
# Crear el script de backup
cat > /opt/geodatabase/scripts/backup_db.sh <<'EOF'
#!/bin/bash
set -e
BACKUP_DIR="/opt/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \
  | gzip > "$BACKUP_DIR/db-$TIMESTAMP.sql.gz"
# Mantener solo los últimos 14 días
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +14 -delete
EOF

chmod +x /opt/geodatabase/scripts/backup_db.sh

# Programar ejecución diaria a las 03:00
echo "0 3 * * * root /opt/geodatabase/scripts/backup_db.sh" \
  | sudo tee /etc/cron.d/geodatabase-backup
```

### 17. Health checks externos (recomendado)

Configurar UptimeRobot (https://uptimerobot.com) o Healthchecks.io para alertar si la plataforma cae:

| Endpoint | Frecuencia |
|----------|-----------|
| `https://geodatabase.mcconsultorias.com.co/health` | Cada 5 minutos |
| `https://geodatabase.mcconsultorias.com.co/api/zonas` | Cada 15 minutos |

Si alguno falla 2 veces consecutivas, envía alerta por email/SMS.

### 18. Actualización del código (workflow)

```bash
# === Backend (en el VPS) ===
cd /opt/geodatabase
git pull origin main
docker compose -f docker-compose.vps.yml build backend
docker compose -f docker-compose.vps.yml up -d backend

# === Frontend (Netlify, automático) ===
# Solo hacer git push a main. Netlify detecta el cambio y redespliega.
cd /local/geovisor-luruaco
git add . && git commit -m "feat: ..."
git push origin main
# Netlify redesplega automáticamente en 1-3 min.
```

---

## Resumen de comandos críticos (cheat sheet)

```bash
# === DESPLEGAR POR PRIMERA VEZ ===
ssh root@srv1668992.hstgr.cloud
apt update && apt install -y docker.io docker-compose-v2 git
mkdir -p /opt/geodatabase && cd /opt/geodatabase
git clone https://github.com/<user>/geovisor-luruaco.git .
nano .env   # configurar secretos
docker compose -f docker-compose.vps.yml up -d --build
for f in 04-base-de-datos/0*.sql; do
  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica < "$f"
done

# === VERIFICAR ===
curl -s https://geodatabase.mcconsultorias.com.co/health
docker compose -f docker-compose.vps.yml ps

# === ACTUALIZAR BACKEND ===
cd /opt/geodatabase && git pull
docker compose -f docker-compose.vps.yml up -d --build backend

# === BACKUP ===
docker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \
  | gzip > /opt/backups/db-$(date +%Y%m%d).sql.gz
```

---

## Datos que necesito para hacer el deploy yo mismo

Si quieres que yo haga el deploy por ti, **necesito**:

| Dato | Para qué | Cómo obtenerlo |
|------|----------|----------------|
| `NETLIFY_AUTH_TOKEN` | Personal Access Token para autenticar el CLI | https://app.netlify.com/user/applications#personal-access-tokens → New access token |
| `NETLIFY_SITE_ID` | UUID del sitio de Netlify | Site settings → General → Site details → "Site ID" |
| Acceso SSH al VPS de Hostinger (opcional, solo si quieres que despliegue también el backend) | Ejecutar docker compose y migraciones en el servidor | `ssh root@srv1668992.hstgr.cloud` (usuario y puerto SSH) |

**Lo que NO necesito:**
- Contraseña de hPanel de Hostinger
- Acceso al panel DNS
- Credenciales de la base de datos

**Procedimiento recomendado:**
1. **Tú despliegas el backend en Hostinger** (Parte I de esta guía) — son ~30 minutos siguiendo los pasos.
2. **Yo despliego el frontend en Netlify** desde tu Mac con el `netlify-cli` (Parte II simplificada) — son ~5 minutos con los tokens.

¿Procedemos con ese flujo?

---

*Documento generado el 2 de julio de 2026 — versión 1.0. Backend en Hostinger + Frontend en Netlify bajo el dominio `geodatabase.mcconsultorias.com.co`.*
