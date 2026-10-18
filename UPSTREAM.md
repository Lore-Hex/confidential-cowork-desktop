# Upstream Tracking

Repository: https://github.com/anomalyco/opencode

Ported snapshot: `4745089e365ed1a9cdfec8eb831ab8a4efe92d78` (OpenCode 2.0.32).

Trusted Cowork 0.4.0-alpha.1 ports the desktop to the V2 core, schema, provider
registry, native HTTP server and MessagePort RPC architecture. Preserve the
confidential config/bridge, encrypted main-process vault, PKCE sign-in, owned stdio
runtime, provider/model allowlist, permission prompts and disabled telemetry when
updating this snapshot.

The prior fork's history is retained as parent ancestry beneath this upstream
snapshot port. The V1 runtime interception
is replaced by native V2 configuration and registry enforcement, not copied into
the new server architecture. Upstream publishing workflows remain archived.

## Candidate Verification

Local macOS ARM64 checks on 2026-10-17:

* 156 desktop/packaging tests pass, including the upstream packaging contracts.
* All 34 workspace packages pass typechecking.
* Compiled-runtime smoke passes: confidential-only catalog, hostile project
  configuration ignored, local fake-provider inference, pending tool approval.
* Fresh-profile Electron smoke passes: sign-in, API-key entry, blocked renderer
  network/file access. Fixed a bundled-asset loading regression found by this check.
* Fresh-profile vault regression failed before the fix and passed afterward:
  an absent credential no longer invokes the OS key store.
* Full core suite with Bun 1.4.2 on PATH: 6,653 pass, 43 skip, 8 fail. The remaining
  shell test failures also occurred on the unmodified upstream snapshot in this
  environment. This is not a claim that the full upstream suite is green.
* Root lint and the full monorepo check pass. Astro's preference-directory writes
  required running the check outside the filesystem sandbox.

Pending release gates: signed/notarized ARM64 and Intel packages, clean-install
OAuth and live confidential streaming, tool execution/denial, restart/sign-out,
and a V1 conversation migration fixture. Do not replace production downloads on
the strength of these local checks alone.
