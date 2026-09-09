import { test } from 'node:test'
import assert from 'node:assert/strict'
import { confidentialModelIds } from './confidential-models'

const endpoint = { usage_type: 'Credits', privacy_tier: 3, provider_e2ee: true, provider_confidential_compute: true, supported_parameters: ['tools'] }
const model = (id: string, overrides = {}) => ({ id, trustedrouter: { supports_chat: true, route_kind: 'model', endpoints: [endpoint], ...overrides } })

test('named confidential tool models are admitted by endpoint, not primary-provider claims', () => {
  const ids = confidentialModelIds({ data: [model('kimi'), model('glm')] })
  assert.deepEqual([...ids], ['trustedrouter/confidential', 'kimi', 'glm'])
})

test('unknown privacy, BYOK-only, standard, hidden, and non-tool models are excluded', () => {
  for (const change of [{ privacy_tier: 1 }, { provider_e2ee: null }, { provider_confidential_compute: false }, { usage_type: 'BYOK' }, { supported_parameters: [] }]) {
    assert.equal(confidentialModelIds({ data: [model('bad', { endpoints: [{ ...endpoint, ...change }] })] }).has('bad'), false)
  }
  for (const change of [{ configuration_hidden: true }, { internal_only: true }, { supports_chat: false }, { route_kind: 'alias' }, { endpoints: [] }]) {
    assert.equal(confidentialModelIds({ data: [model('bad', change)] }).has('bad'), false)
  }
  assert.throws(() => confidentialModelIds({}), /Invalid/)
})
