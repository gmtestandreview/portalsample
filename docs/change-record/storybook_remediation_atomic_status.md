# Storybook Diagnostic Remediation — Atomic Status and Decision Record

**Record date:** 30 August 2026  
**Sources:** `storybook_remediation_status.md` execution transcript and `2026-08-30-storybook-diagnostic-remediation-audit.md` original plan  
**Overall status:** **Remediation implemented; final acceptance incomplete**

## 1. Executive status

| Atomic statement | Status | Evidence |
| --- | --- | --- |
| Tasks 1, 3, 4, 5, 6 and 7 were completed as planned. | Confirmed | Their required implementation, live-guard proofs, verification and commits are evidenced in the transcript. |
| Tasks 2 and 8 were completed only in a reduced form authorised during execution. | Confirmed deviation | Task 2 Step 5 and Task 8 Steps 1 and 3 were not performed as originally specified. |
| Task 9 produced the required ownership record, but its planned no-conflict revert proof failed. | Confirmed deviation | The dry-run conflicted in six files and was aborted safely. |
| Task 10 final acceptance was started. | Confirmed | Type-check, lint, unit tests, Storybook with coverage, coverage-artifact audit, analytics checks, and change-scope checks were run. |
| Task 10 final acceptance was not completed in the captured transcript. | Confirmed | The non-coverage Storybook run was still running; `build-storybook` was still pending when the transcript ended. |
| The Storybook diagnostic remediation cannot yet be labelled fully complete. | Decision | Completion requires the outstanding acceptance gates and a final recorded scorecard. |
| The three original Storybook diagnostic groups have strong completed-run evidence of remediation on the coverage path. | Confirmed with scope | A completed 87-file/218-test coverage run was audited `CLEAN`; the emitted coverage artifact was also audited `CLEAN`. |

## 2. Original diagnostic groups

| ID | Diagnostic | Atomic outcome | Evidence status |
| --- | --- | --- | --- |
| D1 | Deprecated `vitest.init()` warning | A compatibility bridge remained in place and received a real installed-source contract test. | Verified by 4 passing contract tests, including a fired-guard mutation check. |
| D2 | Unhandled MSW requests | Lookup mocking was changed from log-derived cases to a source-derived, exhaustive fixture map; unknown lookup types fail closed with HTTP 501. | Verified by 7 handler tests and a completed focused Storybook run audited `CLEAN`. |
| D3 | V8 remap/parse failure for `terms-config.json?import` | Coverage verification now inspects the emitted artifact rather than a configuration literal. | Completed coverage run: 276 executable entries, zero JSON entries, zero `terms-config` entries, audit `CLEAN`. |

## 3. Task-by-task status

| Task | Atomic deliverable | Status | Commit |
| --- | --- | --- | --- |
| 1 | Add a three-state Storybook log auditor: `clean`, `dirty`, or `invalid`. | Complete | `e2c22f6` |
| 2 | Guard the V8 remapper version and document the confounded lockfile change. | **Partial — Step 5 version-isolation experiment skipped by decision** | `e430143` |
| 3 | Audit the emitted coverage artifact and remove tautological coverage proof. | Complete | `33753e0` |
| 4 | Add a real contract and expiry test for the Storybook/Vitest `init()` bridge. | Complete | `ae32929` |
| 5 | Mock every lookup type requested by application source and fail closed for unknown types. | Complete | `7878bf7` |
| 6 | Restore a meaningful aggregate-config coverage invariant. | Complete | `caf310c` |
| 7 | Investigate the SlateEditor coverage-only flake and restore the original interaction behaviour. | Complete | `55b2960` |
| 8 | Measure, attribute and record manager-path memory growth without a speculative fix. | **Partial — source attribution recorded; required RSS measurement and `maxWorkers` comparison not performed** | `75d86d7` |
| 9 | Record ownership of the conflated commit and prove the partial-revert recipe. | **Documentation complete; planned revert proof failed with six conflicts** | `75d86d7` |
| 10 | Run all acceptance gates and publish the final scorecard. | **Incomplete in captured evidence** | Not recorded |

## 4. Decisions made

### DEC-01 — Reject incomplete logs as proof of cleanliness

- **Decision:** A zero-hit string scan is valid only after the run reaches its completion summary.
- **Reason:** The earlier “clean” log ended in an out-of-memory failure before Vitest summary and coverage remapping.
- **Implementation:** `scripts/audit-storybook-log.ts` assigns incomplete runs an `invalid` verdict.
- **Consequence:** No final claim may rely on the earlier truncated 110-minute run.

### DEC-02 — Do not reinstall the old remapper during this execution

- **Decision:** Skip the two-reinstall experiment for `ast-v8-to-istanbul@1.0.4` and record causality as unproven.
- **Reason:** The user selected “Skip the reinstall; record as unproven.”
- **Known limitation:** It remains unproven whether the prior remap failure would reproduce on version 1.0.4.
- **Control added:** Dependency security tests require the observed 1.0.5 remapper cohort.

### DEC-03 — Verify coverage from runtime artifacts

- **Decision:** Treat emitted `coverage-final.json` content as the source of truth.
- **Reason:** A Storybook project coverage literal is ignored on two of the three identified execution paths.
- **Acceptance rule:** The artifact must contain executable source entries, no `.json` entries, and no `terms-config` entry.

### DEC-04 — Guard both sides of the temporary Vitest bridge

- **Decision:** Test both the installed Vitest behaviour and the installed Storybook call site.
- **Reason:** The former hand-built-object test could pass even if the dependency contract changed.
- **Expiry behaviour:** The guard must fail when Storybook stops calling `init()` so the compatibility bridge can be removed.

### DEC-05 — Derive MSW completeness from application source

- **Decision:** Enumerate requested lookup types from source instead of maintaining only the types seen in one warning log.
- **Reason:** Application source requested four lookup types; the earlier mock covered only two.
- **Failure policy:** Unknown lookup types return 501 rather than falling through as unhandled requests.
- **Constraint retained:** No catch-all handler and no broad warning suppression.

### DEC-06 — Preserve production analytics behaviour while preventing test network calls

- **Decision:** Keep a positive unit assertion that analytics initializes when a tracking ID is configured.
- **Evidence:** The positive case already existed; completed logs contained zero Google Tag Manager, Google Analytics, or Application Insights network hits.

### DEC-07 — Restore a cross-artifact topology invariant

- **Decision:** Guard package scripts that could enable coverage through the aggregate root without an explicit config.
- **Reason:** The replaced config-literal assertion described intent but did not prove effective runtime topology.

### DEC-08 — Revert the unexplained SlateEditor interaction edit

- **Decision:** Restore the original interaction and assertions after repeated isolated and full-suite verification.
- **Evidence:** Isolated no-coverage run passed; four isolated coverage runs passed; full coverage suite passed 87/87 files and 218/218 tests.

### DEC-09 — Do not speculatively fix manager-path memory growth

- **Decision:** Attribute the risk from installed-source evidence and retain it as an open item.
- **Reason:** The user selected “Attribute from source only”; reproducing the prior failure required UI control and had taken about 110 minutes.
- **Scope:** This does not block the supported CLI Storybook test path, but it remains a risk for the long-lived Test-panel/addon path.

### DEC-10 — Record the conflated commit; do not promise an automatic partial revert

- **Decision:** Preserve an ownership split for commit `23f0a2f` and state that its earlier revert recipe is no longer cleanly executable.
- **Evidence:** The dry-run conflicted in six files after later remediation changes; it was aborted and the worktree was verified restored.
- **Consequence:** The ownership record is authoritative; any future partial revert requires manual conflict resolution.

### DEC-11 — Do not treat the unit coverage threshold failure as a new Storybook regression

- **Decision:** Record the unit test result and coverage threshold result separately.
- **Evidence:** All 1,525 unit tests passed, but the command exited 1 because measured coverage was approximately 76–77% against a 100% threshold.
- **Attribution:** The repository already documents this expected red state under the T1 exemption until Child Plan B1 lands.
- **Isolation proof:** Neither changed ClientApp file appeared in the 249-file unit coverage denominator; there were zero story files and zero `src/storybook` entries.
- **Consequence:** The Storybook remediation did not cause the unit coverage deficit, but the repository-wide unit coverage gate remains red.

## 5. Acceptance evidence captured

| Gate | Result | Classification |
| --- | --- | --- |
| Type-check | Exit 0 | Passed |
| Lint | Exit 0 | Passed |
| Unit tests | 1,525 passed; 0 failed; baseline was 1,495 | Passed test-count criterion |
| Unit coverage threshold | About 76–77% versus 100%; command exit 1 | Pre-existing open gate under T1 exemption |
| Storybook with coverage | 87/87 files; 218/218 tests; log audit `CLEAN` | Passed |
| Coverage artifact | 276 executable entries; 0 JSON; 0 `terms-config`; audit `CLEAN` | Passed |
| Analytics network access | 0 target-domain hits across three logs | Passed |
| Production GA positive case | Existing test asserts initialization when configured | Passed |
| Dependency scope | `package.json` and `package-lock.json` untouched by this plan | Passed |
| Change scope | 14 files, 795 insertions, 45 deletions; `tsconfig.json` changed by one include line | Recorded |
| Storybook without coverage | Run still active when transcript ended | **Pending / result not captured** |
| `build-storybook` | Not started in captured transcript | **Pending** |
| Final audit report and rubric scorecard | No final Task 10 commit recorded | **Pending** |

## 6. Original-plan acceptance cross-reference

The original plan defines 17 cumulative acceptance criteria. A criterion is marked **met** only where the exact evidence required by the plan was captured. Evidence from a different run path may support the result but does not silently replace a named missing gate.

| # | Original acceptance criterion | Cross-reference result | Atomic basis |
| --- | --- | --- | --- |
| 1 | No `vitest.init()` warning in completed Task 10 runs | **Partial** | The completed coverage run audited `CLEAN`; the required non-coverage Task 10 run had not completed in the transcript. |
| 2 | `init()` bridge guarded on both sides and expires when Storybook moves | **Met** | Four contract tests passed and the deliberately broken guard failed. |
| 3 | No unhandled MSW request for any lookup type application code requests | **Partial** | Source-derived exhaustiveness tests and the coverage run passed; the required non-coverage Task 10 run remained pending. |
| 4 | Unmapped lookup type fails closed | **Met** | The HTTP 501 handler test passed. |
| 5 | No real Google Tag Manager request during both Storybook acceptance runs | **Partial** | Zero analytics-domain hits were recorded, but the named non-coverage acceptance log was incomplete. |
| 6 | Production analytics initialisation positively asserted | **Met** | The positive GA initialisation test existed and passed. |
| 7 | V8 coverage completes without JSON parse/remap failure | **Met** | Coverage run and artifact audit were `CLEAN`; zero non-executable entries. |
| 8 | Coverage narrowed rather than gutted | **Met** | 276 executable entries exceeded the minimum of 100. |
| 9 | Aggregate-config coverage hole guarded | **Met** | The invariant passed and the temporary bad-script probe made it fail. |
| 10 | All 87 files and 218 story tests pass on Task 10 Step 3 | **Partial** | Those counts passed with coverage, but the criterion names the still-pending non-coverage Step 3 run. |
| 11 | Unit suite at or above prior count | **Met** | 1,525 tests passed versus the 1,495 baseline. The separate coverage threshold remained red. |
| 12 | Type-check, lint and Storybook build pass | **Partial** | Type-check and lint passed; `build-storybook` was pending. |
| 13 | No unrelated files or dependencies changed by this plan | **Met** | `package.json` and `package-lock.json` were untouched; `tsconfig.json` changed by one intended include line. |
| 14 | `23f0a2f` lockfile drift isolated, guarded and recorded | **Not fully met** | Guarding and recording were completed; the mandatory Task 2 Step 5 isolation experiment was skipped. |
| 15 | Out-of-scope diagnostics recorded, not suppressed | **Met with limitation** | The warning backlog, lockfile defect and manager-path risk were recorded; Task 8's requested measurements were not captured. |
| 16 | No acceptance claim relies on a truncated log | **Met for claims made** | The auditor rejected the historical OOM log; no pending run is treated as passed. |
| 17 | `terms-config.json` still loads as runtime data | **Met** | The retained runtime-data test was included in the passing unit suite. |

### Cross-reference totals

| Classification | Count | Criteria |
| --- | ---: | --- |
| Met | 10 | 2, 4, 6, 7, 8, 9, 11, 13, 16, 17 |
| Met with limitation | 1 | 15 |
| Partial / pending named evidence | 5 | 1, 3, 5, 10, 12 |
| Not fully met | 1 | 14 |

**Plan-level verdict:** **11 of 17 criteria are substantively met, including one with a declared limitation; 6 are not yet fully satisfied exactly as written.** This is not a final rubric score because Task 10 Step 8, which requires the 100-point rubric in the governing spec, was not completed.

## 7. Deviations from the original plan

| Deviation | Original requirement | Actual decision/result | Impact |
| --- | --- | --- | --- |
| DEV-01 | Task 2 Step 5: reinstall against `ast-v8-to-istanbul@1.0.4` and reproduce the JSON remap failure. | User selected “Skip the reinstall; record as unproven.” | Criterion 14 remains not fully met; causal isolation is unresolved. |
| DEV-02 | Task 8 Step 1: measure peak RSS for the manager process. | User selected source-only attribution. | No measured peak RSS is available. |
| DEV-03 | Task 8 Step 3: compare `maxWorkers: 1` with a temporary value of 2. | Not performed under the source-only decision. | Worker-count contribution remains unknown. |
| DEV-04 | Task 9 Step 3: dry-run partial revert with no conflict. | Dry-run conflicted in six subsequently modified files and was aborted. | The ownership split is usable; the automatic revert recipe is not currently executable. |
| DEV-05 | Task 10 Step 2 ran a coverage command expected to provide a completed summary. | 1,525 tests passed, but the command exited 1 on the pre-existing 100% coverage threshold. | Criterion 11 passes; repository-wide unit coverage remains red and must not be represented as passed. |
| DEV-06 | Task 10 Steps 3 and 5 require the non-coverage Storybook run and Storybook build. | Neither final result is present in the transcript. | Criteria 1, 3, 5, 10 and 12 remain partial. |
| DEV-07 | Task 10 Steps 8–9 require a final report, 100-point rubric and commit. | No final Task 10 report commit is recorded. | Formal closure and rubric scoring remain pending. |

## 8. Global-constraint compliance

| Constraint from original plan | Recorded result |
| --- | --- |
| Preserve unrelated user changes | Preserved; six pre-existing untracked documents remained. |
| Do not patch `node_modules` | No patch recorded. Installed dependency source was inspected only. |
| No catch-all MSW handler or broad request suppression | Complied; one owned endpoint uses an explicit lookup map and unknown values return 501. |
| Do not disable or broadly gut coverage | Complied; emitted report retained 276 executable entries. |
| Do not disable source maps globally | No such change recorded. |
| Do not perform broad dependency upgrades | Complied by this plan; `package.json` and `package-lock.json` were untouched. |
| Do not absorb unrelated warnings | Complied; the existing `act(...)` backlog was recorded as out of scope. |
| Use supported commands and `--reporter=default` for piped Vitest runs | The captured acceptance commands use the required reporter; no contrary command is evidenced. |
| Do not edit prohibited generated/external files | No prohibited-file edit appears in the 14-file change set. |

## 9. Explicit open items

| Open item | Owner/status | Effect on closure |
| --- | --- | --- |
| Capture the completed non-coverage Storybook result and audit it. | Task 10 pending | Blocks full acceptance. |
| Run and record `npm run build-storybook`. | Task 10 pending | Blocks full acceptance. |
| Finalize the acceptance report and rubric scorecard. | Task 10 pending | Blocks formal closure. |
| Resolve unit coverage under Child Plan B1. | Pre-existing T1 work | Does not negate the Storybook test results; repository-wide unit coverage remains red. |
| Reproduce manager Test-panel memory growth, if that path must be supported. | Deferred | Known operational risk; not fixed. |
| Determine whether remap failure reproduces on `ast-v8-to-istanbul@1.0.4`. | Deliberately unproven; original Task 2 Step 5 | Blocks full satisfaction of criterion 14. |
| Address 36 `act(...)` warnings / 118 warning lines across 13 stories. | Existing warning-settlement backlog | Explicitly out of scope. |
| Repair the pre-existing lockfile defect affecting 1,272 packages missing `resolved`. | Deferred repository maintenance | Explicitly out of scope. |

## 10. Closure rule

The remediation may be marked **complete** only after all of the following atomic facts are captured:

1. The non-coverage Storybook command finishes with 87/87 files and 218/218 tests, and its log auditor returns `CLEAN`.
2. `npm run build-storybook` exits 0.
3. The final report records the amber unit-coverage threshold as pre-existing rather than passed.
4. The final scorecard distinguishes verified criteria, declared limitations, deferred risks, and out-of-scope work.
5. No acceptance claim relies on an incomplete or truncated log.
6. Either perform Task 2 Step 5 or formally amend criterion 14 to accept the documented causal uncertainty.
7. Retain Task 8's source-only substitution as an approved plan deviation, or complete the planned RSS and worker-count measurements.
8. Record that Task 9's automatic partial-revert proof failed and replace the recipe with manually verified instructions before representing it as executable.

Until then, the accurate final label is:

> **Implementation complete through Task 9; Task 10 acceptance incomplete.**
