import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'

interface SignInOptions {
  openBrowser(url: string): Promise<void>
  saveKey(key: unknown): Promise<void>
  fetch?: typeof fetch
  port?: number
  timeoutMs?: number
}

/** Authorization state and keys never cross renderer IPC or enter persistent logs. */
export class TrustedRouterSignIn {
  private pending?: Promise<void>
  private controller?: AbortController

  constructor(private readonly options: SignInOptions) {}

  start(): Promise<void> {
    if (this.pending) return this.pending
    const controller = new AbortController()
    this.controller = controller
    this.pending = this.run(controller.signal).finally(() => {
      this.pending = undefined
      this.controller = undefined
    })
    return this.pending
  }

  async cancel(): Promise<void> {
    this.controller?.abort()
    await this.pending?.catch(() => {})
  }

  private async run(signal: AbortSignal): Promise<void> {
    const verifier = randomBytes(32).toString('base64url')
    const state = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const server = createServer()
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(this.options.port ?? 3000, '127.0.0.1', () => {
          server.removeListener('error', reject)
          resolve()
        })
      }).catch(() => { throw new Error('Could not start sign-in. Close the app using port 3000 and retry, or use an API key.') })
      if (signal.aborted) throw new Error('Sign-in cancelled.')
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Could not start sign-in.')
      const host = `127.0.0.1:${address.port}`
      const callback = new URL(`http://${host}/trcc/oauth`)
      callback.searchParams.set('state', state)
      const authorize = new URL('https://trustedrouter.com/auth')
      authorize.searchParams.set('callback_url', callback.href)
      authorize.searchParams.set('code_challenge', challenge)
      authorize.searchParams.set('code_challenge_method', 'S256')
      authorize.searchParams.set('key_label', 'TR Confidential Cowork')

      const code = await new Promise<string>((resolve, reject) => {
        const abort = (): void => reject(new Error('Sign-in cancelled.'))
        signal.addEventListener('abort', abort, { once: true })
        timer = setTimeout(() => reject(new Error('Sign-in timed out. Please try again.')), this.options.timeoutMs ?? 300_000)
        let consumed = false
        server.on('request', (request, response) => {
          response.setHeader('Cache-Control', 'no-store')
          response.setHeader('Content-Type', 'text/plain; charset=utf-8')
          response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
          response.setHeader('Referrer-Policy', 'no-referrer')
          let url: URL
          try { url = new URL(request.url ?? '/', callback.origin) }
          catch { response.writeHead(400).end('Invalid sign-in callback.'); return }
          const received = url.searchParams.get('state') ?? ''
          const validState = /^[A-Za-z0-9_-]{43}$/.test(received) && timingSafeEqual(Buffer.from(received), Buffer.from(state))
          if (consumed || request.method !== 'GET' || request.headers.host !== host || url.pathname !== callback.pathname ||
              url.origin !== callback.origin || url.searchParams.getAll('state').length !== 1 || !validState) {
            response.writeHead(400).end('Invalid sign-in callback.')
            return
          }
          const value = url.searchParams.get('code')
          if (url.searchParams.has('error') || !value || value.length > 4096 || url.searchParams.getAll('code').length !== 1) {
            consumed = true
            response.writeHead(400).end('Sign-in was not completed. Return to TR Confidential Cowork.')
            reject(new Error('Sign-in was not approved. Please try again.'))
            return
          }
          consumed = true
          response.writeHead(200).end('Return to TR Confidential Cowork to finish signing in. You can close this tab.')
          signal.removeEventListener('abort', abort)
          resolve(value)
        })
        void this.options.openBrowser(authorize.href).catch(() => reject(new Error('Could not open your browser. Please try again.')))
      })
      if (signal.aborted) throw new Error('Sign-in cancelled.')
      const response = await (this.options.fetch ?? fetch)('https://trustedrouter.com/v1/auth/keys', {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      }).catch(() => { throw new Error('Could not complete sign-in. Please try again.') })
      if (!response.ok) throw new Error('TrustedRouter could not complete sign-in. Please try again.')
      const body: unknown = await response.json().catch(() => { throw new Error('Invalid sign-in response.') })
      if (signal.aborted) throw new Error('Sign-in cancelled.')
      if (!body || typeof body !== 'object' || !('key' in body)) throw new Error('Invalid sign-in response.')
      clearTimeout(timer)
      await this.options.saveKey(body.key)
    } finally {
      clearTimeout(timer)
      server.close()
      server.closeAllConnections()
    }
  }
}
