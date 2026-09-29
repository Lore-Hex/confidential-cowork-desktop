import { expect, test } from "bun:test"
import { boundedJSON, startConfidentialBridge } from "./confidential-bridge"

test("bounded upstream JSON accepts valid data and cancels oversized bodies", async () => {
  expect(await boundedJSON(Response.json({ ok: true }), 32)).toEqual({ ok: true })
  let cancelled = false
  const response = new Response(
    new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(64))
      },
      cancel() {
        cancelled = true
      },
    }),
  )
  await expect(boundedJSON(response, 32)).rejects.toThrow("too large")
  expect(cancelled).toBe(true)
})

test("SDK bridge preserves streams and tools while enforcing privacy", async () => {
  const requests: { url: string; body: Record<string, unknown>; authorization: string | null }[] = []
  const bridge = await startConfidentialBridge({
    readKey: async () => "real-secret",
    fetch: async (input, init) => {
      const url = String(input)
      expect(new URL(url).origin).toBe("https://api.confidential.trustedrouter.com")
      if (url.endsWith("/models")) return Response.json({ data: [] })
      requests.push({
        url,
        body: JSON.parse(String(init?.body)),
        authorization: new Headers(init?.headers).get("authorization"),
      })
      expect(init?.redirect).toBe("error")
      return new Response('data: {"choices":[{"delta":{"tool_calls":[{"id":"call_1"}]}}]}\n\ndata: [DONE]\n\n', {
        headers: { "Content-Type": "text/event-stream" },
      })
    },
  })
  try {
    const response = await fetch(`${bridge.url}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${bridge.token}` },
      body: JSON.stringify({
        model: "trustedrouter/confidential",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
        provider: { data_collection: "allow" },
      }),
    })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("call_1")
    expect(requests).toHaveLength(1)
    expect(requests[0].url).toBe("https://api.confidential.trustedrouter.com/v1/chat/completions")
    expect(requests[0].authorization).toBe("Bearer real-secret")
    expect(requests[0].body.provider).toEqual({ min_privacy: "confidential", data_collection: "deny" })
    expect(requests[0].body).not.toHaveProperty("store")
  } finally {
    await bridge.stop()
  }
})

test("unauthorized, cross-origin and oversized calls cannot reach inference", async () => {
  let reads = 0
  const bridge = await startConfidentialBridge({
    maxBytes: 32,
    readKey: async () => {
      reads++
      return "secret"
    },
    fetch: async () => Response.json({ data: [] }),
  })
  try {
    expect((await fetch(`${bridge.url}/models`)).status).toBe(401)
    expect(
      (
        await fetch(`${bridge.url}/models`, {
          headers: { authorization: `Bearer ${bridge.token}`, origin: "https://evil.test" },
        })
      ).status,
    ).toBe(401)
    const headers = { authorization: `Bearer ${bridge.token}` }
    expect((await fetch(`${bridge.url}/auth/keys`, { method: "POST", headers })).status).toBe(404)
    expect((await fetch(`${bridge.url}/responses`, { method: "POST", headers, body: "x".repeat(33) })).status).toBe(413)
    expect(reads).toBe(0)
  } finally {
    await bridge.stop()
  }
})

test("upstream failure body cannot leak credentials or prompt content", async () => {
  const bridge = await startConfidentialBridge({
    readKey: async () => "secret",
    fetch: async (input) => {
      expect(new URL(String(input)).origin).toBe("https://api.confidential.trustedrouter.com")
      if (String(input).endsWith("/models")) return Response.json({ data: [] })
      expect(String(input)).toBe("https://api.confidential.trustedrouter.com/v1/responses")
      return new Response("secret prompt", { status: 503 })
    },
  })
  try {
    const response = await fetch(`${bridge.url}/responses`, {
      method: "POST",
      headers: { authorization: `Bearer ${bridge.token}` },
      body: JSON.stringify({ model: "trustedrouter/confidential", input: "hi" }),
    })
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain("secret")
  } finally {
    await bridge.stop()
  }
})

test("network failures never fall back to another API host", async () => {
  const urls: string[] = []
  const bridge = await startConfidentialBridge({
    readKey: async () => "secret",
    fetch: async (input) => {
      urls.push(String(input))
      if (String(input).endsWith("/models")) return Response.json({ data: [] })
      throw new TypeError("fetch failed")
    },
  })
  try {
    const response = await fetch(`${bridge.url}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${bridge.token}` },
      body: JSON.stringify({ model: "trustedrouter/confidential", messages: [] }),
    })
    expect(response.status).toBe(502)
    expect(urls).toEqual([
      "https://api.confidential.trustedrouter.com/v1/models",
      "https://api.confidential.trustedrouter.com/v1/chat/completions",
    ])
  } finally {
    await bridge.stop()
  }
})
