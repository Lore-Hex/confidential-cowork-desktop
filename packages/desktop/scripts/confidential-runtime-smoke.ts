import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { startConfidentialProcess } from "../src/main/service/confidential-process"
import { confidentialEnvironment, confidentialRuntimeConfig } from "../src/main/confidential-runtime"

const root = await mkdtemp(join(tmpdir(), "trusted-cowork-runtime-"))
let calls = 0
const provider = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    assert.equal(new URL(request.url).pathname, "/v1/chat/completions")
    assert.equal(request.headers.get("authorization"), `Bearer ${"x".repeat(64)}`)
    const body = (await request.json()) as { model: string; stream?: boolean }
    assert.equal(body.model, "trustedrouter/confidential")
    calls++
    const result = {
      id: "test-completion",
      object: "chat.completion",
      created: 1,
      model: body.model,
      choices: [{ index: 0, message: { role: "assistant", content: "PONG" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }
    if (!body.stream) return Response.json(result)
    return new Response(
      `data: ${JSON.stringify({ ...result, object: "chat.completion.chunk", choices: [{ index: 0, delta: { role: "assistant", content: "PONG" }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
      {
        headers: { "content-type": "text/event-stream" },
      },
    )
  },
})
const config = confidentialRuntimeConfig(`http://127.0.0.1:${provider.port}/v1`, "x".repeat(64), [
  "trustedrouter/confidential",
  "moonshotai/kimi-k2.7",
])
let runtime: Awaited<ReturnType<typeof startConfidentialProcess>> | undefined
try {
  await writeFile(
    join(root, "opencode.json"),
    JSON.stringify({
      model: "openai/gpt-5",
      provider: { openai: { options: { apiKey: "must-not-be-used" } } },
      permission: "allow",
    }),
  )
  runtime = await startConfidentialProcess(
    [resolve(process.argv[2] ?? "resources/opencode-cli")],
    confidentialEnvironment(root, config),
  )
  const read = async (path: string, body?: unknown) => {
    const url = new URL(path, runtime!.url)
    url.searchParams.set("location[directory]", root)
    const response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        Authorization: `Basic ${Buffer.from(`opencode:${runtime!.password}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(30_000),
    })
    const text = await response.text()
    assert.ok(response.ok, `${path}: ${response.status} ${text}`)
    return text ? JSON.parse(text) : undefined
  }
  const selected = await read("/api/model/default")
  assert.equal(selected.data.providerID, "trustedrouter")
  assert.equal(selected.data.id, "trustedrouter/confidential")
  const providers = await read("/api/provider")
  assert.deepEqual(
    providers.data.map((p: { id: string }) => p.id),
    ["trustedrouter"],
  )
  const models = await read("/api/model")
  assert.deepEqual(models.data.map((m: { id: string }) => m.id).sort(), [
    "moonshotai/kimi-k2.7",
    "trustedrouter/confidential",
  ])
  const generated = await read("/api/experimental/generate", { prompt: "Reply PONG" })
  assert.equal(generated.data.text, "PONG")
  assert.equal(calls, 1)
  const session = await read("/api/session", { location: { directory: root } })
  const permission = await read(`/api/session/${session.data.id}/permission`, {
    action: "shell",
    resources: ["echo PONG"],
    save: ["echo *"],
    metadata: {},
  })
  assert.equal(permission.data.effect, "ask", "tool permission must not auto-allow")
  const pending = (await read(`/api/session/${session.data.id}/permission`)).data
  assert.equal(pending.length, 1)
  assert.equal(pending[0].id, permission.data.id)
  await read(`/api/session/${session.data.id}/permission/${pending[0].id}/reply`, { decision: "reject" })
  assert.deepEqual((await read(`/api/session/${session.data.id}/permission`)).data, [])
  console.log(
    "PASS: compiled runtime restricts models, ignores project overrides, completes inference and requires tool approval",
  )
} finally {
  await runtime?.stop()
  await provider.stop(true)
  await rm(root, { recursive: true, force: true })
}
