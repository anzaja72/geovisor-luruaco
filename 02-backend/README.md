# Luruaco API - EcoRestore Backend

API REST para geovisor de restauración ecológica con PostGIS.

## Tecnologías
- Go 1.22+
- Fiber (web framework)
- PostgreSQL + PostGIS
- pgx (driver PostgreSQL)

## Variables de Entorno

```bash
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

## Endpoints

- `GET /health` - Health check
- `GET /api/zonas` - Listar todas las zonas (GeoJSON)
- `GET /api/zonas/:id` - Zona específica
- `GET /api/zonas/:id/puntos` - Puntos de monitoreo

## Despliegue

### Local
```bash
go mod tidy
go run main.go
```

### Railway
```bash
railway login
railway init
railway up
```

## Estructura de Datos

Tablas PostGIS:
- `eco_restauracion.poligonos_restauracion` - Zonas poligonales
- `eco_restauracion.puntos_monitoreo` - Puntos de monitoreo