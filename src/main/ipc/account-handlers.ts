import { ipcMain, safeStorage } from 'electron'
import { getGuiDataPath } from '../app-data-paths'
import { CredentialVault } from '../credential-vault'
import { IPC_CHANNELS } from '../../shared/ipc-contracts'
import { assertTrustedSender } from './validation'
import type { WorkspaceManager } from '../workspace-manager'

export function createAccountVault(): CredentialVault {
  return new CredentialVault(getGuiDataPath('trustedrouter-key.encrypted'), {
    isEncryptionAvailable: () => safeStorage.isEncryptionAvailable() &&
      (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text'),
    encryptString: (value) => safeStorage.encryptString(value),
    decryptString: (value) => safeStorage.decryptString(value),
  })
}

export function registerAccountHandlers(manager: WorkspaceManager): void {
  const vault = createAccountVault()
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_STATUS, async (event) => {
    assertTrustedSender(event)
    return { configured: await vault.hasKey() }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_SAVE, async (event, key: unknown) => {
    assertTrustedSender(event)
    await vault.save(key)
    manager.stopAll()
    return { configured: true }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_REMOVE, async (event) => {
    assertTrustedSender(event)
    manager.stopAll()
    await vault.remove()
    return { configured: false }
  })
}
