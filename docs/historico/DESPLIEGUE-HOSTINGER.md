# 🚀 Despliegue en VPS Hostinger — Geovisor Luruaco

Guía paso a paso para dejar la plataforma en producción sobre un **VPS Hostinger KVM 4**
(4 vCPU / 16 GB / 200 GB NVMe, Ubuntu 24.04) con **dominio + HTTPS + backup externo**.

> Perfil de carga objetivo: ~2000 visitas/día (holgado). Lo pesado es disco (ortofoto +
> tiles), no CPU. Los tiles los sirve Nginx como estáticos.

---

## 0. Antes de empezar (ten a mano)

- [ ] Dominio registrado (ej. `geovisor.tu-entidad.gov.co` o `geo.angelzambrano.co`).
- [ ] Acceso al panel DNS del dominio.
- [ ] Cuenta en **Backblaze B2** (o Hetzner Storage Box) para backups externos.
- [ ] Los GeoTIFF de la ortofoto en Google Drive (para descargar al VPS).
- [ ] Una **contraseña de admin fuerte** para la app.

---

## 1. Contratar el VPS

1. Hostinger → VPS → **KVM 4**, término 24 meses (fija el precio bajo todo el año de operación).
2. **Sistema operativo:** Ubuntu 24.04 LTS (limpio, sin panel).
3. **Ubicación del datacenter:** EE.UU. o Brasil (menor latencia hacia Colombia).
4. Añade tu **llave pública SSH** al crear el servidor (evita contraseña).
5. Anota la **IP pública** del VPS.

---

## 2. Primer acceso y endurecimiento (hardening)

```bash
ssh root@IP_DEL_VPS

# Usuario no-root de operación
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Firewall: solo SSH, HTTP y HTTPS
apt update && apt install -y ufw fail2ban
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Deshabilitar login root y por contraseña
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Actualizaciones de seguridad automáticas
apt install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades
```

A partir de aquí conéctate como `deploy`: `ssh deploy@IP_DEL_VPS`

---

## 3. Instalar dependencias

```bash
sudo apt update && sudo apt install -y \
  docker.io docker-compose-v2 nginx certbot python3-certbot-nginx \
  git gdal-bin rclone
sudo usermod -aG docker deploy    # cerrar y reabrir sesión SSH tras esto
```

---

## 4. Traer el código y configurar secretos

```bash
git clone https://github.com/anzaja72/geovisor-luruaco.git
cd geovisor-luruaco

cat > .env <<EOF
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@tu-entidad.gov.co
ADMIN_PASSWORD=CONTRASEÑA_FUERTE_AQUI
CORS_ALLOW_ORIGINS=https://geovisor.tu-dominio.com
EOF
chmod 600 .env
```

> ⚠️ Guarda `DB_PASSWORD` y `JWT_SECRET` en un gestor de contraseñas. Si pierdes
> `DB_PASSWORD` no podrás abrir los backups.

---

## 5. Ortofoto: generar los tiles (una sola vez)

Descarga los GeoTIFF desde Drive al VPS (con `rclone` o `gdown`) y genera los tiles:

```bash
mkdir -p tiles/ortofoto
gdal2tiles.py -z 12-21 --xyz --processes=4 \
  "Ortofoto predio completo 100 Ha.tif" ./tiles/ortofoto
```

> Alternativa rápida: si ya los generaste en local, sube la carpeta `tiles/` con
> `rsync -avz tiles/ deploy@IP:~/geovisor-luruaco/tiles/`. Ahorra ~1 h de CPU.

---

## 6. Levantar la plataforma

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # los 4 servicios "healthy/up"
curl -s http://localhost/api/health                 # debe responder OK
```

---

## 7. Dominio + HTTPS

1. En el panel DNS del dominio crea un registro **A**:
   `geovisor` → **IP_DEL_VPS** (TTL bajo, ej. 300s, mientras propaga).
2. Espera la propagación (`ping geovisor.tu-dominio.com` debe resolver a la IP).
3. Nginx del host como proxy inverso 443 → contenedor frontend (puerto 80):

```bash
sudo tee /etc/nginx/sites-available/geovisor <<'EOF'
server {
    listen 80;
    server_name geovisor.tu-dominio.com;
    client_max_body_size 200M;   # importar shapefiles/geopackages grandes
    location / { proxy_pass http://127.0.0.1:80; proxy_set_header Host $host; }
}
EOF
sudo ln -s /etc/nginx/sites-available/geovisor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Emitir certificado + forzar HTTPS
sudo certbot --nginx -d geovisor.tu-dominio.com --redirect
```

> El contenedor `frontend` publica el puerto 80 del host. Si prefieres que solo el
> Nginx del host escuche público, cambia en el compose `ports: ["127.0.0.1:8088:80"]`
> y en el proxy apunta a `127.0.0.1:8088`.

---

## 8. Backup externo (fuera del VPS)

El compose ya hace `pg_dump` **diario local** (retención 14 días en `./backups`).
Falta la **copia offsite semanal**. Con Backblaze B2 + rclone:

```bash
rclone config     # crea un remoto "b2" con tu Application Key de Backblaze
```

Timer systemd que sincroniza los dumps a B2 cada noche:

```bash
sudo tee /etc/systemd/system/gdb-backup-offsite.service <<'EOF'
[Unit]
Description=Copia offsite de backups Geovisor a B2
[Service]
Type=oneshot
User=deploy
ExecStart=/usr/bin/rclone sync /home/deploy/geovisor-luruaco/backups b2:gdb-luruaco-backups
EOF

sudo tee /etc/systemd/system/gdb-backup-offsite.timer <<'EOF'
[Unit]
Description=Copia offsite diaria (03:30)
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now gdb-backup-offsite.timer
systemctl list-timers gdb-backup-offsite.timer      # verificar próxima ejecución
```

> **Prueba de restauración (trimestral):** descarga un dump y restáuralo en un
> contenedor efímero con `pg_restore` para confirmar que el backup sirve. Un backup
> nunca probado no es un backup.

---

## 9. Monitoreo de disponibilidad (gratis)

- **UptimeRobot** o **Healthchecks.io**: monitor HTTP cada 5 min a
  `https://geovisor.tu-dominio.com/api/health`. Alerta por correo si cae.

---

## 10. Verificación final (checklist de humo)

- [ ] `https://geovisor.tu-dominio.com` carga con **candado** (TLS válido).
- [ ] HTTP redirige a HTTPS.
- [ ] Login funciona con el admin del `.env`.
- [ ] Se ven las capas (lote, puntos, coberturas, ortofoto del dron).
- [ ] Un reporte (CSV/PDF) descarga con datos reales.
- [ ] `docker compose ps` → 4 servicios arriba; existe un `.dump` en `./backups`.
- [ ] El timer offsite aparece en `systemctl list-timers`.
- [ ] El monitor externo está en verde.

---

## Mantenimiento (rutina)

| Tarea | Frecuencia | Comando / herramienta |
|---|---|---|
| Backup BD local | diario (auto) | servicio `backup` del compose |
| Copia offsite | diario (auto) | timer `gdb-backup-offsite` |
| Actualizar imágenes | mensual | `docker compose -f docker-compose.prod.yml pull && up -d` |
| Parches SO | auto | `unattended-upgrades` |
| Renovación TLS | auto | `certbot.timer` |
| Prueba de restauración | trimestral | `pg_restore` en contenedor efímero |
| Rotar credenciales | semestral | editar `.env` + `up -d` |
