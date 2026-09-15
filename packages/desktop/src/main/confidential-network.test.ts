import { expect, test } from "bun:test"
import { confidentialRendererRequest, setConfidentialSidecar } from "./confidential-network"

test("renderer can only contact its own local runtime and packaged assets", () => {
  setConfidentialSidecar("http://127.0.0.1:12345")
  for (const url of [
    "http://127.0.0.1:12345/event",
    "ws://127.0.0.1:12345/pty",
    "oc://renderer/index.html",
    "data:image/png;base64,eA==",
  ])
    expect(confidentialRendererRequest(url)).toBe(true)
  for (const url of [
    "https://api.openai.com/v1/chat/completions",
    "https://api.trustedrouter.com/v1/chat/completions",
    "http://127.0.0.1:12346/session",
    "file:///etc/passwd",
    "oc://evil/index.html",
  ])
    expect(confidentialRendererRequest(url)).toBe(false)
  expect(() => setConfidentialSidecar("https://remote.test")).toThrow()
})
