import { randomBytes, timingSafeEqual } from "node:crypto"
import { createServer } from "node:http"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { TrustedRouter } from "@lore-hex/trusted-router"
import { confidentialModels, confidentialRequest } from "./confidential-policy"

export async function boundedJSON(response: Response, limit: number) {
  if (!response.body) throw new Error("Empty JSON response")
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > limit) throw new Error("JSON response too large")
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

/** Only this process holds the real API key. The sidecar receives a scoped local capability. */
export async function startConfidentialBridge(options: {
  readKey(): Promise<string>
  fetch?: typeof fetch
  maxBytes?: number
  maxConcurrent?: number
}) {
  const token = randomBytes(32).toString("hex")
  const active = new Set<AbortController>()
  const transport: typeof fetch = (input, init) => (options.fetch ?? fetch)(input, { ...init, redirect: "error" })
  const catalog = new TrustedRouter({
    baseUrl: "https://api.trustedrouter.com/v1",
    fetchImpl: transport,
    maxRetries: 0,
  })
  let cached: { models: Set<string>; expires: number } | undefined
  let pending: Promise<Set<string>> | undefined
  const models = () => {
    if (cached && cached.expires > Date.now()) return Promise.resolve(cached.models)
    if (pending) return pending
    pending = catalog
      .rawRequest("GET", "/models", { timeout: 10_000 })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable")
        const result = confidentialModels(await boundedJSON(response, 32 * 1024 * 1024))
        cached = { models: result, expires: Date.now() + 300_000 }
        return result
      })
      .finally(() => {
        pending = undefined
      })
    return pending
  }
  const server = createServer({ maxHeaderSize: 16_384, requestTimeout: 30_000 }, async (request, response) => {
    response.setHeader("Cache-Control", "no-store")
    const fail = (status: number, message: string, code?: string) => {
      if (response.headersSent) {
        response.destroy()
        return
      }
      response.writeHead(status, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ error: { message, type: "confidential_request_error", code } }))
    }
    const supplied = Buffer.from(request.headers.authorization ?? "")
    const expected = Buffer.from(`Bearer ${token}`)
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected) || request.headers.origin) {
      fail(401, "Unauthorized")
      return
    }
    if (active.size >= (options.maxConcurrent ?? 8)) {
      fail(429, "Too many active requests")
      return
    }
    const controller = new AbortController()
    active.add(controller)
    response.once("close", () => controller.abort())
    request.once("aborted", () => controller.abort())
    const timer = setTimeout(() => controller.abort(), 600_000)
    try {
      if (request.method === "GET" && request.url === "/v1/models") {
        const ids = await models()
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ object: "list", data: [...ids].map((id) => ({ id, object: "model" })) }))
        return
      }
      if (request.method !== "POST" || !["/v1/chat/completions", "/v1/responses"].includes(request.url ?? "")) {
        fail(404, "Unsupported endpoint")
        return
      }
      const chunks: Buffer[] = []
      let bytes = 0
      for await (const chunk of request) {
        bytes += chunk.length
        if (bytes > (options.maxBytes ?? 8 * 1024 * 1024)) {
          fail(413, "Request too large")
          return
        }
        chunks.push(Buffer.from(chunk))
      }
      const body = confidentialRequest(
        JSON.parse(Buffer.concat(chunks).toString("utf8")),
        await models(),
        request.url === "/v1/responses",
      )
      const client = new TrustedRouter({
        apiKey: await options.readKey(),
        baseUrl: "https://api.trustedrouter.com/v1",
        fetchImpl: transport,
        maxRetries: 0,
        regionalFailover: false,
      })
      const upstream = await client.rawRequest("POST", request.url!.slice(3), { body, signal: controller.signal })
      // Do not propagate provider error bodies, which can contain request content or credentials.
      if (!upstream.ok) {
        const failure = await boundedJSON(upstream, 64 * 1024).catch(() => null)
        const candidate = failure?.error?.code ?? failure?.detail?.code ?? failure?.code
        const code = typeof candidate === "string" && /^[a-z_]{1,64}$/.test(candidate) ? candidate : undefined
        fail(
          upstream.status,
          `Confidential inference failed (HTTP ${upstream.status}${code ? `, ${code}` : ""}).`,
          code,
        )
        return
      }
      if (!upstream.body) {
        fail(502, "Empty inference response")
        return
      }
      response.writeHead(200, { "Content-Type": upstream.headers.get("content-type") ?? "application/json" })
      await pipeline(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]), response, {
        signal: controller.signal,
      })
    } catch {
      fail(502, "Confidential inference unavailable. Sign in and select a confidential model.")
    } finally {
      clearTimeout(timer)
      active.delete(controller)
    }
  })
  server.maxConnections = 24
  server.headersTimeout = 10_000
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => resolve())
  })
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Local inference unavailable")
  return {
    url: `http://127.0.0.1:${address.port}/v1`,
    token,
    models,
    invalidate() {
      cached = undefined
      active.forEach((controller) => controller.abort())
    },
    async stop() {
      active.forEach((controller) => controller.abort())
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}
