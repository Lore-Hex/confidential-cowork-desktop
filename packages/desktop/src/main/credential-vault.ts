import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { randomUUID } from "node:crypto"

export interface SecretEncryption {
  isEncryptionAvailable(): boolean
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
  getSelectedStorageBackend?(): string
}

export class CredentialVault {
  constructor(
    private readonly file: string,
    private readonly encryption: SecretEncryption,
  ) {}

  private requireEncryption() {
    if (!this.encryption.isEncryptionAvailable() || this.encryption.getSelectedStorageBackend?.() === "basic_text")
      throw new Error("Unlock your system key store to sign in.")
  }

  async hasKey() {
    return this.read().then(
      () => true,
      () => false,
    )
  }

  async read() {
    this.requireEncryption()
    return this.encryption.decryptString(await readFile(this.file))
  }

  async save(value: unknown) {
    if (typeof value !== "string" || !/^sk-tr-[A-Za-z0-9_-]{16,256}$/.test(value.trim()))
      throw new Error("Enter a valid TrustedRouter API key.")
    this.requireEncryption()
    const encrypted = this.encryption.encryptString(value.trim())
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 })
    const temporary = `${this.file}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, encrypted, { mode: 0o600, flag: "wx" })
      await rename(temporary, this.file)
    } finally {
      await rm(temporary, { force: true })
    }
  }

  async remove() {
    await rm(this.file, { force: true })
  }
}
