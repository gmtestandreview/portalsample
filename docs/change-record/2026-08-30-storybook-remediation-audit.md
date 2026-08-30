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
