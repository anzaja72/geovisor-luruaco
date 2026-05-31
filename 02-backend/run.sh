#!/bin/bash

# Script para compilar y ejecutar el servidor Luruaco API

set -e

echo "🚀 Iniciando Luruaco API - Restauración Ecológica"
echo "=================================================="

# Verificar que Go esté instalado
if ! command -v go &> /dev/null; then
    if [ -f /usr/local/go/bin/go ]; then
        export PATH=$PATH:/usr/local/go/bin
    else
        echo "❌ Go no está instalado. Por favor instala Go primero."
        exit 1
    fi
fi

echo "✅ Go version: $(go version)"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
go get github.com/gofiber/fiber/v2
go get github.com/gofiber/fiber/v2/middleware/cors
go get github.com/joho/godotenv
go get github.com/lib/pq

# Descargar módulos
echo ""
echo "⬇️  Descargando módulos..."
go mod tidy

# Compilar
echo ""
echo "🔨 Compilando..."
go build -o luruaco-api main.go

echo ""
echo "✅ Compilación exitosa!"
echo ""

# Ejecutar
echo "🌐 Iniciando servidor en http://localhost:8080"
echo "   Endpoints disponibles:"
echo "   - GET /health"
echo "   - GET /api/zonas"
echo "   - GET /api/zonas/:id"
echo "   - GET /api/zonas/:id/puntos"
echo ""

./luruaco-api