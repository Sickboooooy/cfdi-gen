import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin que simula las funciones serverless de Vercel en dev local
function devApiPlugin(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/grok', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        const grokKey = env.GROK_API_KEY
        if (!grokKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'GROK_API_KEY no configurada en .env' }))
          return
        }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          try {
            const { messages, max_tokens = 4000 } = JSON.parse(Buffer.concat(chunks).toString())
            const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
              body: JSON.stringify({ model: 'grok-3', max_tokens, messages }),
            })
            const data = await upstream.json()
            if (!upstream.ok || data.error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: data.error?.message || 'Error Grok API' }))
              return
            }
            const content = data.choices?.[0]?.message?.content || ''
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ content }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devApiPlugin(env)],
    build: {
      sourcemap: false,
      esbuildOptions: {
        drop: ['console', 'debugger'],
      },
    },
  }
})
