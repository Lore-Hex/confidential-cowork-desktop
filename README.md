# Trusted Cowork

A macOS desktop agent built on OpenCode, using confidential models through TrustedRouter.

Sign in with TrustedRouter in your browser or add an API key. The default model is
`trustedrouter/confidential`. You can select qualified confidential models by name.
Every inference request requires confidential routing and denies data collection.
There is no fallback to another inference backend.

Local tools require permission. Conversations are stored on your Mac. This is not
an OS sandbox: approved tools can access files and the network.

See [security boundaries and release checks](TRUSTED-COWORK.md). The app uses HTTPS
and gateway confidential-route enforcement; it does not independently verify the
client TLS socket through attestation.

## Downloads

Use the signed macOS packages linked from [TrustedRouter](https://trustedrouter.com/confidential-cowork).
Updates are manual. Windows and Linux packages are not released for this version.

## Development

Requires Bun 1.4.2 and Node 24 or newer. Ensure Bun 1.4.2 is also first on PATH
because build and test subprocesses invoke `bun`.

```sh
bun install --frozen-lockfile
bun run check
cd packages/cli
OPENCODE_CHANNEL=prod OPENCODE_VERSION=0.4.0-alpha.1 bun run script/build.ts --single --skip-install --skip-web-ui
cd ../desktop
bun typecheck
bun test src/main electron-builder.config.test.ts --timeout 30000
OPENCODE_CHANNEL=prod OPENCODE_CLI_DIST=../cli/dist bun run build
bun scripts/confidential-runtime-smoke.ts
bun scripts/confidential-desktop-smoke.ts
```

The main process uses `@lore-hex/trusted-router` with `https://api.confidential.trustedrouter.com/v1`.
Only it can decrypt the stored API key. The bundled runtime receives a scoped
local capability, not the real key. Browser authorization uses `https://trustedrouter.com`.

## Attribution

Based on OpenCode 2.0.32, upstream commit `4745089e365ed1a9cdfec8eb831ab8a4efe92d78`.
The [upstream README](README.upstream.md) and [MIT license](LICENSE) are retained.
Upstream workflows are archived under `.github/upstream-workflows` and do not execute
in this repository.
