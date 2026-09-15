import { join } from "node:path"
import { CONFIDENTIAL_MODEL } from "./confidential-policy"

export function confidentialRuntimeConfig(url: string, token: string, models: Iterable<string>) {
  const ids = [...models]
  return {
    model: `trustedrouter/${CONFIDENTIAL_MODEL}`,
    small_model: `trustedrouter/${CONFIDENTIAL_MODEL}`,
    enabled_providers: ["trustedrouter"],
    plugin: [],
    mcp: {},
    share: "disabled",
    autoupdate: false,
    permission: { "*": "ask" },
    provider: {
      trustedrouter: {
        name: "TrustedRouter",
        npm: "@ai-sdk/openai-compatible",
        env: [],
        whitelist: ids,
        options: { baseURL: url, apiKey: token },
        models: Object.fromEntries(
          ids.map((id) => [
            id,
            {
              id,
              name: id === CONFIDENTIAL_MODEL ? "Confidential (automatic)" : id,
              tool_call: true,
              limit: { context: 32000, output: 8192 },
            },
          ]),
        ),
      },
    },
  }
}

export function confidentialEnvironment(root: string, config: string) {
  return {
    TRCC_CONFIG: config,
    OPENCODE_CONFIG_CONTENT: config,
    OPENCODE_DISABLE_PROJECT_CONFIG: "true",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "true",
    OPENCODE_DISABLE_CLAUDE_CODE: "true",
    OPENCODE_DISABLE_AUTOUPDATE: "true",
    OPENCODE_DISABLE_MODELS_FETCH: "true",
    DO_NOT_TRACK: "1",
    XDG_DATA_HOME: join(root, "data"),
    XDG_CONFIG_HOME: join(root, "config"),
    XDG_STATE_HOME: join(root, "state"),
    XDG_CACHE_HOME: join(root, "cache"),
  }
}
