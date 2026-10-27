import { describe, expect, test } from "bun:test"
import { ConfidentialConfig } from "../../src/config/confidential"

const capability = {
  baseURL: "http://127.0.0.1:43210/v1",
  token: "x".repeat(64),
  models: ["nyte/confidential", "moonshotai/kimi-k2.7"],
}

describe("confidential V2 configuration", () => {
  test("defines only the bridge provider and explicit tool approval", () => {
    const { info } = ConfidentialConfig.document(JSON.stringify(capability))
    expect(Object.keys(info.providers!)).toEqual(["trustedrouter"])
    expect(info.providers!.trustedrouter.name).toBe("NY Token Exchange")
    expect(info.providers!.trustedrouter.settings!.baseURL).toBe(capability.baseURL)
    expect(info.providers!.trustedrouter.package).toBe("@opencode/ai/providers/openai-compatible")
    expect(Object.keys(info.providers!.trustedrouter.models!)).toEqual(capability.models)
    expect(String(info.model?.providerID)).toBe("trustedrouter")
    expect(String(info.model?.model)).toBe("nyte/confidential")
    expect(info.permissions).toEqual([{ action: "*", resource: "*", effect: "ask" }])
    expect(info.share).toBe("disabled")
    expect(info.update).toBe("disable")
    expect(info.warming).toBe(false)
    expect(info.plugins).toEqual([])
    expect(info.mcp).toEqual({})
  })

  test.each([
    "https://api.trustedrouter.com/v1",
    "http://localhost:43210/v1",
    "http://0.0.0.0:43210/v1",
    "http://127.0.0.1/v1",
    "http://u:p@127.0.0.1:43210/v1",
    "http://127.0.0.1:43210/v1?q=1",
    "http://127.0.0.1:43210/v1#x",
    "http://127.0.0.1:43210/",
    "file:///v1",
  ])("rejects unowned endpoint %s", (baseURL) => {
    expect(() => ConfidentialConfig.document(JSON.stringify({ ...capability, baseURL }))).toThrow()
  })

  test.each([
    { token: "short" },
    { models: [] },
    { models: ["other/model"] },
    { models: [...capability.models, "bad\nmodel"] },
  ])("fails closed for malformed capability %j", (patch) => {
    expect(() => ConfidentialConfig.document(JSON.stringify({ ...capability, ...patch }))).toThrow()
  })

  test("caller cannot inject provider settings or plugin declarations", () => {
    const { info } = ConfidentialConfig.document(
      JSON.stringify({
        ...capability,
        plugins: ["evil"],
        providers: { openai: {} },
        permissions: [{ effect: "allow" }],
      }),
    )
    expect(Object.keys(info.providers!)).toEqual(["trustedrouter"])
    expect(info.plugins).toEqual([])
    expect(info.permissions![0].effect).toBe("ask")
  })
})
