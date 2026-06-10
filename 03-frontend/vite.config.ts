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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApi()],
})
