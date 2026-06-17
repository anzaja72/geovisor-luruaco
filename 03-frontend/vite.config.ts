import { createReadStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiMiddleware } from './src/mock/mockApi'

// Plugin de desarrollo: sirve /api/* con datos de demostración SOLO si se pide
// con USE_MOCK=1. Por defecto, /api se redirige al backend Go (server.proxy).
function mockApi(): Plugin {
  return {
    name: 'mock-api-dev',
    apply: 'serve',
    configureServer(server) {
      if (process.env.USE_MOCK === '1') server.middlewares.use(mockApiMiddleware)
    },
  }
}

// Sirve los tiles de la ortofoto (../tiles) en desarrollo, igual que Nginx
// sirve /tiles/ en producción.
function serveTiles(): Plugin {
  const tilesDir = resolve(__dirname, '..', 'tiles')
  return {
    name: 'serve-tiles-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (!url.startsWith('/tiles/')) return next()
        const file = resolve(tilesDir, '.' + url.slice('/tiles'.length))
        if (!file.startsWith(tilesDir) || !existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApi(), serveTiles()],
  server: {
    // Permite servir bajo dominios de túnel (cloudflared/ngrok) para demos en línea.
    allowedHosts: true,
    // Mismo origen: /api se redirige al backend Go (cuando VITE_API_URL queda vacío).
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
