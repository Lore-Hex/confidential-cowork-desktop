# Upstream Tracking

Repository: https://github.com/anomalyco/opencode

Ported snapshot: `4745089e365ed1a9cdfec8eb831ab8a4efe92d78` (OpenCode 2.0.32).

Latest inspected upstream commit: `9d90d892dcbfc52b47e95b2ea31b8aba877128fd`.
Applicable subsequent upstream changes are retained as individual cherry-picks.

## Daily Review: 2026-10-19

Candidate remains 0.4.0-alpha.2, unpublished. Based on the previous daily candidate,
with 42 additional upstream commits retained separately using upstream SHA trailers.
This is not an unqualified claim of full upstream parity.

Dependencies were installed with Bun 1.4.2 and `bun install --frozen-lockfile`.
OpenTUI is now 0.6.6 and Playwright is 1.60.0. Do not introduce an npm lockfile
or install an unrelated package named `nit` based on ambiguous chat wording.

Deferred security-sensitive changes:

* acdcdb8dd9: breaking V2.1 session/credential migration removes the explicit
  route-compatibility check for native compaction context. Review the replacement
  model-bound history semantics and migration fixtures before importing it.
* cb07c555d4 and 6bac3b9ad8: upstream shared/Drive service adoption is incompatible
  with our owned, capability-bound runtime. Preserve isolated profile behavior.
* 31dc762147: direct Gemini Live voice credentials are outside confidential-only
  inference and are not imported.

Excluded unrelated upstream changes: 802f2d8e75 and 9c2611b400 (hosted deployment
workflows), 501b15af26 and 157ad7f22a (upstream promotional/install README changes),
6d6003da86 (hosted share endpoints), 580fcabd92 and c193810f65 (hosted console
documentation), abcdfda371 (hosted enterprise form).

Imported saved-permission editing only changes explicitly saved approvals; it
does not change the default ask policy. Compaction continues through the existing
confidential model boundary. Client regeneration produced no additional changes.
Local verification results and release blockers are recorded in the update PR.
No production release is authorized by an install or unit-test result alone.

## Daily Review: 2026-10-18

Candidate: 0.4.0-alpha.2. Reviewed and ported c38d83c0c4 (idle message filter),
49e9786bb7 (bounded skill discovery), 63c1a27af5 (filesystem access-denial
handling), 60a5a6ca7c (null Responses fields), and da9d436c36 (model snapshot).
Skipped 214fb7fdba: hosted OpenCode console harness guides are not part of this app.

Access-denial handling does not grant filesystem access or alter confidential
routing/tool permissions. The bundled upstream catalog remains subject to the
TrustedRouter-only provider registry and confidential model allowlist.
Client regeneration completed with no additional changes.

Local verification: 157 desktop/packaging tests, 73 Responses fixture tests,
two message endpoint tests and all 34 workspace typechecks pass. Full core suite:
6,659 pass, 43 skip, seven fail in the pre-existing macOS Bash compatibility
family. Native runtime build and fake-provider inference/permission-denial smoke
pass. The real public catalog returns 19 eligible choices; that is not a live
inference test. CI now runs the complete core suite, not just confidential config.
The first full Linux CI run exposed a missing ripgrep executable: all 23 failures
attempted a forbidden test-time download. CI now installs ripgrep up front while
preserving the test suite's network guard; the full-suite retry must pass.

The prior 0.4.0-alpha.1 draft has signed/notarized ARM64 and Intel artifacts.
It has not been promoted. This candidate needs its own verification and signing;
do not reuse the prior draft's signatures or claim Intel interactive verification
from an ARM64 machine. No authorized credential was present in the known test or
packaged-app profile during this audit; no live inference spend was incurred.

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
