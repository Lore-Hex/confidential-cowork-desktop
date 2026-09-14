// Opt-in diagnostic. Sends only the fixed PONG prompt, never a user's conversation.
const { app, safeStorage } = require("electron")
const { readFile } = require("node:fs/promises")
const { join } = require("node:path")

async function run() {
  if (process.env.TRCC_LIVE_SMOKE !== "1") throw new Error("Set TRCC_LIVE_SMOKE=1 to allow the small paid smoke")
  const root = join(app.getPath("appData"), "com.trustedrouter.cowork.opencodedev")
  app.setName("Trusted Cowork Dev")
  app.setPath("userData", root)
  await app.whenReady()
  if (!safeStorage.isEncryptionAvailable()) throw new Error("System encryption unavailable")
  const key = safeStorage.decryptString(await readFile(join(root, "trustedrouter.credential")))
  const { TrustedRouter } = await import("@lore-hex/trusted-router")
  const client = new TrustedRouter({ apiKey: key, baseUrl: "https://api.trustedrouter.com/v1", maxRetries: 0 })
  const response = await client.rawRequest("POST", "/chat/completions", {
    timeout: 60000, redirect: "error",
    body: { model: "trustedrouter/confidential", messages: [{ role: "user", content: "Reply exactly PONG. Do not use tools." }], max_tokens: 1024, provider: { min_privacy: "confidential", data_collection: "deny" } },
  })
  const body = await response.json()
  console.log("Fixed PONG smoke", response.status, body.model, body.id)
  if (!response.ok || body.choices?.[0]?.message?.content?.trim() !== "PONG") throw new Error("PONG assertion failed")
}
run().then(() => app.exit(0), (error) => { console.error("Local confidential smoke failed", error.name, error.message); app.exit(1) })
