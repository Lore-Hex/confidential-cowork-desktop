# Trusted Cowork

OpenCode-based desktop client for confidential models on TrustedRouter.
Based on OpenCode Desktop v1.18.30 (3104c142), with upstream MIT attribution retained.
The main process uses @lore-hex/trusted-router 0.4.0 at https://api.trustedrouter.com/v1.

## Security Boundaries

* Browser sign-in uses S256 PKCE and a single-use, state-bound loopback callback.
* Keys are encrypted using OS safe storage. The renderer never receives the key.
* The local runtime receives only a scoped loopback capability.
* Every inference request enforces provider.min_privacy=confidential and
  data_collection=deny. Named models must qualify in the current catalog.
* Project/global provider configuration, remote servers and plugins are disabled.
* Local tools require permission. Approved tools can access files and the network.
  This app is not an OS sandbox.
* Renderer networking is restricted to its bundled assets and local runtime.
* Telemetry and the upstream update feed are disabled. Updates are manual.
* Conversations are stored locally, not encrypted by this change.
* The SDK uses HTTPS and gateway confidential-route enforcement. This release
  does not implement independently verified, socket-bound client attestation.

## Verification

The focused OAuth, credential, policy, bridge and network suite has 26 tests.
Desktop and runtime typechecks pass. Local browser sign-in, restart, streamed
confidential GLM inference, tool denial and approved shell execution were exercised.

The earlier development build timed out on one approved shell command. After a
complete rebuild, both temporary-directory and default-project commands succeeded.
The cause was not conclusively established; a Node and Electron utility-process
smoke is required in the signing workflow.

Bun cannot run the upstream node:sqlite draft-store test. Test that storage path
under Node/Electron instead, without replacing or weakening the database.

## Release

Publish only Developer ID signed and notarized macOS packages. The signing job is
pinned to an immutable source SHA and runs tests before importing credentials.
Require clean-install OAuth, restart/sign-out, streamed inference and tool approval
on the signed package before changing the production website download.
The old Pi desktop credentials and data are not automatically imported.
