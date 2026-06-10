# Frontend — Geovisor Luruaco

Visor web del índice de calidad (dashboard departamental tipo ICAM) para la
geodatabase de restauración ecológica de la Ciénaga de Luruaco.

**Stack:** React 19 · TypeScript · Vite 8 · Leaflet 5 · gráficas SVG.

## Requisitos
- Node.js 20+ y npm.

## Puesta en marcha

```bash
npm install

# Opción A — con el backend Go corriendo en :8080
echo 'VITE_API_URL=http://localhost:8080' > .env.local
npm run dev          # http://localhost:5173

# Opción B — sin backend (datos de demostración)
# No definas VITE_API_URL: Vite sirve un mock de /api/* automáticamente.
npm run dev
```

## Scripts

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo (HMR) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | ESLint (flat config) |

## Estructura

Ver `../04-FRONTEND.md` para el detalle de carpetas (`src/lib`, `src/hooks`,
`src/components`, `src/mock`) y el modelo de datos.

## Variables de entorno

`VITE_API_URL` — URL base del backend. Si se omite en dev, se usa el mock.
Plantilla en `.env.example`.
