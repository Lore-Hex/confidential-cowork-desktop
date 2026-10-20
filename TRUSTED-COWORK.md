# Trusted Cowork Security And Release Checks

Trusted Cowork by NYTE: https://nytokenexchange.com/trusted-cowork

The default model is `nyte/confidential`. Only confidential tool-capable models
are available. Standard routing aliases and non-confidential fallback remain
blocked. NYTE uses the existing TrustedRouter sign-in, encrypted credential
store, and verified confidential API origin. The app identity is unchanged so
existing local sessions and credentials remain available. The NYTE-branded
confidential API hostname must be verified before switching transport origins.

## Security Boundaries

* Browser sign-in uses S256 PKCE and a single-use, state-bound loopback callback.
* Keys are encrypted using OS safe storage. The renderer never receives the key.
* The owned local runtime receives only a scoped loopback capability. It does not
  adopt an existing OpenCode service and exits when its parent closes the stdio lease.
* Every inference request enforces `provider.min_privacy=confidential` and
  `data_collection=deny`. Named models must qualify in the current catalog.
* Both the V2 provider registry and the main-process bridge enforce model eligibility.
* Project/global provider configuration, remote servers, external plugins and
  other providers' account integrations are disabled in confidential mode.
* Local tools require permission. Approved tools can access files and the network.
  This app is not an OS sandbox.
* Renderer networking is restricted to bundled assets and its owned local runtime.
* Telemetry and the upstream update feed are disabled. Updates are manual.
* Conversations are stored locally, not encrypted by this change.
* HTTPS and gateway confidential-route enforcement do not constitute independently
  verified, socket-bound client attestation.

## Upgrade

The V2 port retains the Trusted Cowork bundle identity, encrypted credential path,
and isolated data/config/state/cache directories. Do not erase these to upgrade.
Pi and QuillCode data are not automatically imported. Existing-user conversation
migration must be verified before promoting the release.

## Release Gates

Run desktop privacy, OAuth, credential, network, packaging and owned-process tests,
core confidential configuration tests, lint/typechecks and compiled-runtime smokes.
The runtime smoke verifies actual inference against a local fake provider and
pending tool approval despite hostile project settings. The Electron smoke verifies
the fresh sign-in screen and renderer network restrictions without production keys.

Publish only Developer ID signed and notarized macOS packages. The signing job is
pinned to an immutable source SHA and runs tests before importing credentials.
Require clean-install OAuth, restart/sign-out, streamed inference, tool approval
and existing-user data checks on the signed package before changing the production
website download. Passing unit tests alone does not establish those release gates.
