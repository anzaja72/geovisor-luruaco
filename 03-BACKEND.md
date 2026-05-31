# ⚙️ Backend API REST

## Tecnologías
- **Lenguaje:** Go 1.22
- **Framework:** Fiber v2.52.13
- **Driver PostgreSQL:** lib/pq
- **CORS:** Habilitado para cualquier origen

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
Response: GeoJSON FeatureCollection (puntos de monitoreo)
```

### Lotes de Bioaumentación
```
GET /api/lotes
Response: GeoJSON FeatureCollection

GET /api/lotes/:id
Response: GeoJSON Feature
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

```bash
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_USER=eco_admin
DB_PASSWORD=EcoRest2024!
DB_NAME=restauracion_ecologica
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
