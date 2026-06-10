# 🌿 Geodatabase - Restauración Ecológica Ciénaga de Luruaco

**Proyecto:** Geovisor Ecológico Luruaco  
**Cliente:** MC Consultorías / Fundación ProNature  
**Responsable:** Ángel Zambrano Jaraba  
**Fecha:** Junio 2026  
**Versión:** 3.0

---

## 📋 Índice de Documentación

- [▶️ Cómo correr el proyecto en local](./00-COMO-CORRER.md)
1. [Arquitectura del Sistema](./01-ARQUITECTURA.md)
2. [Base de Datos PostGIS](./02-BASE-DE-DATOS.md)
3. [Backend API REST](./03-BACKEND.md)
4. [Frontend Geovisor](./04-FRONTEND.md)
5. [Datos Espaciales](./05-DATOS-ESPACIALES.md)
6. [Guía de Despliegue](./06-DESPLIEGUE.md)
7. [Diseño UI/UX](./07-DISENO-UI-UX.md)
8. [Referencias y Recursos](./08-REFERENCIAS.md)
9. [Registro de cambios](./09-CAMBIOS.md)

---

## 🎯 Resumen Ejecutivo

Sistema completo de geodatabase espacial para monitorear proyectos de restauración ecológica en la Ciénaga de Luruaco, Atlántico, Colombia.

### Estado Actual
- ✅ Base de datos PostGIS operativa
- ✅ Backend API REST funcional
- ✅ Frontend geovisor desplegado
- ✅ Datos reales del lote de bioaumentación cargados

### URLs de Acceso
| Servicio | Dev (local) | Prod |
|----------|-------------|------|
| Geovisor | http://localhost:5173 | http://187.77.4.10:8081 |
| API | http://localhost:8080 | http://187.77.4.10:8080 |

> Para correrlo localmente, ver **[00-COMO-CORRER.md](./00-COMO-CORRER.md)**.

---

## 📁 Estructura del Proyecto

```
spatial-eco-db/
├── backend/          # API REST en Go
├── frontend/         # React + Leaflet
├── db/               # Scripts SQL
└── docker-compose.yml
```

---

*Documentación generada por Alfred (OpenClaw) - Mayo 2026*
