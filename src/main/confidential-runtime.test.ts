import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configureConfidentialRuntime, confidentialStart, confidentialCommand } from './confidential-runtime'

test('all session starts pin the bundle, credentials, routing, and shipped permission extension', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cowork-runtime-'))
  const executable = join(root, 'agent')
  const permissionExtension = join(root, 'permissions.ts')
  await writeFile(executable, 'synthetic'); await writeFile(permissionExtension, 'synthetic')
  configureConfidentialRuntime({ executable, permissionExtension, agentDir: root, readKey: async () => 'synthetic-secret' })
  try {
    for (const session of [{}, { sessionPath: '/session' }, { forkSessionPath: '/session' }, { continueSession: true }]) {
      const start = await confidentialStart({ ...session, engine: 'omp', provider: 'other', model: 'other',
        args: ['--provider', 'other', '-e', '/untrusted.ts', '--tools', 'read,grep'],
        env: { TRUSTEDROUTER_API_KEY: 'wrong', TR_COWORK_CODING_AGENT_DIR: '/other', PI_DESKTOP_PERMISSION_MODE: 'ask-edits' } })
      assert.equal(start.provider, 'trustedrouter')
      assert.equal(start.model, 'trustedrouter/confidential')
      assert.equal(start.engine, 'pi')
      assert.equal(start.env?.TRUSTEDROUTER_API_KEY, 'synthetic-secret')
      assert.equal(start.env?.TR_COWORK_CODING_AGENT_DIR, root)
      assert.equal(start.env?.PI_DESKTOP_PERMISSION_MODE, 'ask-edits')
      assert.deepEqual(start.args, ['--no-extensions', '--no-skills', '--no-prompt-templates', '-e', permissionExtension, '--tools', 'read,grep'])
      assert.equal(JSON.stringify(start.args).includes('synthetic-secret'), false)
    }
    assert.throws(() => confidentialCommand({ type: 'set_model', provider: 'openai', modelId: 'other' }), /requires/)
    assert.throws(() => confidentialCommand({ type: 'switch_session', sessionPath: '/other' }), /session list/)
    assert.deepEqual(confidentialCommand({ type: 'cycle_model' }), { type: 'set_model', provider: 'trustedrouter', modelId: 'trustedrouter/confidential' })
    await rm(executable)
    await assert.rejects(confidentialStart({}), /bundled agent is missing/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
