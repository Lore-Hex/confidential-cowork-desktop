# OpenCode Upstream Tracking

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
