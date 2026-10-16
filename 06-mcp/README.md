# Servidor MCP — Geodatabase Luruaco

Permite que la C.R.A. consulte la geodatabase desde **Claude** o **ChatGPT** (Model Context
Protocol, transporte *Streamable HTTP*). Versión 1: **solo lectura**.

```
Claude / ChatGPT ──HTTPS──▶ Traefik ──▶ mcp (:8090) ──HTTP interno──▶ backend Go (/api) ──▶ PostGIS
```

- **No toca PostGIS**: no tiene credenciales de base de datos. Cada herramienta es una llamada a la
  API REST existente con el JWT *del propio usuario*; por eso el filtrado de capas sensibles y la
  verificación de cuenta en cada petición siguen siendo los del backend.
- **Solo `tecnico` y `administrador`**. El rol `consulta` recibe `403` (en el login OAuth no se
  emite código, y en `/mcp` se rechaza). El rol y el estado de la cuenta se releen del backend en
  **cada** petición: desactivar a alguien o bajarle el rol corta su acceso de inmediato.
- Stdlib de Go únicamente (sin dependencias externas).

## Herramientas

| Herramienta | Backend | Qué devuelve |
|---|---|---|
| `resumen_proyecto` | `GET /api/resumen` | Resumen del proyecto (opc. `periodo`) |
| `indicadores_restauracion` | `GET /api/restauracion/indicadores` | Indicadores por `fecha` de campaña (y `cobertura`) |
| `listar_parcelas` | `GET /api/puntos` | Puntos/parcelas de monitoreo (`solo_parcelas`, `limite`) |
| `listar_coberturas` | `GET /api/coberturas` | Coberturas vegetales |
| `fauna_grupos` | `GET /api/fauna/grupos` | Fauna por grupo |
| `fauna_observaciones` | `GET /api/fauna/observaciones` | Observaciones (filtro `grupo`, `limite`) |
| `limpiezas_maleza` | `GET /api/maleza/limpiezas` | Jornadas de limpieza |
| `mediciones_ficorremediacion` | `GET /api/ficor/mediciones` | Agua/sedimentos/biota (filtro `campana`) |
| `actividades_gobernanza` | `GET /api/gobernanza/actividades` | Actividades y participantes |
| `listar_capas` / `capa_geojson` | `GET /api/capas`, `/api/capas/geojson` | Inventario y GeoJSON de una capa |
| `consultar_copiloto` | `POST /api/copiloto` | Respuesta del copiloto a una pregunta |

Todas llevan `readOnlyHint: true`. No hay herramientas de escritura, de importación ni de
administración de usuarios.

## Autenticación

**OAuth 2.1** (authorization code + PKCE S256, registro dinámico de clientes). El cliente abre una
página de inicio de sesión del propio servidor; el usuario entra con su correo y contraseña de la
geodatabase (validado contra `usuarios` vía `/api/auth/login`). Los `redirect_uri` solo se aceptan
para los hosts de `MCP_REDIRECT_HOSTS` (claude.ai, chatgpt.com…).

Alternativa mínima para pruebas o scripts: enviar como `Authorization: Bearer` el JWT de
`POST /api/auth/login` del backend; se valida igual (rol y cuenta) en cada llamada.

Los access tokens (12 h) están firmados con `MCP_TOKEN_SECRET`; no se emiten *refresh tokens*:
al vencer, el cliente repite el inicio de sesión.

## Límites y auditoría

- **Límite de peticiones**: `MCP_RATE_PER_MIN` (60) por usuario; 10/min por IP en `/authorize`
  y sobre `/mcp` antes de autenticar. Excedido → `429` + `Retry-After`.
- **Tope de respuesta**: `MCP_MAX_RESPONSE_BYTES` (200 000). Si el resultado no cabe, se recorta
  la lista más larga y se añade `_aviso`.
- **Auditoría**: una línea JSON por evento en stdout (`docker logs geodb-mcp`) y en
  `MCP_AUDIT_FILE` (volumen `mcp_audit`): `ts, evento, usuario_id, email, rol, ip, tool, args,
  estado, bytes, truncado, ms`. Se registran también logins, denegaciones por rol y límites.
  Las contraseñas no se registran; los argumentos de texto se recortan a 200 caracteres.

## Variables de entorno

Ver [`.env.example`](.env.example). Obligatorias: `MCP_TOKEN_SECRET` (≥32 caracteres,
`openssl rand -hex 32`) y `MCP_PUBLIC_URL`.

## Despliegue (pendiente de confirmación — no se ha desplegado)

1. DNS: registro `A` de `mcp.luruacorenace.online` → IP del VPS.
2. En `/opt/geovisor/.env` añadir `MCP_TOKEN_SECRET=$(openssl rand -hex 32)`.
3. `docker compose -f docker-compose.vps.yml up -d --build mcp`
4. Comprobar: `curl https://mcp.luruacorenace.online/.well-known/oauth-authorization-server`

El servicio `mcp` está en `docker-compose.vps.yml`, detrás de Traefik, sin publicar puertos.

## Conectarlo

**Claude** (claude.ai → Configuración → Conectores → *Añadir conector personalizado*):
URL `https://mcp.luruacorenace.online/mcp`. Claude abrirá la página de inicio de sesión; entre con
una cuenta técnica o de administrador. En Claude Code:
`claude mcp add --transport http luruaco https://mcp.luruacorenace.online/mcp`.

**ChatGPT** (Configuración → Conectores/Apps → modo desarrollador → *Crear* conector MCP):
URL `https://mcp.luruacorenace.online/mcp`, autenticación **OAuth** (registro dinámico). Inicie
sesión con la misma cuenta. Requiere plan con conectores MCP personalizados habilitados.

## Pruebas

```bash
cd 06-mcp && go test ./...
```

Cubren: `consulta` → 403 (JWT directo y flujo OAuth, sin código emitido); técnico/administrador
reciben capas sensibles porque el MCP reenvía su propio JWT; cuenta desactivada → 401 y rol
degradado → 403 en la siguiente petición; PKCE y código de un solo uso; `redirect_uri` y `Origin`
no permitidos; límite de peticiones; tope de tamaño; herramientas solo lectura.

## Fuera de alcance (versión 1)

Escritura/carga de datos, administración de usuarios, *refresh tokens*, flujo SSE (GET /mcp).
El límite de intentos de login es en memoria (se reinicia con el contenedor).
