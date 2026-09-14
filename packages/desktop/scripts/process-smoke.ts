import assert from "node:assert/strict"
import { Effect, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"
import { CrossSpawnSpawner } from "../../core/src/cross-spawn-spawner"
import { LayerNode } from "../../core/src/effect/layer-node"

const live = LayerNode.compile(CrossSpawnSpawner.node)
const result = await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
      const handle = yield* spawner.spawn(
        ChildProcess.make("pwd", [], {
          shell: "/bin/zsh",
          cwd: "/tmp",
          env: process.env,
          stdin: "ignore",
          detached: true,
        }),
      )
      return yield* Effect.all([handle.exitCode, Stream.runCollect(Stream.decodeText(handle.all))], {
        concurrency: "unbounded",
      })
    }),
  ).pipe(Effect.provide(live), Effect.timeout("10 seconds")),
)
assert.equal(result[0], 0)
assert.match(result[1].join(""), /\/(private\/)?tmp/)
console.log("process smoke passed")
