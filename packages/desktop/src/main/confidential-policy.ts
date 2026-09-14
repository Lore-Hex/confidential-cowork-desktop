export const CONFIDENTIAL_MODEL = "trustedrouter/confidential"

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function confidentialModels(payload: unknown) {
  const data = record(payload).data
  if (!Array.isArray(data)) throw new Error("Confidential model catalog unavailable")
  return new Set([
    CONFIDENTIAL_MODEL,
    ...data.flatMap((value) => {
      const model = record(value)
      const routing = record(model.trustedrouter)
      if (
        typeof model.id !== "string" ||
        routing.supports_chat !== true ||
        routing.route_kind !== "model" ||
        routing.internal_only === true ||
        routing.configuration_hidden === true
      )
        return []
      const endpoints = routing.endpoints
      if (!Array.isArray(endpoints)) return []
      const allowed = endpoints.some((value) => {
        const endpoint = record(value)
        return (
          endpoint.usage_type === "Credits" &&
          endpoint.privacy_tier === 3 &&
          endpoint.provider_e2ee === true &&
          endpoint.provider_confidential_compute === true &&
          Array.isArray(endpoint.supported_parameters) &&
          endpoint.supported_parameters.includes("tools")
        )
      })
      return allowed ? [model.id] : []
    }),
  ])
}

export function confidentialRequest(value: unknown, models: ReadonlySet<string>, responses = false) {
  const body = record(value)
  if (typeof body.model !== "string" || !models.has(body.model)) throw new Error("Select a confidential model")
  if (body.store === true || body.previous_response_id || body.conversation || body.background === true)
    throw new Error("Stored inference is unavailable")
  if (body.models !== undefined || body.route !== undefined || body.base_url !== undefined)
    throw new Error("Routing overrides are unavailable")
  const { store, ...stateless } = body
  return {
    ...stateless,
    ...(responses ? { store: false } : {}),
    provider: { min_privacy: "confidential", data_collection: "deny" },
  }
}
