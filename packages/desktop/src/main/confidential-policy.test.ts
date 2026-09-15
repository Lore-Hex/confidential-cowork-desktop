import { describe, expect, test } from "bun:test"
import { CONFIDENTIAL_MODEL, confidentialModels, confidentialRequest } from "./confidential-policy"

const endpoint = {
  usage_type: "Credits",
  privacy_tier: 3,
  provider_e2ee: true,
  provider_confidential_compute: true,
  supported_parameters: ["tools"],
}
const model = (changes = {}) => ({
  id: "kimi/test",
  trustedrouter: { supports_chat: true, route_kind: "model", endpoints: [{ ...endpoint, ...changes }] },
})

describe("confidential model boundary", () => {
  test("includes only qualifying prepaid tool models and the confidential alias", () => {
    expect([...confidentialModels({ data: [model()] })]).toEqual([CONFIDENTIAL_MODEL, "kimi/test"])
  })
  for (const changes of [
    { usage_type: "BYOK" },
    { privacy_tier: 2 },
    { provider_e2ee: false },
    { provider_confidential_compute: false },
    { supported_parameters: [] },
  ]) {
    test(`rejects endpoint ${JSON.stringify(changes)}`, () => {
      expect([...confidentialModels({ data: [model(changes)] })]).toEqual([CONFIDENTIAL_MODEL])
    })
  }
  test("fails closed on malformed catalog", () => {
    expect(() => confidentialModels({ error: "unavailable" })).toThrow()
  })
  test("enforces privacy even when request asks for weaker settings", () => {
    const tools = [{ type: "function", function: { name: "read_file" } }]
    const body = confidentialRequest(
      {
        model: CONFIDENTIAL_MODEL,
        tools,
        provider: { min_privacy: "none", data_collection: "allow", only: ["other"] },
      },
      new Set([CONFIDENTIAL_MODEL]),
    )
    expect(body.provider).toEqual({ min_privacy: "confidential", data_collection: "deny" })
    expect(body).not.toHaveProperty("store")
    expect(body.tools).toEqual(tools)
  })
  test("only Responses carries store=false, never Chat Completions", () => {
    const input = { model: CONFIDENTIAL_MODEL, store: false }
    const allowed = new Set([CONFIDENTIAL_MODEL])
    expect(confidentialRequest(input, allowed)).not.toHaveProperty("store")
    expect(confidentialRequest(input, allowed, true).store).toBe(false)
  })
  for (const patch of [
    { model: "openai/gpt-test" },
    { models: ["other"] },
    { store: true },
    { previous_response_id: "secret" },
    { conversation: "old" },
    { background: true },
    { base_url: "https://other.test" },
  ]) {
    test(`rejects request override ${JSON.stringify(patch)}`, () => {
      expect(() =>
        confidentialRequest({ model: CONFIDENTIAL_MODEL, ...patch }, new Set([CONFIDENTIAL_MODEL])),
      ).toThrow()
    })
  }
})
