import { app } from "electron"

type Channel = "local" | "dev" | "beta" | "prod"

const raw = import.meta.env.OPENCODE_CHANNEL

export const CHANNEL: Channel = raw === "local" || raw === "dev" || raw === "beta" || raw === "prod" ? raw : "dev"

export const VERSION = app.isPackaged ? app.getVersion() : (process.env.OPENCODE_VERSION ?? app.getVersion())

const appNames: Record<string, string> = {
  dev: "Trusted Cowork Dev",
  beta: "Trusted Cowork Beta",
  prod: "Trusted Cowork",
}

const appIDs: Record<string, string> = {
  dev: "com.trustedrouter.cowork.opencodedev",
  beta: "com.trustedrouter.cowork.opencodebeta",
  prod: "com.trustedrouter.cowork.opencodedesktop",
}

// Local renderer/server mode keeps the dev application identity.
export const APP_NAME = app.isPackaged ? appNames[CHANNEL] : "Trusted Cowork Dev"

export const APP_ID = app.isPackaged ? appIDs[CHANNEL] : "com.trustedrouter.cowork.opencodedev"
