import { BrowserWindow, ipcMain, safeStorage, shell } from 'electron'
import { TrustedRouterSignIn } from '../trustedrouter-sign-in'
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
  const signIn = new TrustedRouterSignIn({
    openBrowser: (url) => shell.openExternal(url),
    saveKey: async (key) => { await vault.save(key); manager.stopAll() },
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_SIGN_IN, async (event) => {
    assertTrustedSender(event)
    await signIn.start()
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window && !window.isDestroyed()) { window.show(); window.focus() }
    return { configured: true }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_CANCEL_SIGN_IN, async (event) => {
    assertTrustedSender(event)
    await signIn.cancel()
    return { configured: await vault.hasKey() }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_STATUS, async (event) => {
    assertTrustedSender(event)
    return { configured: await vault.hasKey() }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_SAVE, async (event, key: unknown) => {
    assertTrustedSender(event)
    await signIn.cancel()
    await vault.save(key)
    manager.stopAll()
    return { configured: true }
  })
  ipcMain.handle(IPC_CHANNELS.ACCOUNT_REMOVE, async (event) => {
    assertTrustedSender(event)
    await signIn.cancel()
    manager.stopAll()
    await vault.remove()
    return { configured: false }
  })
}
