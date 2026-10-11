# Dependency upgrade review revalidation

**Date:** 2026-10-12 (Australia/Sydney)  
**Repository baseline:** `aa05cdae`, branch
`feat/formik-to-react-hooks-migration`  
**Verdict:** Do not execute the September plan unchanged.  
**Status:** Review complete with concerns; replacement proposal requires the
feasibility gates below.

## Answers to the requested questions

**Was the review applied?** Substantially, to the plan. Its twelve named
recommendations have corresponding remediation text. That is document adoption,
not proof of implementation or external-owner approval.

**Was the migration implemented?** No. Some dependency maintenance landed
independently, including fewer overrides and newer lint/Storybook packages, but
the defining migration changes remain absent.

**Is the review still valid and up to date?** Its engineering principles remain
useful. Its September inventory, zero-audit observation, blanket Vitest 5
compatibility hold, and implementation-readiness assessment are stale. The
historical 66/100 review and the revised plan's 98/100 approval describe
different document states; neither is a current release clearance.

The plan and companion review were introduced in `b2ab9def`. There are 354
reachable commits in `b2ab9def..aa05cdae`. HEAD advanced during this audit
through an unrelated Formik documentation commit; dependency inputs were
rechecked. No claim is made about other branches, unpublished work, or deployed
infrastructure.

## Scope and decisions

The user selected a full adoption/freshness audit plus a smaller replacement
proposal. They also selected patch-tool remediation as a prerequisite while
preserving zero vulnerabilities, bridge verification before MSAL activation,
separate inventory/approval/execution evidence, and auth recovery coverage.

This is a planning review. Dependency installation, package changes,
infrastructure changes, Entra changes, and deployment were not performed. No
external ownership or approval was inferred from text in a plan.

## Recommendation adoption

Line references in this table refer to the unchanged body of the
[September implementation plan](2026-09-27-repository-dependency-upgrade.md).

| Original concern                                     | Incorporated in the revised plan                                      | Current implementation evidence                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| MSAL API, bridge, build, headers, Entra and rollback | Tasks 0, 5 and 6; lines 806, 1209, 1433                               | Browser 3.30.0 / React 2.2.0 remain; bridge, ADR and runbook absent                      |
| Remove overrides only after owners                   | Task 9; lines 1801–1838                                               | Eight override rules remain; WDS 5 and remark-cli remain                                 |
| Commit only GREEN cohorts                            | Constraint line 131 and cohort commit steps                           | Instruction adopted; migration commits not evidenced                                     |
| MDX ignore/config/frail/diagnostic parity            | Task 1B; lines 941–985                                                | remark-cli command remains; replacement script/tests absent                              |
| Explicit lsmcp retirement decision                   | Lines 102–105, 824–828; Task 2                                        | Dependency, launcher and configuration remain; owner sign-off not evidenced              |
| Real auth/telemetry integration and separate cohorts | Task 5 staging harness, Task 6 matrix, Task 7 package/transport smoke | Planned artifacts absent; current supporting tests do not establish the new integrations |
| Exact migration targets and explicit outdated holds  | Lines 87–92 and 279–344                                               | React/React DOM/TypeScript still declared with carets; target and hold data now stale    |
| Avoid blanket Glob-major security policy             | Lines 949–951                                                         | Current policy permits maintained non-10 majors but still requires scoped overrides      |
| Test exact Node lower bound and constrain Node types | Task 3; lines 1059–1083                                               | Manifest floor and lower-bound CI remain 24.0.0; local/Chromatic Node remain 24.20.0     |
| Bound lockfile churn and preserve baseline           | Task 0; graph-cohort diff checks                                      | Manifest and lock declarations match; installed lint tools lag both                      |
| Try parser without patch before rebasing             | Task 9; lines 1781–1799                                               | Old `html-react-parser+6.1.4.patch` still exists with parser 6.1.8                       |
| Align mirrored policy and operational documentation  | Task 10; lines 1885–1917                                              | New MSAL runbook absent; alignment remains planned                                       |

The real-MSAL-import recommendation is less explicit than the telemetry
equivalent: Task 5's bootstrap assertions can still be mocked. A real production
build and staging flow would supply meaningful integration evidence, but neither
has been run for the proposed migration.

## What already exists

Reuse `tests/unit/config/dependencySecurity.test.ts` and
`workflowPolicy.test.ts`, existing unit/Storybook/BDD suites, the exact-floor CI
job, native-binding verification, and the existing auth guard/account provider.
These already cover version floors, Vitest alignment, deprecation metadata,
workflow partitions, and current application behavior.

The plan creates several new script-policy test suites around script text.
Prefer behavior tests for genuinely new MDX or bridge functionality and extend
existing configuration tests for version/runtime policy. A new permanent command
needs an actual repeatable CI use case; a one-time review inventory does not
automatically need a custom CLI.

## Findings

### F1. End-state feasibility and GREEN sequencing are no longer established — P1, confidence 10/10

**Evidence:** September plan lines 763–775 require a clean baseline audit; lines
899–915 require Task 1 to pass audit without changing the graph; lines 2023–2027
freeze `patch-package`. Both `npm audit --json` and
`npm audit --package-lock-only --json` now report **nine high-severity affected
package entries** arising from one underlying braces advisory. This is not nine
independent vulnerabilities.

The surviving chain is
`patch-package@8.0.1 -> find-yarn-workspace-root@2.0.0 -> micromatch@4.0.8 -> braces@3.0.3`.
Removing remark-cli and upgrading WDS will not remove that third chain. The
[reviewed braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
currently lists no patched release. Registry latest for patch-package remains
8.0.1 and braces remains 3.0.3.

An additional current owner is `@qdrant/js-client-rest@1.19.0`, whose latest
published manifest pins `undici: 7.29.0`. The repository overrides it to 7.30.0;
its existing security test requires at least 7.29.1. Thus the old owner
inventory also omits a concrete obstacle to natural resolution. This is a
repository-policy conflict; this review did not independently reproduce an
undici exploit.

**Consequence:** Task 0/1 cannot satisfy their expected audit result today, and
the proposed final graph is not proved achievable under the unchanged patch-tool
constraint. Existing audit paths are development tooling; production
exploitability was not established.

**Recommendation:** Capture failures as baseline evidence, resolve patch-tool
and remaining owner feasibility first, and commit all necessary security-graph
changes together when the zero-audit gate passes. Do not treat a failed baseline
as migration success, accept an exception, downgrade patch-package
automatically, or remove Qdrant functionality incidentally. The user selected
remediation as a prerequisite; the replacement mechanism still requires design
and validation.

### F2. Node provisioning changes are missing from executable tasks — P1, confidence 10/10

**Evidence:** The plan line 96 says `.node-version` “remains 24.21.0”; lines
514–517 say Chromatic retains 24.21.0. Actual `.node-version:1` and
`.github/workflows/chromatic.yml:46` specify 24.20.0. Task 3 changes only the
lower-bound PR job; its file and commit lists omit `.node-version`. Task 10
lists Chromatic as inspect-only.

**Consequence:** Raising `devEngines.runtime.version` to `>=24.21.0` with
`onFail: error` while retaining Chromatic 24.20.0 breaks that clean install.
Local contributors are also directed below the new floor.

**Recommendation:** Explicitly modify both files, assert every exact
provisioning surface is at or above the floor, and run install plus
unit/configuration/build checks on exact 24.21.0. The
[Node release exists](https://nodejs.org/en/blog/release/v24.21.0); provisioning
and testing it remain unperformed.

### F3. Replaying old targets would downgrade current packages and leave new outdated packages unclassified — P1, confidence 10/10

**Evidence:** Plan targets `@types/node 24.19.0`, `vite 8.3.1`, and
`@eslint-react/eslint-plugin 5.20.8`; current manifest/lock have 24.19.1, 8.3.2
and 5.23.3 respectively. Plan lines 38/275 still describe 16 override rules;
eight remain. Current outdated output includes Slate/Slate React and MSW major
updates with no explicit upgrade/hold disposition in the old matrix.

Selected live registry results:

| Package                    | September target | Latest observed 2026-10-12 |
| -------------------------- | ---------------- | -------------------------- |
| MSAL Browser / React       | 5.23.0 / 5.7.1   | 5.25.0 / 5.7.2             |
| Application Insights web   | 3.4.4            | 3.4.5                      |
| jsdom                      | 30.1.1           | 30.1.2                     |
| Sass                       | 1.105.0          | 1.105.1                    |
| Vite                       | 8.3.1            | 8.3.4                      |
| Vitest cohort latest tuple | 5.0.2            | 5.0.3                      |

These are candidates to review, not authorization to install. MSAL React 5.7.2
requires Browser `^5.24.0`; pairing it mechanically with the old Browser 5.23.0
target is invalid.

**Recommendation:** Regenerate a complete direct-dependency disposition from the
preserved manifest/lock, prohibit unintended downgrades, verify coupled peers,
and refresh every explicit hold tuple. Preserve the user-owned react-hook-form
range unless separately authorized. A registry release moving after capture
needs renewed evidence, not a wildcard exception.

### F4. The Vitest 5 incompatibility hold is obsolete — P2, confidence 10/10

**Evidence:** Plan lines 97–98 and 326–344 hold Vitest 4 because Storybook 10.6
supposedly supports only Vitest 3/4. Current Storybook is 10.6.1. Both registry
metadata and the
[10.6.1 source manifest](https://github.com/storybookjs/storybook/blob/v10.6.1/code/addons/vitest/package.json)
accept Vitest 5 and browser-playwright 5. The older 10.6.0 manifest supported
only 3/4.

**Recommendation:** Reassess Vitest 5 as a coordinated test-platform migration.
A temporary Vitest 4 hold may still be sensible to isolate work, but its reason
must be actual remaining migration risk with an owner and review trigger. Peer
compatibility alone does not prove the repository's test configuration or
coverage remapper works with Vitest 5.

### F5. Bridge-first activation remains ambiguous — P1, confidence 8/10

**Evidence:** Task 5 produces the combined MSAL 5 application build. Task 6
lines 1452–1455 verify the bridge “after deploying the build to staging,” then
describe switching auth configuration. The original review line 58 required an
inert bridge-first sequence.

**Consequence:** An active deployment can run MSAL 5 with the old redirect
destination before verification. An inactive slot could avoid this, but Step 2
does not require it. This is a sequencing ambiguity, not proof of a hosting
outage.

**Recommendation:** Deploy only the bridge and route policy, or use an inactive
slot. Verify the actual bridge, retain both Entra URIs, then activate MSAL 5 and
its matching runtime configuration together. The user selected this requirement.
Microsoft still documents the bridge's
[same-origin, cache and COOP requirements](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-browser-v5.23.0/lib/msal-browser/docs/redirect-bridge.md).

### F6. Lifecycle inventory is overstated as execution/prevention evidence — P2, confidence 10/10

**Evidence:** Task 1 lines 880–888 inspect script declarations after `npm ci`;
lines 2025–2027 claim that this proves no new owner ran and no approved owner
was skipped. [npm query](https://docs.npmjs.com/cli/v11/commands/npm-query/)
returns dependency objects, not execution outcomes. The
[pinned npm 11.19.1 approve-scripts documentation](https://github.com/npm/cli/blob/v11.19.1/docs/lib/content/commands/npm-approve-scripts.md)
describes unreviewed script approvals as advisory by default.

**Recommendation:** Separate graph inventory, approval semantics, and actual
install/build outcomes. Verify the pinned npm behavior with disposable
allowed/denied/unreviewed fixtures before calling it preventative enforcement.
Preserve credential isolation. Do not broaden approvals or claim that a
post-install failure prevented a script already executed. The user selected
separate evidence.

### F7. Auth renewal tests omit a documented recovery branch — P2, confidence 9/10

**Evidence:** Task 6's six assertions cover successful `CacheLookupPolicy.Skip`
renewal and normal logout. Microsoft's
[pinned token-lifetime guidance](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-browser-v5.23.0/lib/msal-browser/docs/token-lifetimes.md)
says Skip fails with blocked third-party cookies and describes
interaction-required fallback.

**Recommendation:** Keep the successful iframe test, record its browser
prerequisites, and add blocked-cookie/expired-IdP-session tests proving
supported recovery or a clear recoverable error, with no redirect loop, token
logging, or indefinite spinner. Add a real-package startup check so
source-contract mocks cannot hide removed exports. The user selected recovery
coverage. This is a missing acceptance branch, not a demonstrated production
regression.

## Test review and failure map

Vitest 4 unit/Storybook and Playwright-BDD are already available. “Planned”
below means specified in the revised plan; it does not mean implemented or
passing.

```text
Manifest + lock
  -> clean install
     -> inventory / approval / execution: separate evidence [F6 GAP]
     -> natural graph: audit + peers + deprecation + no overrides [F1 GAP]
  -> Node provisioning: local + exact-floor CI + Chromatic [F2 GAP]
  -> programmatic MDX
     -> config + ignore + warning + empty pattern [PLANNED]
  -> build main + isolated bridge
     -> direct 200 + headers + local chunk [PLANNED]
     -> verify bridge BEFORE auth activation [F5 GAP]
  -> real application auth [E2E]
     -> login -> original route -> protected API -> logout [PLANNED]
     -> forced iframe renewal [PLANNED]
     -> blocked cookie / expired IdP session -> recovery [F7 GAP]
     -> rollback old artifact + config + URI [PLANNED]
  -> telemetry [INTEGRATION]
     -> initialize + correlated page view + handled exception [PLANNED]
  -> date / route / error / analytics [EXISTING + FOCUSED REGRESSION]
```

| Failure                                       | Planned evidence and handling                     | Remaining consequence                      |
| --------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Vulnerable retained patch-tool graph          | Audit catches it, but plan assumes clean baseline | Execution stops without a specified remedy |
| New Node floor with old Chromatic pin         | Lower-bound test covers another job               | Chromatic install fails                    |
| New script or skipped approved build          | Metadata comparator only                          | Execution claims can be falsely reassuring |
| Bridge unavailable or wrong headers           | Verifier and rollback specified                   | Must run before application activation     |
| Silent renewal cannot use IdP cookies/session | Success matrix only                               | Recovery behavior unproven                 |
| Telemetry missing/duplicate                   | Bounded correlation-based smoke specified         | Good planned gate; not implemented         |
| MDX ignored invalid file/warning parity       | Behavior fixtures specified                       | Good planned gate; not implemented         |

Two critical planning gaps drive the no-clearance verdict: F1 end-state
feasibility and F5 activation sequencing. No new production failure was
reproduced.

## Performance review

No measured runtime-performance defect was established. Repeated clean installs
and complete gates in every cohort increase execution cost, but measured
duration is unavailable. Keep focused verification per green cohort and run the
complete canonical gate at each release boundary; do not remove required checks.
Bridge isolation also avoids loading the React application during hidden-iframe
renewal.

## Independent review

A separate Codex subagent independently confirmed F5 and F6. It found the global
iframe callback already gated by an accepted ADR and considered
CacheLookupPolicy.Skip a valid renewal mechanism with browser prerequisites.
There was no substantive disagreement after verification. This was an
independent same-model review, not a cross-model consensus claim.

## Smaller replacement and task ownership

See the
[replacement proposal](2026-10-12-repository-dependency-upgrade-replacement-proposal.md).
It separates security/graph work, compatible runtime and telemetry updates, and
the auth release. It retains the overall requested end state; finishing one
stage does not claim the whole migration is complete.

Implementation tasks:

- [ ] **T1, P1:** Resolve patch-tool/Qdrant owner feasibility and produce a
      zero-audit natural graph before claiming a green migration boundary.
- [ ] **T2, P1:** Explicitly align local, exact-floor and Chromatic Node
      provisioning.
- [ ] **T3, P1:** Refresh all targets and holds; avoid downgrades and reassess
      the Vitest cohort.
- [ ] **T4, P1:** Require verified inert bridge or inactive slot before MSAL
      activation.
- [ ] **T5, P2:** Separate lifecycle inventory, approval and execution evidence.
- [ ] **T6, P2:** Cover real MSAL startup and renewal-failure recovery.

These are proposed implementation tasks, not changes performed by this review.
Estimates and file ownership are included in the local gstack task artifact. No
unrelated TODOs were identified; no TODOS.md change is proposed.

## NOT in scope

- Implementing upgrades, replacing the patch tool, removing Qdrant or lsmcp, or
  changing approvals.
- Updating React beyond 18.3.1 or TypeScript beyond 5.9.3.
- Formik/react-hook-form feature migration or normalizing user-owned baseline
  ranges.
- Entra/hosting changes, staging credential use, production header verification,
  deployment or release approval.
- A new dependency-management framework or additional UI/design review.

## Verification and limitations

| Verification                                      | Observed result                                                                          | Supported conclusion                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------- |
| Secrets scans before inspected workspace files    | No reported secrets                                                                      | Those reads passed the required scan        |
| Manifest/lock comparison                          | Matching root dependency declarations; eight override rules; no deprecated lock metadata | Current stored graph state                  |
| `npm outdated --json --long`, selected `npm view` | Targets and hold tuples have moved                                                       | September inventory needs refresh           |
| `npm audit --json` and lock-only audit            | Nine high affected entries, zero critical                                                | Zero-audit claim is stale                   |
| `npm explain`                                     | Patch-package, WDS, remark and Qdrant owner chains confirmed                             | Remediation needs the actual current owners |
| `npm ls --all`                                    | Three invalid installed lint-tool entries                                                | node_modules is behind manifest/lock        |
| Two focused config suites                         | 2 files / 151 tests passed                                                               | Existing configuration contracts pass       |
| File existence and source inspection              | New migration artifacts absent; old auth/build APIs remain                               | Main migration not implemented              |

Diagnostics and focused tests used local Node 24.20.0 / npm 11.17.0, not
proposed Node 24.21.0 / pinned npm 11.19.1. The manifest/lock are internally
consistent, but node_modules contains older eslint-react, globals and
typescript-eslint versions. No install was run to repair another task's
workspace.

The full build, full CI gate, Storybook MCP, BDD, and real staging/telemetry
tests were not run. This review does not make claims about UI component
properties, staging readiness or production health. The unchanged September
review remains historical evidence.

The two new documents and appended review footer pass Prettier. The historical
plan already failed Prettier at HEAD; its original body was preserved and only
the current review footer was appended. Targeted `git diff --check` passes.

## Completion assessment

Scope: full audit with a smaller proposal requested. Architecture: 3 findings.
Code/dependency quality: 3 findings. Tests: 1 gap finding and diagram produced.
Performance: no measured finding. Independent review: completed. Critical
planning gaps: 2. Parallel implementation: one dependency writer; external owner
preparation can proceed independently. No implementation clearance is granted.
