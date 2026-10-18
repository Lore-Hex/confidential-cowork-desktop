import { expect, test } from "bun:test"
import { startConfidentialProcess } from "./confidential-process"

test("owned runtime receives only local capabilities and shuts down on its lease", async () => {
  const runtime = await startConfidentialProcess(
    [
      process.execPath,
      "-e",
      `
    const server = require('node:http').createServer((req, res) => {
      res.end(JSON.stringify({ args: process.argv, secret: process.env.OPENCODE_PASSWORD, capability: process.env.TRCC_CONFIG }))
    }).listen(0, '127.0.0.1', () => console.log(JSON.stringify({url: 'http://127.0.0.1:' + server.address().port})))
    process.stdin.on('end', () => server.close())
    process.stdin.resume()
  `,
    ],
    { TRCC_CONFIG: "local-capability-only" },
  )
  try {
    const data = await (await fetch(runtime.url)).json()
    expect(data.secret).toBe(runtime.password)
    expect(data.capability).toBe("local-capability-only")
    expect(data.args).toContain("--stdio")
    expect(data.args).not.toContain("--service")
  } finally {
    await runtime.stop()
  }
  await runtime.stop()
  await expect(fetch(runtime.url)).rejects.toThrow()
})

test.each(["https://example.com", "http://0.0.0.0:1234", "http://localhost:1234", "http://u:p@127.0.0.1:1234"])(
  "rejects non-owned readiness %s and terminates the child",
  async (url) => {
    await expect(
      startConfidentialProcess(
        [
          process.execPath,
          "-e",
          `
      console.log(JSON.stringify({url: ${JSON.stringify(url)}}))
      process.stdin.resume()
      process.stdin.on('end', () => process.exit(0))
    `,
        ],
        {},
      ),
    ).rejects.toThrow("Invalid confidential runtime readiness")
  },
)

test("reports a failed executable without hanging", async () => {
  await expect(startConfidentialProcess(["/no-such-cowork-runtime"], {})).rejects.toThrow("failed to start")
})
