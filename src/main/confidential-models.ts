import { COWORK_API, COWORK_MODEL } from '../shared/confidential'

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function confidentialModelIds(payload: unknown): Set<string> {
  const data = record(payload).data
  if (!Array.isArray(data)) throw new Error('Invalid confidential model catalog')
  const ids = new Set([COWORK_MODEL])
  for (const item of data) {
    const model = record(item)
    const routing = record(model.trustedrouter)
    if (typeof model.id !== 'string' || routing.supports_chat !== true || routing.internal_only === true || routing.configuration_hidden === true || routing.route_kind !== 'model') continue
    if (!Array.isArray(routing.endpoints)) continue
    if (routing.endpoints.some((item) => {
      const endpoint = record(item)
      return endpoint.usage_type === 'Credits' && endpoint.privacy_tier === 3 &&
        endpoint.provider_e2ee === true && endpoint.provider_confidential_compute === true &&
        Array.isArray(endpoint.supported_parameters) && endpoint.supported_parameters.includes('tools')
    })) ids.add(model.id)
  }
  return ids
}

let cached: { ids: Set<string>; expires: number } | undefined
let loading: Promise<Set<string>> | undefined

export async function loadConfidentialModelIds(): Promise<Set<string>> {
  if (cached && cached.expires > Date.now()) return cached.ids
  if (loading) return loading
  loading = (async () => {
    const response = await fetch(`${COWORK_API}/models`, { signal: AbortSignal.timeout(10000), redirect: 'error' })
    if (!response.ok) throw new Error('Could not refresh confidential models. Please retry.')
    const ids = confidentialModelIds(await response.json())
    cached = { ids, expires: Date.now() + 300000 }
    return ids
  })()
  try { return await loading } finally { loading = undefined }
}
