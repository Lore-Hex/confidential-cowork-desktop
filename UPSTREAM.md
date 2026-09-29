# OpenCode Upstream Tracking

## Confidential API Endpoint Update

On September 29, at the user's request, the desktop catalog and both inference
paths were moved to `https://api.confidential.trustedrouter.com/v1`. Both SDK
clients explicitly disable regional failover. OAuth remains on the separate
`https://trustedrouter.com/v1` control plane. Documentation, live diagnostic and
daily automation now use the confidential API host. Historical entries below
describe the endpoint used at the time and are not current configuration.

Desktop regression coverage asserts catalog/chat/Responses use the new host,
blocks direct renderer access to it, and verifies connection failure does not
fall back to another host. All 78 desktop tests passed. One bounded isolated live
request returned exact PONG through the new host, HTTP 200, request
`chatcmpl-10262669d5cd6be10479fc2e2c404322`, model `openai/gpt-oss-120b`.
Its catalog upper estimate was $0.011059776, not measured settlement cost.

Upstream was fetched again and remains at `7945de20`; applicable desktop/runtime
ports are current through that revision, not a wholesale merge of upstream's
hosted business. This source update does not replace the signed production app.
The full-suite native PTY failure described below still blocks release.

## September 29, 2026

Public main remains `4c46c96f`; tested candidate is `18ec513b`. Reviewed the
20-commit range after `03e67171` through
`7945de208964a49300d7f770d1a71d078db9a4c4` on upstream `dev`, including merge
commits. Changes are hosted Go/Go Plus plans, billing/referrals, statistics,
documentation/privacy links, translations and generated documentation. None
changes the locked confidential desktop path; no source was ported or policy
silently imported.

Desktop/runtime typechecks passed. Desktop tests: 77 passed; packaging: 3 passed;
core browser/filesystem/npm: 43 passed; TUI lifecycle: 3 passed. SQLite persistence,
production build, and actual subprocess output under Node and Electron passed.
Full runtime: 3,590 passed, 22 skipped, 1 todo, 1 failed across 256 files.
`v2 pty HttpApi > serves location-wrapped PTY routes and retains exited sessions`
still reported a fast `exit 4` process as running after its 20-second deadline.
No retry was used to turn that failed gate green. The build ran afterward.

Investigation narrowed a plausible race: bun-pty 0.4.8 starts its read loop inside
the Terminal constructor, and can fire data/exit events before the consumer can
subscribe. Core spawns before attaching its listeners. This is source-level
evidence, not proof that this race caused today's failure; the dependency also
breaks its loop without an exit event on read errors. A deterministic reproducer
must distinguish those cases before modifying the adapter/dependency. The
packaged Node runtime uses a different native PTY backend. Do not weaken the
test or label this repaired. Candidate release remains blocked.

One live confidential SDK request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-3edb9acabd9e3ecc293d000aa30a594b`.
Catalog upper estimate: $0.011059776, not measured settled spend. The isolated
profile used the existing encrypted credential without retries, funding or
session mutation. OAuth/PKCE, credential removal, streaming privacy and approvals
were fixture-tested, not fresh signed-package interactive acceptance.

Installed signature/Gatekeeper, public homepage/status/API health, download page
and both DMG links passed. Previous PR CI/security checks are green. Production
remains `v0.3.0-alpha.1`; no signing, publishing, website changes or Intel
interactive verification occurred. OnPrem was not touched.

## September 28, 2026

Public main remains `4c46c96f`; tested candidate is `22e58c3c`. Reviewed all six
upstream commits after `b471c2b4` through
`03e67171ab2dc1e7f16e8cebfbc7f778f61b89f0` on upstream `dev`. No source port:
`35fc7a77` fixes the Cloudflare-specific loader and extracts the existing shared
timeout wrapper without adding behavior needed by the locked TrustedRouter path;
`1eacc1bd` changes upstream changelog model selection; `90e65205` bumps upstream
release versions; `661b7c55`, `d6963bdf`, and `03e67171` change hosted rankings.
No alternate provider or hosted service was enabled.

All daily source gates passed: full runtime 3,591 passed, 22 skipped, 1 todo,
zero failures across 256 files; core browser/filesystem/npm 43 passed; desktop
77 passed; packaging 3 passed; TUI lifecycle 3 passed. Desktop, runtime and core
typechecks, SQLite persistence, production build, and actual subprocess output
under Node and Electron utilityProcess passed. The production build ran after
the full runtime suite. Yesterday's terminal timeout did not recur, without any
source or timeout change; this does not prove its historical root cause or repair.
Yesterday's PR CI and GitGuardian checks are also green.

One live confidential SDK request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-f0167212d9be669cbf4ccced95a88d1e`.
Catalog-based request upper estimate: $0.011059776, not measured settled spend.
Used an isolated profile and existing encrypted credential without retries,
funding, user-session mutation or user conversation content. OAuth/PKCE,
credential persistence/removal, bridge streaming and approval coverage are local
fixture tests, not a new signed-package interactive login or Intel execution.

Installed release signature/Gatekeeper, public homepage/status/API health,
download page and both DMG downloads passed. No new package was signed or
published and no website change was made; production remains `v0.3.0-alpha.1`.
The existing draft candidate is not automatically promoted by one clean run.
Fresh signed-package OAuth, restart/sign-out, inference and approval acceptance
remain required before that candidate can replace the working release.

## September 27, 2026

Public main remains `4c46c96f`. Reviewed all seven upstream commits after
`34aa4274` through `b471c2b4495747353af768fbf2e0790c9d820ce2` on upstream `dev`.
Ported separately with upstream attribution:

* `29f07e0c` -> `470ff855`: shared HTTP(S)-only browser opener, updated opener
  dependency, and rejection of non-web MCP authorization URLs.
* `b471c2b4` -> `30db47ec`: detect browser launchers that already exited with
  failure before the listener was attached, with regression tests.

Not ported: `543c686c` hosted DeepSeek allowance, `adee738d` generated hosted
documentation, `696f41bc` Nix hashes (this desktop uses the reviewed macOS/Bun
pipeline), `b65de4d6` hosted model docs, and `a42f393c` ecosystem marketing link.
No confidential routing, credential, approval, telemetry or backend policy was
weakened. September 26's isolated worktree had no commits or completed test record;
this run includes that unported upstream range rather than assuming it was done.

Desktop, runtime and core typechecks passed. Desktop tests: 77 passed; packaging:
3 passed; core browser/filesystem/npm tests: 43 passed; TUI lifecycle: 3 passed.
SQLite persistence, production build, and actual subprocess output under Node and
Electron utilityProcess passed. Initial sandboxed desktop and build attempts were
blocked by loopback/network restrictions; normal-permission runs passed unchanged.

Full runtime: 3,590 passed, 22 skipped, 1 todo, 1 failed across 256 files. The
failure was `v2 pty HttpApi > applies plugin shell environment before forced PTY
values`, a five-second output wait timeout. One focused diagnostic run of this
file and the new MCP browser/OAuth tests passed all 19 tests. This does not waive
the failed full-suite gate or establish its root cause; candidate release remains
blocked. Do not increase timeouts or retry until green as a substitute for repair.

One live confidential SDK request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-70bfd5ff936335a23562fc2888955d23`.
The catalog-based request upper estimate was $0.011059776, not measured settled
spend. Used an isolated profile and the existing encrypted credential, with no
retries, automatic funding, session mutation or user conversation content.
OAuth/PKCE, sign-out, bridge streaming and tool approvals were fixture-tested;
fresh signed-package interactive login and Intel execution were not verified.

Installed release signature and Gatekeeper passed. Homepage, status, API health,
download page and both DMG links returned HTTP 200. Production stays on
`v0.3.0-alpha.1`; no signing, installation, publication or website change occurred.

Signing discovery correction: QuillCode's current
`.github/workflows/sign-trusted-cowork.yml` (workflow 358334173) is the correct
OpenCode, dual-architecture signer. The similarly named `sign-trcc-desktop.yml`
and `codex/tr-cowork-signer-build-order` branch are not the appropriate path.
The correct workflow verifies the immutable SHA against `confidential-desktop`.
After resolving the full-suite gate, promote reviewed source through that branch,
use a new release version, and complete signed-package acceptance before release.

## September 25, 2026

Public main remains `4c46c96f`; tested candidate is `38648a02`. Reviewed the
three upstream commits through `34aa4274` on `anomalyco/opencode`'s `dev` branch.
Hosted statistics, Zen documentation and issue automation do not affect the
locked desktop backend. No new runtime source was imported.

All source checks passed today: full runtime 3,587 passed, 22 skipped, 1 todo,
zero failures across 255 files; expanded core 41 passed, zero failures; desktop
77 passed; packaging 3 passed; TUI lifecycle 3 passed. Desktop/runtime typechecks,
SQLite persistence, production build, and actual subprocess output under Node
and Electron utilityProcess passed. Both previously failing native suites passed
without a code change; their historical root causes are not established.

One live confidential request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-5a5fe0030547e967f1190593487445e1`.
Catalog upper estimate: $0.011059776, not measured settlement cost. It used an
isolated profile and the existing encrypted credential without retries, funding,
session mutation, or user conversation content. OAuth/PKCE, sign-out, credentials,
catalog and approval tests used fixtures, not a fresh signed-package login.

Installed signature/Gatekeeper and public homepage/status/API health, download
page and both correct architecture downloads passed. Production stays on
`v0.3.0-alpha.1`; no release, install or website change was made.

Release handoff: published provenance points to QuillCode workflow commit
`312b4fbff98769ae9563c12540f46df271d432d3`, whose OpenCode signer verifies the
`confidential-desktop` source branch. That branch still points to released source
`e8e6207`. QuillCode's default-branch workflow is the legacy Pi/runtime signer and
must not be dispatched for this candidate. Reconcile the reviewed signing path
with the candidate before signing; then verify checksums/provenance and perform
fresh signed-package OAuth, restart/sign-out, inference and tool approval before
publishing. No interactive Intel verification is claimed.

## September 24, 2026

Public main remains `4c46c96f`. Reviewed seven upstream commits through
`0f549842` on `anomalyco/opencode`'s `dev` branch. Ported `82d4c890` separately:
redact credentials from debug configuration output, without mutating provider
configuration. Its two tests passed, including real CLI output with fixture
secrets. Skipped hosted Go/stats changes, generated metadata, the GitLab provider
bump and Gemini-specific thinking defaults. Confidential routing is unchanged.

Desktop/runtime typechecks, 77 desktop tests, 3 packaging tests, 3 TUI lifecycle
tests, SQLite persistence and production build passed. Actual subprocess output
passed under both Node and Electron utilityProcess. Expanded core tests recorded
36 passes and the same 5 watcher-readiness failures. No gate was weakened.

Full runtime completed with 3,587 passed, 22 skipped, 1 todo and zero failures
across 255 files. The previously intermittent PTY test passed today; no fix was
made or root cause established for it. The separate watcher gate still blocks
release.

One live confidential SDK request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-c9e129c7561da91522ff6a6cb735e4ed`.
Catalog upper estimate: $0.011059776, not measured settlement cost. Used isolated
profile storage and the existing encrypted credential, with no retries, funding,
session revocation or user conversations. OAuth/PKCE, sign-out, credential storage,
catalog and tool-permission coverage used local fixtures. Fresh interactive login
and Intel execution were not tested.

Installed signature and Gatekeeper passed. Public homepage/status/API health,
the documented download page and both correct DMGs returned HTTP 200. Production
remains `v0.3.0-alpha.1`; no signing, publication or website deployment occurred.

## September 23, 2026

Public main remains `4c46c96f`; candidate is `cf610a95`. Reviewed all nine
upstream commits through `7cb044ee` on `anomalyco/opencode`'s `dev` branch.
They cover hosted console/Go/Zen changes, Codex model eligibility, a GitLab
provider bump, and generated artifacts. None applies to the locked confidential
backend; none addresses the native test blockers. No runtime source was imported.

Desktop/runtime/core typechecks, 77 desktop tests, 3 packaging tests, 3 TUI
lifecycle tests, SQLite persistence, production build, and actual subprocess
results under Node and Electron utilityProcess passed. OAuth/PKCE, sign-out,
encrypted credentials, fail-closed catalog and tool approvals used local fixtures.
No fresh interactive OAuth or Intel execution was performed.

Expanded core tests: 36 passed and the same 5 native watcher readiness failures.
A disposable direct Parcel watcher probe also failed in a workspace directory,
so the failure is not limited to macOS temporary-directory placement. This is
not a proven root cause or a waiver of the native release gates.

Full runtime: 3,584 passed, 22 skipped, 1 todo, 1 failed across 254 files.
The same Bun PTY exit-status failure remains; no new runtime failures were seen.

One live confidential request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-6dd42a0bb894791c4a57f7515b3ac0fd`.
Current-catalog upper estimate was $0.011059776, not actual settled spend.
The harness used isolated profile storage and an existing encrypted credential;
no retries, automatic funding, credential mutations, or user conversations.

Installed signature/Gatekeeper checks passed. Homepage, status, API health,
documented download page and both correct architecture DMGs returned HTTP 200.
Production remains `v0.3.0-alpha.1` from `e8e6207`; no new signing, publication,
installation or website deployment occurred. OnPrem remains unrelated and paused.

## September 22, 2026

Public main is still `4c46c96f`. Reviewed the five upstream commits through
`fe3f3a41` (v1.18.32) on `anomalyco/opencode`'s `dev` branch. Ported separately:

* `ba341c6c`: resolve package entrypoints to importable files under Node, with
  a real Node regression test.
* `f5ce4f88`: break the filesystem-search runtime import cycle.

Skipped generated artifacts, upstream version churn, and hosted MiMo docs.
No confidentiality, credentials, telemetry, approval, or fallback policy changed.

Desktop, runtime, and core typechecks passed. All 77 desktop tests, 3 packaging
tests, 3 TUI lifecycle tests, SQLite persistence, and the production build passed.
Real subprocess results passed under Node and Electron utilityProcess.
The expanded npm/filesystem run had 36 passes and 5 watcher-readiness timeouts;
the new Node entrypoint test and filesystem-search tests passed. All five watcher
failures reproduce on the pre-port candidate. A disposable native Parcel watcher
probe also failed to observe file creation under both Bun and Node, independently
of OpenCode services. This narrows the investigation but does not prove a root
cause or justify skipping the gate.

Full runtime result: 3,584 passed, 22 skipped, 1 todo, 1 failed across 254 files.
The remaining failure is the previously recorded Bun PTY exit-status test.
The draft remains blocked on that failure and the native watcher investigation.

Today's one live confidential request returned exact `PONG`, HTTP 200, model
`openai/gpt-oss-120b`, ID `chatcmpl-e167827e7c754ecc369443c2a782c63f`.
Catalog-based upper estimate: $0.011059776, not measured settlement cost.
Used isolated profile storage and the existing encrypted credential without
modification, retries, or automatic funding. Browser OAuth, sign-out, credential
persistence and tool permissions were covered by fixture tests, not a fresh
interactive login. No Intel interactive execution was performed.

Installed release signature and Gatekeeper passed. The public download page
still links both correct `v0.3.0-alpha.1` DMGs; those assets, homepage, status and
API health returned HTTP 200. No signing, publication, or website change was made.

## September 21, 2026

Public main remains `4c46c96f`; draft PR #2 remains unmerged. The isolated
daily worktree is based on its candidate `9ff9245a`. Reviewed all 11 new
upstream commits through `e059ac59` on `anomalyco/opencode`'s `dev` branch.
None is applicable to the locked confidential backend: the runtime changes
are Together usage reporting and Bedrock tool images; the others concern hosted
console authentication, hosted catalogs, stats, documentation, and generated
Nix metadata. No hosted-provider policy or runtime source change was imported.

Desktop and runtime typechecks, all 77 desktop tests, 3 packaging tests,
SQLite draft persistence, 3 TUI lifecycle tests, and production build passed.
Actual subprocess output passed under Node and Electron utilityProcess.
OAuth/PKCE, credential persistence/sign-out, confidential eligibility and tool
approval coverage used local fixtures, not a fresh interactive browser login.

Today's single live confidential SDK request returned exact `PONG`, HTTP 200,
model `openai/gpt-oss-120b`, ID `chatcmpl-faa4c7dc8edabafb8f31acc9d9206441`.
The current-catalog upper estimate was $0.011059776, not measured settled spend.
It used isolated profile storage, an existing encrypted credential, no retries,
and no user conversation. No user session was revoked or replaced.

The full runtime suite finished with 3,584 passed, 22 skipped, 1 todo, and
1 failed across 254 files. It again reproduced the Bun PTY exit-status failure.
One isolated comparison of both previously failing files passed all 7 tests.
Do not infer a root cause or waive the full-suite gate from the isolated pass.
The green GitHub CI run does not include the full runtime suite.

The installed release passes deep strict codesign verification and Gatekeeper
outside the sandbox. An initial sandboxed codesign failure did not reproduce
with normal verification access. The documented `/confidential-cowork` page
links to both correct `v0.3.0-alpha.1` DMGs, and both downloads, homepage, status,
and API health return HTTP 200. No new package was signed or published; fresh
interactive OAuth and Intel execution were not tested. Production is unchanged.

## September 20, 2026

Production remains `v0.3.0-alpha.1`. This candidate is not approved for release.

The source baseline is OpenCode v1.18.30, `3104c142`. The upstream repository
redirects from `sst/opencode` to `anomalyco/opencode`; its default branch is `dev`,
not `main`. Reviewed the 59-commit range through
`ebb7b76eca82342642c78645109e865614533827`.

Ported separately with upstream SHAs in commit messages:

* `95daf906`: ACP session selection restoration and reasoning chunk boundaries.
* `199a4cdb`: shared AI SDK dependency versions and upstream lock changes.
* `a97622c8`: propagate remote-auth startup failures instead of successful exit.

Other changes in this range are not ported: hosted console/Go billing and model
catalogs, stats jobs, generated hosted artifacts, upstream release-version churn,
website documentation, Copilot-only adaptive thinking, an unrelated provider icon,
and removal of legacy app regression coverage. Trusted Cowork does not enable those
hosted providers or services. Existing regression coverage is retained. Upstream's
v2 download promotion is not a migration of this application's locked runtime.

## Verification

Candidate checks on macOS Apple silicon:

* Desktop and runtime typechecks passed.
* All 77 desktop main-process tests passed, including mocked OAuth/PKCE,
  encrypted vault persistence/removal, confidential policy and stream bridge.
* All 3 packaging contract tests passed; Node SQLite persistence passed.
* All 254 focused runtime/permission tests and 3 TUI lifecycle tests passed.
* Production desktop build passed.
* Real `pwd` execution passed under Node and Electron utilityProcess.
* Live confidential SDK PONG passed with HTTP 200 and exact PONG, model
  `openai/gpt-oss-120b`, request `chatcmpl-c93f2186475a008faa08688b30b928dc`.
  The fixed request's catalog-based upper estimate was $0.011059776, not measured
  settled spend. No user conversation was sent. The diagnostic used isolated
  profile storage and read the existing encrypted development credential without
  changing it. Initial diagnostic attempts failed before HTTP dispatch because
  the temporary harness resolved an ESM-only package through CommonJS; corrected.

Full runtime suite: 3,582 passed, 22 skipped, 1 todo, 3 failed across 254 files.
Failures:

* `httpapi-v2-pty.test.ts`: exited PTY remained reported as running.
* `httpapi-v2-pty.test.ts`: shell environment test interrupted.
* `session-select.test.ts`: invalid session ID status mismatch.

The first PTY failure also reproduces on the released source. Both files together
pass in an isolated candidate rerun (7 tests). This suggests timing or suite-order
interference, but is not a proven root cause or permission to waive the failures.
Resolve the full-suite instability before signing or publishing this candidate.

The installed released app still passes deep signature verification and Gatekeeper.
Both public DMG downloads, homepage, status and API health return HTTP 200.
This daily run did not exercise fresh interactive OAuth, a new signed candidate,
or Intel interactive execution. No installed user session was interrupted.

## Invariants

Keep TrustedRouter at `https://api.trustedrouter.com/v1`, confidential-only routing,
fail-closed catalog eligibility, PKCE, encrypted credentials, explicit tool approvals,
disabled telemetry, and no alternate inference backend. Publish only after signed
packaged-app verification and the reviewed website rollout. OnPrem is unrelated.
