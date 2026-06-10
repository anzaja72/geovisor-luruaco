# ⚙️ Backend API REST

## Tecnologías
- **Lenguaje:** Go 1.22
- **Framework:** Fiber v2.52.13
- **Driver PostgreSQL:** lib/pq
- **Entorno:** godotenv (carga `.env`)
- **CORS:** Configurable vía `CORS_ALLOW_ORIGINS` (por defecto `*` en dev)

## Estructura del Código

```
backend/
├── main.go          # Código fuente principal
├── go.mod           # Módulos Go
├── .env             # Variables de entorno local
├── .env.supabase    # Config para Supabase
├── railway.json     # Config despliegue Railway
├── run.sh           # Script de ejecución
└── luruaco-api      # Binario compilado
```

## Endpoints

### Health Check
```
GET /health
Response: {"status": "ok", "message": "Luruaco API funcionando", "timestamp": "..."}
```

### Zonas de Restauración
```
GET /api/zonas
Response: GeoJSON FeatureCollection

GET /api/zonas/:id
Response: GeoJSON Feature

GET /api/zonas/:id/puntos
Response: GeoJSON FeatureCollection (puntos de una zona)

GET /api/puntos
Response: GeoJSON FeatureCollection (todos los puntos de monitoreo/control)
```

### Lotes de Bioaumentación
```
GET /api/lotes
Response: GeoJSON FeatureCollection

GET /api/lotes/:id
Response: GeoJSON Feature
```

### Resumen (dashboard)
```
GET /api/resumen?periodo=2024-2
Response: {
  "periodo": "2024-2",
  "sitios_visitados": 3,
  "sitios_reportados": 3,
  "categorias": [{"categoria":"adecuada","cantidad":2,"porcentaje":66.6}, ...]
}
```

## Estructuras de Datos

```go
type FeatureCollection struct {
    Type     string    `json:"type"`
    Features []Feature `json:"features"`
}

type Feature struct {
    Type       string                 `json:"type"`
    Geometry   json.RawMessage        `json:"geometry"`
    Properties map[string]interface{} `json:"properties"`
}
```

## Variables de Entorno

Ver plantilla en `02-backend/.env.example`. La contraseña **solo** viene del
entorno (no hay valor por defecto en el binario).

```bash
PORT=8080
# Opción A: cadena completa
DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require
# Opción B: variables sueltas
DB_HOST=localhost
DB_PORT=5432
DB_USER=eco_admin
DB_PASSWORD=          # obligatoria; sin default
DB_NAME=restauracion_ecologica
DB_SSLMODE=disable
# CORS (usa tu dominio en producción)
CORS_ALLOW_ORIGINS=http://localhost:5173
```

## Comandos

```bash
# Compilar
go build -o luruaco-api main.go

# Ejecutar
./luruaco-api

# Ver logs
tail -f server.log
```

## Middleware

- **CORS:** Permite cualquier origen
- **Logger:** Registra todas las peticiones
- **Recovery:** Recupera de panics
