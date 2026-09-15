// Captured before any project code is loaded. Desktop launches only the bundled v1 server.
const raw = process.env.TRCC_CONFIG

export function confidentialConfig() {
  if (raw === undefined) return
  const config = JSON.parse(raw)
  if (
    config.enabled_providers?.length !== 1 ||
    config.enabled_providers[0] !== "trustedrouter" ||
    !/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(config.provider?.trustedrouter?.options?.baseURL ?? "")
  )
    throw new Error("Invalid confidential runtime configuration")
  return config
}

export const confidentialRuntime = raw !== undefined
