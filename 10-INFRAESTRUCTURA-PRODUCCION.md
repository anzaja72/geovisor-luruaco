# 🏗️ Infraestructura de Producción — Operación por 1 año

**Sistema:** Geovisor SIG Restauración Ecológica – Ciénaga de Luruaco
**Fecha:** Junio 2026 · **Responsable:** Ángel Zambrano Jaraba

---

## 1. Dimensionamiento recomendado (12 meses de operación)

El sistema es liviano (API Go + SPA estática + PostGIS con pocos GB de vectores).
El único elemento pesado es la **ortofoto (8.9 GB + 2.7 GB GeoTIFF)**, que se sirve
como **tiles estáticos pre-generados** (no consume CPU en runtime, solo disco).

### Opción recomendada: VPS único (Hetzner CX32 o equivalente)

| Recurso | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| vCPU | 2 | **4** | picos de importación/reportes |
| RAM | 4 GB | **8 GB** | PostGIS + contenedores + margen |
| Disco SSD | 80 GB | **160 GB** | ortofotos (12 GB) + tiles (~15–25 GB) + BD + backups 14 días |
| Transferencia | 1 TB/mes | 20 TB/mes (incluida Hetzner) | tiles de mapa |
| SO | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS | |

### Costo estimado anual

| Concepto | Mensual (USD) | Anual (USD) |
|---|---:|---:|
| VPS 4 vCPU / 8 GB / 160 GB (Hetzner CX32 ≈ €7.6 / DO ≈ $48 — rango) | 8 – 48 | **96 – 576** |
| Dominio (.com/.co) | — | 12 – 40 |
| TLS (Let's Encrypt) | 0 | **0** |
| Backups externos (Backblaze B2 / Hetzner Storage Box, 100 GB) | 1 – 4 | 12 – 48 |
| Monitoreo (UptimeRobot free / Healthchecks.io free) | 0 | 0 |
| **TOTAL** | | **≈ USD 120 – 660 / año** |

> Con Hetzner el escenario completo queda en **≈ USD 130–180/año**. El VPS actual
> (`187.77.4.10`, srv1334142) puede reutilizarse si cumple ≥4 GB RAM y ≥80 GB SSD.

### Alternativa gestionada (menos administración, más costo)
Railway/Render (backend) + Neon/Supabase (PostGIS) + Cloudflare Pages (frontend) + R2 (tiles):
≈ USD 25–40/mes (**300–480/año**). Útil si no se quiere administrar el VPS.

---

## 2. Arquitectura productiva

```
Internet ──HTTPS──► Nginx host (certbot/Let's Encrypt, dominio)
                      │ proxy :443 → :80
              ┌───────▼────────── docker-compose.prod.yml ──────────────┐
              │  frontend (nginx)  ─ /api → backend ─ postgis (interno) │
              │       │ /tiles → volumen ./tiles (ortofoto)             │
              │  backup (pg_dump diario, retención 14 días → ./backups) │
              └─────────────────────────────────────────────────────────┘
```

- **PostGIS no expone puerto público** (solo red interna del compose).
- JWT + roles protegen el API; CORS restringido al dominio.
- Backups diarios locales + **copia semanal fuera del VPS** (rclone → B2/Storage Box).

---

## 3. Procedimiento de despliegue (VPS Ubuntu)

```bash
# 1. Dependencias
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx git

# 2. Código
git clone https://github.com/anzaja72/geovisor-luruaco.git && cd geovisor-luruaco

# 3. Secretos
cat > .env <<EOF
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@tu-entidad.gov.co
ADMIN_PASSWORD=<contraseña-fuerte>
CORS_ALLOW_ORIGINS=https://geovisor.tu-dominio.com
EOF

# 4. Levantar
docker compose -f docker-compose.prod.yml up -d --build

# 5. Dominio + TLS (Nginx del host como proxy 443→80)
sudo certbot --nginx -d geovisor.tu-dominio.com
```

## 4. Pipeline de la ortofoto (una sola vez, en el VPS)

```bash
sudo apt install -y gdal-bin
# Descargar los GeoTIFF desde Drive al VPS (rclone o gdown)
gdal_translate -of COG "Ortofoto predio completo 100 Ha.tif" ortofoto_cog.tif  # opcional
gdal2tiles.py -z 12-21 --processes=4 ortofoto_cog.tif ./tiles/ortofoto
# El visor la consume como capa XYZ:  /tiles/ortofoto/{z}/{x}/{y}.png
```

MDT/DSM (4.7 MB c/u, ya descargados en `datos-dron/`): generar sombreado
`gdaldem hillshade MDT.tif hillshade.tif` y publicar igual que la ortofoto.

## 5. Operación y monitoreo (rutina anual)

| Tarea | Frecuencia | Herramienta |
|---|---|---|
| Healthcheck `/health` + uptime | continuo | UptimeRobot (gratis) |
| Backup BD | diario (automático) | servicio `backup` del compose |
| Copia de backups fuera del VPS | semanal | `rclone sync ./backups b2:gdb-backups` |
| Actualización de imágenes Docker | mensual | `docker compose pull && up -d` |
| Parches del SO | mensual | `unattended-upgrades` |
| Renovación TLS | automática | certbot.timer |
| Prueba de restauración de backup | trimestral | `pg_restore` en contenedor efímero |
| Rotación de credenciales | semestral | `.env` + reinicio |

## 6. Seguridad aplicada

- HTTPS obligatorio (Let's Encrypt), HTTP→HTTPS redirect.
- Autenticación JWT con roles (administrador/técnico/consulta); contraseñas bcrypt.
- PostGIS sin exposición pública; usuario único de aplicación.
- `ufw`: solo 22 (SSH con llave), 80, 443.
- CORS restringido al dominio productivo.
