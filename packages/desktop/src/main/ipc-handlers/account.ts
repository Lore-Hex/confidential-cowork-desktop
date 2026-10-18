import { Effect } from "effect"
import { BrowserWindow } from "electron"
import { AccountRpcs } from "../../shared/ipc-rpc/account"
import { confidentialAccount } from "../confidential-account"
import { ApplicationLifecycle } from "../lifecycle"
import { IpcPortHandoff } from "../ipc-transport"
import { isRendererUrl } from "../windows/scheme"
import { sender, type RpcContext } from "./context"

export const accountHandlers = AccountRpcs.toLayer(
  Effect.gen(function* () {
    const lifecycle = yield* ApplicationLifecycle.Service
    const account = confidentialAccount()
    const handoff = yield* IpcPortHandoff
    const checked = <A, E, R>(context: RpcContext, run: Effect.Effect<A, E, R>) =>
      Effect.sync(() => {
        const contents = sender(handoff, context)
        const win = BrowserWindow.fromWebContents(contents)
        if (!win || win.isDestroyed() || !isRendererUrl(contents.getURL())) throw new Error("Invalid account caller")
      }).pipe(Effect.andThen(run))
    return AccountRpcs.of({
      AccountStatus: (_, context) =>
        checked(
          context,
          Effect.promise(() => account.vault.hasKey()),
        ),
      AccountSignIn: (_, context) =>
        checked(context, Effect.tryPromise({ try: () => account.signIn.start(), catch: () => "Sign-in failed" })),
      AccountCancel: (_, context) =>
        checked(
          context,
          Effect.promise(() => account.signIn.cancel()),
        ),
      AccountSaveKey: ({ key }, context) =>
        checked(
          context,
          Effect.tryPromise({
            try: async () => {
              await account.signIn.cancel()
              ;(await account.bridge).invalidate()
              await account.vault.save(key)
            },
            catch: () => "Could not save credential",
          }),
        ),
      AccountSignOut: (_, context) =>
        checked(
          context,
          Effect.promise(async () => {
            await account.signIn.cancel()
            ;(await account.bridge).invalidate()
            await account.vault.remove()
            lifecycle.relaunch()
          }),
        ),
    })
  }),
)
