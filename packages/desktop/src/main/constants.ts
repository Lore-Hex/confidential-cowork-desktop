type Channel = "dev" | "beta" | "prod"
const raw = import.meta.env.OPENCODE_CHANNEL
export const CHANNEL: Channel = raw === "dev" || raw === "beta" || raw === "prod" ? raw : "dev"

// Remain off until our signed release feed and update migration have passed a clean-install test.
export const UPDATER_ENABLED = false
