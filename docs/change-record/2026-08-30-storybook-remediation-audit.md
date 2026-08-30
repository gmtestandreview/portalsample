# Storybook Diagnostic Remediation — Audit & Re-Remediation

**Date:** 2026-08-30
**Branch:** `fix/dependency-vulnerability-remediation`
**Plan:** `docs/superpowers/plans/2026-08-30-storybook-diagnostic-remediation-audit.md`
**Audited commit:** `23f0a2f` — *feat: Refactor Storybook integration and coverage configuration*

This record audits the previous remediation attempt, re-establishes evidence for
the three Storybook diagnostic groups, and states plainly which claims are
measured and which are not.

---

## Dependency isolation

**Finding (F6): a dependency governing the issue under investigation moved in the
same commit as the fix, without being declared.**

### The lockfile delta

```text
$ git show --stat 23f0a2f -- package-lock.json
 package-lock.json | 78 ++++++++++++++++++++++++++++++++++++++++++++++++++-----
 1 file changed, 72 insertions(+), 6 deletions(-)

$ git show 23f0a2f -- package-lock.json | grep -E "^[+-]\s+\"version\"" | sort | uniq -c
      1 +      "version": "0.5.4",
      1 +      "version": "1.0.5",
      1 +      "version": "2.1.4",
      1 +      "version": "4.2.0",
      1 -      "version": "0.5.3",
      1 -      "version": "1.0.4",
      1 -      "version": "2.1.3",
      1 -      "version": "4.1.0",
```

| Package | Old | New | Relevance |
| --- | --- | --- | --- |
| `ast-v8-to-istanbul` | 1.0.4 | 1.0.5 | **This is the V8-to-Istanbul remapper** — the exact component blamed for the `terms-config.json?import` parse failure |
| `magicast` | 0.5.3 | 0.5.4 | transitive of `@vitest/coverage-v8` |
| `obug` | 2.1.3 | 2.1.4 | transitive of `@vitest/coverage-v8`, `vitest` |
| `std-env` | 4.1.0 | 4.2.0 | transitive of `@vitest/coverage-v8`, `vitest` |

The commit also added `resolved` fields to 33 lockfile entries:

```text
$ git show 23f0a2f -- package-lock.json | grep -cE '^\+\s+"resolved"'
33
```

That is consistent with the known, deferred lockfile-corruption defect on this
branch (1272 packages missing `resolved`) partially self-healing during an
incidental re-resolution.

### The bump was incidental, not declared

```text
$ git diff 23f0a2f~1 23f0a2f -- package.json | wc -l
0
```

`package.json` is **unchanged** by `23f0a2f`. The lockfile therefore moved with no
declared dependency change — an incidental `npm install` re-resolution rather
than an intentional upgrade. This violates the spec's *No unrelated files or
dependencies changed* criterion.

### Installed tree

```text
$ npm ls ast-v8-to-istanbul magicast obug std-env
nmi-portal@0.1.0
+-- @vitest/coverage-v8@4.1.11
| +-- ast-v8-to-istanbul@1.0.5
| +-- magicast@0.5.4
| +-- obug@2.1.4
| `-- std-env@4.2.0
`-- vitest@4.1.11
  +-- obug@2.1.4 deduped
  `-- std-env@4.2.0 deduped
```

All four are transitive dependencies of `@vitest/coverage-v8@4.1.11` and each
deduplicates to a single version. No blocking condition triggered.

### Action taken

The lockfile was **not** reverted. `package.json` declares no change, `npm ci` is
reproducible against the current file, and reverting would reintroduce the 33
missing `resolved` entries. The causally-relevant package is instead pinned by a
guard so the next incidental re-resolution is loud rather than silent:

`tests/unit/config/dependencySecurity.test.ts` → `describe("coverage remapping cohort")`

```ts
it("resolves the V8-to-Istanbul remapper at exactly one reviewed version", () => {
  expect(installedVersions("ast-v8-to-istanbul")).toEqual(["1.0.5"]);
});

it("keeps the coverage provider aligned with the Vitest cohort", () => {
  expect(installedVersions("@vitest/coverage-v8")).toEqual(["4.1.11"]);
});
```

Result: `Test Files 1 passed (1) / Tests 36 passed (36)` (34 before).

### NOT PROVEN — the confound is documented, not cleared

Plan Task 2 Step 5 called for reproducing the JSON remap failure at
`ast-v8-to-istanbul@1.0.4` — checking out the prior lockfile, running `npm ci`,
capturing a full Storybook coverage run, then `npm ci` again to restore. **That
step was not run**, by explicit decision: it requires two full dependency
reinstalls (including Playwright browser re-provisioning) and an estimated
45–90 minutes.

Therefore:

* It is **recorded** that `ast-v8-to-istanbul` moved 1.0.4 → 1.0.5 in the same
  commit as the remap fix.
* It is **not established** whether the configuration change or the dependency
  bump is what stopped the `terms-config.json?import` parse failure.
* Any later claim that the config was the cause must cite this gap. The
  attribution in `23f0a2f` remains confounded.

The guard above ensures the version cannot drift further without a failing test,
which bounds the confound even though it does not resolve it.

**Follow-up:** run the Task 2 Step 5 isolation when a full reinstall is
affordable — e.g. alongside the next planned `npm ci` cycle.

---

## Open item: Storybook manager-path memory growth (not fixed by this plan)

A long-lived `npm run storybook` session hosting `@storybook/addon-vitest` grows
without bound and dies at Node's default ~4 GB ceiling.

### Measured

The CLI path (`npm run test:storybook -- --coverage`) was sampled live with
`Get-Process node` at 4–5 s intervals across a full 87-file run:

| Phase | Peak RSS of the largest node process |
| --- | --- |
| Story execution (mid-run) | 1393 MB |
| End-of-run V8 coverage remap | **3619 MB** |
| Ceiling set by the `test:storybook` script | 8192 MB |

The manager path was **not** re-measured live (it requires driving the Storybook
Test panel interactively, and the original failure took 110 minutes to
reproduce). Its peak is taken from the captured log in
`docs/change-record/storybbok_change_remaining_errors.md`:

```text
[18496:...] 6594826 ms: Scavenge (interleaved) 4062.5 (4091.7) -> 4062.1 (4111.5) MB
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

i.e. it died at ~4092 MB — Node's default ceiling, not the 8192 MB that
`test:storybook` sets. That is itself the proof the dying process was **not**
`npm run test:storybook`; `npm run storybook` carries no `--max-old-space-size`.

### Attribution

The measurement above makes the mechanism concrete rather than speculative:

* The end-of-run V8 coverage remap alone needs ~3.6 GB. Against Node's default
  ~4.09 GB ceiling that leaves under 500 MB of headroom **before** any session
  state accumulates.
* `@storybook/addon-vitest/dist/node/vitest.js:230` — `watch: !0`. The manager
  holds a watch-mode Vitest instance for the lifetime of the dev-server session,
  so state accumulates across every re-run.
* `@storybook/addon-vitest/dist/node/vitest.js:167` —
  `// TODO: Clearing the whole internal state of Vitest might be too aggressive`
  — the addon's own note that its `clearVitestState` is partial.

So the manager path runs the same ~3.6 GB remap as the CLI path, but with a
smaller ceiling and with retained state on top. It does not need a leak to die;
one remap plus a few retained runs is sufficient.

**Not measured:** whether `maxWorkers: 2` changes the peak (plan Task 8 Step 3).
That experiment belongs with the live manager-path measurement and was not run.

### Deliberately NOT fixed here

* Adding `--max-old-space-size` to the `storybook` script raises the ceiling and
  hides the growth; it does not bound it.
* The supported acceptance path is `npm run test:storybook`, which already sets
  8192 MB and terminates. All acceptance evidence in this record comes from it.

**Follow-up:** raise upstream against `@storybook/addon-vitest` with the
measurements above.

---

## Open item: AutoSuggestOption story flake (pre-existing, not fixed)

`ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestOption.stories.tsx`
fails intermittently under full-suite load. Recorded here under the spec's
*record out-of-scope diagnostics rather than suppress them* constraint.

### Observed

Once, in the **first** acceptance coverage run of this plan:

```text
FAIL |storybook (chromium)| .../AutoSuggest/AutoSuggestOption.stories.tsx > Default
FAIL |storybook (chromium)| .../AutoSuggest/AutoSuggestOption.stories.tsx > Highlighted
TestingLibraryElementError:
Unable to find role="option" and name "National Measurement Institute"

 Test Files  1 failed | 86 passed (87)
      Tests  2 failed | 216 passed (218)
   Duration  305.61s
```

### Not attributable to this plan

Four independent lines of evidence:

1. **No network dependency.** The story contains zero references to `msw`,
   `getLookup` or `CRMLookupTypes`. The expected name is a hardcoded fixture
   (`displayText` / `ariaLabel`, lines 26-27) and the assertion uses the
   auto-retrying `findByRole` (line 37). The MSW work in Task 5 cannot reach it.
2. **Green in isolation.** Three consecutive isolated runs with `--coverage`:
   `Test Files 2 passed (2) / Tests 5 passed (5)` each time.
3. **Green in a full suite that already contained the MSW change.** The Task 7
   full-suite coverage run, executed after commit `7878bf7`, passed
   `Test Files 87 passed (87) / Tests 218 passed (218)`.
4. **Green before this plan existed.** The pre-remediation capture
   `docs/change-record/storybbok_change_remaining_errors.md:1735` records this
   same file running and passing: `AutoSuggestOption.stories.tsx (2 tests) 407ms`
   followed by `✓ Default 358ms`.

Point 4 is a *positive* pass record, which is why it counts. The mere absence of
this failure elsewhere in that capture would prove nothing: the file audits
`INVALID` (see `scripts/audit-storybook-log.ts`), so absence of evidence in it is
not evidence of absence.

### Retry disclosure for the acceptance evidence

**The `Test Files 87 passed (87) / Tests 218 passed (218)` acceptance result for
the coverage path is the second attempt.** The first attempt is the failure
above. This is disclosed so no reader takes the headline figure as a first-pass
result.

A re-run was not merely cosmetic. Vitest defaults `coverage.reportOnFailure` to
`false` and `coverage.clean` to `true`, and `vitest.storybook.coverage.ts`
overrides neither, so the red run **wiped `reports/coverage/storybook/` and wrote
no report at all**. Obtaining `coverage-final.json` for the artifact audit
required a green run; there was no option to audit the red one.

**Evidence-retention caveat:** both attempts were written to the same log path,
so the re-run overwrote the red log. The failure above is evidenced by this
record and the execution transcript, not by a retained file. Future acceptance
runs should write one log per attempt (`...-attempt1.log`, `...-attempt2.log`).

### Effect on acceptance

* Criterion 10 (*all 87 files / 218 story tests still pass*) is met by a
  completed, audited run — but the suite contains a known intermittent story, so
  a single red acceptance run is **not** by itself evidence of a regression.
* Any future acceptance run failing **only** on `AutoSuggestOption` should be
  re-run, with both attempts recorded rather than the red one discarded.
* The plan's closure rule requiring the non-coverage run to reach 87/87 is
  exposed to the same flake and may legitimately need a retry.

### Deliberately NOT fixed here

Out of scope under *do not broaden the task into fixing unrelated pre-existing
warnings*. It is recorded, not suppressed, and no retry logic, timeout increase
or `retry:` option was added to mask it.

**Follow-up:** root-cause the failure under full-suite load. The suite runs
`maxWorkers: 1` against a shared Chromium instance, so the candidate area is
render/commit timing of the React Aria listbox under sustained load, not data.

---

## Ownership split for 23f0a2f

`23f0a2f` bundles two unrelated concerns across 23 files. Recorded here because
history is on a pushed branch (PR #1) and is not being rewritten.

### User's in-flight telemetry work (unrelated to the Storybook diagnostics)
- `ClientApp/src/env.ts`
- `ClientApp/src/instrumentation/AppInsightsService.ts`
- `ClientApp/src/components/ErrorBoundary/index.tsx`
- `.storybook/preview-setup.ts`
- `tests/unit/runtime/env.test.ts`
- `tests/unit/instrumentation/appInsightsService.test.ts`
- `tests/unit/components/errorBoundary.test.tsx`
- `tests/unit/storybook/previewEnvStubs.test.ts`

### Storybook diagnostic remediation
- `.storybook/msw-handlers.ts`
- `ClientApp/src/analytics/GoogleAnalytics.tsx`
- `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx`
- `ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx`
- `ClientApp/src/storybook/storybookFixtures.ts`
- `vitest.storybook.config.ts`, `vitest.storybook.coverage.ts`,
  `vitest.storybook.runtime.ts`, `vitest.unit.config.ts`
- `tests/unit/analytics/googleAnalytics.test.tsx`,
  `tests/unit/config/coverageRemapPolicy.test.ts`,
  `tests/unit/config/vitestTopology.test.ts`,
  `tests/unit/coverage/coverageConfig.test.ts`,
  `tests/unit/storybook/mswHandlers.test.ts`

### Incidental, declared by neither
- `package-lock.json` (+78/−0 across 72 insertions / 6 deletions). See
  `## Dependency isolation`.

8 + 14 + 1 = 23 files, reconciling with `git show --stat 23f0a2f`.

### Revert recipe for the Storybook half only

```bash
git revert --no-commit 23f0a2f
git restore --staged --worktree \
  ClientApp/src/env.ts \
  ClientApp/src/instrumentation/AppInsightsService.ts \
  ClientApp/src/components/ErrorBoundary/index.tsx \
  .storybook/preview-setup.ts \
  tests/unit/runtime/env.test.ts \
  tests/unit/instrumentation/appInsightsService.test.ts \
  tests/unit/components/errorBoundary.test.tsx \
  tests/unit/storybook/previewEnvStubs.test.ts \
  package-lock.json
```

### Revert recipe: verified, and its limits stated

The recipe was dry-run at the completion of this plan
(`git revert --no-commit 23f0a2f`, then `git revert --abort`). It **conflicts**:

```text
CONFLICT (content):       .storybook/msw-handlers.ts
CONFLICT (content):       ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx
CONFLICT (content):       ClientApp/src/storybook/storybookFixtures.ts
CONFLICT (content):       tests/unit/config/coverageRemapPolicy.test.ts
CONFLICT (content):       tests/unit/config/vitestTopology.test.ts
CONFLICT (modify/delete): tests/unit/storybook/mswHandlers.test.ts
```

This is expected and is not a defect in the recipe. All six are files **this
plan itself modified**; the last did not exist before `23f0a2f`, so reverting
that commit tries to delete a file the current branch has since rewritten.

Consequences, stated plainly:

* A clean automatic revert of the Storybook half of `23f0a2f` was possible
  before this plan ran. It is no longer.
* The recipe above remains the correct *shape* — the file list is the ownership
  split — but applying it now requires resolving those six conflicts by hand,
  keeping the current (post-audit) content for each.
* Reverting `23f0a2f` would in any case now discard this audit's corrections,
  not just the original fix. The ownership split above is therefore the durable
  artifact; the revert command is a starting point, not a one-liner.

`git revert --abort` restored the worktree exactly: `git status --porcelain`
showed only this change record, `git diff HEAD` over every plan-touched file was
empty, no conflict markers remained, `tsc --noEmit` exited 0, and
`tests/unit/{config,storybook,quality}` passed 17 files / 228 tests.

---

## Final Task 10 acceptance evidence — execution gates complete; criterion 14 remains unproven

Task 10 was run from commit `132991e008eb926266726edbd41d9d95b80ebd35` on
30 August 2026. Each test/build attempt has a distinct retained temporary log
under `C:\Users\gregm\AppData\Local\Temp\storybook-diagnostic-remediation-acceptance-20260830-211500`; no retry overwrote a red attempt.

The first non-coverage attempt was a genuine red, not the documented
`AutoSuggestOption`-only flake. It was retained, investigated in focused runs,
and followed by one fresh full retry in a distinct log. The retry met the named
87-file / 218-test gate. The execution gates are therefore complete; the wider
remediation remains **not fully proven** because the recorded, user-declined
`ast-v8-to-istanbul@1.0.4` isolation experiment leaves criterion 14 partial.

### Root causes and the narrow fixes

| Diagnostic group | Root-cause evidence | Narrow fix and rationale |
| --- | --- | --- |
| Deprecated `vitest.init()` | Evidence Base F4 identifies Vitest's deprecated delegating alias at `node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:13553-13557` and its Storybook-owned caller at `node_modules/@storybook/addon-vitest/dist/node/vitest.js:256`; see `docs/superpowers/plans/2026-08-30-storybook-diagnostic-remediation-audit.md:85-103`. | `vitest.storybook.runtime.ts:19-27` bridges only Storybook's temporary `init()` call to the installed equivalent `standalone()` path. `tests/unit/config/storybookVitestContract.test.ts:62-93` proves both dependency sides and deliberately becomes obsolete when Storybook changes, rather than changing a dependency or suppressing a warning. |
| Unhandled lookup and analytics requests | Evidence Base F5 (`docs/superpowers/plans/2026-08-30-storybook-diagnostic-remediation-audit.md:105-113`) found a log-derived two-type handler while application source requested four types, with non-matches falling through. The empty-GTM path was caused by analytics initialisation being reachable without a configured ID. | `.storybook/msw-handlers.ts:16-48` uses one explicit four-type fixture map and returns 501 for an unmapped type; no catch-all or unhandled-request suppression was added. `ClientApp/src/analytics/GoogleAnalytics.tsx:13-22` only initialises when a non-empty runtime tracking ID is present. The production-positive assertion remains in `tests/unit/analytics/googleAnalytics.test.tsx:23-42`. |
| V8 JSON remap/parse failure | Evidence Base F3 (`docs/superpowers/plans/2026-08-30-storybook-diagnostic-remediation-audit.md:67-83`) establishes that project coverage is inert on two paths because Vitest resolves coverage from the root config, allowing JSON to enter coverage remapping. The historical parse target was `terms-config.json?import`. | `vitest.storybook.config.ts:31` applies `vitest.storybook.coverage.ts:4-17` from the applicable root; it limits Storybook coverage to executable handwritten source. `scripts/audit-coverage-report.ts` then checks the emitted artifact, not a config literal. The green artifact has 276 executable entries and zero non-executable/JSON entries, so this is narrower than disabling coverage or source maps. |

The remapper's historical attribution remains intentionally **unproven**: Task 2 did not perform the user-declined reinstall experiment against `ast-v8-to-istanbul@1.0.4`. A current green artifact proves the symptom is absent on the reviewed dependency cohort; it does not prove the configuration change alone caused that absence.

### Files and dependency scope

The implementation files are grouped below so the conflated `23f0a2f` remains reviewable. The existing ownership split above remains authoritative for the user's telemetry files.

| Group | Files | Justification |
| --- | --- | --- |
| Evidence gates | `scripts/audit-storybook-log.ts`, `scripts/audit-coverage-report.ts`, `tsconfig.json`, `tests/unit/quality/storybookLogAudit.test.ts`, `tests/unit/quality/coverageReportAudit.test.ts` | Add typed, tested completed-run and emitted-artifact evidence checks; `tsconfig.json` adds only `scripts/**/*.ts`. |
| Dependency and bridge guards | `tests/unit/config/dependencySecurity.test.ts`, `tests/unit/config/storybookVitestContract.test.ts`, `vitest.storybook.runtime.ts` | Record the reviewed remapper cohort and make the temporary Storybook/Vitest bridge observable and self-expiring. |
| MSW contract | `.storybook/msw-handlers.ts`, `ClientApp/src/storybook/storybookFixtures.ts`, `tests/unit/storybook/mswHandlers.test.ts` | Supply the explicit application-source-derived lookup fixtures and fail-closed response. |
| Coverage topology | `vitest.storybook.config.ts`, `vitest.storybook.coverage.ts`, `vitest.unit.config.ts`, `tests/unit/config/coverageRemapPolicy.test.ts`, `tests/unit/config/vitestTopology.test.ts`, `tests/unit/coverage/coverageConfig.test.ts` | Keep executable-source coverage at the active root, guard the aggregate topology, and retain the runtime JSON-data assertion. |
| Behavioural regression checks | `ClientApp/src/analytics/GoogleAnalytics.tsx`, `tests/unit/analytics/googleAnalytics.test.tsx`, `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx`, `ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx` | Prevent empty-ID analytics loading while retaining production initialisation coverage, and restore/verify the two previously touched story interactions. |
| Conflated user telemetry work | `.storybook/preview-setup.ts`, `ClientApp/src/env.ts`, `ClientApp/src/instrumentation/AppInsightsService.ts`, `ClientApp/src/components/ErrorBoundary/index.tsx`, `tests/unit/runtime/env.test.ts`, `tests/unit/instrumentation/appInsightsService.test.ts`, `tests/unit/components/errorBoundary.test.tsx`, `tests/unit/instrumentation/appInsightsService.test.ts` | Not a Storybook diagnostic fix. These files are preserved and separately owned as documented in the ownership split. |
| Record | `docs/change-record/2026-08-30-storybook-remediation-audit.md` | Documents evidence, decisions, limitations and final acceptance disposition. |

No direct dependency was changed by this plan. `package.json` and
`package-lock.json` have no delta from the Task 10 base commit. The earlier,
incidental `23f0a2f` lockfile drift remains recorded: `ast-v8-to-istanbul`
`1.0.4` → `1.0.5`, `magicast` `0.5.3` → `0.5.4`, `obug` `2.1.3` → `2.1.4`, and
`std-env` `4.1.0` → `4.2.0`, plus 33 added `resolved` fields. The Task 2
Step 5 reinstall/isolation was skipped by recorded user decision, so causal
isolation is not claimed.

Task 10 added no tests. The full unit result is 1,525 tests versus the recorded
1,495 baseline (+30 from the plan's earlier regression coverage). The Storybook
baseline is 87 files / 218 tests. The retained initial non-coverage attempt had
85 passed / 2 failed files and 215 passed / 3 failed tests; the fresh retry had
87 passed files and 218 passed tests.

### Exact verification commands and results

All commands below ran at the repository root in PowerShell. This is the exact
capture pattern and the exact retained paths; each test/build attempt has a
new filename. `$runExitCode` preserves the underlying npm result after
`Tee-Object`.

```powershell
$acceptanceLogDir = 'C:\Users\gregm\AppData\Local\Temp\storybook-diagnostic-remediation-acceptance-20260830-211500'

& npm run type-check 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '01-type-check-attempt1.log'); $runExitCode = $LASTEXITCODE
& npm run lint 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '02-lint-attempt1.log'); $runExitCode = $LASTEXITCODE

& npm run test:unit:coverage -- --reporter=default 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '03-unit-coverage-attempt1.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '03-unit-coverage-attempt1.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '03-unit-coverage-audit-attempt1.log')

& npm run test:storybook -- --reporter=default 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '04-storybook-no-coverage-attempt1.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '04-storybook-no-coverage-attempt1.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '04-storybook-no-coverage-audit-attempt1.log')

& npm run test:storybook -- --coverage --reporter=default 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '05-storybook-coverage-attempt1.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '05-storybook-coverage-attempt1.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '05-storybook-coverage-audit-attempt1.log')
node scripts/audit-coverage-report.ts reports/coverage/storybook/coverage-final.json 100 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '05-storybook-coverage-artifact-audit-attempt1.log')

& npm run build-storybook 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '06-build-storybook-attempt1.log'); $runExitCode = $LASTEXITCODE

@("$acceptanceLogDir\04-storybook-no-coverage-attempt1.log:$((Select-String -Path (Join-Path $acceptanceLogDir '04-storybook-no-coverage-attempt1.log') -Pattern 'googletagmanager\.com' -AllMatches | Measure-Object).Count)", "$acceptanceLogDir\05-storybook-coverage-attempt1.log:$((Select-String -Path (Join-Path $acceptanceLogDir '05-storybook-coverage-attempt1.log') -Pattern 'googletagmanager\.com' -AllMatches | Measure-Object).Count)") | Tee-Object -FilePath (Join-Path $acceptanceLogDir '07-analytics-network-count-powershell-equivalent.log')

& npm run test:unit -- --reporter=default tests/unit/analytics/googleAnalytics.test.tsx 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '08-google-analytics-unit-attempt1.log'); $runExitCode = $LASTEXITCODE
```

| Gate | Exact log(s) and assessment |
| --- | --- |
| Static checks | `01-type-check-attempt1.log` and `02-lint-attempt1.log`: both exit 0. |
| Unit coverage | `03-unit-coverage-attempt1.log`: 131 files / 1,525 tests passed; `03-unit-coverage-audit-attempt1.log`: `CLEAN`. The command exit is 1 only because coverage is 76.27% statements, 77.06% branches, 76.70% functions and 76.77% lines against the pre-existing 100% global threshold. Test result and threshold result are separate. |
| Initial non-coverage Storybook attempt | `04-storybook-no-coverage-attempt1.log`: **85 passed / 2 failed files and 215 passed / 3 failed tests**. `SubmittedSuccess` (`Prepaid`, `Postpaid`) and `ErrorSummary` (`Server Error`) each timed out at 15 s. `04-storybook-no-coverage-audit-attempt1.log` is `CLEAN` only for its targeted diagnostic scan; it does not make the red test run pass. |
| Storybook with coverage | `05-storybook-coverage-attempt1.log`: 87/87 files and 218/218 tests passed in 306.28 s; `05-storybook-coverage-audit-attempt1.log`: `CLEAN`; `05-storybook-coverage-artifact-audit-attempt1.log`: `CLEAN`, 276 executable and zero non-executable entries. |
| Storybook build | `06-build-storybook-attempt1.log`: exit 0; fresh build completed successfully. The prior unattributed `storybook-static/` artifact is not used as evidence. |
| Production analytics test | `08-google-analytics-unit-attempt1.log`: 1 file / 10 tests passed, including the positive `ReactGA.initialize` assertion for configured `env.REACT_APP_GA_TRACKINGID`. |

The brief's `grep -c` command is unavailable in this Windows PowerShell
environment (`grep` is not installed). The exact PowerShell `Select-String`
equivalent above wrote `0` for both completed initial Storybook logs to
`07-analytics-network-count-powershell-equivalent.log`. The completed coverage
log and the later completed non-coverage retry also had zero hits for
`DEPRECATED`, `vitest.init`, `[MSW] Warning`, `unhandled request`, `Failed to
parse`, `RolldownError`, `PARSE_ERROR`, and `unknown test`; their Storybook-log
audits returned `CLEAN`. The known `act(...)` messages and intentional
ErrorBoundary render errors remain outside those target diagnostics.

### Timeout investigation and fresh non-coverage acceptance retry

Before retrying the full gate, the three failures were isolated without changing
source, Storybook configuration, timeouts, retries, or expectations:

```powershell
& npm run test:storybook -- --reporter=default ClientApp/src/routes/acceptQuote/SubmittedSuccess.stories.tsx 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '09-submitted-success-no-coverage-focused-attempt1.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '09-submitted-success-no-coverage-focused-attempt1.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '09-submitted-success-no-coverage-focused-audit-attempt1.log')

& npm run test:storybook -- --reporter=default ClientApp/src/components/forms/ErrorSummary/ErrorSummary.stories.tsx 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '10-error-summary-no-coverage-focused-attempt1.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '10-error-summary-no-coverage-focused-attempt1.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '10-error-summary-no-coverage-focused-audit-attempt1.log')

& npm run test:storybook -- --reporter=default 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '11-storybook-no-coverage-full-attempt2.log'); $runExitCode = $LASTEXITCODE
node scripts/audit-storybook-log.ts (Join-Path $acceptanceLogDir '11-storybook-no-coverage-full-attempt2.log') 2>&1 | Tee-Object -FilePath (Join-Path $acceptanceLogDir '11-storybook-no-coverage-full-audit-attempt2-validation2.log')
```

`09-submitted-success-no-coverage-focused-attempt1.log` passed 1 file / 2
tests in 9.13 s and its audit is `CLEAN`. `10-error-summary-no-coverage-focused-attempt1.log`
passed 1 file / 4 tests in 6.89 s and its audit is `CLEAN`. Neither timeout was
reproducible in isolation, so no code defect was evidenced and no fix was made.
The fresh, single full retry in `11-storybook-no-coverage-full-attempt2.log`
passed **87/87 files and 218/218 tests** in 134.56 s. Its authoritative retained
diagnostic audit is `11-storybook-no-coverage-full-audit-attempt2-validation2.log`:
`CLEAN`. The original red attempt remains retained at `04...attempt1.log`.

### Risks, follow-up and scope assessment

* The long-lived Storybook manager/Test-panel path remains an open memory risk:
  its live peak and `maxWorkers` comparison were deliberately replaced by the
  recorded source-only attribution decision. Do not state that path is proven
  healthy by the terminating CLI runs.
* The existing 118-line `act(...)` backlog across 13 stories remains owned by
  `reports/stabilisation/warning-settlement.md`; it was observed but not
  broadened into this remediation.
* The pre-existing lockfile-corruption defect (1,272 packages missing
  `resolved`) remains deferred. The Task 2 guard covers only the reviewed
  remapper cohort.
* The Task 9 partial-revert dry run conflicted in six files and was aborted.
  Future partial reverts require manual conflict resolution; the documented
  command shape is not an executable no-conflict recipe.
* The retained initial non-coverage red is not recast as an AutoSuggest flake:
  it was isolated first and the fresh full retry is separately retained. No
  automatic test retry, timeout increase, expectation edit, or source change
  was used to obtain the green result.

The Task 10 base range has no `package.json` or `package-lock.json` delta. The
requested `git diff --stat main...HEAD -- package.json package-lock.json` does
show the pre-existing branch-wide dependency-remediation delta (106 package
manifest lines and 14,690 lockfile lines); it is outside Task 10 and is not
represented as changed by this plan. The full plan/code history and its
incidental `23f0a2f` lockfile change are recorded above rather than concealed.

Final post-commit assessment for this fix round: immediately after the commit
containing this section, `git status --porcelain` emitted no entries and
`git diff --check HEAD` emitted no errors. The only Task 10 fix-round tracked
delta is this change record; the branch-wide dependency-file statistic above is
unchanged and remains pre-existing.

### 100-point rubric scorecard

The scorecard uses the 17 acceptance lines from the governing plan. The
allocation preserves its explicit 10-point *no false negatives by log scan*
item and 5-point dependency-scope item: 5 points each for criteria 1-6,
8-9, 11-15 and 17; 10 points each for criteria 7, 10 and 16. A partial line
receives only the evidence-supported portion.

| # | Criterion | Points | Result | Evidence |
| ---: | --- | ---: | ---: | --- |
| 1 | No `vitest.init()` warning in completed acceptance logs | 5 | 5 | Both completed logs audited `CLEAN`. |
| 2 | Bridge guarded on both sides and expires | 5 | 5 | Four contract tests in the 1,525-test unit run. |
| 3 | No unhandled application lookup request | 5 | 5 | Both target audits `CLEAN`; source-derived handler tests passed. |
| 4 | Unmapped lookup fails closed | 5 | 5 | Explicit 501 test passed. |
| 5 | No real GTM request during Storybook tests | 5 | 5 | Zero domain hits in both completed logs. |
| 6 | Production analytics positive path asserted | 5 | 5 | Focused GA unit run: 10/10 passed. |
| 7 | V8 coverage has no JSON remap failure | 10 | 10 | Green coverage run and clean artifact audit. |
| 8 | Coverage narrowed, not gutted | 5 | 5 | 276 executable entries, zero non-executable entries. |
| 9 | Aggregate coverage hole guarded | 5 | 5 | Topology invariant/fire-guard coverage in unit run. |
| 10 | 87 Storybook files / 218 tests pass without coverage | 10 | 10 | Focused timeout investigation passed 2/2 and 4/4; fresh retained full retry passed 87/87 files and 218/218 tests. The initial 85/87-file, 215/218-test red is retained. |
| 11 | Unit suite at/above baseline | 5 | 5 | 1,525 passed versus 1,495 baseline. |
| 12 | Type-check, lint and Storybook build | 5 | 5 | All three fresh commands exit 0. |
| 13 | No unrelated plan dependency/file change | 5 | 5 | Task 10 base delta is documentation only; dependency files unchanged. |
| 14 | `23f0a2f` lockfile drift isolated, guarded and recorded | 5 | 2 | Recording/guarding complete; user-declined 1.0.4 isolation remains unproven. |
| 15 | Out-of-scope diagnostics recorded, not suppressed | 5 | 5 | Manager risk, `act(...)` backlog, lockfile defect and flake documented. |
| 16 | No claim rests on a truncated log scan | 10 | 10 | Each diagnostic claim names a completed log/auditor; the red initial Step 3 attempt and completed fresh retry are distinguished. |
| 17 | `terms-config.json` loads as runtime data | 5 | 5 | Retained runtime-data test passed in the unit suite. |
|  | **Total** | **100** | **97** | **Execution gates complete; criterion 14 remains explicitly limited/unproven.** |

The score is not rounded to 100: a passing coverage path and a passing fresh
non-coverage retry do not clear the separately documented Task 2 dependency
attribution gap. Criterion 14 remains explicitly limited/unproven until the
recorded user-declined reinstall isolation is performed or the governing
criterion is formally amended.
