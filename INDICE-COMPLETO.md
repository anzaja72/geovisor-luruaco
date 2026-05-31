# 📁 Índice Completo - Proyecto Geodatabase Luruaco

**Carpeta:** Proyectos Alfred > gdb  
**Fecha:** 29 de mayo de 2026  
**Responsable:** Ángel Zambrano Jaraba

---

## 📂 Estructura de Archivos

### 📄 Documentación Principal (Raíz)

| Archivo | Descripción |
|---------|-------------|
| **README.md** | Índice general del proyecto |
| **RESUMEN-EJECUTIVO.md** | Resumen ejecutivo con métricas |
| **01-ARQUITECTURA.md** | Diagramas de arquitectura y flujos |
| **02-BASE-DE-DATOS.md** | Esquema PostGIS y tablas |
| **03-BACKEND.md** | Documentación API REST en Go |
| **04-FRONTEND.md** | Documentación React + Leaflet |
| **05-DATOS-ESPACIALES.md** | Coordenadas y polígonos del lote |
| **06-DESPLIEGUE.md** | Guía de instalación y despliegue |
| **07-DISENO-UI-UX.md** | Referencias de diseño moderno |
| **08-REFERENCIAS.md** | Recursos y enlaces útiles |
| **schema-completo.sql** | Script SQL completo de la base de datos |

---

### 📁 01-codigo-fuente

Archivos principales del proyecto:

| Archivo | Descripción |
|---------|-------------|
| README.md | README principal del proyecto |
| docker-compose.yml | Configuración Docker |
| lote_bioaumentacion.kmz | Archivo KML original de Google Earth |
| cargar_lote_bioaumentacion.sql | Script SQL para cargar el lote |

---

### 📁 02-backend

Código fuente del backend (Go + Fiber):

| Archivo | Descripción |
|---------|-------------|
| main.go | Código fuente principal del API |
| go.mod | Módulos Go |
| go.sum | Checksums de dependencias |
| railway.json | Configuración para Railway |
| run.sh | Script de ejecución |
| README.md | Documentación del backend |
| RAILWAY_DEPLOY.md | Guía de despliegue en Railway |
| .env | Variables de entorno local |
| .env.supabase | Configuración para Supabase |

---

### 📁 03-frontend

Código fuente del frontend (React + TypeScript + Leaflet):

| Archivo | Descripción |
|---------|-------------|
| package.json | Dependencias npm |
| package-lock.json | Lock de dependencias |
| tsconfig.json | Configuración TypeScript |
| tsconfig.app.json | Config TS de la app |
| tsconfig.node.json | Config TS de Node |
| vite.config.ts | Configuración Vite |
| index.html | HTML principal |
| README.md | Documentación del frontend |
| .env.local | Variables de entorno local |
| .env.production | Variables de producción |
| src/main.tsx | Punto de entrada React |
| src/App.tsx | Componente principal |
| src/App.css | Estilos de la app |
| src/index.css | Estilos globales |

---

### 📁 04-base-de-datos

Scripts y configuración de la base de datos:

| Archivo | Descripción |
|---------|-------------|
| 01_init_schema.sql | Script inicial de creación de tablas |
| docker-compose.yml | Configuración Docker de PostGIS |
| schema-completo.sql | Schema completo con datos y funciones |

---

### 📁 05-configuracion

Archivos de configuración y visores:

| Archivo | Descripción |
|---------|-------------|
| visor-bioaumentacion.html | Visor HTML estático de bioaumentación |
| README.md | README del proyecto |

---

## 🌐 URLs del Sistema

| Servicio | URL |
|----------|-----|
| Geovisor | http://187.77.4.10:8081 |
| API Backend | http://187.77.4.10:8080 |
| Health Check | http://187.77.4.10:8080/health |

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Zonas registradas | 3 |
| Lotes de bioaumentación | 1 |
| Área total monitoreada | 206.81 hectáreas |
| Puntos de referencia | 5 |
| Endpoints API | 6 |
| Archivos documentados | 30+ |

---

## 🚀 Próximos Pasos

1. Configurar SSL/HTTPS
2. Apuntar dominio geo.angelzambrano.co
3. Implementar autenticación de usuarios
4. Agregar más capas de datos (IGAC, IDEAM)
5. Crear app móvil (PWA)

---

*Índice generado por Alfred (OpenClaw)*  
*29 de mayo de 2026*
