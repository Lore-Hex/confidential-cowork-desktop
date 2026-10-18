import { invoke } from "./ipc-client"

export const accountApi = {
  accountStatus: () => invoke("AccountStatus"),
  accountSignIn: () => invoke("AccountSignIn"),
  accountCancel: () => invoke("AccountCancel"),
  accountSaveKey: (key: string) => invoke("AccountSaveKey", { key }),
  accountSignOut: () => invoke("AccountSignOut"),
}
