# 🌿 Geovisor Ecológico Luruaco

Sistema de visualización geográfica para proyectos de restauración ecológica en Luruaco, Atlántico, Colombia.

![Geovisor Luruaco](https://img.shields.io/badge/Stack-Go%20%7C%20React%20%7C%20PostGIS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Descripción

Este proyecto es una aplicación web completa para monitorear y visualizar proyectos de restauración ecológica. Incluye:

- 🗺️ **Mapa interactivo** con polígonos de restauración
- 📍 **Puntos de monitoreo** con datos de biodiversidad
- 📊 **Panel de estadísticas** en tiempo real
- 🔄 **API REST** para integración con otros sistemas

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   PostGIS DB    │
│  (React/Leaflet)│     │   (Go/Fiber)    │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       Port: 5173              Port: 8080            Port: 54322
```

## 🚀 Tecnologías

### Backend
- **Go** (Golang) - Lenguaje principal
- **Fiber** - Web framework
- **PostgreSQL + PostGIS** - Base de datos geoespacial

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Leaflet** - Mapas interactivos
- **Vite** - Build tool

### Infraestructura
- **Docker** - Contenedores
- **Nginx** - Reverse proxy
- **Supabase** - PostgreSQL local

## 📦 Instalación

### Requisitos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo frontend)
- Go 1.21+ (para desarrollo backend)

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/angelzambrano/geovisor-luruaco.git
cd geovisor-luruaco
```

### Paso 2: Iniciar con Docker Compose
```bash
docker-compose up -d
```

### Paso 3: Configurar base de datos
```bash
# Las migraciones se ejecutan automáticamente
# Verificar en: docker-compose logs db
```

### Paso 4: Iniciar backend
```bash
cd backend
go run main.go
```

### Paso 5: Iniciar frontend (desarrollo)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Interfaz web |
| Backend API | http://localhost:8080 | API REST |
| Health Check | http://localhost:8080/health | Estado del sistema |
| API Zonas | http://localhost:8080/api/zonas | Datos GeoJSON |

## 📊 Datos de Ejemplo

El sistema incluye 2 proyectos de restauración:

| Proyecto | Área | Ecosistema | Estado |
|----------|------|------------|--------|
| Reserva Natural Luruaco Norte | 45.5 ha | Bosque Nativo | En Progreso |
| Humedal Laguna de Luruaco | 28.75 ha | Humedal | Planificado |

## 🔧 Configuración

### Variables de Entorno Backend
```env
DB_HOST=localhost
DB_PORT=54322
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
DB_SCHEMA=eco_restauracion
```

### Variables de Entorno Frontend
```env
VITE_API_URL=http://localhost:8080
```

## 📁 Estructura del Proyecto

```
geovisor-luruaco/
├── backend/              # API en Go
│   ├── main.go          # Punto de entrada
│   ├── go.mod           # Dependencias
│   └── README.md        # Documentación backend
├── frontend/            # Aplicación React
│   ├── src/             # Código fuente
│   ├── public/          # Archivos estáticos
│   └── package.json     # Dependencias
├── db/                  # Scripts de base de datos
│   └── init/            # Migraciones SQL
├── docker-compose.yml   # Configuración Docker
└── README.md           # Este archivo
```

## 🗺️ Endpoints API

### Health Check
```http
GET /health
```

### Listar Zonas
```http
GET /api/zonas
```

### Obtener Zona Específica
```http
GET /api/zonas/:id
```

### Listar Puntos de Monitoreo
```http
GET /api/zonas/:id/puntos
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo MIT License.

## 👤 Autor

**Ángel Zambrano Jaraba**
- GitHub: [@angelzambrano81](https://github.com/angelzambrano81)
- Email: angelzambranojaraba@gmail.com

## 🙏 Agradecimientos

- Fundación ProNature
- Corporación Ambiental del Atlántico
- Comunidad de Luruaco

---

⭐ **Si este proyecto te es útil, dale una estrella en GitHub!**
