import { createReadStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiMiddleware } from './src/mock/mockApi'

// Plugin de desarrollo: sirve /api/* con datos de demostración cuando no se
// define VITE_API_URL, para poder trabajar el front sin levantar el backend.
function mockApi(): Plugin {
  return {
    name: 'mock-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(mockApiMiddleware)
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
})
