import { join } from "node:path"

export function confidentialRuntimeConfig(baseURL: string, token: string, models: Iterable<string>) {
  return JSON.stringify({ baseURL, token, models: [...models] })
}

export function confidentialEnvironment(root: string, config: string) {
  return {
    TRCC_CONFIG: config,
    OPENCODE_DISABLE_PROJECT_CONFIG: "true",
    OPENCODE_DISABLE_CLAUDE_CODE: "true",
    OPENCODE_DISABLE_AUTOUPDATE: "true",
    OPENCODE_DISABLE_MODELS_FETCH: "true",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "true",
    DO_NOT_TRACK: "1",
    XDG_DATA_HOME: join(root, "data"),
    XDG_CONFIG_HOME: join(root, "config"),
    XDG_STATE_HOME: join(root, "state"),
    XDG_CACHE_HOME: join(root, "cache"),
  }
}
