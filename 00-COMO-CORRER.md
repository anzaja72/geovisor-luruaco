# ▶️ Cómo correr el proyecto en local

Stack: **PostGIS** (Docker) + **backend Go/Fiber** + **frontend React/Vite**.

## Requisitos
- Docker Desktop
- Go 1.22+
- Node.js 20+ y npm

## 1. Base de datos (PostGIS)

```bash
# Levantar el contenedor
docker compose -f 04-base-de-datos/docker-compose.yml up -d

# Aplicar esquema + migración + datos (en orden)
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < schema-completo.sql
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < 04-base-de-datos/02_add_categoria_calidad.sql
docker exec -i postgis-eco-restauracion psql -U eco_admin -d restauracion_ecologica < 04-base-de-datos/03_seed_proyecto.sql
```

Credenciales del contenedor: `eco_admin` / `EcoRest2024!` / `restauracion_ecologica` en `:5432`.

## 2. Backend (Go)

```bash
cd 02-backend
cp .env.example .env      # ajusta DB_PASSWORD=EcoRest2024! para el contenedor de arriba
go build -o luruaco-api .
./luruaco-api             # http://localhost:8080
```

Verificación rápida:
```bash
curl -s http://localhost:8080/health
curl -s http://localhost:8080/api/resumen
```

## 3. Frontend (React)

```bash
cd 03-frontend
npm install
echo 'VITE_API_URL=http://localhost:8080' > .env.local
npm run dev               # http://localhost:5173
```

> Sin `VITE_API_URL`, el front arranca con un **mock de datos** (no necesita backend).

## Notas
- El backend toma la contraseña solo del entorno (`.env`); no hay password por defecto.
- En producción, define `CORS_ALLOW_ORIGINS` con tu dominio (no `*`).
- El build de producción del front (`npm run build`) genera `dist/` (estático).
