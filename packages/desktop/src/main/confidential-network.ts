let origin: string | undefined

export function setConfidentialSidecar(url: string) {
  const parsed = new URL(url)
  if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1") throw new Error("Sidecar must be local")
  origin = parsed.origin
}

export function confidentialRendererRequest(value: string, dev?: string) {
  const url = URL.parse(value)
  if (!url) return false
  if (url.protocol === "oc:" && url.hostname === "renderer") return true
  if (url.protocol === "data:" || url.protocol === "blob:") return true
  if (dev && url.origin === new URL(dev).origin) return true
  return origin !== undefined && (url.origin === origin || url.origin === origin.replace("http:", "ws:"))
}
