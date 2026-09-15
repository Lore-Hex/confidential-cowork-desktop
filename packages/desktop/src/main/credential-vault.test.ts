import { expect, test } from "bun:test"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CredentialVault } from "./credential-vault"

test("vault persists ciphertext with owner-only access, rotates, and deletes", async () => {
  const root = await mkdtemp(join(tmpdir(), "trusted-cowork-vault-"))
  const file = join(root, "credential")
  const secret = randomBytes(32)
  const vault = new CredentialVault(file, {
    isEncryptionAvailable: () => true,
    encryptString(value) {
      const iv = randomBytes(12)
      const cipher = createCipheriv("aes-256-gcm", secret, iv)
      const encrypted = Buffer.concat([cipher.update(value), cipher.final()])
      return Buffer.concat([iv, cipher.getAuthTag(), encrypted])
    },
    decryptString(value) {
      const cipher = createDecipheriv("aes-256-gcm", secret, value.subarray(0, 12))
      cipher.setAuthTag(value.subarray(12, 28))
      return Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString()
    },
  })
  try {
    expect(await vault.hasKey()).toBe(false)
    await vault.save("sk-tr-first-valid-test-key")
    expect(await vault.read()).toBe("sk-tr-first-valid-test-key")
    expect((await readFile(file)).includes(Buffer.from("sk-tr-"))).toBe(false)
    expect((await stat(file)).mode & 0o777).toBe(0o600)
    await vault.save("sk-tr-second-valid-test-key")
    expect(await vault.read()).toBe("sk-tr-second-valid-test-key")
    await expect(vault.save("invalid")).rejects.toThrow()
    expect(await vault.read()).toBe("sk-tr-second-valid-test-key")
    await vault.remove()
    expect(await vault.hasKey()).toBe(false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("plaintext OS fallback and unavailable encryption are rejected", async () => {
  for (const available of [true, false]) {
    const vault = new CredentialVault("unused", {
      isEncryptionAvailable: () => available,
      getSelectedStorageBackend: () => "basic_text",
      encryptString: () => {
        throw new Error("must not encrypt")
      },
      decryptString: () => {
        throw new Error("must not decrypt")
      },
    })
    await expect(vault.save("sk-tr-first-valid-test-key")).rejects.toThrow("Unlock")
  }
})
