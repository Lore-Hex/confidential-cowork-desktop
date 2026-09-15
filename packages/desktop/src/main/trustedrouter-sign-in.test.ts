import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { TrustedRouterSignIn } from "./trustedrouter-sign-in"

test("browser sign-in checks state, exchanges S256 through SDK, and saves only the key", async () => {
  let challenge = ""
  const saved: unknown[] = []
  const flow = new TrustedRouterSignIn({
    port: 0,
    openBrowser: async (value) => {
      const url = new URL(value)
      expect(url.origin + url.pathname).toBe("https://trustedrouter.com/auth")
      challenge = url.searchParams.get("code_challenge")!
      const callback = new URL(url.searchParams.get("callback_url")!)
      const bad = new URL(callback)
      bad.searchParams.set("state", "invalid")
      bad.searchParams.set("code", "stolen")
      expect((await fetch(bad)).status).toBe(400)
      callback.searchParams.set("code", "authorized-code")
      expect((await fetch(callback)).status).toBe(200)
      expect((await fetch(callback)).status).toBe(400)
    },
    fetch: async (input, init) => {
      expect(String(input)).toBe("https://trustedrouter.com/v1/auth/keys")
      expect(init?.redirect).toBe("error")
      const body = JSON.parse(String(init?.body))
      expect(body.code).toBe("authorized-code")
      expect(body.code_challenge_method).toBe("S256")
      expect(createHash("sha256").update(body.code_verifier).digest("base64url")).toBe(challenge)
      return Response.json({ key: "sk-tr-test-key-value12345678", data: {} })
    },
    saveKey: async (key) => {
      saved.push(key)
    },
  })
  await flow.start()
  expect(saved).toEqual(["sk-tr-test-key-value12345678"])
})

test("cancelled sign-in never exchanges or persists keys", async () => {
  let calls = 0
  const flow = new TrustedRouterSignIn({
    port: 0,
    openBrowser: async () => {
      void flow.cancel()
    },
    fetch: async () => {
      calls++
      return Response.json({})
    },
    saveKey: async () => {
      calls++
    },
  })
  await expect(flow.start()).rejects.toThrow("Sign-in could not be completed")
  expect(calls).toBe(0)
})

test("concurrent sign-ins share one browser flow", async () => {
  let opened = 0
  const flow = new TrustedRouterSignIn({
    port: 0,
    timeoutMs: 25,
    openBrowser: async () => {
      opened++
    },
    saveKey: async () => {
      throw new Error("must not save")
    },
  })
  const first = flow.start()
  expect(flow.start()).toBe(first)
  await expect(first).rejects.toThrow()
  expect(opened).toBe(1)
})
