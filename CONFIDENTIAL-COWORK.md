# TR Confidential Cowork Desktop Alpha

This is the graphical Pi Desktop fork, not the TRPi terminal launcher.
It retains the upstream Apache 2.0 license and attribution.

## Runtime and privacy

The app bundles the checksum-pinned TRPi v0.84.5 macOS runtime. Every session
starts with the TrustedRouter provider at `https://api.trustedrouter.com/v1`.
The default is `trustedrouter/confidential`; the picker also offers named models
whose current catalog has a prepaid, tool-capable Confidential + E2EE endpoint.
The bundled runtime applies `min_privacy=confidential` and `data_collection=deny`
to every named model request. The catalog is refreshed with a five-minute cache;
expired-cache failures block named model selection rather than admitting unknown
routes. The gateway remains responsible for enforcing privacy at request time.
There is no automatic fallback to an installed CLI or another provider.
Custom provider configuration and multi-agent council inference are disabled.

The API key is encrypted using Electron safeStorage and written with mode 0600.
Unavailable OS encryption fails closed. Removing a key stops active runtimes.
Profiles and local conversation history use a separate app data directory.
Existing Pi and QuillCode profiles are not imported.

Confidential routing does not sandbox local tools. Files, terminal commands and
tool network activity remain subject to the user's tool approvals. The app
loads the shipped permission extension, not automatically discovered extensions.

## Development

On macOS:

```sh
npm ci
node scripts/hydrate-runtime.mjs
npm run typecheck
npm run lint
node --import tsx --test --test-concurrency=1 $(rg --files src resources -g '*.test.ts' -g '!resources/runtime/**')
npm run build
node scripts/cowork-desktop-smoke.mjs
npm run preview
```

An optional live smoke reads a designated test key from the path in
`COWORK_SMOKE_KEY_FILE`; it makes one small PONG request. It never prints the key.

## Release gate

Do not replace the website download until a signed and notarized desktop DMG
passes clean-install GUI, inference, permission-approval, and credential-removal
checks. A successful terminal-runtime release does not satisfy this gate.
