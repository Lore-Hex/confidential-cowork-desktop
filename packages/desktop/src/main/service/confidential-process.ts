import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"

/** An owned stdio lease: EOF shuts the child down even if Electron crashes. */
export async function startConfidentialProcess(command: readonly string[], env: Record<string, string>) {
  const [file, ...args] = command
  if (!file) throw new Error("Missing confidential runtime")
  const password = randomBytes(32).toString("base64url")
  const child = spawn(file, [...args, "serve", "--stdio", "--hostname", "127.0.0.1", "--port", "0"], {
    env: { ...process.env, ...env, OPENCODE_PASSWORD: password },
    stdio: ["pipe", "pipe", "ignore"],
    windowsHide: true,
  })
  const exited = new Promise<void>((resolve) => child.once("close", () => resolve()))
  let stopped: Promise<void> | undefined
  const stop = () =>
    (stopped ??= (async () => {
      child.stdin.end()
      const timer = setTimeout(() => child.kill("SIGKILL"), 3000)
      try {
        await exited
      } finally {
        clearTimeout(timer)
      }
    })())
  try {
    const url = await new Promise<string>((resolve, reject) => {
      let pending = ""
      let ready = false
      const timer = setTimeout(() => reject(new Error("Confidential runtime startup timed out")), 30_000)
      child.once("error", () => {
        clearTimeout(timer)
        reject(new Error("Confidential runtime failed to start"))
      })
      child.once("close", () => {
        clearTimeout(timer)
        reject(new Error("Confidential runtime exited before readiness"))
      })
      child.stdout.setEncoding("utf8")
      child.stdout.on("data", (chunk: string) => {
        if (ready) return
        pending += chunk
        if (pending.length > 4096) {
          clearTimeout(timer)
          reject(new Error("Invalid confidential runtime readiness"))
          return
        }
        if (!pending.includes("\n")) return
        clearTimeout(timer)
        try {
          const data: unknown = JSON.parse(pending.split("\n", 1)[0])
          if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string")
            throw new Error("Missing endpoint")
          const url = new URL(data.url)
          if (
            url.protocol !== "http:" ||
            url.hostname !== "127.0.0.1" ||
            !url.port ||
            url.username ||
            url.password ||
            url.pathname !== "/" ||
            url.search ||
            url.hash
          )
            throw new Error("Invalid endpoint")
          ready = true
          pending = ""
          resolve(url.origin)
        } catch {
          reject(new Error("Invalid confidential runtime readiness"))
        }
      })
    })
    return { url, password, stop }
  } catch (error) {
    await stop()
    throw error
  }
}
