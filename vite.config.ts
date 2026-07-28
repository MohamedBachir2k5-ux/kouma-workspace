import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { appendFileSync, mkdirSync } from 'fs'
import type { Plugin, ViteDevServer } from 'vite'

const LOG_FILE = '/tmp/kouma-live.ndjson'

function devlogServerPlugin(): Plugin {
  return {
    name: 'devlog-server',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      mkdirSync('./test/e2e', { recursive: true })

      server.middlewares.use('/devlog', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const entry = JSON.parse(body)
            appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8')
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
  plugins: [react(), tailwindcss(), devlogServerPlugin()],
  server: {
    port: 3009,
    watch: {
      ignored: ['**/test/e2e/**'],
    },
  },
})
