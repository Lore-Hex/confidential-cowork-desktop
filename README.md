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
Install directly and sign in again when moving from the older Pi or QuillCode apps.
Updates are manual. Windows and Linux packages are not released for this version.

## Development

Requires Bun 1.3.14 and Node 24 or newer.

```sh
bun install --frozen-lockfile
cd packages/desktop
bun typecheck
bun run build
bun run preview
```

The main process uses `@lore-hex/trusted-router` with `https://api.trustedrouter.com/v1`.
Only it can decrypt the stored API key. The bundled runtime receives a scoped
local capability, not the real key.

## Attribution

Based on OpenCode Desktop v1.18.30. The [upstream README](README.upstream.md) and
[MIT license](LICENSE) are retained. Upstream workflows are archived under
`.github/upstream-workflows` and do not execute in this repository.
