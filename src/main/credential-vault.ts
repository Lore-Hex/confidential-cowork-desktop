import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { randomUUID } from 'crypto'

export interface SecretEncryption {
  isEncryptionAvailable(): boolean
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
}

/** Only ciphertext is persisted. A missing OS key store fails closed. */
export class CredentialVault {
  constructor(private readonly file: string, private readonly encryption: SecretEncryption) {}

  async hasKey(): Promise<boolean> {
    try { await this.read(); return true } catch { return false }
  }

  async read(): Promise<string> {
    if (!this.encryption.isEncryptionAvailable()) throw new Error('Secure key storage is unavailable. Unlock your login keychain and retry.')
    try { return this.encryption.decryptString(await readFile(this.file)) }
    catch { throw new Error('Add your TrustedRouter API key in Account settings.') }
  }

  async save(raw: unknown): Promise<void> {
    if (typeof raw !== 'string' || !/^sk-tr-[A-Za-z0-9_-]{16,256}$/.test(raw.trim())) throw new Error('Enter a valid TrustedRouter API key.')
    if (!this.encryption.isEncryptionAvailable()) throw new Error('Secure key storage is unavailable. Unlock your login keychain and retry.')
    const encrypted = this.encryption.encryptString(raw.trim())
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 })
    const temporary = `${this.file}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, encrypted, { mode: 0o600, flag: 'wx' })
      await rename(temporary, this.file)
    } finally { await rm(temporary, { force: true }) }
  }

  async remove(): Promise<void> { await rm(this.file, { force: true }) }
}
