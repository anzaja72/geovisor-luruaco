# 🚀 Guía de Despliegue en Netlify — Geodatabase Luruaco

**Fecha:** 2 de julio de 2026 · **Versión:** 1.1 (backend en Hostinger)
**Dominio objetivo:** `https://geodatabase.mcconsultorias.com.co`
**Alcance:** migración del **frontend** (SPA estática) a Netlify.
El **backend (Go/Fiber) y la base de datos (PostGIS) permanecen en el VPS de Hostinger**.

---

## 0. Cambio reciente — Backend en Hostinger (no Hetzner)

A partir de julio de 2026 el backend dejó de estar alojado en un VPS de Hetzner
y se migró a un VPS de Hostinger. La verificación de DNS así lo confirma:

| Comprobación | Resultado |
|--------------|-----------|
| `nslookup geodatabase.mcconsultorias.com.co` | `2.24.97.152` |
| Reverse DNS `2.24.97.152` | `srv1668992.hstgr.cloud` |
| WHOIS de la IP | Rango `2.24.64.0 – 2.24.127.255`, `netname: HOSTINGER-HOSTING`, país US |

Implicaciones prácticas: el procedimiento de despliegue en Netlify es el mismo
(la SPA sigue en Netlify, el backend y la BD siguen en el mismo servidor de origen).
Solo cambia **dónde** se hacen las operaciones de mantenimiento del backend:
el SSH ahora se hace al host de Hostinger, no a `srv1334142.hetzner.com`.

---

## 1. Contexto y decisión arquitectónica

### 1.1. ¿Por qué solo el frontend?

El proyecto tiene tres componentes con restricciones de hosting muy diferentes:

| Componente | Tecnología | Restricción | ¿Va a Netlify? |
|------------|-----------|-------------|-----------------|
| **Frontend** | React 19 + Vite (build estático) | Cualquier CDN | ✅ Sí |
| **Backend** | Go 1.22 + Fiber | TCP socket persistente, JWT, binarios nativos | ❌ No (sigue en Hostinger) |
| **Geodatabase** | PostgreSQL 15 + PostGIS 3.4 | Extensiones nativas, sistema de archivos | ❌ No (sigue en Hostinger) |
| **Tiles ortofoto** | 2.378 archivos XYZ (259 MB) | Volumen persistente en el VPS | ❌ No (sigue en Hostinger) |

**Netlify está optimizado para servir HTML/CSS/JS estático + funciones serverless**.
Los binarios Go y PostGIS no corren en Netlify. La estrategia correcta es **separar
frontend y backend** y dejar que Netlify proxie `/api/*`, `/health` y `/tiles/*` al
backend existente en Hostinger.

### 1.2. Lo que cambia (y lo que no)

| Antes | Después |
|-------|---------|
| `https://geodatabase.mcconsultorias.com.co/` → Nginx (VPS) | `https://geodatabase.mcconsultorias.com.co/` → **Netlify** |
| `/api/*` → Go/Fiber (VPS, red Docker interna) | `/api/*` → **proxy Netlify → Go/Fiber (Hostinger)** |
| `/health` → Go/Fiber | `/health` → **proxy Netlify → Go/Fiber** |
| `/tiles/*` → Nginx → volumen Docker | `/tiles/*` → **proxy Netlify → Nginx (Hostinger)** |

El usuario final **no nota diferencia**: misma URL, mismo comportamiento, mismo certificado TLS (Let's Encrypt sigue vigente — Netlify lo gestiona automáticamente al configurar el dominio custom).

---

## 2. Pre-requisitos

### 2.1. Cuentas y accesos

- [ ] **Cuenta en Netlify** (https://app.netlify.com) — el plan Free es suficiente para SPA estática.
- [ ] **Acceso al panel de DNS del dominio** `mcconsultorias.com.co` (para apuntar el subdominio `geodatabase` a Netlify).
- [ ] **Acceso SSH/SFTP al VPS de Hostinger** (para verificar que el backend sigue arriba antes del cutover y para reiniciar el contenedor si es necesario).
- [ ] **Credenciales del panel de Hostinger** (hPanel — https://hpanel.hostinger.com) para acceder al VPS y a la gestión DNS.
- [ ] **Acceso al repositorio Git** (GitHub, GitLab o Bitbucket) donde está el código del frontend.

### 2.2. Estado del backend (antes del cutover) — BLOQUEANTE

⚠️ **Importante:** según el Reporte de Despliegue (25-jun-2026), el backend estaba
caído. Este paso es **BLOQUEANTE** — no se debe migrar a Netlify con el backend
caído, porque el resultado será un frontend inerte que no puede mostrar datos.

Antes del cutover, ejecutar desde cualquier terminal:

```bash
curl -I https://geodatabase.mcconsultorias.com.co/health
# Esperado: HTTP/1.1 200 OK

curl -s https://geodatabase.mcconsultorias.com.co/api/resumen
# Esperado: JSON con el resumen institucional

curl -I https://geodatabase.mcconsultorias.com.co/api/zonas
# Esperado: HTTP/1.1 200 OK (puede ser 401 si requiere auth)
```

Si alguno falla, **restablecer primero el backend en Hostinger** (ver §4).

### 2.3. Repositorio Git

El repositorio debe tener los archivos de configuración para Netlify (commiteados en este PR):

- ✅ `03-frontend/netlify.toml` — **creado y actualizado en este commit** (apunta a Hostinger)
- ✅ `03-frontend/public/_redirects` — **creado y actualizado en este commit**
- ✅ `03-frontend/public/_headers` — **creado en este commit**
- ✅ `03-frontend/.env.production` — **actualizado al nuevo dominio**
- ✅ `03-frontend/package.json` — con scripts `build` y `dev` (existente)

Si el repositorio no está aún en GitHub/GitLab, hacer un `git init` y `git push` antes de continuar.

---

## 3. Configuración del sitio en Netlify (paso a paso)

### 3.1. Crear el sitio

1. Ir a https://app.netlify.com/start
2. **"Import an existing project"** → seleccionar el proveedor Git (GitHub/GitLab/Bitbucket)
3. Autorizar a Netlify el acceso al repositorio
4. Seleccionar el repositorio del proyecto (`geovisor-luruaco` o equivalente)

### 3.2. Configurar el build (lectura desde `netlify.toml`)

Netlify detectará automáticamente las instrucciones del archivo `netlify.toml` ya commiteado:

| Campo | Valor (leído del archivo) |
|-------|---------------------------|
| Base directory | `03-frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Node version | `22` |
| `VITE_API_URL` | `https://geodatabase.mcconsultorias.com.co` |

**No es necesario cambiar nada** — el `netlify.toml` del repositorio es la fuente de verdad.

### 3.3. Variables de entorno (opcional)

`netlify.toml` ya define `VITE_API_URL` en la sección `[build.environment]`, así
que **no es necesario** configurar variables de entorno adicionales en el panel.

Si por alguna razón se quiere cambiar la URL de la API (por ejemplo, para
desplegar a un dominio de staging), se puede sobreescribir en:
`Site settings → Environment variables → Add variable`:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://geodatabase.mcconsultorias.com.co` |

### 3.4. Primer deploy

Netlify ejecutará automáticamente:
1. `npm ci` — instala dependencias (usa `package-lock.json` para build determinístico).
2. `npm run build` — ejecuta `tsc -b && vite build` → produce `dist/`.
3. Publica el contenido de `dist/` en una URL temporal tipo `https://<random-name>.netlify.app`.

Verificar en la pestaña **"Deploys"** que el build terminó en verde ✅.

### 3.5. Configurar el dominio custom

1. **Site settings → Domain management → Add custom domain**
2. Escribir: `geodatabase.mcconsultorias.com.co`
3. Netlify detectará que el dominio ya existe y preguntará cómo se quiere gestionar el DNS:
   - **Opción A — Netlify DNS (recomendado):** Netlify se convierte en el servidor DNS autoritativo del subdominio. Migrar el registro NS de `geodatabase` al panel de Netlify.
   - **Opción B — External DNS:** dejar el DNS en el registrador actual y agregar un registro CNAME:
     - `geodatabase.mcconsultorias.com.co CNAME <tu-sitio>.netlify.app`
4. Netlify provisionará automáticamente un **certificado TLS** vía Let's Encrypt (gratuito, renovación automática cada 60 días).

**Importante sobre DNS:** la zona DNS de `mcconsultorias.com.co` puede estar
gestionada en el panel de Hostinger (junto con el VPS) o en el registrador del
dominio (GoDaddy, Namecheap, etc.). Verificar dónde están los registros NS
antes de modificar nada.

### 3.6. Verificación post-despliegue

Una vez que Netlify muestra el sitio como "Live":

```bash
# 1. HTTPS al dominio principal
curl -I https://geodatabase.mcconsultorias.com.co/
# Esperado: HTTP/2 200, server: Netlify

# 2. Proxy de la API
curl -I https://geodatabase.mcconsultorias.com.co/api/zonas
# Esperado: HTTP/2 200 (proxy al backend de Hostinger)

# 3. Health check
curl -s https://geodatabase.mcconsultorias.com.co/health
# Esperado: {"status":"ok",...}

# 4. Tiles de la ortofoto
curl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png
# Esperado: HTTP/2 200, content-type: image/png

# 5. Carga la SPA en el navegador y verifica la consola
#    que no haya errores CORS ni 404.
```

---

## 4. Configuración del backend en Hostinger (sin cambios necesarios)

El backend **no se toca**. Sigue corriendo como hasta ahora en el VPS de Hostinger.

### 4.1. Acceso al VPS de Hostinger

Para tareas de mantenimiento (reiniciar contenedores, ver logs, aplicar
actualizaciones), acceder al VPS por SSH:

```bash
# Desde una terminal con acceso SSH al VPS:
ssh -p <puerto> root@srv1668992.hstgr.cloud
# o usar la IP directa:
ssh -p <puerto> root@2.24.97.152
```

El puerto SSH no es 22 por defecto en Hostinger (varía según configuración).
Consultar el panel de Hostinger → VPS → Acceso SSH.

### 4.2. CORS del backend

Verificar que el backend Go (en `02-backend/main.go` y `auth.go`) tiene
configurado correctamente el origen de Netlify como permitido:

```bash
# En el VPS de Hostinger:
cat ~/geovisor-luruaco/02-backend/.env
# Confirmar que CORS_ALLOW_ORIGINS incluye el dominio nuevo
```

Si el backend se desplegó con `CORS_ALLOW_ORIGINS=*` (default para dev), no
hace falta cambiar. Si está restringido a un dominio específico, agregar:

```bash
CORS_ALLOW_ORIGINS=https://geodatabase.mcconsultorias.com.co
```

Y reiniciar el contenedor:

```bash
cd ~/geovisor-luruaco
docker-compose -f docker-compose.prod.yml restart backend
```

### 4.3. Tiles de la ortofoto

Los tiles (`/tiles/14/8623/12031.png`, etc.) viven en el volumen persistente
del VPS de Hostinger. Las redirecciones en `netlify.toml` los proxean
transparentemente, así que el frontend no nota el cambio. **No hace falta
migrar los tiles.**

Si en algún momento el volumen de tiles crece mucho (>10 GB), considerar
moverlos a un CDN dedicado (Bunny.net, Cloudflare R2, AWS S3 + CloudFront).
Para el estado actual (2.378 tiles, 259 MB), el proxiado por Netlify es
más que suficiente.

### 4.4. Health check del backend

El endpoint `/health` ya está implementado en `02-backend/main.go`:

```go
app.Get("/health", func(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status":    "ok",
        "message":   "Luruaco API funcionando",
        "timestamp": time.Now().Format(time.RFC3339),
    })
})
```

**Importante:** este endpoint no verifica la conexión a la base de datos, solo
que el proceso Go esté vivo. Para un health check real (con verificación de BD),
considerar añadir una query `SELECT 1` antes de retornar.

---

## 5. Rollback (si algo sale mal)

Netlify permite hacer rollback a un deploy anterior en **un solo click**:

1. **Deploys** → seleccionar el deploy anterior al problemático
2. Click en **"Publish deploy"**
3. Netlify restaura la versión anterior en menos de 30 segundos

Si el problema es del backend (no de Netlify), el rollback de Netlify no
ayuda — hay que ir al VPS de Hostinger y restaurar el contenedor manualmente.

---

## 6. Costos y plan recomendado

| Plan | Precio | Características | ¿Suficiente? |
|------|--------|-----------------|---------------|
| **Free (Starter)** | $0/mes | 100 GB bandwidth, 300 build-minutos, HTTPS automático | ✅ Sí para este proyecto |
| Pro | $19/mes | 1 TB bandwidth, Forms, Identity, Functions | Solo si se añaden funciones serverless |

El plan Free es más que suficiente para la SPA actual (~5 MB de bundle +
assets + tiles proxiados). El ancho de banda consumido es el del tráfico
de usuarios reales a la plataforma, no el de los tiles (que se proxean
pero el costo de transfer lo paga Netlify desde el free tier).

**Costo del backend en Hostinger:** depende del plan VPS contratado
(Cloud Startup, Cloud Professional, etc.). Verificar en el panel de
Hostinger.

---

## 7. Resumen de cambios en el repositorio

Archivos **creados** en este commit:

| Archivo | Propósito |
|---------|-----------|
| `03-frontend/netlify.toml` | Configuración principal (build, redirects, headers) — actualizado a Hostinger |
| `03-frontend/public/_redirects` | Redirects declarativos (respaldo legible) — actualizado a Hostinger |
| `03-frontend/public/_headers` | Headers de seguridad y caché (respaldo legible) |
| `docs/GUIA-DESPLIEGUE-NETLIFY.md` | Esta guía paso a paso — v1.1 (Hostinger) |
| `docs/GUIA-DESPLIEGUE-NETLIFY.docx` | Esta guía en formato DOCX |

Archivos **modificados**:

| Archivo | Cambio |
|---------|--------|
| `03-frontend/.env.production` | `VITE_API_URL` apunta al dominio; comentario actualizado a Hostinger |

Archivos **no modificados** (siguen como estaban):

- `02-backend/**` — backend sin cambios (sigue en Hostinger)
- `04-base-de-datos/**` — esquema y migraciones sin cambios
- `docker-compose.prod.yml` — sigue orquestando backend + PostGIS + tiles en el VPS
- `01-ARQUITECTURA.md`, `06-DESPLIEGUE.md`, `10-INFRAESTRUCTURA-PRODUCCION.md` — **REQUIEREN ACTUALIZACIÓN** para reflejar que el backend ahora está en Hostinger, no en Hetzner (ver §8)

---

## 8. Actualizaciones recomendadas a otros documentos

Los siguientes documentos del repositorio mencionan "Hetzner" como proveedor
de hosting del backend y deben actualizarse para mantener la coherencia:

| Documento | Cambio requerido |
|-----------|-----------------|
| `01-ARQUITECTURA.md` | "VPS: srv1334142 (Hetzner)" → "VPS: srv1668992.hstgr.cloud (Hostinger, IP 2.24.97.152)" |
| `06-DESPLIEGUE.md` | Sección "Infraestructura" y todas las menciones a Hetzner |
| `10-INFRAESTRUCTURA-PRODUCCION.md` | "Opción recomendada: VPS único (Hetzner CX32)" → reescribir para Hostinger |
| `02-backend/README.md` | Mención a Railway como alternativa; agregar Hostinger como host primario |
| `02-backend/.env` | Comentario sobre el host (ya correcto en `DB_HOST=localhost`) |

Esta actualización es **documental, no técnica** — el código y los
archivos de configuración no cambian, solo las descripciones en texto.

---

## 9. Verificación final antes de cerrar el ticket

### 9.1. Pre-despliegue

- [ ] Repositorio commiteado y pusheado a GitHub/GitLab.
- [ ] Backend en Hostinger responde `/health` con 200 OK.
- [ ] Backend en Hostinger responde `/api/resumen` con JSON válido.
- [ ] CORS del backend permite el dominio `geodatabase.mcconsultorias.com.co`.
- [ ] Cuenta en Netlify creada y vinculada al repositorio.
- [ ] DNS del subdominio `geodatabase` localizado (Hostinger o registrador).

### 9.2. Post-despliegue

- [ ] Sitio creado en Netlify con build verde.
- [ ] Dominio custom configurado con TLS activo (HTTPS sin warnings).
- [ ] `curl https://geodatabase.mcconsultorias.com.co/api/zonas` responde 200.
- [ ] `curl https://geodatabase.mcconsultorias.com.co/health` responde 200.
- [ ] `curl https://geodatabase.mcconsultorias.com.co/tiles/.../...png` responde 200 image/png.
- [ ] SPA carga en el navegador sin errores en la consola.
- [ ] Pruebas de humo del Anexo 2 (login, vista de zonas, dashboard) funcionan.
- [ ] Anexo 2 (Capturas) regenerado con screenshots reales del frontend en Netlify.

### 9.3. Documentación contractual

- [ ] Regenerar Anexo 1 (Informe Técnico) si cambió la fecha o el estado de despliegue.
- [ ] Regenerar Reporte de Despliegue tras la verificación post-Netlify.
- [ ] Actualizar `01-ARQUITECTURA.md`, `06-DESPLIEGUE.md`, `10-INFRAESTRUCTURA-PRODUCCION.md` para reflejar Hostinger (no Hetzner).
- [ ] Archivar esta guía en el expediente contractual del UTL:001.

---

*Documento generado el 2 de julio de 2026 (versión 1.1 — backend en Hostinger) como parte del procedimiento de despliegue en Netlify del frontend del Contrato UTL:001.*
