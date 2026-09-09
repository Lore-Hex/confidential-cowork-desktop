export const COWORK_NAME = 'TR Confidential Cowork'
export const COWORK_PROVIDER = 'trustedrouter'
export const COWORK_MODEL = 'trustedrouter/confidential'
export const COWORK_API = 'https://api.trustedrouter.com/v1'
export const COWORK_RELEASE_REPO = 'Lore-Hex/confidential-cowork-desktop'

export function requireConfidentialModel(provider: unknown, model: unknown): void {
  if (provider !== COWORK_PROVIDER || model !== COWORK_MODEL) {
    throw new Error('Confidential Cowork requires the TrustedRouter confidential route.')
  }
}
