import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { appendFileSync, mkdirSync } from 'fs'
import type { Plugin, ViteDevServer } from 'vite'

const TRACE_FILE = '/tmp/kouma-trace.ndjson'

function traceServerPlugin(): Plugin {
  return {
    name: 'trace-server',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      mkdirSync('./test/e2e', { recursive: true })

      server.middlewares.use('/trace', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const batch: unknown[] = JSON.parse(body)
            if (Array.isArray(batch)) {
              batch.forEach(entry => {
                appendFileSync(TRACE_FILE, JSON.stringify(entry) + '\n', 'utf8')
              })
            }
          } catch {}
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), traceServerPlugin()],
  server: {
    port: 3009,
  },
})
