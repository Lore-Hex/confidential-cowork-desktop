import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CredentialVault } from './credential-vault'

test('vault persists ciphertext, replaces and removes credentials without exposing raw keys', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cowork-vault-'))
  const file = join(root, 'key')
  const values = new Map<string, string>()
  const vault = new CredentialVault(file, {
    isEncryptionAvailable: () => true,
    encryptString: (value) => { const id = `encrypted-${values.size}`; values.set(id, value); return Buffer.from(id) },
    decryptString: (value) => values.get(value.toString())!,
  })
  try {
    assert.equal(await vault.hasKey(), false)
    const key = 'sk-tr-v1-synthetic-credential-12345'
    await vault.save(key)
    assert.equal(await vault.read(), key)
    assert.equal((await readFile(file, 'utf8')).includes(key), false)
    assert.equal((await stat(file)).mode & 0o777, 0o600)
    await vault.save(`${key}-new`)
    assert.equal(await vault.read(), `${key}-new`)
    await vault.remove()
    assert.equal(await vault.hasKey(), false)
    await assert.rejects(vault.read(), /Add your TrustedRouter/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('unavailable OS encryption never falls back to plaintext', async () => {
  const vault = new CredentialVault('/unused', {
    isEncryptionAvailable: () => false,
    encryptString: () => { throw new Error('must not encrypt') },
    decryptString: () => { throw new Error('must not decrypt') },
  })
  await assert.rejects(vault.save('sk-tr-v1-synthetic-credential-12345'), /Secure key storage/)
  await assert.rejects(vault.read(), /Secure key storage/)
})

test('invalid credentials are rejected before persistence without echoing the value', async () => {
  const vault = new CredentialVault('/unused', {
    isEncryptionAvailable: () => true,
    encryptString: () => { throw new Error('must not encrypt') },
    decryptString: () => '',
  })
  for (const invalid of [null, {}, '', 'other-provider-secret', 'sk-tr-v1-short', 'sk-tr-v1-valid-looking-key\nINJECT=1']) {
    await assert.rejects(vault.save(invalid), /Enter a valid TrustedRouter API key/)
  }
})
