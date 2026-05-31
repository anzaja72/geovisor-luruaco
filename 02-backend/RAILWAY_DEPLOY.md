# Railway Deployment Guide

## 1. Crear cuenta en Railway
- Ir a https://railway.app
- Registrarse con GitHub

## 2. Crear proyecto
```bash
# Instalar CLI de Railway
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto (dentro de /backend)
cd backend
railway init

# Crear variables de entorno
railway variables set DATABASE_URL="postgres://..."
```

## 3. Desplegar
```bash
railway up
```

## 4. Obtener URL
```bash
railway domain
```

## Variables de Entorno Necesarias
- `DATABASE_URL`: URL de conexión PostgreSQL con PostGIS
- `PORT`: Puerto (Railway lo asigna automáticamente)

## Notas
- El backend escucha en el puerto asignado por Railway
- CORS está configurado para permitir cualquier origen