# 🚀 Guía de Despliegue

## Infraestructura

### VPS
- **Proveedor:** Hetzner
- **IP:** 187.77.4.10
- **OS:** Ubuntu 22.04 LTS
- **Hostname:** srv1334142

### Servicios en Ejecución

| Servicio | Puerto | Estado |
|----------|--------|--------|
| Backend API | 8080 | ✅ Activo |
| Frontend | 8081 | ✅ Activo |
| PostgreSQL+PostGIS | 5432 | ✅ Activo |

## Base de Datos

### Docker
```bash
# Contenedor PostGIS
docker ps | grep postgis

# Acceder a la base de datos
docker exec -it postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica
```

### Credenciales
```
Host: localhost
Puerto: 5432
Usuario: eco_admin
Base de datos: restauracion_ecologica
```

## Backend

### Compilación
```bash
cd ~/spatial-eco-db/backend
export PATH=$PATH:/usr/local/go/bin
go build -o luruaco-api main.go
```

### Ejecución
```bash
# Iniciar servidor
nohup ./luruaco-api > server.log 2>&1 &

# Verificar
curl http://localhost:8080/health
```

### Variables de Entorno
```bash
export PORT=8080
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=eco_admin
export DB_PASSWORD=EcoRest2024!
export DB_NAME=restauracion_ecologica
```

## Frontend

### Build
```bash
cd ~/spatial-eco-db/frontend
npm install
npm run build
```

### Despliegue
```bash
# Copiar archivos compilados
cp -r dist/* ~/public_html/geovisor/

# Iniciar servidor Python
cd ~/public_html/geovisor
python3 -m http.server 8081
```

## Nginx (Configuración Futura)

```nginx
server {
    listen 80;
    server_name geo.angelzambrano.co;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
```

## SSL/HTTPS (Pendiente)
```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Generar certificado
sudo certbot --nginx -d geo.angelzambrano.co
```

## Monitoreo

### Logs
```bash
# Backend
tail -f ~/spatial-eco-db/backend/server.log

# Frontend
tail -f /tmp/frontend_server.log
```

### Health Checks
```bash
# Backend
curl http://localhost:8080/health

# Frontend
curl -I http://localhost:8081

# Base de datos
docker exec postgis-eco-restauracion pg_isready -U eco_admin
```

## Backup

### Base de Datos
```bash
# Backup
docker exec postgis-eco-restauracion pg_dump -U eco_admin restauracion_ecologica > backup.sql

# Restaurar
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < backup.sql
```

### Archivos
```bash
# Backup del proyecto
tar -czf spatial-eco-db-backup.tar.gz ~/spatial-eco-db/
```
