import { Schema } from "effect"
import { Rpc, RpcGroup } from "effect/rpc"

export const AccountRpcs = RpcGroup.make(
  Rpc.make("AccountStatus", { success: Schema.Boolean }),
  Rpc.make("AccountSignIn", { error: Schema.String }),
  Rpc.make("AccountCancel"),
  Rpc.make("AccountSaveKey", { payload: { key: Schema.String.check(Schema.isMaxLength(512)) }, error: Schema.String }),
  Rpc.make("AccountSignOut"),
)
