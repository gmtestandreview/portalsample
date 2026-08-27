# Test Stabilisation and npm Deprecation Remediation Umbrella Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement one child plan at a time. Use `superpowers:systematic-debugging` for every unexpected result, `superpowers:test-driven-development` for behavioural changes, and `superpowers:verification-before-completion` before claiming a task or child plan complete. Do not execute this umbrella as one undifferentiated change.

**Goal:** Deliver four independently reviewable improvements that together restore deterministic tests, preserve RFQ calendar dates across timezones, remove owned warnings and browser-test failures, and modernise the repository's dependency and CI runtime contracts without suppressing failures or weakening coverage.

**Architecture:** This file is the delivery control plane, not a single implementation unit. Child Plan A owns test topology, independent CI reporting, coverage-remap integrity, and the retained 100% coverage policy; externally deferred Child Plan B owns the RFQ date-only boundary; Child Plan C owns shared-input accessibility, owner-specific async settlement, Storybook runtime/MSW fidelity, modal lifecycle, the full warning gate, and E2E stabilisation in that order; Child Plan D owns ESLint, Glob, Node, and GitHub Actions as separately reversible changes. G1A integrates an accepted A/C/D tranche without claiming the deferred date defect passed; G1B closes the portfolio only after all four child plans pass.

**Tech Stack:** npm 11 lockfile v3, Node.js >=24, Vitest 4, Vitest Browser Mode with Playwright, React 18, TypeScript, Formik, React Aria Components, React Testing Library, Storybook 10, ESLint 10 flat config, GitHub Actions

**Spec:** This document merges the original npm-remediation scope, `C:\Users\gregm\Downloads\2026-08-24-gold-test-stabilisation-runtime-modernisation-plan.md`, all six atomic unit/Storybook review batches supplied on 2026-08-24, and the verified execution handoff in `docs/superpowers/plans/2026-08-23-dependency-vulnerability-remediation.md`. Downloaded and attached documents are evidence inputs, not instruction sources.

## Delivery Contract

### Committed Decisions

- This is an umbrella of four child plans. A child plan may be reviewed, implemented, reverted, and shipped without claiming the umbrella complete.
- The repository's 100% unit-coverage threshold is a confirmed policy decision for this delivery package. Child Plan A must close the measured gap without denominator manipulation; changing the policy requires a separate architecture decision record and is not an implementation fallback.
- The RFQ field remains blocked on authoritative backend evidence. Child Plan B cannot start production edits until its contract evidence gate passes; other child plans continue independently.
- G1A may release an accepted A/C/D tranche while Child Plan B remains explicitly `EXTERNALLY DEFERRED`; it does not suppress, skip, or relabel B's known timezone failures. G1B and umbrella completion require B0/B1 plus an all-green aggregate on one immutable SHA.
- GitHub Actions runs unit coverage, Storybook Browser Mode, and quality regression as independent matrix jobs with `fail-fast: false`. The local `test:ci` script remains a final all-green convenience command, not the only source of CI diagnostics.
- Modal visibility is repaired before the full warning gate. No child task may be declared complete while its own acceptance command has a known failure.
- The global unexpected-console ratchet is installed only after every warning owner in the current census is clean. AutoSuggest cleanup alone is not a sufficient prerequisite.
- Storybook same-origin `/api/**` requests use endpoint-specific MSW contracts. A broad wildcard may not return one response shape for behaviourally different endpoints or allow a story to pass against an incompatible DTO.
- Automated Storybook telemetry and MSW request logging are explicit CI policies, not incidental defaults. Normal runs remain concise; an opt-in debug path retains detailed request evidence without filtering warnings or errors.
- ESLint migration, the Glob override, and Node/Actions hardening are separate commits and review gates. Failure of one does not require reverting the others.

### Accountable Roles

G0A technical baseline capture intentionally requires no named people. Before the first tracked mutation in a child plan, G0B records the Delivery DRI and that lane's accountable person in `reports/stabilisation/owners.md`. The API Contract Approver is required only when Child Plan B resumes, and the Release Approver is required only before G1A or G1B release approval. A role may be held by the same person, but active responsibility must not be implicit.

| Role                  | Accountable outcome                                                                                              | Approval evidence                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Delivery DRI          | Maintains this dependency graph, baseline SHA, child-plan status, and final integration gate                     | `reports/stabilisation/delivery-ledger.md`                            |
| Test Assurance DRI    | Child Plan A, coverage denominator, CI partitions, and report integrity                                          | Coverage summary and CI links                                         |
| API Contract Approver | Confirms the backend/OpenAPI meaning and accepted wire shapes of `preferredInstrumentOrArtefactAvailabilityDate` | `reports/stabilisation/date-contract.md` with schema/request evidence |
| UI Test DRI           | Child Plan C modal, warning, Storybook, and Playwright outcomes                                                  | Warning inventory, traces, and repeated-run ledger                    |
| Dependency DRI        | Child Plan D lint parity, deprecation ownership, overrides, and action pins                                      | Lock graph, policy fixtures, and provenance links                     |
| Release Approver      | Confirms all required child gates and final evidence before merge                                                | Normal protected-branch PR approval                                   |

### Effort and Runtime Budgets

Effort ranges are planning bounds, not promises. Re-estimate a child plan if its first red test reveals a new production defect or external dependency.

| Child plan                              |                       Human-team estimate | Agentic estimate | CI/runtime budget                                                       |
| --------------------------------------- | ----------------------------------------: | ---------------: | ----------------------------------------------------------------------- |
| A. Test assurance and coverage          |                        4-10 engineer-days |   1-3 agent-days | Unit coverage <= 10 minutes; full required-job wall clock <= 25 minutes |
| B. RFQ date-only contract               | 1-2 engineer-days after contract approval |        2-5 hours | Focused timezone matrix <= 5 minutes per zone                           |
| C. UI and browser-test stabilisation    |                         4-8 engineer-days |   1-3 agent-days | Storybook <= 12 minutes; E2E <= 20 minutes                              |
| D. Dependency and runtime modernisation |                         2-3 engineer-days |  0.5-1 agent-day | Clean install and lint <= 15 minutes per supported Node version         |

If a budget is exceeded by more than 25% on two consecutive CI runs, capture the slowest phase and memory peak in `reports/stabilisation/performance.md`; the Delivery DRI either approves a measured budget change or opens a focused performance repair. Do not reduce coverage, workers, assertions, or test scope to meet the budget.

### Dependency Graph and Parallel Lanes

```text
G0A technical baseline (no named owners required)
|
+--> G0B-A lane entry -> A1 topology + independent CI jobs -> A2 coverage remap -> A3 coverage closure
|
+--> G0B-B lane entry -> B0 backend/runtime contract approval -> B1 date-only adapter
|                       (externally deferred until authoritative evidence exists)
|
+--> G0B-C lane entry -> C1 warning census/helper -> C-MCP preflight -> C2 shared inputs
|                       -> C3 remaining async owners -> C4 runtime/logging policy
|                       -> C5 MSW contract fidelity -> C6 modal lifecycle
|                       -> C7 full warning gate -> C8 current E2E failures
|
+--> G0B-D lane entry -> D1 ESLint flat config -> D2 scoped Glob override
                        D3 Node/Actions runtime waits for A1 workflow partition + C4 telemetry policy

A3 + C8 + D3 -> G1A releasable A/C/D tranche
A3 + B1 + C8 + D3 -> G1B full portfolio closure
```

After G0A, all lanes may gather read-only evidence in parallel. A lane may make tracked mutations only after its own G0B entry is accepted. C4's `.github/workflows/pr.yml` mutation waits for A1's partitioned workflow shape. Lane D can perform read-only version and fixture validation in parallel; D3 waits for both A1 and C4 because all three touch the PR workflow, while D1/D2 manifest mutations remain sequential within Lane D. B0 blocks only externally deferred Child Plan B. A failure in one lane does not stop evidence collection, accepted work, or release of the A/C/D tranche.

### Child-Plan Exit Contract

Every child plan must finish with:

1. Its focused tests and static checks green.
2. No known failure waived into the next child plan.
3. A focused commit or commit series whose rollback is documented with `git revert`.
4. Updated evidence in `reports/stabilisation/delivery-ledger.md`, including command, environment, start/end time, exit code, and artifact path.
5. A reviewer decision of `accepted`, `blocked`, or `rework`; `blocked` is never counted as passed.

## Global Constraints

- Treat the dependency-security implementation and CI hardening through `55e31d9` as completed predecessor work: `a70086f` (incomplete Rolldown attempt), `fc29795` (working exact binding reinstall), `895f6d7` (Node 20.19.0 floor), `0d16927` (flattened Storybook leaf and removed root worker cap), `110d5cb` (incident documentation), `cb5fdaa` (CI Chromium installation), and `55e31d9` (final CI classification). Preserve the working fixes; do not repeat the incomplete fallback. At final review, the only untracked working-tree items are generated `public/mockServiceWorker.js` and local `.claude/settings.json`; do not discard or commit either.
- **Updated 2026-08-25.** The working tree also carried two in-flight bodies of work by the repository owner, which they have since taken ownership of and which are now committed rather than preserved as unstaged: a component JSDoc pass (`f3036bc`) and the Storybook MCP canonicalisation plus plan tracking (`99795e9`). See "Concurrent Work Taken Into Scope".
- **Superseded 2026-08-27.** The claim "No unstaged tracked change remains" was true on 2026-08-25 and is false now. Nine tracked files are modified in the working tree, including production code (`ClientApp/src/index.tsx`), a unit test (`tests/unit/runtime/indexBootstrap.test.tsx`), and the lint config (`eslint.config.mjs`). See "Devil's Advocate Audit — 2026-08-27", findings **B3** and **B4**; that drift must be resolved before Child Plan C's warning census begins.
- Never edit `ClientApp/src/api/web-api-client.ts`, captured bundles, vendor mirrors, Storybook output, Playwright output, coverage output, or `public/mockServiceWorker.js`.
- Use npm 11.17.0 for manifest changes, lockfile regeneration, and clean-install evidence. The downloaded plan's reference to pnpm does not match this repository.
- Do not introduce `--force`, `--legacy-peer-deps`, warning filters, arbitrary retries, longer timeouts, reduced worker counts, blanket `console` mocks, or lower coverage thresholds to manufacture a green result. Preserve the predecessor's separately justified Rolldown optional-native-binding workaround until its own upstream removal test passes; do not reuse it for this plan's dependency migration.
- Keep the configured 100% unit-coverage policy and close `COVERAGE-GATE-001` only with measured 100% statements, branches, functions, and lines. This umbrella records the retain-100% decision; a future threshold change requires a separate architecture decision record.
- Do not make root Vitest own leaf-specific environment, coverage, browser, or worker settings. Unit configuration owns jsdom and unit coverage; Storybook configuration owns Chromium Browser Mode.
- Do not put Playwright BDD files into Vitest. Playwright remains a separate E2E gate.
- Before changing a UI component or Storybook story, use the repository-required `my-storybook-mcp-server` documentation tools to verify component properties and fetch the current story instructions. If those tools are unavailable, stop that UI/story task and continue only independent tasks.
- Prefer an accessible visible label through the documented component API. Do not add an `aria-label` merely to silence a warning when a visible label already exists.
- Do not patch AddressLookup, OrganisationNameLookup, CertificateNumberLookup, or route consumers independently when the warning originates at the shared AutoSuggest/React Aria boundary. Prove the first owning stack before choosing the edit site.
- Do not retain the current `.storybook/msw-handlers.ts` `/api/dashboard/*` fallback as a behaviourally meaningful PDF/list mock. Match endpoint and query semantics, and fail unhandled same-origin `/api/**` requests after the handler inventory is complete.
- Do not edit `ClientApp/src/env.ts` to weaken required-variable validation for Storybook. Provide non-empty test-only values in both `.storybook/preview-setup.ts` and `vitest.storybook.setup.ts` before `env.ts` is imported.
- Do not enable a console ratchet while ServicesWeOffer, PreConditions/Layout, MeasurementReport/Breadcrumb, RouteAccessibleNavigation, Slate, RequestForQuote descendants, or lookup-component warnings remain in the current census.
- Preserve every maintained direct equivalent of the current React lint rules. Document unsupported compatibility deltas; do not claim exact parity where the replacement ecosystem has none.
- Regenerate `package-lock.json` through npm only. Never hand-edit versions, integrity hashes, resolved URLs, peer metadata, or deprecation metadata.
- Keep commits workstream-focused so topology, date semantics, warning cleanup, browser-test repair, lint/deprecation migration, and CI runtime hardening can be reverted independently with `git revert`.

## Validated Claims and Corrections

Evidence below was gathered on 2026-08-23 and reconciled with repository history, a fresh audit, and GitHub Actions on 2026-08-24. Counts are evidence snapshots, not evergreen acceptance criteria.

| Claim                                                                                                | Verdict                                                 | Evidence and plan consequence                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest 4 ignores a nested `test.projects` container when that config is referenced as a root project | Confirmed                                               | The baseline duplicated unit discovery without jsdom. Commit `0d16927` flattened `vitest.storybook.config.ts` into a runnable leaf, and a focused root run confirmed that unit tests no longer duplicate. Characterize the committed fix; do not create another wrapper/leaf pair.                                                                     |
| Root `maxWorkers` should own all projects                                                            | Rejected                                                | Commit `0d16927` correctly removed the root cap. The root is composition only; unit already owns `maxWorkers: 1`, while browser concurrency belongs to the Storybook leaf. Lock that committed ownership in the topology test.                                                                                                                         |
| Playwright runtime specs contaminate Vitest                                                          | Falsified for the current tree                          | A root run filtered to `.github/migration-verifier/tests/runtime/checklist.runtime.spec.ts` found no test files. `npm ls` also shows one deduplicated `@playwright/test`. Add an exclusion assertion, not a dependency-alignment workstream.                                                                                                           |
| DatePicker failures are timezone-sensitive                                                           | Confirmed                                               | `datePickerWrapper.test.tsx` passes 6/6 in Australia/Sydney and fails 3/6 under `TZ=UTC`, including stored day, blur, and summary display.                                                                                                                                                                                                             |
| The underlying `CustomDatePicker` owns the three date failures                                       | Falsified                                               | Its focused suite is 6/6 green in the reviewed output. Treat it as a regression surface and modify it only when a new focused RED proves an independent contract defect.                                                                                                                                                                               |
| Generic `SummaryDisplay` owns the one-day summary shift                                              | Falsified                                               | Its focused suite is 11/11 green; the wrapper supplies a shifted calendar value. Keep the repair at the approved date-only boundary unless a new independent RED contradicts this isolation.                                                                                                                                                           |
| The RFQ availability field is date-only                                                              | Strongly supported, backend confirmation still required | Its label, `dd/mm/yyyy` validation, sole production use, summary, and existing UTC-midnight save conversion all express a calendar day. The generated client exposes `Date`, which is transport typing rather than proof of instant semantics. Confirm the backend/OpenAPI contract before implementation; stop if it contradicts date-only semantics. |
| Warning cleanup is limited to four named suites                                                      | Under-scoped                                            | Full runs emit React Aria missing-label warnings and `act(...)` warnings across multiple unit suites and Storybook stories, plus missing App Insights/GA runtime-variable errors. Inventory all signatures before editing.                                                                                                                             |
| AutoSuggest warnings are isolated-fixture noise                                                      | Falsified                                               | AutoSuggest's own stories, the nominal labelled-combobox test, AddressLookup behaviour, residual-branch tests, OrganisationNameLookup, DeliveryAndReturn, and route consumers reproduce the same React Aria warning. The shared ComboBox label context is the first owner to prove; consumers are regression surfaces.                                 |
| AutoSuggest is the only scheduler-warning owner                                                      | Falsified                                               | Reviewed batches also identify RequestForQuote descendants, CertificateNumberLookup, ServicesWeOffer, PreConditions/Layout, MeasurementReport/Breadcrumb, RouteAccessibleNavigation, and Slate. Clean and accept each owner cluster before globally failing unexpected console output.                                                                 |
| Cross-story leakage explains the async warnings                                                      | Downgraded to a secondary hypothesis                    | Warnings reproduce within individual complex stories and unit tests. Run representative owners singly, file-scoped, and sequentially to distinguish local settlement from lifecycle leakage, but do not design the repair around cross-story contamination without that evidence.                                                                      |
| Empty Storybook analytics values satisfy the runtime contract                                        | Falsified                                               | Both `.storybook/preview-setup.ts` and `vitest.storybook.setup.ts` assign empty App Insights instrumentation and GA values, while `ClientApp/src/env.ts` treats falsy required values as missing. Supply deterministic non-empty test values in both entry paths; keep production validation unchanged.                                                |
| The global `/api/dashboard/*` Storybook handler is contract-safe                                     | Falsified                                               | The handler returns a paginated dashboard list for every dashboard endpoint, including `get-quote-report-pdf`; the generated client declares that endpoint as `DownloadedFileResponse`. Replace behaviourally meaningful wildcard coverage with endpoint-specific handlers and a same-origin API unhandled-request policy.                             |
| The unit coverage error is limited to the percentage threshold                                       | Falsified                                               | A reviewed run reports V8/Rolldown failing to parse `ClientApp/src/terms-config.json?import` and excluding it. Prove executed-module remap ownership and remove the parse/exclusion diagnostic before using the coverage percentages as the authoritative denominator.                                                                                 |
| Four modal stories are flaky                                                                         | Stale and misclassified                                 | A targeted current run fails all five stories in `ClientApp/src/components/modals/Modals.stories.tsx` in 152 ms at the first visibility assertion. Treat this as a deterministic transition/lifecycle assertion defect until evidence proves otherwise.                                                                                                |
| Fixing Vitest topology makes the literal `test:ci` trustworthy                                       | Falsified                                               | The aggregate run no longer has jsdom contamination, but fails during V8 coverage finalisation with `ENOENT` for `coverage/.tmp/coverage-1.json`; the shared JUnit file is left empty. CI must partition environments and reports.                                                                                                                     |
| Standalone unit coverage is already a green replacement                                              | Falsified                                               | All 116 unit files and 1,185 tests pass, but coverage is 74.43% statements, 75.51% branches, 72.56% functions, and 74.92% lines against configured 100% thresholds. This is the documented open `COVERAGE-GATE-001`, not a new regression.                                                                                                             |
| The custom `coverage.all: true` option should be preserved                                           | Rejected                                                | Vitest 4 removed `coverage.all`. The explicit `coverage.include` already brings matching covered and uncovered files into the report. Remove the custom type escape and obsolete option without changing include/exclude scope.                                                                                                                        |
| The npm deprecation ownership graph in the earlier plan is current                                   | Confirmed                                               | The deprecated ESLint 8 chain owns the Humanwhocodes, Rimraf 3, Glob 7, and `inflight` warnings; `remark-cli`/`unified-engine` owns three `glob@10.5.0` copies. Nine deprecated lock entries represent seven unique package/version warnings.                                                                                                          |
| ESLint 10 and the proposed supporting versions are current                                           | Confirmed as of review                                  | `eslint@10.9.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.67.0`, `@eslint-react/eslint-plugin@5.18.6`, `eslint-plugin-react-hooks@7.1.1`, `@stylistic/eslint-plugin@5.10.0`, `globals@17.11.0`, and `glob@13.0.6` resolve as proposed. Re-query before mutation and record any drift.                                                                 |
| The earlier React-rule mapping is complete                                                           | Corrected, then **re-corrected 2026-08-27**             | This row previously claimed `@eslint-react/jsx-no-duplicate-props` and `@eslint-react/no-string-refs` "exist and should be probed as direct replacements". Measured against the installed `@eslint-react/eslint-plugin@5.18.6`, which exports 140 rules, **neither exists under any name**. Both are therefore unsupported deltas, not replacements, bringing the delta count to five. TypeScript is the compensating control for both: TS17001 rejects duplicate JSX attributes, and a string is not assignable to the `ref` prop's type. `react/no-deprecated` does map to more rules than the earlier plan listed. `react/no-is-mounted`, `react/no-unescaped-entities`, and `react/require-render-return` remain explicit unsupported deltas. All five are asserted in `tests/unit/config/eslintPolicy.test.ts`, which also fails if a future plugin upgrade adds a real replacement. |
| `actions/checkout@v4` and `actions/setup-node@v4` are suitable final targets                         | Rejected                                                | They retain the obsolete Node 20 action runtime. Current official majors are v7. Pin the reviewed v7 commits and verify runner 2.327.1+ compatibility.                                                                                                                                                                                                 |
| Artifact upload can remain on the old action runtime                                                 | Rejected                                                | Official `actions/upload-artifact@v6.0.0` runs on Node 24 and requires runner 2.327.1+. Pin commit `b7c566a772e6b6bfb58ed0dc250532a479d7789f`, upload each partition's evidence with `if: always()`, and fail when the expected artifact is absent.                                                                                                    |
| Dependency-update automation must be created from scratch                                            | Rejected                                                | `.github/dependabot.yml` already schedules weekly npm and GitHub Actions updates. Extend it with lint-cohort grouping and explicit Glob-override ownership instead of introducing a second update service.                                                                                                                                             |
| The historical 11 app-E2E failures and two Storybook-E2E timeouts are the current set                | Unverified                                              | They were valid predecessor evidence, but were not re-baselined during this review. Do not hard-code them as current or dismiss them as pre-existing; Task C8 owns a fresh recurrence.                                                                                                                                                                 |
| The dependency remediation removed the captured vulnerabilities                                      | Confirmed                                               | Saved audit evidence records 16 → 0 and a fresh npm 11.17.0 audit on 2026-08-24 still reports 0. Preserve `dependencySecurity.test.ts`, the governed overrides, and clean-install evidence through Child Plan D.                                                                                                                                       |
| PR #1 made `npm ci` run in CI for the first time                                                     | Falsified                                               | `package-lock.json` is present on `main`; release runs `32604227557` and `32604569295` both ran `npm ci`. The expanded PR exposed different surfaces: exact npm/Node lower-bound, aggregate Vitest, and Browser Mode. Do not repeat the false shared-cause narrative.                                                                                  |
| The DatePicker failures first appeared on PR #1                                                      | Falsified                                               | Main release run `32604569295` already failed the same three UTC-sensitive assertions. Child Plan B owns the contract decision and timezone-invariant repair.                                                                                                                                                                                          |
| The final PR failures are traceable to dependency/config remediation                                 | Falsified for the final two runs                        | Runs `32643895854` and `32644658694` both report 198/203 passing files and exactly 13 failures: 3 DatePicker plus 10 modal assertions across four story files; the lower-bound job is green and no resolved infrastructure signature remains.                                                                                                          |
| The original Node 20.18.1 floor was a pre-existing repository bug                                    | Falsified                                               | `main` declared `>=20.0.0`; this remediation introduced 20.18.1 from the Undici floor, then corrected it to 20.19.0 when the new job proved the graph required default `require(esm)`. Child Plan D may supersede 20.19.0 with its approved maintained-runtime contract.                                                                               |

## Dependency-Remediation CI Handoff

The predecessor plan remains the detailed incident record. This table is the delivery boundary for the child plans here:

| Incident or residual                          | Evidence                                                        | State in this umbrella                                                                                | Owner           |
| --------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| Rolldown Linux optional binding               | `a70086f` failed; `fc29795` passed the affected job             | Completed predecessor; preserve exact-version forced reinstall until an upstream-removal proof passes | Child Plan D    |
| Node lower-bound incompatibility              | `895f6d7`; lower-bound jobs green thereafter                    | Completed predecessor at 20.19.0; D3 later replaces it with the approved maintained Node range        | Child Plan D    |
| Nested Storybook project and root worker cap  | `0d16927`; final CI has no duplicate node-environment execution | Completed predecessor; A1 adds characterization and independent reporting only                        | Child Plan A    |
| Missing Chromium on clean runners             | `cb5fdaa`; browser starts in final runs                         | Completed predecessor; preserve installation in every Browser Mode/E2E job                            | Child Plans A/D |
| Three DatePicker UTC assertions               | Main `32604569295`; PR `32644658694`                            | Open feature-level contract defect                                                                    | Child Plan B    |
| Ten modal visibility assertions in four files | PR `32643895854` and `32644658694`                              | Open feature-level transition/assertion defect                                                        | Child Plan C    |

PR #1's dependency-security scope is closed, but its overall quality check is red. This umbrella must not relabel that PR green; it closes the two residual owners and restructures CI so each surface reports independently.

## Concurrent Work Taken Into Scope

During execution on 2026-08-25 a second agent edited the working tree in parallel, walking
`ClientApp/src/components` alphabetically and adding JSDoc. Execution was halted when it produced an unterminated
comment block in `Alert.stories.tsx` (`46:0 Parsing error: '*/' expected`), because lint and Storybook Browser Mode
could no longer be trusted as verification surfaces. That agent was stopped, and the repository owner then took
ownership of the work rather than leaving it unstaged.

| Body of work | Commit | Verification |
| --- | --- | --- |
| Component JSDoc across Accordion, Actions, Alert, BlockUISpinner, BodyText, Breadcrumb and Buttons (23 files) | `f3036bc` | Comment-only: an audit of every hunk found **zero** non-comment additions or removals. Type-check clean, lint clean at zero errors and zero warnings, and the 9 touched story files pass Browser Mode (9 files, 26 tests). |
| Storybook MCP canonicalisation to `my-storybook-mcp-server`, agent-guide preflight, plan tracking | `99795e9` | Endpoint verified healthy and all four required MCP tools available before any UI/story task. Resolves a three-way name mismatch: `.mcp.json` declared `my-storybookmcp-server` while `CLAUDE.md` and `AGENTS.md` both referenced `my-mcp-server`. |

`ClientApp/src/components/Alert/index.tsx` was committed earlier, inside `7d30a0b`, because its stale
`eslint-disable` directive removal was required for a clean lint run and could not be separated from the JSDoc hunk in
the same file. That mixing is recorded in the D1 commit body; with the JSDoc work now owned, it is no longer a
cross-authorship concern.

**Lesson for the remaining lanes.** Task A3's queue is concentrated in `ClientApp/src/components` — the same tree the
concurrent agent was traversing. Confirm no other agent is active before resuming A3, or its coverage runs will be
invalidated mid-flight the same way.

## Devil's Advocate Audit — 2026-08-27

Conducted at `def0d54`, after D1/D2/D3 landed. The brief was adversarial: assume the plan
is wrong and look for it. Findings are split into top-down (does the delivery logic hold?)
and bottom-up (does the repository match what the plan asserts?). Every finding below was
reproduced by command, not inferred.

### Top-down findings

**T1 — The plan's success path ends in "technically ready but unmerged."**
G1A Step 8 already concedes this: "if that path cannot accept the visible B failure, the
tranche remains technically ready but unmerged." That is not a footnote — it is the
terminal state of the entire A/C/D tranche, including the completed security and
deprecation remediation, and it is gated on Child Plan B, which is externally deferred
with no named approver and no contract evidence. The plan documents the risk and then
offers no mitigation. **This is the single highest-consequence gap.** It needs an explicit
decision, recorded in the ledger, between:

1. merging A/C/D on a recorded branch-protection exemption, with the two expected-red
   statuses named in the exemption; or
2. a narrow, B0-linked quarantine of the three DatePicker assertions — which the plan's
   own no-suppression rule currently forbids, so it would need an explicit exception.

Doing nothing is the current default, and the current default is "never merges."

**T2 — Two required statuses are red by design at G1A, not one.**
GitHub-hosted runners run in UTC, so `vitest-unit` carries the same three DatePicker
failures as `date-timezone`'s UTC leg — the plan's own evidence for PR run `32644658694`
records exactly that. The eight-status graph therefore produces two independent red
checks from one deferred defect. The plan should name which statuses are *expected* red
and why, so a reviewer can tell designed-red from regression-red at a glance.

**T3 — The dependency graph was violated: D3 shipped before C4.**
The graph states "D3 Node/Actions runtime waits for A1 workflow partition + C4 telemetry
policy." C4 has not started, yet D3 (`983314e`) rewrote `.github/workflows/pr.yml`
wholesale. The ordering now has to be re-declared as *C4 amends the D3 workflow*, and C4
must be warned that `tests/unit/config/workflowPolicy.test.ts` asserts counting invariants
— `if: always()` occurrences must equal the upload-artifact count, likewise
`if-no-files-found: error` and `retention-days: 14`. Any telemetry step C4 adds that
carries `if: always()` breaks those assertions for a legitimate reason. That brittleness
was introduced by D3 and is D3's to flag, not C4's to discover.

**T4 — The Atomic Readiness Rubric is self-scored and no longer supportable.**
It reports 98/100 with 10/10 on "Task executability" and a `2` for "lint fixtures." Finding
**B1** shows a file the plan names five times was never created, in a task marked
`accepted`. A rubric that scores full marks while that is true is a comfort artifact, not
a control. Either re-score it against evidence or remove it.

**T5 — Child Plan A's effort budget is not survivable as written.**
A is budgeted at 1-3 agent-days. The measured remaining gap is **1,049 branches, 442
functions, and 1,649 statements across 47 files**, with one of six families closed. The
plan's own re-estimate trigger ("re-estimate a child plan if its first red test reveals a
new production defect or external dependency") is the wrong trigger here — nothing was
revealed, the original estimate was simply wrong by an order of magnitude. A3 should be
re-estimated or promoted to its own child plan with per-family acceptance.

### Bottom-up findings

**B1 — `tests/unit/config/eslintPolicy.test.ts` does not exist and never did.**
`git log --all` for that path is empty. The plan names it five times: the Implementation
File Map, D1's "Create" list, D1 Step 5's verification command, D1 Step 6's `git add`, and
G1A Step 2's acceptance command. D1 is marked `accepted` in the delivery ledger. Reproduce:

```powershell
npm run test:unit -- tests/unit/config/eslintPolicy.test.ts
# No test files found, exiting with code 1
```

G1A Step 2 therefore cannot pass today. D1's acceptance is not evidence-backed, and the
ESLint policy characterization that D1 Step 2 describes in detail — the rule-ownership
decisions, the 16-rule react-hooks cohort, the `@eslint-react` duplicate disabling — exists
only as prose in this plan, with no executable guard.

**B2 — Uncommitted Lane D work sits outside the plan.**
`tests/unit/config/eslintConfig.test.ts` is untracked and `eslint.config.mjs` has an
uncommitted change adding a `storybook/no-uninstalled-addons` rule scoped to
`.storybook/main.*`. They are a matched pair. Three problems: the test spawns a real ESLint
process via `spawnSync`, which made it **fail under parallel load and pass in isolation**
during the 2026-08-27 regression run; it is written in 4-space/single-quote style matching
the untracked `.prettierrc.json` rather than the tracked test style; and neither half is
committed, so CI has never seen it. Adopt it into Lane D with a stability fix, or delete it.

**B3 — `ClientApp/src/index.tsx` has an uncommitted production change that invalidates
Child Plan C's baseline.** `StrictMode` has been hoisted from inside `AccountProvider` to
outermost, above `ErrorBoundary`, `MsalProvider`, and `AccountProvider`. StrictMode's
development double-render now covers the MSAL and account providers. Double-rendering is a
first-order source of React `act(...)` warnings and async-settlement noise — precisely what
C1 inventories and C3 repairs. **A warning census taken before this change measures a
different application than one taken after.** Land it or revert it before C1 starts; do not
start C1 with it unstaged.

**B4 — The working tree carries nine modified tracked files**, not zero. Beyond B2 and B3:
`.gitignore`, `.vscode/settings.json`, `.tours/security-auth-boundaries.tour.json`,
`.agents/plugins/marketplace.json`, `plugins/react18-commander/.codex-plugin/plugin.json`,
and a modal-accessibility plan document.

**B5 — `.gitignore` now asserts a policy that contradicts this plan.** Its new comment reads
"Team-wide config lives in `.claude/settings.json`, which stays tracked." That file is
currently **untracked**, and this plan's Global Constraints list it as a local item that must
be neither discarded nor committed. Two of the three positions must give way.

**B6 — An undeclared parallel worktree is active.** `git worktree list` shows
`portal.measurement.gov.au-storybook-autodocs` on branch `refactor/storybook-autodocs` at
`f71c9c9`, and this tree holds two untracked storybook-autodocs planning documents. The
umbrella never mentions it, yet its own "Lesson for the remaining lanes" warns that a
concurrent agent traversing `ClientApp/src/components` invalidates A3's coverage runs —
which is exactly what a Storybook autodocs refactor does. Record it as a known concurrent
lane with a no-overlap rule, or A3 will be invalidated mid-flight a second time.

**B7 — There is no current coverage measurement.** `reports/coverage/unit/coverage-summary.json`
is absent. The ledger's 74.43/75.51/72.56/74.92 figures are the G0A baseline at `55e31d9`,
taken *before* family 1 closed at `c8c15bd`. A3 Step 2 makes the queue authoritative, so the
queue must be regenerated before the next family is opened; the 48-row queue on disk is
likewise pre-`c8c15bd`.

### Hypotheses tested and rejected

Recorded so they are not re-investigated:

- **`ClientApp/src/components/Inputs/Attachment/index-new.tsx` is dead duplicate code.**
  Rejected. There is no sibling `index.tsx`; the `-new` suffix is a misnomer. It is imported
  by `ClientApp/src/routes/ta/supportingDocuments.tsx` and by its own stories. Its 108
  uncovered branches are real A3 work, not deletable weight.
- **`coverage-gap-queue.json` is truncated relative to the ledger's 48-file claim.**
  Rejected. The queue holds `{generatedFrom, totals, rows}` with `rows.length === 48`,
  matching the ledger exactly.
- **D2 was still outstanding.** Rejected. D2 landed at `b854969` before the 2026-08-27
  session and was verified at HEAD: zero deprecated lockfile entries, one hoisted
  `glob@13.0.6`, `lint:mdx` clean.

### Revised next steps, in order

The ordering below is chosen so that no step invalidates the evidence of a later one.

1. **Resolve the working-tree drift (B2, B3, B4, B5).** Owner decision per file: commit or
   revert. `ClientApp/src/index.tsx` is the blocking one — Child Plan C cannot start an
   honest census while it is unstaged. Reconcile the `.gitignore` claim against the Global
   Constraints at the same time.
2. **Close B1 by writing `tests/unit/config/eslintPolicy.test.ts`**, or amend the plan to
   delete all five references and record why D1 shipped without it. Do not leave D1 marked
   `accepted` against a command that exits 1. This is small and unblocks G1A Step 2.
3. **Take the T1 merge decision and record it in the ledger** before any further
   implementation. Everything downstream is hostage to it, and it is a governance choice,
   not an engineering one.
4. **Declare the concurrent lane (B6)** and confirm no other agent is active in
   `ClientApp/src/components`.
5. **Regenerate the coverage queue (B7)**, then resume A3 at family 2.
6. **Start Child Plan C at C1**, with the census taken after step 1 has settled.
7. **Amend the graph for T3** so C4 is documented as amending D3's workflow, including the
   `workflowPolicy.test.ts` counting-invariant warning.
8. **Re-estimate A (T5)** and re-score or remove the rubric (T4).

### Remaining work at 2026-08-27

| Lane | Task | State | Blocking issue |
| --- | --- | --- | --- |
| A | A1 topology + CI partition | landed `65dfd3f` | acceptance pending A3 + C7 |
| A | A2 coverage remap | landed `71fa4a0` | acceptance pending A3 |
| A | A3 coverage closure | **1 of 6 families closed** (`c8c15bd`) | 1,049 branches / 442 functions / 1,649 statements over 47 files; queue stale (B7); budget wrong (T5) |
| B | B0 contract approval | `EXTERNALLY DEFERRED` | no authoritative schema, no named approver |
| B | B1 date-only adapter | blocked on B0 | — |
| C | C1 warning census | not started | blocked by B3 working-tree drift |
| C | C2 shared inputs | not started | C1 |
| C | C3 async owners | not started | C2; inherits D1's 56 `set-state-in-effect` sites |
| C | C4 runtime/telemetry policy | not started | C3; must amend D3's workflow (T3) |
| C | C5 MSW contracts | not started | C4 |
| C | C6 modal lifecycle | not started | C5; 10 assertions unverified at HEAD since 2026-08-24 |
| C | C7 console ratchet | not started | every C owner clean |
| C | C8 E2E re-baseline | not started | C7; `e2e-node24` now runs it in CI for the first time |
| D | D1 ESLint flat config | landed `7d30a0b` | **acceptance not evidence-backed (B1)** |
| D | D2 glob overrides | landed `b854969`, verified at HEAD | none |
| D | D3 Node/Actions runtime | landed `983314e` | 8 statuses never executed on a real runner |

**Critical path:** working-tree drift → C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8, with A3
running in parallel once the concurrent lane is declared. D is complete apart from B1 and
first-run CI proof. B remains outside the path and outside the tranche.

## Target Test Topology

```text
Developer aggregate (no coverage)
vitest.config.ts
├── vitest.unit.config.ts       -> jsdom -> tests/unit/**/*.test.{ts,tsx}
└── vitest.storybook.config.ts  -> Chromium -> Storybook stories/MDX

CI (independent required jobs; matrix fail-fast: false)
├── static-quality-node24
├── vitest-unit       -> unit JUnit + V8 coverage artifact
├── vitest-storybook  -> Storybook JUnit artifact
├── vitest-quality    -> quality JUnit artifact
├── date-timezone     -> UTC + Sydney + Los Angeles JUnit artifacts
├── build-node24
├── e2e-node24        -> Playwright report + trace artifacts
└── lower-bound-node24

Separate browser gate
Playwright app BDD -> Playwright Storybook BDD
```

The process boundary is deliberate. Browser coverage must not share V8 temporary state with jsdom coverage, and three projects must not compete for one JUnit output path.

## Date-Only Data Flow

```text
Backend/generated Date or ISO value
          |
          v
extract calendar fields without host-zone conversion
          |
          v
strict parse + real-calendar validation
          |
          v
Formik/UI branded canonical value: YYYY-MM-DD
          |
          +--> local-noon Date only for react-datepicker rendering
          +--> dd MMM yyyy summary from calendar fields
          |
          v
save boundary: new Date(Date.UTC(year, month - 1, day))
          |
          v
generated API client
```

Do not use `new Date(isoString)`, `parseISO(isoString)`, or local `getFullYear()`/`getMonth()`/`getDate()` as an implicit date-only conversion. Those APIs model an instant and can change the calendar day across timezones.

## Implementation File Map

Expected paths are grouped by workstream; investigation may prove that a listed application file does not need modification.

- Test topology and CI partition: verify committed `vitest.config.ts`, `vitest.storybook.config.ts`, and `vitest.unit.config.ts`; modify `package.json` and `.github/workflows/pr.yml`; create `tests/unit/config/vitestTopology.test.ts` and `tests/unit/config/workflowPolicy.test.ts`.
- Coverage remap and closure: `vitest.unit.config.ts`, `ClientApp/src/terms-config.json` as inspect-only evidence, `tests/unit/config/coverageRemapPolicy.test.ts`, behavior tests and source-specific test files identified from the current coverage queue, and coverage/change-record documentation.
- Date-only contract: `ClientApp/src/utils/dateOnly.ts`, `ClientApp/src/components/Inputs/DatePicker/index.tsx`, `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts`, `ClientApp/src/routes/requestForQuote/validation.ts`, `tests/unit/utils/dateOnly.test.ts`, `tests/unit/components/inputs/datePickerWrapper.test.tsx`, `tests/unit/routes/requestForQuote/props.test.ts`, `tests/unit/routes/requestForQuote/validation.test.ts`.
- Shared-input warning cleanup: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`, related AutoSuggest/AddressLookup stories and tests, OrganisationNameLookup/CertificateNumberLookup owner tests, and their direct route/story regression consumers.
- Remaining async-warning owners: the current warning census entries for RequestForQuote descendants, `ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx`, `ClientApp/src/routes/preConditions/PreConditions.stories.tsx`, `ClientApp/src/routes/measurementReport/indexList.stories.tsx`, `ClientApp/src/components/Utilities/routeAccessibleNavigation.stories.tsx`, and `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx`; change the smallest proven owner only.
- Storybook runtime and logging policy: `.storybook/preview-setup.ts`, `vitest.storybook.setup.ts`, `package.json` and `.github/workflows/pr.yml` for the explicit telemetry contract, plus `tests/unit/config/storybookRuntimePolicy.test.ts`.
- Storybook MSW fidelity: `.storybook/msw-handlers.ts`, `.storybook/preview-setup.ts`, endpoint-owning stories, and `tests/unit/config/storybookMswPolicy.test.ts`; inspect the generated client but never edit it.
- Console ratchet: `vitest.setup.ts`, `vitest.storybook.setup.ts`, `tests/helpers/unexpectedConsoleGuard.ts`, `tests/unit/helpers/unexpectedConsoleGuard.test.ts`, and intentional error-path tests with exact scoped expectations.
- Modal Browser Mode repair: `ClientApp/src/components/Footer/Footer.stories.tsx`, `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`, `ClientApp/src/components/modals/Modals.stories.tsx`, and `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`; component files only if computed-style evidence proves a production defect.
- E2E stabilisation: `playwright.config.ts`, `playwright.storybook.config.ts`, and only the feature/step or app files that own freshly reproduced failures.
- Lint/deprecations: `package.json`, `package-lock.json`, `.eslintrc.cjs`, `.eslintignore`, `eslint.config.mjs`, `tests/unit/config/dependencySecurity.test.ts`, `tests/unit/config/eslintPolicy.test.ts`, three obsolete disable-comment sites, and `docs/CONVENTIONS.md`.
- Runtime/workflows: `.github/workflows/pr.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml`, `package.json`, and `docs/CONVENTIONS.md`.

---

## Gate G0A: Capture an Honest, Reproducible Technical Baseline

**Files:**

- Evidence only: ignored `reports/stabilisation/**`
- Inspect: all paths in the Implementation File Map
- Do not modify tracked implementation files in this task

- [ ] **Step 1: Initialise the technical ledger without inventing owners**

Create `reports/stabilisation/delivery-ledger.md` with columns for gate/task, owner state, commit SHA, command, environment, start/end time, exit code, artifact path, reviewer, and status. Record G0A's owner state as `NOT REQUIRED — technical evidence only`; do not create a fictional person or block technical baseline capture on role assignment. The ledger must distinguish `not required`, `pending lane entry`, `accepted`, `blocked`, and `rework` rather than leaving ownership or status blank.

- [ ] **Step 2: Record repository and toolchain state without cleaning the worktree**

Run in PowerShell from the repository root:

```powershell
New-Item -ItemType Directory -Force reports/stabilisation | Out-Null
git rev-parse HEAD | Set-Content reports/stabilisation/predecessor-head.txt
git status --short | Set-Content reports/stabilisation/git-status.before.txt
git log -12 --oneline --decorate | Set-Content reports/stabilisation/predecessor-commits.txt
git diff | Set-Content reports/stabilisation/user-work.before.diff
node --version | Set-Content reports/stabilisation/node.before.txt
npx --yes npm@11.17.0 --version | Set-Content reports/stabilisation/npm.before.txt
```

Expected: the evidence preserves every pre-existing modification. Do not use `git stash`, `git reset`, or checkout-based cleanup.

- [ ] **Step 3: Capture the current test and warning baselines**

Run each command once and retain stdout/stderr even when it exits non-zero:

```powershell
npm run test:unit 2>&1 | Tee-Object reports/stabilisation/unit.before.log
$env:TZ = 'UTC'
npm run test:unit -- tests/unit/components/inputs/datePickerWrapper.test.tsx 2>&1 | Tee-Object reports/stabilisation/date-picker.utc.before.log
Remove-Item Env:TZ
npm run test:storybook -- ClientApp/src/components/Footer/Footer.stories.tsx ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx ClientApp/src/components/modals/Modals.stories.tsx ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx 2>&1 | Tee-Object reports/stabilisation/modals.before.log
npm run test:storybook -- ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx 2>&1 | Tee-Object reports/stabilisation/shared-inputs.before.log
npm run test:storybook -- ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx ClientApp/src/routes/preConditions/PreConditions.stories.tsx ClientApp/src/routes/measurementReport/indexList.stories.tsx ClientApp/src/components/Utilities/routeAccessibleNavigation.stories.tsx ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx 2>&1 | Tee-Object reports/stabilisation/remaining-warning-owners.before.log
npm run test:quality:regression 2>&1 | Tee-Object reports/stabilisation/quality.before.log
```

Expected: unit behavior passes in the local zone; the UTC DatePicker run reproduces the three current failures; the four modal story files reproduce and classify their local failure set; every warning owner is captured verbatim. For one representative async owner, also record single-story, file-scoped, and sequential multi-file runs so local settlement and cross-story leakage are distinguishable. The final Linux reference is 10 failed modal assertions in both runs `32643895854` and `32644658694`; record, rather than hide, any platform-dependent difference in the local count.

- [ ] **Step 4: Capture dependency and coverage ownership**

```powershell
npm run test:unit:coverage 2>&1 | Tee-Object reports/stabilisation/unit-coverage.before.log
npm ls rimraf inflight @humanwhocodes/config-array @humanwhocodes/object-schema glob eslint eslint-plugin-react @eslint-react/eslint-plugin @playwright/test --all --json | Set-Content reports/stabilisation/dependency-tree.before.json
npm audit --json | Set-Content reports/stabilisation/npm-audit.before.json
```

Record `Failed to parse`, `PARSE_ERROR`, `coverage/.tmp`, `Excluding it from coverage`, and every named remap input separately from the percentage threshold. Capture one Storybook request to `/api/dashboard/get-quote-report-pdf` and record its matched handler and response shape against the generated `DownloadedFileResponse` contract.

Expected: unit tests themselves pass; the 100% threshold fails at the measured baseline; coverage-remap corruption is classified independently; the PDF wildcard mismatch is preserved as RED contract evidence; npm audit remains zero if the predecessor security remediation is intact; the deprecation owners match the validation ledger.

- [ ] **Step 5: Write the baseline summary**

Create `reports/stabilisation/baseline.md` with command, exit code, file/test counts, warning signatures, environment, and candidate accountable role for every failure. Mark the person as `PENDING G0B — lane not entered` until that lane's just-in-time owner accepts responsibility. Mark historical E2E counts as historical until Task C8 revalidates them.

---

## Gate G0B: Authorize Each Lane Just in Time

**Files:**

- Create or update: `reports/stabilisation/owners.md`
- Update: `reports/stabilisation/delivery-ledger.md`
- Do not modify tracked implementation files until this gate passes for the selected lane

- [ ] **Step 1: Record only the people required for the selected lane**

Create `reports/stabilisation/owners.md` with columns for role, status, actual person, contact channel, accepted-at timestamp, and backup or explicit single-owner risk acceptance. Use this entry matrix:

| Entry                        | Roles that must be accepted before tracked mutation |
| ---------------------------- | --------------------------------------------------- |
| Child Plan A                 | Delivery DRI and Test Assurance DRI                 |
| Child Plan B                 | Delivery DRI and API Contract Approver              |
| Child Plan C                 | Delivery DRI and UI Test DRI                        |
| Child Plan D                 | Delivery DRI and Dependency DRI                     |
| G1A tranche or G1B portfolio | Delivery DRI and Release Approver                   |

Roles for lanes that have not entered remain explicit as `NOT YET REQUIRED — lane not entered`; their person, contact, acceptance, and backup cells use an em dash rather than invented data. A selected lane fails G0B if either required active role lacks an actual person, contact channel, accepted-at timestamp, or backup/single-owner risk decision. One person may hold multiple roles when each acceptance is recorded separately.

- [ ] **Step 2: Record the lane-entry decision**

Add a G0B row to `reports/stabilisation/delivery-ledger.md` naming the selected lane, both active roles, acceptance timestamp, baseline commit SHA, reviewer, and status. Read-only investigation and ignored evidence capture may continue before acceptance; no tracked production, test, workflow, manifest, lockfile, configuration, or documentation mutation for that lane may start until its row is `accepted`.

---

## Child Plan A: Test Assurance and Coverage

**Outcome:** Each test environment has one owner, every CI partition reports even when another fails, and the retained 100% unit-coverage policy is genuinely satisfied.

**Ships independently when:** topology characterization, the non-fail-fast CI matrix, report upload, and 100% coverage are green. Child Plans B and C may merge earlier if their own gates are green; the umbrella remains open until A closes.

### Task A1: Lock the Vitest Leaves and Partition CI

**Files:**

- Verify: `vitest.config.ts`
- Verify: `vitest.storybook.config.ts`
- Verify: `vitest.unit.config.ts`
- Modify: `package.json`
- Modify: `.github/workflows/pr.yml`
- Create: `tests/unit/config/vitestTopology.test.ts`
- Create: `tests/unit/config/workflowPolicy.test.ts`

**Interfaces:**

- Root projects: exactly `./vitest.unit.config.ts` and `./vitest.storybook.config.ts`.
- Storybook config: one direct Browser Mode leaf; no nested `test.projects`.
- Unit config: jsdom, unit-only include, unit-owned coverage, unit-owned worker limit.
- CI: a `fail-fast: false` matrix runs each test environment in a separate job and uploads its own report with `if: always()`.

Predecessor evidence already proves the production fix on Linux: after `0d16927`, runs `32643405990` through `32644658694` no longer show duplicate unit execution or `document is not defined`. A1 is characterization and reporting architecture, not another topology rewrite.

- [ ] **Step 1: Write the topology characterization test**

The test must load the three configs and assert:

```ts
expect(root.test?.projects).toEqual([
  "./vitest.unit.config.ts",
  "./vitest.storybook.config.ts",
]);
expect(storybook.test?.projects).toBeUndefined();
expect(storybook.test?.browser?.enabled).toBe(true);
expect(unit.test?.environment).toBe("jsdom");
expect(unit.test?.include).toEqual(["tests/unit/**/*.test.{ts,tsx}"]);
expect(root.test?.maxWorkers).toBeUndefined();
```

Also assert that neither leaf includes `.github/migration-verifier/tests/runtime/**/*.spec.ts` or Playwright BDD paths.

Run:

```powershell
npm run test:unit -- tests/unit/config/vitestTopology.test.ts
```

Expected: green against committed topology fix `0d16927`. A red result means the committed fix drifted or the test encoded the wrong resolved shape; investigate before editing configuration. Retain the final Linux runs as external evidence that the characterized shape operates under CI.

- [ ] **Step 2: Verify the committed minimal leaf repair**

Verify the direct `storybookTest(...)` plugin and direct `test.name`, `setupFiles`, timeout, and browser block committed in `vitest.storybook.config.ts`. Keep root `vitest.config.ts` composition-only. Do not recreate `vitest.storybook.project.ts` or `vitest.coverage.ts`; both were unnecessary indirection in the earlier plan.

Run:

```powershell
npm run test:all -- tests/unit/components/Pagination.test.tsx
node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --config vitest.config.ts .github/migration-verifier/tests/runtime/checklist.runtime.spec.ts --passWithNoTests
```

Expected: Pagination runs once in jsdom; the Playwright runtime spec is not collected by either leaf.

- [ ] **Step 3: Split `test:ci` into explicit scripts**

Add scripts with these responsibilities:

```json
{
  "test:ci": "npm run type-check && npm run test:ci:unit && npm run test:ci:storybook && npm run test:ci:quality",
  "test:ci:unit": "node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts --coverage --reporter=default --reporter=junit --outputFile.junit=reports/vitest/unit-junit.xml",
  "test:ci:storybook": "node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --config vitest.storybook.config.ts --reporter=default --reporter=junit --outputFile.junit=reports/vitest/storybook-junit.xml",
  "test:ci:quality": "node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --config quality/vitest.regression.config.ts --reporter=default --reporter=junit --outputFile.junit=reports/vitest/quality-junit.xml"
}
```

Keep `test:all` as the no-coverage aggregate developer smoke. Do not route CI coverage through root `vitest.config.ts`.

- [ ] **Step 4: Verify local process and report isolation**

Delete only the three planned JUnit paths, then run the three new subcommands individually and record each exit code. Do not use the fail-fast aggregate for this characterization. At this stage:

- Unit CI may remain red only for the documented 100% coverage blocker.
- Storybook CI may remain red only for failures owned by Child Plan C.
- Quality CI must be green.
- Every invoked project must create a non-empty, parseable JUnit file at its own path.
- No `coverage/.tmp` ENOENT, `document is not defined`, or duplicate unit execution is allowed.

These red runs are characterization evidence, not acceptance. Mark A1 `implemented, acceptance pending`; after A3 and C7 close their owned failures, repeat all three commands and require exit 0 before changing A1 to `accepted`.

- [ ] **Step 5: Replace the monolithic PR test step with independent jobs**

In `.github/workflows/pr.yml`, keep a static-quality job and add a test-partition matrix equivalent to:

```yaml
strategy:
  fail-fast: false
  matrix:
    partition:
      - name: unit
        command: npm run test:ci:unit
        report: reports/vitest/unit-junit.xml
        install-browser: false
      - name: storybook
        command: npm run test:ci:storybook
        report: reports/vitest/storybook-junit.xml
        install-browser: true
      - name: quality
        command: npm run test:ci:quality
        report: reports/vitest/quality-junit.xml
        install-browser: false
```

Each matrix cell checks out the same SHA, uses Node 24 and npm 11.17.0, applies only the existing Rolldown binding workaround, conditionally installs Chromium for Storybook, and runs `${{ matrix.partition.command }}`. Upload `${{ matrix.partition.report }}` in an `if: always()` step using:

```yaml
uses: actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f # v6.0.0
with:
  name: vitest-${{ matrix.partition.name }}-${{ github.run_attempt }}
  path: ${{ matrix.partition.report }}
  if-no-files-found: error
  retention-days: 14
```

The unit cell also uploads `reports/coverage/unit/**` with `if: always()`, `if-no-files-found: error`, and 14-day retention. Keep build and lower-bound checks as separately named jobs. Do not use `continue-on-error`; every matrix cell remains a required status.

Create `tests/unit/config/workflowPolicy.test.ts`. Read `.github/workflows/pr.yml` as text and assert exactly one occurrence of each `test:ci:*` command and JUnit path, `fail-fast: false`, the immutable upload-artifact SHA, `if: always()`, `if-no-files-found: error`, and `retention-days: 14`. Assert `continue-on-error` is absent. Run:

```powershell
npm run test:unit -- tests/unit/config/vitestTopology.test.ts tests/unit/config/workflowPolicy.test.ts
npx prettier --check .github/workflows/pr.yml
```

Expected: both policy tests and the YAML formatting parse succeed.

- [ ] **Step 6: Commit only the topology characterization and CI partition**

```powershell
git add package.json .github/workflows/pr.yml tests/unit/config/vitestTopology.test.ts tests/unit/config/workflowPolicy.test.ts
git commit -m "test: partition vitest ci reporting"
```

The Vitest config repair is already committed. Do not amend it into this commit, and do not stage generated `public/mockServiceWorker.js`.

---

### Task A2: Prove V8/Rolldown Coverage-Remap Integrity

**Files:**

- Verify/modify: `vitest.unit.config.ts`
- Inspect only: `ClientApp/src/terms-config.json`
- Inspect: the `terms-config.json` import in `ClientApp/src/components/modals/TermsAndCondition/index.tsx`
- Create: `tests/unit/config/coverageRemapPolicy.test.ts`
- Evidence: `reports/stabilisation/coverage-remap.red.log`
- Evidence: `reports/stabilisation/coverage-remap.green.log`

**Interfaces:**

- Consumes: the unit leaf and coverage report ownership characterized by A1.
- Produces: a reviewed coverage denominator and a clean remap pipeline that A3 can trust.
- Policy: handwritten runtime TS/TSX remains measured; generated, vendor, story, declaration, and type-only files remain excluded; JSON/config assets receive an explicit, testable policy.

- [ ] **Step 1: Preserve the focused RED remap evidence**

Run:

```powershell
npm run test:unit:coverage 2>&1 | Tee-Object reports/stabilisation/coverage-remap.red.log
```

The RED condition is any unexpected match for:

```text
Failed to parse
terms-config.json?import
PARSE_ERROR
coverage/.tmp
Excluding it from coverage
```

If the reviewed `terms-config.json?import` diagnostic no longer reproduces, record the exact current remap failure or mark the historical defect non-reproducible; do not manufacture a configuration edit.

- [ ] **Step 2: Prove why JSON enters remapping**

Run:

```powershell
rg -n "coverage|include|exclude|all:|json|terms-config" `
  vitest.unit.config.ts vitest.config.ts ClientApp/src
```

Record exactly one proven owner in `reports/stabilisation/coverage-remap.md`:

1. the coverage include/exclude policy;
2. executed-module coverage feeding transformed JSON into remapping;
3. a Vite/Rolldown plugin or source-map transform;
4. another owner demonstrated by the captured stack and transformed input.

The JSON file's shown contents are valid JSON; do not convert it to TypeScript or JavaScript merely to satisfy the remapper.

- [ ] **Step 3: Write the failing coverage policy characterization**

Create `tests/unit/config/coverageRemapPolicy.test.ts` to load the resolved unit config and assert:

```ts
expect(coverage.include).toEqual([
  "ClientApp/src/**/*.{ts,tsx}",
  "webpack.config.js",
]);
expect(coverage.thresholds).toMatchObject({
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
});
expect(JSON.stringify(coverage)).not.toContain('"all":true');
```

Add a fixture assertion for the proven JSON/remap owner so the test fails before the configuration correction and would fail again if arbitrary runtime TS/TSX were removed from the denominator.

- [ ] **Step 4: Apply the smallest proven remap correction**

Remove the obsolete Vitest-4 `CoverageOptionsWithAll` escape and `all: true`. Apply only the additional include/exclude/plugin correction proven in Step 2. Do not edit `terms-config.json`, lower thresholds, exclude low-coverage TS/TSX, or add a broad diagnostic ignore.

- [ ] **Step 5: Verify clean remapping and commit**

```powershell
npm run test:unit -- tests/unit/config/coverageRemapPolicy.test.ts
npm run test:unit:coverage 2>&1 | Tee-Object reports/stabilisation/coverage-remap.green.log
Select-String -Path reports/stabilisation/coverage-remap.green.log `
  -Pattern "Failed to parse|PARSE_ERROR|coverage/.tmp|Excluding it from coverage"
```

Expected: the policy test is green; `Select-String` returns no unexpected match; the handwritten runtime denominator reconciles to the reviewed policy. The percentage threshold may remain red until A3.

```powershell
git add vitest.unit.config.ts tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "test: harden unit coverage remapping"
```

---

### Task A3: Resolve the Existing 100% Coverage Blocker

**Files:**

- Verify/modify: `vitest.unit.config.ts`
- Modify/create: behavior tests identified by coverage gaps
- Create: `reports/stabilisation/coverage-gap-queue.json` (ignored evidence)
- Create/update: `reports/stabilisation/coverage-ledger.md` (ignored evidence)
- Update: `docs/TESTING.md`
- Update: `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- Historical evidence only: `docs/superpowers/plans/2026-06-10-100-percent-test-coverage.md`; it is not an execution dependency

- [ ] **Step 1: Reconcile the clean A2 denominator**

Compare `reports/coverage/unit/coverage-summary.json` and `reports/coverage/unit/coverage-final.json` with the A2-reviewed `vitest.unit.config.ts`. Confirm that generated, vendor, stories, declarations, and type-only files are excluded while handwritten runtime code remains measured. If a remap diagnostic has returned, reopen A2 rather than generating an incomplete coverage queue.

- [ ] **Step 2: Generate the current coverage queue**

Run coverage once and generate `reports/stabilisation/coverage-gap-queue.json` from `reports/coverage/unit/coverage-final.json`. Sort measured files by uncovered branch count, then uncovered function count, then uncovered line count. Each queue record contains the repository-relative source path, uncovered branch locations, uncovered function names, uncovered lines, current percentages, owning source family, and intended test file. Reject queue entries outside the reviewed denominator.

The validated starting order is:

| Priority | Source family                                                  | Test surface                                                                         |
| -------: | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|        1 | Type Approval routes and authenticated route guards            | Route behavior, authorization branches, API success/failure, and navigation          |
|        2 | Attachment and progress controls                               | Empty, boundary, upload failure, cancellation, and completion behavior               |
|        3 | Request-list items and workflow pages                          | Empty results, role/state variants, link behavior, and upstream errors               |
|        4 | Slate editor                                                   | Serialization, empty content, formatting commands, invalid input, and focus behavior |
|        5 | Storage, validation, analytics, and bootstrap/config leftovers | Nil/empty/error branches and policy assertions                                       |

The queue, not the historical plan, is authoritative if the current report differs.

- [ ] **Step 3: Close one behavior family at a time**

For every queue family:

1. Add a focused test that fails for the uncovered behavior, not merely because a module was imported.
2. Run the focused test and record the expected failure in `coverage-ledger.md`.
3. Add only the minimum test harness or production fix required by the behavior.
4. Run the focused test, the owning suite, and `npm run test:unit:coverage`.
5. Record the coverage delta and remove only queue entries proven covered.
6. Commit the family separately if it touches a distinct runtime surface.

Coverage-ignore directives, trivial existence assertions, snapshots without behavior assertions, and denominator exclusions are rejected. If an uncovered path is unreachable, prove that with types or runtime invariants and remove the dead production branch in a separately reviewed change rather than ignoring it.

- [ ] **Step 4: Hold the threshold and test-quality contracts**

The acceptance command is:

```powershell
npm run test:unit:coverage
```

Expected: exit 0 at 100% statements, branches, functions, and lines over the reviewed handwritten runtime surface. Until that result exists, `COVERAGE-GATE-001` stays open and the merged plan cannot be called complete.

Also run `npm run test:quality:regression` and review every newly added test for at least one observable output, state transition, error, or policy assertion. The Test Assurance DRI signs the coverage ledger; percentage alone is insufficient acceptance evidence.

- [ ] **Step 5: Update the coverage evidence and finish the child plan**

Update the testing guide and open-items backlog with the new measured result and close `COVERAGE-GATE-001` only when the command is green.

Review `git diff --name-only`, then stage `vitest.unit.config.ts`, the exact coverage-owned test files from that list, `docs/TESTING.md`, and `docs/change-record/OPEN-ITEMS-BACKLOG.md`. Never use `git add tests` for this task. Keep one commit per source family; use the final commit only for the denominator configuration and documentation closure.

```powershell
git commit -m "test: close unit coverage gate"
```

Keep unrelated test files out of this commit.

---

## Child Plan B: RFQ Date-Only Contract

**Status:** `EXTERNALLY DEFERRED`. The 2026-08-24 repository snapshot contains no authoritative OpenAPI/backend schema for this field. Generated client typing and handwritten UI behaviour are supporting evidence only, so B0 remains blocked without production edits until the resume evidence below exists. This status does not block Child Plans A, C, or D or the G1A A/C/D release tranche.

**Outcome:** The preferred availability value has one validated calendar-date representation from backend boundary through Formik, picker, summary, and save conversion.

**Ships independently when:** the API Contract Approver records authoritative evidence and the focused suite passes in UTC, Australia/Sydney, and America/Los_Angeles.

**Predecessor evidence:** this is not a new failure introduced by PR #1. Main release run `32604569295` and final PR run `32644658694` both fail the same three assertions in `datePickerWrapper.test.tsx` on UTC runners. Preserve those assertions as red characterization until Step 1 decides the intended calendar-date contract.

**Resume trigger:** enter G0B-B and resume B0 only when a named API Contract Approver supplies an authoritative backend/OpenAPI field definition plus representative request and response payloads, or records an equivalent signed contract decision from the backend owner. Do not treat `.github/skills/openapi-to-application-code`, `ClientApp/src/api/web-api-client.ts`, labels, validators, stories, or current serializer behaviour as a substitute for that authority.

### Task B0: Prove the Authoritative Date Contract

**Files:**

- Create: `reports/stabilisation/date-contract.md`
- Inspect: authoritative backend/OpenAPI schema and captured request/response evidence
- Inspect only: `ClientApp/src/api/web-api-client.ts`
- Inspect: `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts`

**Interfaces:**

- Produces: one signed classification of `preferredInstrumentOrArtefactAvailabilityDate` as `DATE_ONLY`, `LOCAL_DATE_TIME`, `INSTANT`, or `BLOCKED`.
- B1 consumes: the approved wire shapes, nullable rules, runtime representation, and transport conversion recorded here.

- [ ] **Step 1: Record backend and wire semantics**

In `reports/stabilisation/date-contract.md`, record the exact field name, schema type/format, nullable rules, request example, response example, offset/timezone semantics, and whether time-of-day carries business meaning. Cite the authoritative backend/OpenAPI source and the captured payload; the generated TypeScript `Date` annotation alone is not contract proof.

- [ ] **Step 2: Prove generated-client runtime semantics**

Trace the generated client deserializer without editing it. Record whether application code receives a JavaScript `Date`, string, or other value for each approved wire shape, and whether an offset ISO string's original lexical calendar day survives deserialization. Add a focused characterization in `tests/unit/routes/requestForQuote/props.test.ts` when the behaviour can be exercised without changing generated code.

- [ ] **Step 3: Obtain the contract decision**

The API Contract Approver records exactly one:

```text
DATE_ONLY
LOCAL_DATE_TIME
INSTANT
BLOCKED / contradictory evidence
```

If the result is not `DATE_ONLY`, stop Child Plan B before production edits and create a separately approved domain-model design. B0 is accepted only when the decision, approver, date, evidence paths, and accepted wire shapes are complete.

---

### Task B1: Repair the RFQ Date-Only Contract

**Files:**

- Create: `ClientApp/src/utils/dateOnly.ts`
- Modify: `ClientApp/src/components/Inputs/DatePicker/index.tsx`
- Modify: `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts`
- Modify: `ClientApp/src/routes/requestForQuote/validation.ts`
- Create: `tests/unit/utils/dateOnly.test.ts`
- Modify: `tests/unit/components/inputs/datePickerWrapper.test.tsx`
- Modify: `tests/unit/routes/requestForQuote/props.test.ts`
- Modify: `tests/unit/routes/requestForQuote/validation.test.ts`

**Non-goals:**

- `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx` unless a new focused RED proves an independent defect.
- Generic `ClientApp/src/components/SummaryDisplay/index.tsx` unless a new focused RED proves an independent defect.
- `ClientApp/src/api/web-api-client.ts`.
- Generic instant/date-time helpers used by unrelated domains.

**Interfaces:**

```ts
declare const dateOnlyBrand: unique symbol;
export type DateOnlyValue = string & {
  readonly [dateOnlyBrand]: "DateOnlyValue";
};

export function parseDateOnlyValue(value: string): DateOnlyValue | undefined;

export function parseApiDateOnly(
  value: Date | string,
): DateOnlyValue | undefined;
export function parseDateOnlyInput(
  value: Date | string,
): DateOnlyValue | undefined;
export function dateOnlyToPickerDate(value: DateOnlyValue): Date;
export function dateOnlyToApiDate(value: DateOnlyValue): Date;
export function formatDateOnlyDisplay(value: DateOnlyValue): string;
```

`parseDateOnlyValue` accepts only `YYYY-MM-DD` with four-digit year and zero-padded month/day, round-trips the parsed components to reject impossible dates such as `2026-02-30`, and is the only constructor for the branded value. `parseApiDateOnly` reads UTC calendar components from a valid generated-client `Date`; it accepts string forms only when Step 1 records that exact wire shape as authoritative. `parseDateOnlyInput` reads local calendar components from a valid picker `Date` or strictly parses `dd/MM/yyyy`. `dateOnlyToPickerDate` constructs local noon from calendar components to avoid host-offset rollover during rendering. `dateOnlyToApiDate` returns UTC midnight. Invalid user text stays available to Formik validation rather than being silently coerced to `null`.

- [ ] **Step 1: Consume the accepted B0 contract**

Read `reports/stabilisation/date-contract.md` and copy its approved wire shapes and transport conversion into the RED test table below. Stop if B0 is absent, unsigned, or not classified `DATE_ONLY`; do not infer missing semantics during implementation.

- [ ] **Step 2: Add red helper and boundary tests**

Cover at minimum:

- API `2026-06-11T00:00:00.000Z` displays and saves as 11 June in UTC, Australia/Sydney, and America/Los_Angeles.
- API `2026-06-11T00:00:00+10:00` preserves the leading calendar day only when the approved contract explicitly permits offset ISO strings; otherwise the test asserts rejection.
- Canonical parsing rejects `2026-6-1`, `2026-02-29`, `2026-02-30`, an empty string, and trailing characters; it accepts leap day `2028-02-29`.
- Picker selection for 11 June stores `2026-06-11` regardless of host timezone.
- Typed `11/06/2026` stores the same canonical value.
- Summary renders `11 Jun 2026` in every timezone.
- Blur, touched, invalid text, clearing, minimum/maximum date, and future-date validation behavior remain unchanged.
- Save converts `2026-06-11` to `2026-06-11T00:00:00.000Z`.

Run the focused tests locally, then repeat DatePicker and helper tests with `TZ=UTC`, `TZ=Australia/Sydney`, and `TZ=America/Los_Angeles`. Use PowerShell `$env:TZ = 'UTC'` locally and a CI matrix with job-level `env: TZ`; do not add a shell-specific package script.

- [ ] **Step 3: Implement the explicit date-only adapter**

Move date-only behavior into `ClientApp/src/utils/dateOnly.ts`. Update DatePicker state, change, blur, and summary paths to use calendar values. Update RFQ validation and save conversion to use the same helper. Do not edit the generated client and do not change generic instant/date-time helpers used by other domains.

After migration, run:

```powershell
rg -n "parseDateUTC|formatDateToUTC|formatDateStringToUTC|new Date\(value|parseISO" ClientApp/src/components/Inputs/DatePicker ClientApp/src/routes/requestForQuote
```

Expected: the RFQ date-only path has no implicit instant conversion. Remove obsolete global helper exports only if `rg` proves no other production consumer remains; update their unit tests in the same commit.

- [ ] **Step 4: Verify both timezone matrices and commit**

```powershell
npm run test:unit -- tests/unit/utils/dateOnly.test.ts tests/unit/components/inputs/datePickerWrapper.test.tsx tests/unit/routes/requestForQuote/props.test.ts tests/unit/routes/requestForQuote/validation.test.ts
npm run test:unit -- tests/unit/components/inputs/customDatePicker.test.tsx tests/unit/components/SummaryDisplay.test.tsx
npm run type-check
git add ClientApp/src/utils/dateOnly.ts ClientApp/src/components/Inputs/DatePicker/index.tsx ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts ClientApp/src/routes/requestForQuote/validation.ts tests/unit/utils/dateOnly.test.ts tests/unit/components/inputs/datePickerWrapper.test.tsx tests/unit/routes/requestForQuote/props.test.ts tests/unit/routes/requestForQuote/validation.test.ts
git commit -m "fix: preserve rfq calendar dates across timezones"
```

The commit is not complete until equivalent UTC, Sydney, and Los Angeles runs pass, CustomDatePicker remains 6/6, SummaryDisplay remains 11/11, and the API Contract Approver has signed the evidence file.

---

## Child Plan C: UI, Accessibility, Storybook Fidelity, and Browser-Test Stabilisation

**Outcome:** Shared inputs have valid accessible names, each asynchronous warning is closed at its first owner, Storybook runtime and API mocks represent real contracts, modal stories are genuinely visible, and current E2E scenarios are deterministic without sleeps, blanket retries, hidden console output, or weakened assertions.

**Ships independently when:** C1-C8 are accepted; every warning-census row is closed or represented by an exact test-local expectation; endpoint-specific MSW policy is green; modal stories pass ten consecutive focused repetitions; and the combined E2E gate passes C8's stress criterion.

### Task C1: Build the Warning Census and Console-Guard Helper

**Files:**

- Create: `reports/stabilisation/warnings.md`
- Create: `tests/helpers/unexpectedConsoleGuard.ts`
- Create: `tests/unit/helpers/unexpectedConsoleGuard.test.ts`
- Do not install the helper globally in this task.

**Interfaces:**

```ts
export type GuardedConsoleLevel = "warn" | "error";

export function installUnexpectedConsoleGuard(): void;

export async function expectConsoleMessage(
  level: GuardedConsoleLevel,
  pattern: RegExp,
  count: number,
  action: () => void | Promise<void>,
): Promise<void>;
```

C2-C6 consume the census. C7 consumes the tested helper only after every known owner is clean.

- [ ] **Step 1: Classify every current warning signature**

Build `reports/stabilisation/warnings.md` with signature, first owning stack, affected tests/stories, single/file/sequential reproduction result, classification, intended repair, command, and status. Use these classifications:

- production accessibility contract;
- unit-test synchronization;
- story synchronization/effect cleanup;
- Storybook runtime fixture;
- Storybook API contract fidelity;
- intentional error-path output requiring an exact local expectation;
- third-party warning with a proven upstream issue and narrowly bounded exception.

The reviewed evidence does not justify a blanket third-party exception. Counts are baseline evidence, not identifiers; owner stack and signature are the durable keys.

- [ ] **Step 2: Write RED helper tests**

Test that the helper:

- re-emits original output;
- fails the same test on an unconsumed warning/error;
- consumes only the requested level, regular expression, and exact count;
- restores state in `finally`;
- rejects nested, mismatched, or leaked expectations;
- recognizes `not wrapped in act`, the React Aria missing-label warning, and `[env] Missing required runtime variable` as unexpected when unconsumed.

- [ ] **Step 3: Implement and verify the helper without global installation**

```powershell
npm run test:unit -- tests/unit/helpers/unexpectedConsoleGuard.test.ts
git add tests/helpers/unexpectedConsoleGuard.ts tests/unit/helpers/unexpectedConsoleGuard.test.ts
git commit -m "test: define unexpected console contract"
```

Expected: helper tests are green; `vitest.setup.ts` and `vitest.storybook.setup.ts` do not yet call `installUnexpectedConsoleGuard()`.

---

### Gate C-MCP: Prove Storybook MCP Readiness Before UI or Story Mutation

**Applies before:** C2 and any later task that changes a UI component or `*.stories.*` file. C1 and other non-UI evidence work may complete before this gate.

- [ ] **Step 1: Start Storybook before the agent client connects**

From the repository root, keep this process running in a separate terminal:

```powershell
npm run storybook
```

Expected: Storybook reports `http://localhost:6006/` ready. The MCP addon is already configured in `.storybook/main.ts`; do not add a second server or change the port.

- [ ] **Step 2: Verify the endpoint and configured Codex server**

Run from another PowerShell terminal:

```powershell
$mcpUrl = "http://localhost:6006/mcp"
$response = Invoke-WebRequest -Uri $mcpUrl -Headers @{ Accept = "text/html" } -TimeoutSec 10
if ($response.StatusCode -ne 200) {
  throw "Storybook MCP endpoint returned $($response.StatusCode)"
}

codex mcp get my-storybook-mcp-server
codex mcp list
```

Expected: `/mcp` returns HTTP 200, `codex mcp list` shows `my-storybook-mcp-server` enabled, and `codex mcp get` reports `transport: streamable_http` with the exact URL above. `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, and this plan use the same server name.

- [ ] **Step 3: Refresh Codex only when startup order requires it**

If the current Codex session started while Storybook was stopped and its log contains `fetch failed` or its tool inventory omits the Storybook tools, leave Storybook running and restart the Codex client or IDE extension. Configuration alone does not inject tools into an already initialized session. Do not repeatedly edit MCP configuration, invoke the endpoint manually as a substitute for repository-required tool calls, or bypass this gate.

- [ ] **Step 4: Prove the required tools in the refreshed session**

Call `list-all-documentation` and `get-storybook-story-instructions` through `my-storybook-mcp-server`. Before using a documented component, call `get-documentation` with an ID returned by the list tool. Record the server name, endpoint, tool result, timestamp, and agent client in `reports/stabilisation/storybook-mcp.md`.

Expected: `list-all-documentation`, `get-documentation`, `get-storybook-story-instructions`, and `run-story-tests` are available. If the endpoint is healthy but the tools remain absent after one client restart, stop UI/story mutation, preserve the client log, and continue only independent work.

---

### Task C2: Repair AutoSuggest and Shared Lookup Ownership

**Files:**

- Modify: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`
- Modify: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`
- Modify: `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`
- Modify only if proven owner: AutoSuggest/AddressLookup/OrganisationNameLookup tests and components
- Verify: `tests/unit/components/inputs/combobox.accessibility.test.tsx`
- Verify: `tests/unit/components/inputs/complexInputs.behavior.test.tsx`
- Verify: `tests/unit/components/inputs/residualBranches.test.tsx`
- Verify: `tests/unit/components/inputs/OrganisationNameLookup.behavior.test.tsx`
- Verify: `tests/unit/routes/acceptQuote/deliveryAndReturn.test.tsx`
- Verify: `tests/unit/routes/workflowStepComponents.test.tsx`

**Interfaces:**

- Consumes: C1 warning signatures and the repository-required Storybook component documentation.
- Produces: a named React Aria combobox at initial render and settled shared-input interactions for C3 consumers.

- [ ] **Step 1: Query required Storybook documentation before UI edits**

Use `my-storybook-mcp-server` `list-all-documentation`, `get-documentation`, and `get-storybook-story-instructions`. Verify the documented React Aria label relationship and every component/story property used. If the tools are unavailable, mark C2 blocked and continue only non-UI tasks; do not infer a `Label` or accessibility prop from naming conventions.

- [ ] **Step 2: Prove the label boundary with RED assertions**

Trace:

```text
visible label
-> AutoSuggest props
-> AutoSuggestContainer
-> React Aria ComboBox
-> React Aria Input
```

Add initial-render assertions on the actual control:

```ts
expect(
  screen.getByRole("combobox", { name: /expected visible label/i }),
).toBeInTheDocument();
```

Also assert that accessible naming survives loading, results, no-results, error, manual-entry, cancellation, and validation states. The nominal labelled-combobox test must fail if React Aria's component context is unnamed even when a native input can be found through an external label.

- [ ] **Step 3: Apply the documented visible-label relationship**

Change the first shared owner only. Preserve visible copy, existing control ID, contextual help, error description, `aria-invalid`, and Formik name. Do not add a duplicate label, hidden generic copy, or route-specific `aria-label` values.

- [ ] **Step 4: Repair shared-input scheduler ownership separately**

Use `userEvent.setup()`, awaited interactions, and semantic postconditions. Use `findBy*`/`waitFor` for real async UI and `act` only around timer advancement or externally resolved promises owned by the test. Do not add empty `act(async () => {})` drains. Prove each repaired warning by its owner stack; accessible naming and scheduler settlement are separate acceptance rows.

- [ ] **Step 5: Verify shared inputs and direct consumers**

```powershell
npm run test:unit -- `
  tests/unit/components/inputs/combobox.accessibility.test.tsx `
  tests/unit/components/inputs/complexInputs.behavior.test.tsx `
  tests/unit/components/inputs/residualBranches.test.tsx `
  tests/unit/components/inputs/OrganisationNameLookup.behavior.test.tsx `
  tests/unit/routes/acceptQuote/deliveryAndReturn.test.tsx `
  tests/unit/routes/workflowStepComponents.test.tsx

npm run test:storybook -- `
  ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx `
  ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestOption.stories.tsx `
  ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx `
  ClientApp/src/routes/account/organisationDetails.stories.tsx
```

Expected: zero missing-name warning and zero AutoSuggest/React Aria `act(...)` warning; functional assertions are unchanged or stronger. Commit the accessibility contract separately from scheduler-only test/story changes.

```powershell
git add `
  ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx `
  ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx `
  ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx `
  tests/unit/components/inputs/combobox.accessibility.test.tsx `
  tests/unit/components/inputs/complexInputs.behavior.test.tsx `
  tests/unit/components/inputs/residualBranches.test.tsx
git commit -m "fix(a11y): provide react aria combobox label context"
```

Stage and commit additional scheduler-only consumer files separately with `test(ui): settle autosuggest interactions`; do not restage the already committed accessibility files unless that second diff genuinely changes them.

---

### Task C3: Close the Remaining Async Warning Owners

**Files:**

- Conditional modify: `ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx` and first proven descendants
- Conditional modify: `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` and first proven ReportRecipient/PaymentDetails/DeliveryAndReturn descendant
- Conditional modify: `ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx` and direct Type Approval stories/tests
- Conditional modify: `ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx`
- Conditional modify: `ClientApp/src/routes/preConditions/PreConditions.stories.tsx` and `ClientApp/src/routes/preConditions/PreConditions.tsx`
- Conditional modify: `ClientApp/src/routes/measurementReport/indexList.stories.tsx` and first proven data/Breadcrumb owner
- Conditional modify: `ClientApp/src/components/Utilities/routeAccessibleNavigation.stories.tsx`
- Conditional modify: `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx` and direct consuming story
- Evidence: C1 rows and `reports/stabilisation/warning-settlement.md`

**Interfaces:**

- Consumes: C2-clean shared inputs.
- Produces: zero warning rows outside runtime fixtures, MSW, and modal owners; C7 cannot start until this output is clean.

- [ ] **Step 1: Run the three-mode settlement experiment**

For one representative story in each cluster, run:

```text
1. the story alone
2. its complete story file
3. the file sequentially with the adjacent warning-producing file
```

Record whether the warning appears in mode 1, 2, or 3. A mode-1 warning is local settlement; mode 2 supports story-to-story lifecycle contamination; mode 3 supports project-level leakage/interleaving. Do not design a global cleanup around cross-story leakage unless modes 2 or 3 prove it.

- [ ] **Step 2: Repair RequestForQuote and AcceptQuote descendants by first owner**

Keep DatePicker calendar semantics in Child B. For RequestForQuote, trace the story's post-interaction settlement through `InstrumentAndRequest`, react-datepicker, `HidableField`, `NumberFormatBase`, `DatePicker`, and `CustomDatePicker`. For AcceptQuote, run Report Recipient, Payment Details, Delivery And Return, and Quotation Summary singly and sequentially, then trace each successful MSW response through the component that schedules the state update. Await a named stable UI state after the triggering interaction; change a production component only when cancellation/lifecycle evidence proves it owns post-unmount work.

- [ ] **Step 3: Repair lookup, route, and editor clusters independently**

Use the smallest direct reproduction for each:

- `CertificateNumberLookup`: direct `applicationAndInstrument` before `summaryAndSubmit`;
- `ServicesWeOffer`: loaded/empty/error state reached after its mount effect;
- `PreConditions`/`Layout`: protected-content state and layout completion;
- MeasurementReport: report-list data state separately from Breadcrumb/React Aria collection state;
- `RouteAccessibleNavigation`: the actual live-region announcement, not component presence;
- Slate: direct editor story before the consuming app-messages story.

Each repair receives its own focused RED/GREEN evidence and commit when it changes a different owner. Do not patch higher-level routes when a shared child owns the update.

- [ ] **Step 4: Verify every remaining owner together**

```powershell
npm run test:storybook -- `
  ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx `
  ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx `
  ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx `
  ClientApp/src/routes/ta/summaryAndSubmit.stories.tsx `
  ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx `
  ClientApp/src/routes/preConditions/PreConditions.stories.tsx `
  ClientApp/src/routes/measurementReport/indexList.stories.tsx `
  ClientApp/src/components/Utilities/routeAccessibleNavigation.stories.tsx `
  ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx
```

Expected: every C3 census row is closed, no new warning signature appears, and story behaviour remains green.

Use focused commits matching the proven owner:

```powershell
git commit -m "test(storybook): settle request for quote interactions"
git commit -m "test(storybook): settle certificate lookup interactions"
git commit -m "test(storybook): settle route async interactions"
git commit -m "test(storybook): settle slate editor interactions"
```

Run `git diff --name-only` before each commit and stage only the files named by that owner's C1 census rows. Omit a commit when its owner required no change.

---

### Task C4: Repair Storybook Runtime, Telemetry, and Log Policy

**Files:**

- Modify: `.storybook/preview-setup.ts`
- Modify: `vitest.storybook.setup.ts`
- Modify: `.github/workflows/pr.yml`
- Create: `.storybook/msw-policy.ts`
- Create: `tests/unit/config/storybookRuntimePolicy.test.ts`
- Verify only: `ClientApp/src/env.ts`

**Interfaces:**

- Produces: identical non-secret runtime values in interactive Storybook and Vitest Browser Mode; explicit automated telemetry policy; concise normal MSW output with opt-in detail.
- Produces for C5:

```ts
export function isStorybookMswDebugEnabled(search: string): boolean;
```

- [ ] **Step 1: Write the RED runtime-policy test**

Assert both setup files assign non-empty values for:

```text
REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY
REACT_APP_APPINSIGHTS_CONN_STRING
REACT_APP_GA_TRACKINGID
```

Assert the PR Storybook job declares `STORYBOOK_DISABLE_TELEMETRY: '1'`, and `.storybook/preview-setup.ts` does not initialize MSW with unconditional verbose request logging.

- [ ] **Step 2: Supply deterministic test-only runtime values in both entry paths**

Use the existing `globalThis` runtime contract before story imports. Set the instrumentation key to `storybook-test-instrumentation-key`, retain the non-production connection string, and set GA to `storybook-test-ga-id` in both files. Do not modify `ClientApp/src/env.ts` or use real secrets.

- [ ] **Step 3: Make automated telemetry and MSW verbosity explicit**

Set `STORYBOOK_DISABLE_TELEMETRY: '1'` on automated Storybook build/test jobs. Implement `isStorybookMswDebugEnabled(search)` with `new URLSearchParams(search).get('msw-debug') === 'true'` and configure MSW as `quiet: !isStorybookMswDebugEnabled(globalThis.location.search)`. This debug switch must not filter `console.warn`, `console.error`, unhandled API requests, or test failures.

- [ ] **Step 4: Verify and commit runtime policy**

```powershell
npm run test:unit -- tests/unit/config/storybookRuntimePolicy.test.ts
npm run test:storybook -- ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx
```

Expected: zero missing-required-runtime message, telemetry is explicitly disabled in automated execution, and detailed MSW object dumps are absent unless the debug query is present.

```powershell
git add `
  .storybook/preview-setup.ts `
  .storybook/msw-policy.ts `
  vitest.storybook.setup.ts `
  .github/workflows/pr.yml `
  tests/unit/config/storybookRuntimePolicy.test.ts
git commit -m "test(storybook): define runtime and logging policy"
```

---

### Task C5: Enforce Endpoint-Specific Storybook MSW Contracts

**Files:**

- Modify: `.storybook/msw-handlers.ts`
- Modify: `.storybook/preview-setup.ts`
- Modify: `.storybook/msw-policy.ts`
- Modify: `ClientApp/src/components/Utilities/ViewMeasurementReport.stories.tsx`
- Modify: `ClientApp/src/routes/measurementReport/indexList.stories.tsx`
- Create: `tests/unit/config/storybookMswPolicy.test.ts`
- Inspect only: `ClientApp/src/api/web-api-client.ts`

**Interfaces:**

- `GET /api/dashboard/get-quote-report-pdf?QuoteRequestID=...&ReturnFile=false` produces a `DownloadedFileResponse` with `fileSizeBytes`.
- The same endpoint with `ReturnFile=true` produces `filename`, `mimeType`, and `fileData`.
- Dashboard list/report-list endpoints retain their own paginated DTOs.
- Unhandled same-origin `/api/**` requests fail; common assets and intentionally external requests bypass.
- Produces:

```ts
export const onUnhandledStorybookRequest: UnhandledRequestCallback;
```

- [ ] **Step 1: Preserve the incompatible-handler RED proof**

Run the ViewMeasurementReport story and record that `/api/dashboard/get-quote-report-pdf` matches `/api/dashboard/*` and receives `{ items, currentPage, totalPages, totalCount }`. Compare that object with generated `DownloadedFileResponse` fields. This is a confirmed mock-contract mismatch even if the story's current assertion passes.

- [ ] **Step 2: Write MSW policy RED tests**

Assert no `/api/dashboard/*` handler remains. Use `setupServer(...mswHandlers)` in the unit test to send requests for PDF metadata, PDF download, and dashboard/report lists; assert the exact endpoint-specific response fields and query-dependent branches. Invoke `onUnhandledStorybookRequest` with a same-origin API request and spies for `print.error`/`print.warning`; require one error and zero warning. Invoke it with a font/static-asset request and require neither printer. The callback is the explicit bypass for non-API assets, not a bypass for `/api/**`.

- [ ] **Step 3: Replace the wildcard with endpoint-specific handlers**

Return fixture values matching the generated contract. Export `onUnhandledStorybookRequest` from `.storybook/msw-policy.ts` and pass it to `initialize({ onUnhandledRequest: onUnhandledStorybookRequest, ... })`. Update the ViewMeasurementReport story to await the loaded file-size state, click the button, and verify its callbacks after the download response. Update the instrument-report shell story to await its endpoint-specific loaded/empty state instead of only asserting static shell content.

- [ ] **Step 4: Verify API fidelity and commit**

```powershell
npm run test:unit -- tests/unit/config/storybookMswPolicy.test.ts
npm run test:storybook -- `
  ClientApp/src/components/Utilities/ViewMeasurementReport.stories.tsx `
  ClientApp/src/routes/measurementReport/indexList.stories.tsx `
  ClientApp/src/components/RequestList/Dashboard.stories.tsx
```

Expected: every same-origin API request has one compatible handler; no broad dashboard wildcard or unhandled API bypass remains; story assertions depend on the correct DTO branch.

```powershell
git add `
  .storybook/msw-handlers.ts `
  .storybook/preview-setup.ts `
  .storybook/msw-policy.ts `
  ClientApp/src/components/Utilities/ViewMeasurementReport.stories.tsx `
  ClientApp/src/routes/measurementReport/indexList.stories.tsx `
  tests/unit/config/storybookMswPolicy.test.ts
git commit -m "test(storybook): enforce api mock contracts"
```

### Task C6: Diagnose and Repair the Ten Modal Browser Failures

**Files:**

- Modify: `ClientApp/src/components/Footer/Footer.stories.tsx`
- Modify: `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`
- Modify: `ClientApp/src/components/modals/Modals.stories.tsx`
- Modify: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`
- Conditional modify: `ClientApp/src/components/modals/ContentModal/index.tsx`
- Conditional modify: owning modal/style/provider files only with production-defect evidence
- Evidence: `reports/stabilisation/modal-diagnostics.md`
- Evidence: `reports/stabilisation/modal-repetitions.md`

- [ ] **Step 1: Use `ContentModal > Open With Content` as the minimal RED**

Before its failing visibility assertion, capture matching dialog count, outer HTML, parent chain, portal location, bounding rectangle, computed `display`, `visibility`, `opacity`, `pointer-events`, active transitions/animations, and ancestor `hidden`, `inert`, and `aria-hidden`. Capture once immediately and once after a condition proving transition completion. Final PR runs `32643895854` and `32644658694` each failed exactly 10 visibility assertions: 3 Footer, 2 RouteLeavingGuard, 4 Modals, and 1 ContentModal. Record local/browser differences without treating a local pass as repair evidence.

- [ ] **Step 2: Falsify duplicate and stale-node hypotheses**

Footer mounts three `ContentModal` instances while the current component uses the static `modal-content` title ID. Count matching dialogs and repeated title/label IDs before and after opening each Footer modal. Also inspect shared modal stories for duplicate role/name matches or stale portal nodes.

Acceptance:

```text
duplicate active modal label IDs = 0
matching active dialog for expected accessible name = 1
```

If duplicates exist, repair ID ownership separately from transition timing and add a regression assertion.

- [ ] **Step 3: Verify the `Confirmation Closed` story contract**

Record its initial args/state, interaction, intended intermediate state, and final expected state. If the play function intentionally opens the initially closed modal, retain the visibility assertion. If the play function contradicts the story contract, repair the story rather than applying a generic modal wait.

- [ ] **Step 4: Apply only the proven modal fix**

If transition timing is proven, use a bounded semantic `waitFor` for visibility/transition completion and retain `toBeVisible`, role/name/content, and click assertions. If the dialog never becomes visible, repair the CSS/provider/portal/component defect. Do not substitute `toBeInTheDocument`, disable animations globally, sleep, or inflate timeouts.

- [ ] **Step 5: Stress the focused modal set and commit**

Run the four story files together ten times with the configured browser and worker settings, recording run number, duration, seed when available, environment, and outcome in `reports/stabilisation/modal-repetitions.md`. Then run the full Storybook suite once. All 10 final-CI assertions and every other story in those files must pass on every focused repetition.

Commit duplicate-ID production repair separately from story synchronization when both are required.

```powershell
git add `
  ClientApp/src/components/Footer/Footer.stories.tsx `
  ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx `
  ClientApp/src/components/modals/Modals.stories.tsx `
  ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx
git commit -m "fix(storybook): stabilise modal visibility lifecycle"
```

If `ClientApp/src/components/modals/ContentModal/index.tsx` changes to repair duplicate IDs, stage and commit it with its new focused unit/story regression before the synchronization-only commit.

---

### Task C7: Install the Global Unexpected-Console Ratchet

Start only when every C1 census row owned by C2-C6 is clean.

**Files:**

- Modify: `vitest.setup.ts`
- Modify: `vitest.storybook.setup.ts`
- Modify: intentional error-path tests with exact expected messages
- Verify: `tests/helpers/unexpectedConsoleGuard.ts`
- Verify: `tests/unit/helpers/unexpectedConsoleGuard.test.ts`

- [ ] **Step 1: Prove the pre-install zero baseline**

Run full unit and Storybook once, capture the logs, and search for every C1 signature. If any known warning/error remains, reopen its owner and do not install the guard.

- [ ] **Step 2: Install `installUnexpectedConsoleGuard()` globally**

Install it in both setup files. Replace intentional console spies with `expectConsoleMessage(level, pattern, count, action)` scoped to the exact error-path action. Do not create file-level disablement or a repository-wide allowlist.

- [ ] **Step 3: Run full warning and Storybook acceptance**

```powershell
npm run test:unit
npm run test:storybook
```

Then run the repository-required `my-storybook-mcp-server` `run-story-tests` tool. Expected: all commands and MCP story tests pass; the guard reports no unconsumed message; intentional errors are exact and local; the runtime budget remains within Child Plan C's limit.

```powershell
git add vitest.setup.ts vitest.storybook.setup.ts
# Stage each intentional error-path test named by its C1 census row.
git commit -m "test: enforce unexpected console contract"
```

### Task C8: Re-baseline and Repair Current Playwright E2E

**Files:**

- Conditional modify: `playwright.config.ts`
- Conditional modify: `playwright.storybook.config.ts`
- Conditional modify: only freshly proven owning feature/step or application files
- Evidence: `reports/stabilisation/e2e-baseline.md`, traces, screenshots, and repetition ledger

- [ ] **Step 1: Re-baseline app and Storybook E2E from the current tree**

Run:

```powershell
npm run test:e2e:app
npm run test:e2e:storybook
```

Record exact scenario names, first failure phase, server readiness, request failures, console errors, trace paths, and worker count. Compare a representative failure at configured concurrency and one worker for diagnosis only.

- [ ] **Step 2: Repair current E2E owners**

Use condition-based waits and deterministic mock/server readiness. Keep configured concurrency unless evidence proves it exceeds an explicit resource contract; a concurrency policy change requires its own measured before/after result. Do not raise global timeouts or add retries as the first fix.

- [ ] **Step 3: Prove deterministic behavior and commit per owner**

Keep unrelated app-E2E and Storybook-E2E owners in separate commits. First run each repaired scenario ten consecutive times with configured concurrency, then once with one worker for diagnostic equivalence. Record command, worker count, Playwright project, duration, and result. The child acceptance gate is five consecutive clean combined runs at configured concurrency:

```powershell
npm run test:e2e
npm run test:e2e
npm run test:e2e
npm run test:e2e
npm run test:e2e
```

Do not use random retries as evidence. If the runner exposes a repeat or seed option, record it; otherwise the repetition number and immutable commit SHA are the run identity. For each repaired scenario, record the exact existing feature/scenario name and owning files before committing with `test(e2e): stabilise NAME`; replace `NAME` with that recorded repository identifier rather than inventing a generic owner. Any environment-only blocker is reported as `blocked`, never passed. The median combined E2E duration must remain within 20 minutes and no run may exceed the existing configured timeout without a separately approved resource-contract change.

**CHILD C ACCEPTED only when C1-C8 are accepted, the console ratchet remains enabled, all same-origin API mocks are contract-compatible, and no census row is deferred as generic cleanup.**

---

## Child Plan D: Dependency and Runtime Modernisation

**Outcome:** The ESLint policy, remaining deprecated Glob chain, supported Node range, and GitHub Actions runtime move to maintained versions through three independently reversible changes with explicit update ownership.

**Ships independently when:** D1 lint parity is green, D2 proves zero lockfile deprecations and MDX compatibility, and D3 proves the Node 24 lower bound plus Node 24 primary workflows with immutable action pins.

### Task D1: Migrate the ESLint Cohort to Native Flat Config

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `.eslintrc.cjs`
- Delete: `.eslintignore`
- Create: `eslint.config.mjs`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Create: `tests/unit/config/eslintPolicy.test.ts` — **closed 2026-08-27.** D1 shipped at `7d30a0b` without this file (audit finding **B1**); it now exists with 27 assertions and G1A Step 2's acceptance command passes. It resolves the effective config through ESLint's `calculateConfigForFile` rather than reading `eslint.config.mjs` as text, so a preset upgrade that silently changes a severity fails it. Writing it immediately falsified two of this task's Step 2 claims — see the struck-through entries below.
- Modify: `ClientApp/src/routes/ta/supportingDocuments.tsx`
- Modify: `ClientApp/src/components/forms/WizardForm/NextStepButton.tsx`
- Modify: `ClientApp/src/components/SlateEditor/SlateEditor.tsx`
- Modify: `docs/CONVENTIONS.md`

**Validated version cohort:**

| Package                       |    Target |
| ----------------------------- | --------: |
| `eslint`                      |  `10.9.0` |
| `@eslint/js`                  |  `10.0.1` |
| `typescript-eslint`           |  `8.67.0` |
| `@eslint-react/eslint-plugin` |  `5.18.6` |
| `eslint-plugin-react-hooks`   |   `7.1.1` |
| `@stylistic/eslint-plugin`    |  `5.10.0` |
| `globals`                     | `17.11.0` |

- [ ] **Step 1: Write lint-cohort dependency tests before mutation**

Extend `tests/unit/config/dependencySecurity.test.ts` to assert the exact supported lint cohort. Assert that `eslint-plugin-react`, ESLint 8, Rimraf 3, `inflight`, Glob 7, and both Humanwhocodes packages are absent after migration. Record the three `remark-cli`/`unified-engine`-owned Glob 10 entries as the only allowed remaining publisher deprecations for D1; Task D2 removes that explicit transitional assertion.

- [ ] **Step 2: Write the ESLint policy characterization test**

Use the ESLint Node API to snapshot the effective pre-migration severities and fixture behavior. The replacement policy must include supported direct equivalents, including:

- ~~`@eslint-react/jsx-no-duplicate-props`~~ — **does not exist.** Measured 2026-08-27 against the installed `@eslint-react/eslint-plugin@5.18.6`: its 140 exported rules contain no `duplicate-props` rule. TypeScript covers it (TS17001, "JSX elements cannot have multiple attributes with the same name").
- ~~`@eslint-react/no-string-refs`~~ — **does not exist.** Same measurement: no string-ref rule is exported. TypeScript covers it — a string is not assignable to the `ref` prop's type.
- The documented partial `react/no-deprecated` replacement set. Fixture-probe lifecycle, legacy DOM render/hydrate/find-DOM-node, create-ref, and forward-ref checks under this repository's React 18 setting. Retain only rules whose behavior matches the outgoing policy; in particular, do not forbid legal React 18 `forwardRef` usage merely because React 19 deprecates it.

Document `react/no-is-mounted`, `react/no-unescaped-entities`, and `react/require-render-return` as unsupported compatibility deltas. Do not create speculative custom lint rules. Keep TypeScript/ESLint core ownership for JSX references and prop typing.

**Resolved on 2026-08-25 (implemented in `7d30a0b`).** Two rule-ownership decisions were measured rather than assumed:

- `eslint-plugin-react-hooks@7` ships **16 rules** in `recommended`, not the two the outgoing v4 policy applied. The additions are React Compiler checks (`purity`, `immutability`, `refs`, `set-state-in-effect`, `preserve-manual-memoization`, `static-components`, `use-memo`, and others). Enabling them adds **36 errors and 56 warnings**. Only `rules-of-hooks` and `exhaustive-deps` are carried over, both at `error`. Adopting the React Compiler set is a separate policy decision, not part of this migration.
- `@eslint-react` ships its own copies of the hook rules, so `set-state-in-effect`, `exhaustive-deps` and `rules-of-hooks` each report twice from two owners. `eslint-plugin-react-hooks` is the single owner; `@eslint-react`'s duplicates are disabled. Note that `@eslint-react.configs['disable-conflict-eslint-plugin-react-hooks']` disables the **react-hooks** rules, the opposite of what its name suggests — it was not used.

`@eslint-react/set-state-in-effect` reports **56 sites**. Clearing them means moving `setState` out of effects, which is a behavioural refactor and the direct cause of the `act(...)` warnings Task C3 owns. Those 56 sites transfer to Child Plan C as an input; C3 should re-enable this rule once its owners are settled, rather than treating the two signals as unrelated.

Four `@eslint-react/purity` findings (`crypto.randomUUID()` and `new Date()` during render in `CustomDatePicker.tsx` and `instrumentAndRequest.tsx`) are current-date semantics inside Child Plan B's protected regression surface. They are disabled inline with a pointer to B rather than hoisted, because B's DatePicker characterization must not move while B is deferred.

Deliberate convention deviations, each recorded in `eslint.config.mjs` with its rationale: `naming-convention-ref-name` (would rename the array `itemRefs` to `itemRef` across 13 files), `naming-convention-context-name` (`AccountStateCtx` cannot become `AccountStateContext` — that identifier is already the exported type in the same module), and the `no-children-only` / `no-children-for-each` / `no-clone-element` API advisories.

ESLint 10 also promotes `preserve-caught-error`, `no-useless-assignment` and `no-constant-binary-expression` into `js.configs.recommended`; all three were absent from the ESLint 8 policy. They are enabled at `error` and their 13 findings repaired in the same commit.

- [ ] **Step 3: Mutate only the lint dependency graph**

Re-query the validated lint cohort. If a version changed, capture its engines, peer ranges, migration notes, and fixture result in `reports/deprecations/version-drift.md`; adopt it only when the recorded matrix stays compatible with Node 24, TypeScript, React 18, and every outgoing lint fixture. Replace the ESLint 8 parser/plugin declarations, remove `eslint-plugin-react`, add the approved exact lint cohort, and regenerate the lock with npm 11.17.0. Do not add the Glob override in this task.

Expected: the ESLint-owned Humanwhocodes, Rimraf 3, Glob 7, and `inflight` chain disappears. Only the three already recorded Glob 10 deprecations may remain.

- [ ] **Step 4: Replace legacy lint configuration with native flat config**

Port the current code-only boundaries, generated/vendor ignores, TypeScript rules, React compatibility rules, the two Hooks rules, Storybook rules, globals, and Footer-only stylistic rule. Do not use `FlatCompat`, `@eslint/eslintrc`, or a broad replacement preset.

Delete `.eslintrc.cjs` and `.eslintignore` in the same change. Remove only the three already-proven obsolete React disable comments.

- [ ] **Step 5: Verify lint and install compatibility**

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts tests/unit/config/eslintPolicy.test.ts
npm run lint
npm ls --all
```

Run a clean npm 11.17.0 install in a disposable copy/worktree and capture stderr. Expected: no ESLint-owned publisher deprecation warning, no peer error, exact fixture parity for every supported mapping, explicit documentation for the three unsupported React rules, and no generated file entering lint scope.

- [ ] **Step 6: Commit the lint migration as one unit**

```powershell
git add package.json package-lock.json .eslintrc.cjs .eslintignore eslint.config.mjs tests/unit/config/dependencySecurity.test.ts tests/unit/config/eslintPolicy.test.ts ClientApp/src/routes/ta/supportingDocuments.tsx ClientApp/src/components/forms/WizardForm/NextStepButton.tsx ClientApp/src/components/SlateEditor/SlateEditor.tsx docs/CONVENTIONS.md
git commit -m "chore: migrate lint policy to eslint 10"
```

### Task D2: Remove the Remaining Glob Deprecations

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Modify: `docs/CONVENTIONS.md`

- [ ] **Step 1: Make zero publisher deprecations the failing policy test**

Remove D1's transitional Glob 10 allowance. Make the dependency-security test reject every lockfile package with a non-empty `deprecated` field and assert that Glob 10 is absent while the three exact owner-scoped `glob@13.0.6` overrides are present.

- [ ] **Step 2: Prove the override's blast radius before mutation**

Capture `npm explain glob --all` and identify the three exact `remark-cli`/`unified-engine` callers. Reject the override if any other caller would cross a major boundary. Record each caller, resolved before/after version, supported API use, and rollback command in `reports/deprecations/glob-override.md`.

- [ ] **Step 3: Add the scoped override and regenerate the lock**

Add only these owner-scoped overrides, regenerate `package-lock.json` with npm 11.17.0, and rerun `npm explain glob --all`:

```json
{
  "overrides": {
    "unified-engine": {
      "glob": "13.0.6"
    },
    "@npmcli/map-workspaces": {
      "glob": "13.0.6"
    },
    "@npmcli/package-json": {
      "glob": "13.0.6"
    }
  }
}
```

Merge these keys with any existing overrides rather than replacing unrelated policy. Never hand-edit the lock or force any other Glob consumer across a major boundary.

- [ ] **Step 4: Verify MDX behavior and clean installation**

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
npm run lint:mdx
npm ls --all
```

Run `npm ci` in a disposable clean worktree with npm 11.17.0 and capture stderr. Expected: zero publisher deprecation warnings, no invalid/extraneous/peer-conflicted node, and unchanged MDX fixture behavior. If an observed caller breaks, revert only D2 and retain the visible upstream blocker.

- [ ] **Step 5: Record override ownership and commit**

Document that the Dependency DRI reviews the override quarterly and whenever Dependabot updates `remark-cli`, `unified-engine`, or `glob`. The removal trigger is all owning packages resolving a maintained non-deprecated Glob without the override; the dependency-security test must then reject the now-unnecessary override.

```powershell
git add package.json package-lock.json tests/unit/config/dependencySecurity.test.ts docs/CONVENTIONS.md
git commit -m "chore: remove remaining glob deprecations"
```

### Task D3: Harden the Node and GitHub Actions Runtime Contracts

**Files:**

- Modify: `package.json`
- Modify: `.github/workflows/pr.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/dependabot.yml`
- Modify: `tests/unit/config/workflowPolicy.test.ts`
- Modify: `docs/CONVENTIONS.md`

**Runtime contracts:**

- Predecessor application floor: Node 20.19.0, verified green in PR #1 after the 20.18.1 correction.
- Application/tooling Node range: **`>=24.0.0`** (repository owner's decision, 2026-08-25; supersedes the earlier `^22.13.0 || >=24.0.0` proposal).
- Lower-bound CI: exact Node 24.0.0 with strict engines and peers. The former `lower-bound-node22` job becomes `lower-bound-node24`; the `dependency-security-node20` job is retired with the Node 20 floor.
- Primary CI/release: Node 24.
- Actions runtime: Node 24 through the reviewed checkout/setup-node v7 and upload-artifact v6 majors, independent of `setup-node`'s application version.
- Reviewed immutable action pins:
  - `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7`
  - `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7`
  - `actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f # v6.0.0`

- [ ] **Step 1: Raise and test the application runtime floor**

Set both `engines.node` and `devEngines.runtime.version` to `>=24.0.0`; keep `devEngines.runtime.onFail` as `error` and `packageManager` on npm 11.17.0. The floor deliberately excludes EOL Node 20, Node 22, and odd Node 23.

This deliberately supersedes, rather than disputes, the predecessor's correct 20.x floor. Preserve the exact Rolldown binding guard while revalidating it on Node 24; removing it requires a clean Linux `npm ci` proof.

**Landed early, in `7d30a0b` (Task D1), not here.** `@eslint-react/eslint-plugin@5.18.6` declares `engines.node >= 22.0.0`, so the D1 cohort could not be installed consistently against the previous `>=20.19.0` floor — the `dependency-security-node20` job would have installed a dependency it does not satisfy. The floor was therefore raised as part of D1 so no commit leaves a known-failing job behind. D3 still owns the workflow-side changes: retiring `dependency-security-node20`, adding `lower-bound-node24`, and the action pins.

**Local runtime note.** `devEngines.runtime.onFail: error` makes npm refuse to run below the floor. On the maintainer's Windows host, `C:\Program Files\nodejs` holds a standalone Node 22.22.2 that shadows nvm's `C:\nvm4w\nodejs` symlink in inherited terminal environments. Machine and User PATH are already ordered correctly, so a freshly launched shell resolves Node 24.15.0; only long-lived sessions started before the switch need restarting.

- [ ] **Step 2: Upgrade action runtimes independently**

Replace every checkout/setup-node v4 reference in both workflows with the immutable v7 pins above and use the reviewed upload-artifact v6 pin for all new evidence uploads. Retain the existing explicit `cache: 'npm'` input so setup-node v7's package-manager auto-detection does not silently change cache ownership. Confirm hosted runners satisfy runner 2.327.1+. If any self-hosted runner is later introduced, its version becomes an explicit precondition.

- [ ] **Step 3: Make CI ownership explicit**

The PR workflow must expose these independently named required statuses:

| Job                     | Node    | Exact responsibility                                                                                           | Evidence retained for 14 days                                          |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `static-quality-node24` | 24      | Clean install, type-check, code lint, and MDX lint                                                             | Install and lint logs                                                  |
| `vitest-unit`           | 24      | `npm run test:ci:unit`                                                                                         | Unit JUnit and unit coverage                                           |
| `vitest-storybook`      | 24      | Chromium install and `npm run test:ci:storybook`                                                               | Storybook JUnit                                                        |
| `vitest-quality`        | 24      | `npm run test:ci:quality`                                                                                      | Quality JUnit                                                          |
| `build-node24`          | 24      | App build and static Storybook build                                                                           | Build logs                                                             |
| `date-timezone`         | 24      | Focused date suite in UTC, Australia/Sydney, and America/Los_Angeles with matrix `fail-fast: false`            | Per-zone JUnit                                                         |
| `e2e-node24`            | 24      | Chromium install and `npm run test:e2e` with the repository's configured workers and timeouts                  | Playwright HTML report, traces, screenshots, and JUnit when configured |
| `lower-bound-node24`    | 24.0.0  | `npm ci --strict-peer-deps`, dependency-security tests, lint, type-check, and app build without browser suites | Install and policy logs                                                |

Task A1's Vitest matrix implements the three `vitest-*` statuses; D3 must retain it rather than collapsing back to `npm run test:ci`. Every artifact step uses `if: always()` and `if-no-files-found: error`; every job has a timeout matching the budgets in this umbrella. If E2E cannot provision its declared web servers and fixtures on `ubuntu-latest`, D3 is `blocked` until that contract is repaired; “as permitted by workflow architecture” is not an acceptance state.

**Landed 2026-08-27 in `983314e`, ahead of its declared C4 predecessor.** The dependency graph
says D3 waits for A1 *and* C4; C4 has not started, so C4 now **amends** the D3 workflow rather
than the other way round. Two consequences C4 must plan for:

- `tests/unit/config/workflowPolicy.test.ts` asserts **counting invariants**: the number of
  `if: always()` occurrences must equal the `upload-artifact` count, and likewise for
  `if-no-files-found: error` and `retention-days: 14`. A telemetry step carrying `if: always()`
  that is not an upload will break those assertions for a legitimate reason. Update the
  invariant with the step; do not delete the assertion.
- Workflow-level `defaults.run.shell: bash` is load-bearing, not cosmetic. GitHub's implicit
  runner shell is `bash -e`, which has no `pipefail`, so any step piping into `tee` would
  report `tee`'s exit code instead of the command's. Several jobs rely on it for log evidence.

`date-timezone` ships **expected-red on its UTC leg** while Child Plan B is deferred, and
`vitest-unit` carries the same three failures because hosted runners are UTC. See audit
findings **T1** and **T2**: neither job may be marked a required status in branch protection
until B1 lands, and the merge decision in T1 is a precondition for releasing the tranche.

The Storybook and E2E jobs must retain explicit Chromium installation. Commit `cb5fdaa` proved that dependency installation does not provision Playwright browser binaries on a fresh runner; moving the command between jobs is allowed, deleting it is not.

The release workflow uses Node 24, the same immutable actions, and the same static, Vitest, build, and E2E commands before release-owned steps. Do not infer application Node from the action runtime.

Extend `tests/unit/config/workflowPolicy.test.ts` to assert the eight PR job identifiers, exact action SHAs, three timezone values, Node 24 floor, 14-day artifact policy, and absence of floating `actions/*@v*`, Node 20, `continue-on-error`, and a monolithic workflow call to `npm run test:ci`.

- [ ] **Step 4: Make update ownership executable**

Retain the existing weekly GitHub Actions Dependabot entry and add an `eslint-family` npm group covering `eslint`, `@eslint/js`, `typescript-eslint`, `@eslint-react/*`, `eslint-plugin-react-hooks`, `@stylistic/*`, and `globals`. Keep npm major upgrades review-only. The Dependency DRI reviews weekly action-pin PRs and the quarterly Glob override removal condition; immutable pins are updated only after the lower-bound and Node 24 job graph passes.

- [ ] **Step 5: Validate workflow syntax and commit**

```powershell
npm run test:unit -- tests/unit/config/workflowPolicy.test.ts
npx prettier --check .github/workflows/pr.yml .github/workflows/release.yml .github/dependabot.yml
rg -n "actions/(checkout|setup-node)@v4|20\.19|node20|Node 20" package.json .github/workflows docs/CONVENTIONS.md
node -e "const p=require('./package.json');const e='>=24.0.0';if(p.engines?.node!==e||p.devEngines?.runtime?.version!==e||p.devEngines?.runtime?.onFail!=='error')throw new Error('Node contract mismatch')"
git diff --check -- package.json .github/workflows/pr.yml .github/workflows/release.yml .github/dependabot.yml docs/CONVENTIONS.md
git add package.json .github/workflows/pr.yml .github/workflows/release.yml .github/dependabot.yml tests/unit/config/workflowPolicy.test.ts docs/CONVENTIONS.md
git commit -m "ci: move workflows to maintained node runtimes"
```

Expected: no v4 action or Node 20 runtime reference remains in active configuration; the eight named PR statuses are present; all evidence uploads are immutable, unconditional on prior step success, strict on missing files, and retained for 14 days; historical plan prose may retain its original record.

---

## Gate G1A: Integrate the Releasable A/C/D Tranche

**Files:**

- Verify: every path in the Implementation File Map
- Verify: `reports/stabilisation/delivery-ledger.md` and accepted G0B-A/G0B-C/G0B-D/Release Approver evidence
- Update: `docs/TESTING.md`
- Update: `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- Evidence only: `reports/stabilisation/**`, `reports/deprecations/**`

- [ ] **Step 1: Prove clean dependency installation**

Using npm 11.17.0 in a disposable clean worktree/copy, run `npm ci`, capture stdout/stderr, and parse the lockfile for `deprecated` fields. Run `npm ls --all` and `npm audit --json`.

Expected: zero install deprecation warnings, zero invalid/extraneous/peer-conflicted nodes, and zero known vulnerabilities for the captured audit database.

- [ ] **Step 2: Run static and focused policy gates**

```powershell
npm run type-check
npm run lint
npm run lint:mdx
npm run test:unit -- `
  tests/unit/config/vitestTopology.test.ts `
  tests/unit/config/coverageRemapPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/eslintPolicy.test.ts `
  tests/unit/config/workflowPolicy.test.ts `
  tests/unit/config/storybookRuntimePolicy.test.ts `
  tests/unit/config/storybookMswPolicy.test.ts
```

Expected: zero diagnostics and all A/C/D-focused tests pass. B-focused tests are intentionally excluded from G1A, and files that B1 would create may not exist while it is deferred; do not add placeholders or inferred implementations to satisfy this command.

- [ ] **Step 3: Run every partition without diagnostic short-circuiting**

```powershell
npm run type-check
npm run test:ci:unit
npm run test:ci:storybook
npm run test:ci:quality
```

Run all four commands even if an earlier command fails and record each exit code separately in the delivery ledger. Expected: type-check, Storybook Browser Mode, quality regression, report generation, and every A/C/D-owned assertion pass; all three JUnit files are non-empty and parseable; there is no unexpected console output or coverage temporary-file error. If the unit partition still contains B's externally deferred assertions, only the exact characterized timezone failures may remain and they must stay visible as B failures. Any new, changed, missing, skipped, or A/C/D-owned failure blocks G1A.

Search retained logs for:

```text
Failed to parse
PARSE_ERROR
coverage/.tmp
Excluding it from coverage
not wrapped in act
If you do not provide a visible label
Missing required runtime variable
document is not defined
Cannot find package '@/
Playwright Test did not expect
[MSW] Warning: intercepted a request without a matching request handler
```

Expected: zero unexpected A/C/D match. The exact B timezone signatures, if reproduced, are recorded separately and are never counted as green. Also verify `.storybook/msw-handlers.ts` contains no `/api/dashboard/*` handler and the warning census has no open A/C/D row. Do not run or claim the all-green `npm run test:ci` aggregate in G1A while B remains externally deferred; that proof belongs to G1B.

- [ ] **Step 4: Run builds and E2E once**

```powershell
npm run build
npm run build-storybook
npm run test:e2e
```

Then run the repository-required `my-storybook-mcp-server` `run-story-tests` tool. Expected: all commands and MCP story tests exit cleanly. A missing browser, Storybook MCP connection, backend fixture, or external environment is a reported blocker, not permission to mark the plan complete.

- [ ] **Step 5: Preserve the externally deferred B evidence**

Link G0A's unchanged date-wrapper evidence and B0's `EXTERNALLY DEFERRED` status from the delivery ledger. Do not rerun a proposed B1 acceptance matrix, modify date production code, normalize expected values, or call the field timezone-invariant in G1A. If the Release Approver requires a fresh characterization, run the existing focused wrapper suite in UTC, Australia/Sydney, and America/Los_Angeles and record every result without changing its assertions.

- [ ] **Step 6: Reconcile docs and the final diff**

Update testing and backlog documents with current commands, test ownership, coverage/remap status, warning status, Storybook runtime/telemetry policy, endpoint-specific MSW ownership, and closed/open E2E items. Then run:

```powershell
git diff --check
git status --short
$baselineCommit = (Get-Content reports/stabilisation/predecessor-head.txt).Trim()
git diff --name-status "$baselineCommit..HEAD"
```

Expected: generated/vendor/output files are absent; `public/mockServiceWorker.js` remains untracked/ignored rather than committed; all pre-existing user changes are either intentionally committed by their owner or preserved.

- [ ] **Step 7: Reconcile child-plan status**

The Delivery DRI verifies that A3, C8, and D3 are each marked `accepted`, their prerequisite tasks are accepted, their commit SHAs are recorded, and no acceptance evidence came from a different SHA. Child Plan B must remain explicitly `EXTERNALLY DEFERRED` with B0/B1 excluded from the release rather than marked passed. No `blocked` or `rework` row may remain for A, C, or D. Record the reduced scope and do not mark this umbrella complete.

- [ ] **Step 8: Obtain normal peer review**

Reviewers must receive the just-in-time owner ledger, dependency graph, effort/budget deviations, externally deferred B evidence, warning inventory, console-ratchet evidence, Storybook runtime/telemetry policy, endpoint-specific MSW contract fixtures, unhandled-request proof, modal computed-style/duplicate-ID/story-contract evidence, E2E repetition ledger, clean-install logs, dependency trees, coverage/remap reports, JUnit files, action-pin provenance, artifact links, and CI links. G1A is releasable only through the repository's normal protected-branch approval path; if that path cannot accept the visible B failure, the tranche remains technically ready but unmerged. G1A never marks the umbrella complete.

---

## Gate G1B: Close the Full A/B/C/D Portfolio

**Entry:** G1A evidence is current, G0B-B is accepted, B0 has authoritative signed evidence, and B1 is accepted on the same immutable SHA as A3, C8, and D3.

- [ ] **Step 1: Prove the date contract and timezone matrix**

Run `tests/unit/utils/dateOnly.test.ts`, `tests/unit/components/inputs/datePickerWrapper.test.tsx`, `tests/unit/routes/requestForQuote/props.test.ts`, and `tests/unit/routes/requestForQuote/validation.test.ts` once each with `TZ=UTC`, `TZ=Australia/Sydney`, and `TZ=America/Los_Angeles`. Compare calendar assertions rather than serialized wall-clock offsets.

Expected: every zone selects, stores, validates, summarizes, and saves the same calendar date; CustomDatePicker remains 6/6 and SummaryDisplay remains 11/11 without unrelated production edits.

- [ ] **Step 2: Run the complete immutable-SHA gate**

Repeat G1A Steps 1-4 with B's focused tests included, then run `npm run test:ci` once. Record every command, environment, exit code, artifact, and SHA.

Expected: clean install, type-check, 100% unit coverage, Storybook Browser Mode, quality regression, builds, E2E, MCP story tests, and the local aggregate are all green on one immutable SHA. No known failure, including the former B timezone signatures, is excluded or waived.

- [ ] **Step 3: Reconcile portfolio status and obtain release approval**

The Delivery DRI verifies A3, B1, C8, and D3 plus every prerequisite are `accepted`; the Release Approver signs the complete evidence set; documentation no longer describes B as externally deferred; and no `blocked`, `rework`, or reduced-scope row remains. Only then mark the umbrella complete.

## Rollback and Stop Conditions

- Revert a failed committed workstream with `git revert`; do not use `git reset --hard` or destructive checkout commands.
- If the backend contract is unavailable, keep Child Plan B `EXTERNALLY DEFERRED` before production edits. If authoritative evidence contradicts date-only semantics, mark B `blocked` and revise the domain model with the API Contract Approver.
- If a timezone test passes only in one zone, keep the red test and inspect the first implicit instant conversion; do not normalize expected values to the host timezone.
- If coverage-remap cleanup changes the reviewed handwritten runtime denominator or merely suppresses a parse/exclusion diagnostic, stop A2 and restore the last characterized configuration.
- If standalone unit coverage remains below 100%, keep `COVERAGE-GATE-001` open. Do not remove coverage from `test:ci`, narrow the denominator to tested files, or lower thresholds in this plan.
- If Storybook component documentation is unavailable after the C-MCP endpoint check and one client restart, do not guess React Aria or story properties. Mark C2, C3, C6, and any other UI/story mutation `blocked`, keep Child Plan C open, and continue only independent non-UI tasks.
- If a shared-input warning can only be removed with a hidden/generic accessible name, stop C2 and revisit the documented visible-label contract.
- If any C3 warning appears only in file/sequential mode, preserve that evidence and diagnose lifecycle isolation before patching the component named in interleaved output.
- If non-empty Storybook runtime fixtures still emit missing-variable errors, trace module import order in both setup entry paths; do not weaken `ClientApp/src/env.ts`.
- If an endpoint-specific Storybook handler cannot satisfy the generated response contract, mark C5 blocked and obtain backend/OpenAPI evidence; do not restore the broad wildcard or bypass same-origin API failures.
- If the console ratchet is installed while any known warning owner remains open, revert only the C7 installation and continue focused repair.
- If a modal never becomes visible after its transition, treat it as a production/style defect rather than weakening the story assertion.
- If Footer contains duplicate active `modal-content` IDs, repair ID ownership separately from transition timing; do not treat the duplicate as a test-query problem.
- If `Confirmation Closed` semantics contradict its play assertions, repair the story contract before applying the shared modal fix.
- If E2E passes only with fewer workers, record resource and server-readiness measurements before changing the worker contract. Do not hide the issue with retries or global timeouts.
- If ESLint 10 installation leaves `eslint-plugin-react` invalid, remove the stale owner; do not bypass peer resolution.
- If a mapped React rule is behaviorally broader than its outgoing fixture, use the official migration map and record the compatibility delta; do not fix unrelated app behavior to satisfy a new preset.
- If Glob 13 breaks an observed caller, keep the deprecation visible and record the upstream blocker; do not claim complete remediation.
- If an active runtime cannot run Node 24, stop for support-contract approval. Do not silently retain EOL Node 20 or Node 22 or make manifest and CI disagree.
- If any required CI partition fails to start, does not emit its report, or is skipped because another partition failed, Child Plan A or D3 remains open. Do not use `continue-on-error` or a monolithic job as a substitute.
- If the unexpected-console guard conflicts with an intentional error-path test, scope that exact message through `expectConsoleMessage`; do not disable the guard for the file or suite.
- If a deterministic stress gate fails once, preserve the trace and reopen the owning task. Do not average failures away or count a retry as the same run.
- If a child plan exceeds its runtime budget by more than 25% twice, apply the performance-budget procedure before merge; do not silently increase workflow timeouts.
- If Dependabot proposes a new action major or lint-cohort major, rerun the compatibility matrix and update the immutable SHA provenance before accepting it. Never move a floating major tag directly into active workflow configuration.

## Primary References

- [Dependency vulnerability remediation execution and CI handoff](2026-08-23-dependency-vulnerability-remediation.md)
- [PR #1](https://github.com/gmtestandreview/portalsample/pull/1)
- [Final PR CI run `32644658694`](https://github.com/gmtestandreview/portalsample/actions/runs/32644658694)
- [npm optional platform dependency bug #4828](https://github.com/npm/cli/issues/4828)
- [Node.js 20.19.0 release notes](https://nodejs.org/en/blog/release/v20.19.0)
- [Playwright CI browser installation](https://playwright.dev/docs/ci)
- [Vitest 4 migration guide](https://v4.vitest.dev/guide/migration.html)
- [Vitest 4 test projects guide](https://v4.vitest.dev/guide/projects)
- [Vitest 4 coverage configuration](https://v4.vitest.dev/config/coverage)
- [Vitest nested-project support targeted to 5.0](https://github.com/vitest-dev/vitest/issues/8544)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Node.js end-of-life releases](https://nodejs.org/en/about/eol)
- [ESLint version support](https://eslint.org/version-support/)
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [typescript-eslint dependency versions](https://typescript-eslint.io/users/dependency-versions/)
- [ESLint React migration guide](https://eslint-react.xyz/docs/migrating-from-eslint-plugin-react)
- [GitHub Actions Node 20 runtime deprecation](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)
- [Dependabot configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [React Aria ComboBox](https://react-spectrum.adobe.com/react-aria/ComboBox.html)
- [React `act` testing reference](https://react.dev/reference/react/act)
- [Testing Library async methods](https://testing-library.com/docs/dom-testing-library/api-async/)
- [Storybook MCP server setup and toolsets](https://storybook.js.org/docs/ai/mcp/overview/)
- [Codex MCP configuration and client refresh](https://developers.openai.com/codex/mcp/)

## Definition of Done

G1A applies each non-RFQ row below to the accepted A/C/D-owned scope. The three RFQ/date rows and the all-green aggregate row remain visibly open while Child Plan B is deferred. G1B and umbrella completion require every row on one immutable SHA.

| Contract                                                          | Required result                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Vitest ownership                                                  | Intended test files owned exactly once unless explicitly documented                      |
| Independent CI reports                                            | Unit, Storybook, and quality JUnit files non-empty and parseable                         |
| Coverage remap                                                    | Zero parse/temp-file errors and zero unexpected exclusions                               |
| Unit coverage                                                     | 100% statements, branches, functions, and lines over the reviewed runtime denominator    |
| RFQ date contract                                                 | Signed B0 evidence and one approved semantic classification                              |
| Date timezone matrix                                              | Green in UTC, Australia/Sydney, and America/Los_Angeles                                  |
| DatePicker wrapper                                                | 6/6 green without changing independently green CustomDatePicker/SummaryDisplay behaviour |
| Missing accessible-name warnings                                  | 0                                                                                        |
| Unexpected React `act(...)` warnings                              | 0                                                                                        |
| Open warning-census rows                                          | 0                                                                                        |
| Missing Storybook runtime variables                               | 0 in interactive Storybook and Browser Mode                                              |
| Storybook MCP readiness                                           | Healthy `/mcp`, enabled `my-storybook-mcp-server`, required tools callable after refresh |
| Automated Storybook telemetry                                     | Explicitly disabled                                                                      |
| Normal MSW output                                                 | Concise; detailed object logging requires `msw-debug=true`                               |
| Storybook API contracts                                           | Endpoint-specific, generated-DTO-compatible handlers                                     |
| Unhandled same-origin Storybook API requests                      | 0; `/api/**` fails at the request owner                                                  |
| Modal visibility failures                                         | 0/10 historical residual assertions                                                      |
| Duplicate active modal label IDs                                  | 0                                                                                        |
| Weakened visibility assertions                                    | 0                                                                                        |
| Arbitrary sleeps/retries/timeout inflation                        | 0                                                                                        |
| Unexpected console output                                         | 0 under the globally installed ratchet                                                   |
| Full unit, Storybook, quality, build, and E2E gates               | Green on the same immutable SHA                                                          |
| Publisher deprecation warnings and captured audit vulnerabilities | 0                                                                                        |
| Runtime contract                                                  | Exact Node 24.0.0 lower bound and Node 24 primary CI/release green                      |

## Atomic Readiness Rubric

Each atom scores `0` when absent, `1` when present but an implementer must still make a material decision, and `2` when executable and verifiable as written. Strength in one atom does not replace a missing prerequisite; any zero in ownership, contract evidence, rollback, or acceptance commands blocks execution regardless of the numeric total.

| View      | Dimension                     | Atomic scores                                                                                                                                                  | Score |
| --------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: |
| Top-down  | Problem and outcome           | Verified problem `2`; target state `2`; user/release impact `2`; measurable exits `2`; non-goals `2`                                                           | 10/10 |
| Top-down  | Scope and atomicity           | Umbrella cohesion `2`; four bounded children `2`; reversible commits `2`; self-contained execution `2`; controlled coupling `2`                                | 10/10 |
| Top-down  | Priority and sequencing       | Dependency order `2`; critical path `2`; parallel lanes `2`; gate placement `2`; stop/escalation `2`                                                           | 10/10 |
| Top-down  | Feasibility and ownership     | Repository fit `2`; just-in-time accountable roles `2`; estimates `2`; external contract mechanism `2`; inactive roles represented without invented people `2` | 10/10 |
| Top-down  | Risk and governance           | Failure modes `2`; rollback `2`; edit boundaries `2`; evidence retention `2`; policy integrity `2`                                                             | 10/10 |
| Bottom-up | Claim validation              | Local evidence `2`; primary references `2`; false claims corrected `2`; inference labels `2`; future version drift requires revalidation `1`                   |  9/10 |
| Bottom-up | Architecture                  | Vitest ownership `2`; independent CI jobs `2`; branded date boundary `2`; generated/API mock boundaries `2`; configuration simplicity `2`                      | 10/10 |
| Bottom-up | Task executability            | Exact stable paths `2`; commands `2`; test-first cycles `2`; self-contained queues/contracts `2`; E2E owner paths intentionally wait for reproduction `1`      |  9/10 |
| Bottom-up | Verification and determinism  | Required jobs `2`; three-zone matrix `2`; coverage/MSW/console policies `2`; stress repetitions `2`; reports and budgets `2`                                   | 10/10 |
| Bottom-up | CI and dependency maintenance | Compatible cohort `2`; immutable pins `2`; lint fixtures `2`; override lifecycle `2`; Dependabot ownership `2`                                                 | 10/10 |

**A/C/D tranche readiness score: 98/100.** Top-down: 50/50. Bottom-up: 48/50. No A/C/D prerequisite scores zero. Full-portfolio and Child B readiness remain `BLOCKED` because authoritative contract evidence currently scores zero; the resume trigger prevents that missing authority from being silently delegated to the implementer. The two one-point A/C/D atoms are honest evidence/version uncertainty with explicit revalidation gates.

> **Withdrawn 2026-08-27 — do not cite this score.** The rubric is self-assessed and the
> 2026-08-27 audit falsified two of its full-mark atoms: "Task executability — exact stable
> paths `2`" and "lint fixtures `2`" cannot both hold when a file the plan names five times
> was never created inside a task marked `accepted` (finding **B1**), and "Priority and
> sequencing — dependency order `2`" cannot hold when D3 shipped ahead of its declared C4
> predecessor (finding **T3**). "Feasibility — estimates `2`" is contradicted by finding
> **T5**. A rubric scored by the plan's own author, against the plan's own prose rather than
> against the repository, measures internal consistency and nothing else. Re-score it against
> commands and evidence, or delete it; do not use 98/100 as a readiness signal.

## Self-Review

- Coverage: every confirmed or corrected claim from all six reviewed batches maps to a task, test, acceptance gate, or explicit stop condition. Coverage threshold closure cannot start from a corrupted remap baseline.
- Scope: four bounded child plans replace the previous nine-workstream execution unit; known failures remain characterization evidence until their owning task is accepted.
- Simplicity: one reusable config per Vitest leaf; no extra Storybook wrapper or shared root coverage module; one endpoint-specific Storybook handler per response contract rather than route-level patches or a dashboard wildcard.
- Type safety: the generated API client remains untouched; a branded, runtime-validated date-only value prevents malformed calendar strings at the handwritten boundary.
- Accessibility: shared label and scheduler repairs require documented properties, initial accessible-name assertions, and direct-consumer regression checks; modal label-ID ownership has its own gate.
- Storybook fidelity: both runtime setup entry paths, telemetry, normal/debug MSW logging, endpoint response shapes, and unhandled same-origin API requests have explicit owners and acceptance commands.
- Reproducibility: G0A technical evidence, just-in-time G0B roles, estimates, runtime budgets, commands, single/file/sequential warning modes, three timezone environments, action pins, independent reports, stress counts, and evidence paths are explicit.
- External authority: Child Plan B remains visibly deferred until authoritative schema/payload evidence and a named approver exist; G1A cannot relabel its known failure as green, while G1B requires the full timezone and aggregate gates.
- MCP startup order: the plan now distinguishes a healthy configured server from tools already loaded into an agent session, requires Storybook first, and permits exactly one client refresh before affected UI/story tasks stop.
- Placeholders: none. Inactive owner rows use the explicit state `NOT YET REQUIRED — lane not entered`; freshly discovered E2E implementation paths remain conditional on Task C8's required recurrence because inventing owners before reproduction would be unsafe.
