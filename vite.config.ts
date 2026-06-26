import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const FACE_LIVENESS_API_KEY = process.env.VITE_FACE_LIVENESS_API_KEY ?? ''

if (!FACE_LIVENESS_API_KEY) {
  throw new Error('VITE_FACE_LIVENESS_API_KEY is required. Copy frontend/.env.example to frontend/.env and fill it in.')
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'face-liveness-proxy',
      configureServer(server) {
        server.middlewares.use('/face-liveness', async (req, res) => {
          const apiPath = req.url!.replace(/^\/face-liveness/, '') || '/'
          const url = `https://a8rgaq8bv0.execute-api.us-east-1.amazonaws.com/prod/face-liveness${apiPath}`
          const headers: Record<string, string> = {
            'X-Api-Key': FACE_LIVENESS_API_KEY,
          }
          if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'] as string
          if (req.headers['accept']) headers['accept'] = req.headers['accept'] as string

          try {
            const response = await fetch(url, {
              method: req.method,
              headers,
            })

            res.statusCode = response.status
            response.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })
            res.setHeader('Access-Control-Allow-Origin', '*')

            const body = await response.text()
            res.end(body)
          } catch {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Proxy error' }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
