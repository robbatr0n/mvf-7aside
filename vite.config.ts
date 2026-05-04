import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'node:http'

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE') return resolve(undefined)
    let raw = ''
    req.on('data', (chunk: Buffer) => { raw += String(chunk) })
    req.on('end', () => {
      try { resolve(JSON.parse(raw)) } catch { resolve({}) }
    })
  })
}

export default defineConfig(({ mode }) => {
  // Load all .env variables (not just VITE_ prefixed) so DATABASE_URL
  // is available in process.env when API modules are loaded via ssrLoadModule
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-dev',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url ?? '/'
            if (!url.startsWith('/api/')) return next()

            const sep = url.indexOf('?', 5)
            const pathname = sep === -1 ? url.slice(5) : url.slice(5, sep)
            const queryStr = sep === -1 ? '' : url.slice(sep + 1)

            const body = await parseBody(req)
            const query: Record<string, string | string[]> = {}
            for (const [k, v] of new URLSearchParams(queryStr)) {
              const existing = query[k]
              query[k] =
                existing === undefined
                  ? v
                  : Array.isArray(existing)
                    ? [...existing, v]
                    : [existing, v]
            }

            const vReq = Object.assign(req, { body, query })
            const vRes = Object.assign(res, {
              status(code: number) {
                res.statusCode = code
                return vRes
              },
              json(data: unknown) {
                if (!res.headersSent) {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                }
                return vRes
              },
            })

            try {
              const mod = await server.ssrLoadModule(`/api/${pathname}.ts`)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
              await (mod.default as Function)(vReq, vRes)
            } catch (err) {
              console.error(`[api-dev] /api/${pathname}`, err)
              if (!res.headersSent) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Internal server error' }))
              }
            }
          })
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  }
})
