# 🏗️ Arquitectura del Sistema

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                             │
│                  (Navegador Web / Móvil)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  🌐 FRONTEND (React 19 + TypeScript + Leaflet 5)                │
│  • Dashboard departamental (estilo ICAM) con mapa y gráficas     │
│  • Escala de calidad, KPIs, dona y barras (SVG)                  │
│  • Diseño responsive (móvil/desktop)                             │
│  • Dev: Vite en puerto 5173 · Prod: build estático en dist/      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API REST (JSON/GeoJSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ BACKEND (Go 1.22 + Fiber)                                   │
│  • API RESTful                                                   │
│  • Endpoints: /health, /api/zonas, /api/lotes                    │
│  • Conexión a PostGIS                                            │
│  • Puerto: 8080                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ SQL/PostGIS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  🗄️ BASE DE DATOS (PostgreSQL 15 + PostGIS 3.4)                 │
│  • Extensión geoespacial                                         │
│  • Tablas: poligonos_restauracion, lotes_bioaumentacion         │
│  • SRID 4326 (WGS84)                                             │
│  • Puerto: 5432                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tecnologías Utilizadas

### Backend
- **Lenguaje:** Go 1.22
- **Framework:** Fiber v2.52.13
- **Driver PostgreSQL:** lib/pq
- **CORS:** Habilitado para cualquier origen

### Frontend
- **Framework:** React 19
- **Lenguaje:** TypeScript
- **Build Tool:** Vite 8
- **Mapas:** Leaflet 1.9 + React-Leaflet 5 (basemaps Esri)
- **Gráficas:** SVG/CSS puro (sin librería de charting)
- **Estilos:** CSS puro con variables (tema ICAM)

### Base de Datos
- **Motor:** PostgreSQL 15
- **Extensión:** PostGIS 3.4
- **Tipo de datos:** GEOMETRY (Polygon, Point)
- **SRID:** 4326 (WGS84)

### Infraestructura
- **VPS:** srv1334142 (Hetzner)
- **OS:** Ubuntu 22.04 LTS
- **IP:** 187.77.4.10

## Diagrama de Flujo de Datos

### 1. Carga Inicial
```
Usuario → Frontend → GET /api/zonas → Backend → PostGIS
                                              ↓
Usuario ← Render Mapa ← GeoJSON ←─────────────┘
```

### 2. Visualización de Detalles
```
Click en Polígono → Frontend → GET /api/zonas/:id → Backend → PostGIS
                                                          ↓
Popup Info ← Datos JSON ←─────────────────────────────────┘
```

## Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/zonas` | GET | Listar todas las zonas |
| `/api/zonas/:id` | GET | Obtener zona específica |
| `/api/zonas/:id/puntos` | GET | Puntos de monitoreo |
| `/api/lotes` | GET | Listar lotes de bioaumentación |
| `/api/lotes/:id` | GET | Obtener lote específico |
| `/api/resumen` | GET | Totales y conteo/proporción por categoría de calidad (filtro `?periodo=`) |
