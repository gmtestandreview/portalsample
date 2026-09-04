# Storybook Diagnostic Remediation — Audit & Re-Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-establish trustworthy evidence for the three Storybook diagnostic groups (deprecated `vitest.init()`, unhandled MSW requests, V8 coverage remap failure on `terms-config.json?import`), close the gaps the previous attempt left open, and make the verification method itself incapable of producing the false negative that shipped last time.

**Architecture:** The previous attempt (commit `23f0a2f`) landed plausible fixes but verified them with a log that never completed. This plan inverts the order: build the evidence gate first, isolate the one dependency variable that moved, then re-prove each root cause against runtime artifacts (a real coverage report, a real MSW server, the installed dependency source) instead of against config literals. Collateral damage from the previous attempt — a weakened guard test, a test edited to settle a flake, a conflated commit — is handled explicitly rather than inherited.

**Tech Stack:** React 18, TypeScript 5 (`strict`, `verbatimModuleSyntax`), Node 24.20.0, Vitest 4.1.11 (Browser Mode + Playwright Chromium), Vite 8.1.x / Rolldown, Storybook 10.5.10 + `@storybook/addon-vitest`, MSW 2.14.6, `@vitest/coverage-v8` 4.1.11.

**Spec:** `docs/change-record/storybook_change_prompt_shouldofdone.md` (the rubric), read alongside this plan's Evidence Base below. Supporting evidence: `docs/change-record/storybook_change.md`, `docs/change-record/storybook_changed_output.md`, `docs/change-record/Storybook_change_files.md`, `docs/change-record/storybbok_change_remaining_errors.md`.

---

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include this section.

* Preserve all unrelated user changes.
* Do not patch `node_modules`.
* Do not use catch-all MSW handlers.
* Do not hide missing mocks by broadly bypassing, warning on, or suppressing requests.
* Do not disable coverage globally.
* Do not broadly exclude application source from coverage.
* Do not disable source maps globally unless evidence proves that is the correct repository-wide fix.
* Do not perform broad dependency upgrades.
* Do not broaden the task into fixing unrelated pre-existing warnings. Record them separately unless your changes caused them.
* If any criterion cannot be met, stop and report the blocker with evidence.

Repository constraints that also bind (from `CLAUDE.md`):

* Never edit `ClientApp/src/api/web-api-client.ts`, `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, `ClientApp/webpack/**`.
* Prefer `globalThis` over `window` in handwritten app code, tests and mocks.
* Any schema file calling a custom Yup string method must `import '../../validationSchemas/yupExtensions';`.
* Supported commands only: `npm run type-check`, `npm run lint`, `npm run test:unit`, `npm run test:storybook`, `npm run test:ci`, `npm run build-storybook`, `npm run migration-check`.
* `--reporter=default` is load-bearing on any piped Vitest run. Without it Vitest 4 writes no intercepted console output to a non-TTY stdout and the log reads as clean.

---

## Evidence Base — Devil's Advocate Findings

Each finding is stated with the artifact that proves it. These are the reasons this plan exists; every task below traces to one.

### F1 — The "clean" verification is a false negative. The run never finished.

`docs/change-record/storybbok_change_remaining_errors.md` contains **zero** occurrences of every target string (`DEPRECATED`, `vitest.init`, `[MSW] Warning`, `unhandled request`, `Failed to parse`, `RolldownError`, `PARSE_ERROR`, `unknown test`). It also contains **zero** occurrences of `Test Files`, `Tests`, `Duration`, and any coverage table. The file ends at line 1763 with:

```text
[18496:...]  6594826 ms: Scavenge (interleaved) 4062.5 (4091.7) -> 4062.1 (4111.5) MB ...
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

V8 coverage remapping and the Vitest summary are both **end-of-run** phases. The process died after 6,594,826 ms (110 minutes) before reaching either. A string scan over a truncated log cannot distinguish "the warning is gone" from "the code that emits the warning never ran". Rubric item *No False Negatives by Log Scan Alone* (10 pts) scores 0.

### F2 — The process that died is not `npm run test:storybook`.

`test:storybook` runs `node --max-old-space-size=8192 ...`. The OOM shows a ceiling of ~4092 MB — Node's default, not 8192. The log interleaves `Chromatic:` progress lines with `storybook/test:` lines, so the capture is a long-lived Storybook dev server (`npm run storybook`, no heap flag) hosting `@storybook/addon-vitest` alongside a Chromatic upload. The addon hard-codes watch mode:

`node_modules/@storybook/addon-vitest/dist/node/vitest.js:229` — `watch: !0`

and flags its own state cleanup as insufficient:

`node_modules/@storybook/addon-vitest/dist/node/vitest.js:167` — `// TODO: Clearing the whole internal state of Vitest might be too aggressive`

The previous attempt's final verification ran through exactly this path (see `storybook_changed_output.md`: "The clean-server MCP run is underway"). The verification path is the path that dies.

### F3 — `vitest.storybook.coverage.ts` is inert on two of three run paths.

Vitest 4 resolves coverage from the **root** config only:

`node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:13292` — `get _coverageOptions() { if (!this.configOverride.coverage) return this.config.coverage; ... }`

| Path | Root config | Storybook project `coverage` applied? |
| --- | --- | --- |
| `npm run test:storybook -- --coverage` | `vitest.storybook.config.ts` | **Yes** — it *is* the root |
| `npm run test:all` / `migration-check` | `vitest.config.ts` (`projects: [...]`) | **No** — project coverage ignored |
| Storybook Test panel / MCP | discovered root + addon override | **No** — addon replaces it |

The addon passes its own coverage object with no `provider`, `include` or `exclude`:

`node_modules/@storybook/addon-vitest/dist/node/vitest.js:191-197` — `coverageOptions = coverage ? { enabled: !0, clean: !0, cleanOnRerun: !0, reportOnFailure: !0, reporter: [...], reportsDirectory: ... } : { enabled: !1 }`

The previous attempt found the third case and bridged it with a runtime monkey-patch. It never noticed the second. `tests/unit/config/vitestTopology.test.ts` and `tests/unit/config/coverageRemapPolicy.test.ts` assert the exported config *literal*, so they pass in all three cases and detect none of this.

### F4 — The `vitest.init` bridge is semantically correct but its regression test is tautological.

The bridge is faithful. Vitest's `init()` is literally a deprecation log plus a delegation:

`node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:13553-13557`

```js
/** @deprecated use `standalone()` instead */
init() {
    this.logger.deprecate("`vitest.init()` is deprecated. Use `vitest.standalone()` instead.");
    return this.standalone();
}
```

and the sole caller is the manager path:

`node_modules/@storybook/addon-vitest/dist/node/vitest.js:256` — `await this.vitest.init();`

So `vitest.init = vitest.standalone.bind(vitest)` changes no behaviour. **But** the test guarding it (`tests/unit/config/coverageRemapPolicy.test.ts`, "adapts Storybook manager runs...") builds a hand-rolled `{ config, init, standalone }` object shaped by the plugin's own type, calls `configureVitest` on it, and asserts the plugin did what the plugin does. It cannot fail if Storybook renames the call site, moves to `standalone()`, or stops calling `configureVitest`. The one change that is a dependency-contract bridge has no contract test.

### F5 — The MSW handler set is keyed to one log, not to the code.

`.storybook/msw-handlers.ts` mocks two lookup types. Application code requests **four**:

* `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx:80-81` — `TCPortalMeasurementCategory`, `TCArtefactTypePortalCategory` — mocked
* `ClientApp/src/routes/ta/applicationAndInstrumentProps.ts:34-35` — `PAPortalCategory`, `PAPortalInstrumentType` — **not mocked**
* `ClientApp/src/routes/ta/summaryAndSubmitProps.ts:36-37` — same two — **not mocked**

No `ClientApp/src/routes/ta/*.stories.tsx` declares an `msw` parameter. Additionally, both `/api/lookup` handlers return `undefined` on a non-match, so an unmapped type falls through **both** to the unhandled-request warning — silently, at the exact place the fix was supposed to close.

### F6 — `package-lock.json` moved in the same commit, including the package that owns the remap.

`git show --stat 23f0a2f -- package-lock.json` → `+72 / -6`. Transitive versions changed:

| Package | Old | New |
| --- | --- | --- |
| `ast-v8-to-istanbul` | 1.0.4 | 1.0.5 |
| `magicast` | 0.5.3 | 0.5.4 |
| `obug` | 2.1.3 | 2.1.4 |
| `std-env` | 4.1.0 | 4.2.0 |

`ast-v8-to-istanbul` **is** the V8-to-Istanbul remapper — the exact component blamed for the `terms-config.json?import` parse failure. A dependency governing the issue under investigation was bumped in the same commit as the fix, so the fix and the bump are confounded. Many entries also gained `resolved` fields, consistent with the known deferred lockfile-corruption defect (1272 packages missing `resolved`). This violates *No unrelated files or dependencies changed* (5 pts).

### F7 — The commit conflates the user's in-flight telemetry work with the Storybook fix.

`23f0a2f` contains, alongside the Storybook changes: `ClientApp/src/env.ts`, `ClientApp/src/instrumentation/AppInsightsService.ts`, `ClientApp/src/components/ErrorBoundary/index.tsx`, `.storybook/preview-setup.ts`, `tests/unit/runtime/env.test.ts`, `tests/unit/instrumentation/appInsightsService.test.ts`, `tests/unit/components/errorBoundary.test.tsx`, `tests/unit/storybook/previewEnvStubs.test.ts`. Those were the user's uncommitted telemetry work. The content was preserved, but the Storybook change can no longer be reverted or bisected without also reverting the telemetry fix.

### F8 — An existing guard test was rewritten to bless the new behaviour.

`git show 23f0a2f -- tests/unit/config/vitestTopology.test.ts`:

```diff
-  it("does not own unit coverage", () => {
-    expect(storybook.coverage).toBeUndefined();
+  it("owns only the Storybook executable-source coverage policy", () => {
+    expect(storybook.coverage?.reportsDirectory).toBe("./reports/coverage/storybook",);
```

A guard that fails is evidence. Editing it to pass is not a fix. Given F3, the retired invariant was closer to correct than its replacement.

### F9 — A story test was edited to settle a flake without root cause.

`ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx` gained `await userEvent.click(textbox)` because the story went red **under coverage only** (`storybook_changed_output.md`: "one existing SlateEditor interaction test flaked under coverage (217/218)"). The spec required preserving the behaviour and assertions of all 218 tests.

### F10 — The 36 `act(...)` warnings are out of scope and already owned. Do not re-open them.

`reports/stabilisation/warning-settlement.md` (Task C3, commit `430820c`) documents 118 lines across 13 owner stories, with a three-mode settlement experiment and an attribution-drift proof. The previous attempt was right to exclude them. This plan records them and does not touch them.

---

## File Structure

| File | Responsibility | Status |
| --- | --- | --- |
| `scripts/audit-storybook-log.ts` | Pure log-audit logic + CLI. Refuses to report "clean" on a truncated log. | Create |
| `scripts/audit-coverage-report.ts` | Pure coverage-artifact audit + CLI. Asserts the emitted report, not the config literal. | Create |
| `tsconfig.json` | Add `scripts/**/*.ts` to `include` so the two new scripts type-check. | Modify |
| `tests/unit/quality/storybookLogAudit.test.ts` | Unit tests for the log auditor, including the truncation case. | Create |
| `tests/unit/quality/coverageReportAudit.test.ts` | Unit tests for the coverage-artifact auditor. | Create |
| `tests/unit/config/dependencySecurity.test.ts` | Add the coverage-remapping cohort floor (`ast-v8-to-istanbul`). | Modify |
| `tests/unit/config/storybookVitestContract.test.ts` | Contract + expiry guard on the `init()` bridge against installed sources. | Create |
| `.storybook/msw-handlers.ts` | Single `/api/lookup` handler over an explicit fixture map; fails closed with 501. | Modify |
| `ClientApp/src/storybook/storybookFixtures.ts` | Add `paCategoryResponses`, `paInstrumentTypeResponses`. | Modify |
| `tests/unit/storybook/mswHandlers.test.ts` | Replace log-derived cases with a source-derived exhaustiveness test. | Modify |
| `tests/unit/config/vitestTopology.test.ts` | Restore a real invariant: the aggregate root config must never enable coverage. | Modify |
| `tests/unit/config/coverageRemapPolicy.test.ts` | Delete the tautological plugin test (superseded by the contract test). | Modify |
| `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx` | Revert or justify the flake edit, per root cause. | Modify |
| `docs/change-record/2026-08-30-storybook-remediation-audit.md` | Final report: root causes, evidence, ownership split for `23f0a2f`, open items. | Create |

---

## Task 1: Evidence gate — a log auditor that cannot produce F1

**Rationale (F1):** Nothing else in this plan can be judged until a scan over a run log is trustworthy. Build this first and use it for every subsequent verification.

**Files:**
- Create: `scripts/audit-storybook-log.ts`
- Modify: `tsconfig.json`
- Test: `tests/unit/quality/storybookLogAudit.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export type TargetHit = { target: string; count: number };
  export type LogAudit = {
      completed: boolean;
      truncatedBy: string[];
      hits: TargetHit[];
      verdict: 'clean' | 'dirty' | 'invalid';
  };
  export const TARGET_STRINGS: readonly string[];
  export const auditLog: (log: string) => LogAudit;
  export const formatReport: (audit: LogAudit, source: string) => string;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/unit/quality/storybookLogAudit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { auditLog, formatReport } from '../../../scripts/audit-storybook-log';

const completedRun = [
    'stdout | Some.stories.tsx > Default',
    ' Test Files  87 passed (87)',
    '      Tests  218 passed (218)',
    '   Duration  183.42s',
].join('\n');

const oomRun = [
    'stdout | Some.stories.tsx > Default',
    '<--- Last few GCs --->',
    'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory',
].join('\n');

describe('storybook run log audit', () => {
    it('reports clean only when the run reached its summary', () => {
        const audit = auditLog(completedRun);

        expect(audit.completed).toBe(true);
        expect(audit.hits).toEqual([]);
        expect(audit.verdict).toBe('clean');
    });

    it('refuses to call a truncated log clean, even with zero target strings', () => {
        // This is the exact shape of docs/change-record/storybbok_change_remaining_errors.md:
        // no target strings, and no summary either. Absence of evidence is not
        // evidence of absence, because V8 remapping runs at end of run.
        const audit = auditLog(oomRun);

        expect(audit.completed).toBe(false);
        expect(audit.hits).toEqual([]);
        expect(audit.verdict).toBe('invalid');
        expect(audit.truncatedBy).toContain('JavaScript heap out of memory');
    });

    it('still reports a positive hit found in a truncated log', () => {
        // Presence of evidence IS valid evidence, even when the run died early.
        const audit = auditLog(`${oomRun}\n[MSW] Warning: intercepted a request without a matching handler`);

        expect(audit.completed).toBe(false);
        expect(audit.verdict).toBe('dirty');
        expect(audit.hits).toEqual([{ target: '[MSW] Warning', count: 1 }]);
    });

    it('counts every occurrence of each target string', () => {
        const audit = auditLog(`${completedRun}\nunhandled request\nunhandled request`);

        expect(audit.verdict).toBe('dirty');
        expect(audit.hits).toEqual([{ target: 'unhandled request', count: 2 }]);
    });

    it('names the source and the reason in the report', () => {
        expect(formatReport(auditLog(oomRun), 'run.log')).toContain('run.log');
        expect(formatReport(auditLog(oomRun), 'run.log')).toContain('INVALID');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --reporter=default tests/unit/quality/storybookLogAudit.test.ts`
Expected: FAIL with `Failed to resolve import "../../../scripts/audit-storybook-log"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/audit-storybook-log.ts`:

```ts
/**
 * Audits a captured Storybook/Vitest run log.
 *
 * A string scan over a log is only evidence if the run reached the phase that
 * emits the string. V8 coverage remapping and the Vitest summary are both
 * end-of-run phases; a log truncated by an OOM or a kill contains zero
 * occurrences of every target string while proving nothing. This auditor
 * reports `invalid` rather than `clean` in that case.
 *
 * A positive hit is still valid evidence in a truncated log, so hits win.
 *
 * Usage: node scripts/audit-storybook-log.ts <path-to-log>
 */
import { readFileSync } from 'node:fs';

export type TargetHit = { target: string; count: number };

export type LogAudit = {
    completed: boolean;
    truncatedBy: string[];
    hits: TargetHit[];
    verdict: 'clean' | 'dirty' | 'invalid';
};

export const TARGET_STRINGS: readonly string[] = [
    'DEPRECATED',
    'vitest.init',
    '[MSW] Warning',
    'unhandled request',
    'Failed to parse',
    'RolldownError',
    'PARSE_ERROR',
    'unknown test',
];

const TRUNCATION_MARKERS: readonly string[] = [
    'JavaScript heap out of memory',
    'Ineffective mark-compacts near heap limit',
    'FATAL ERROR',
];

const COMPLETION_MARKER = /^\s*Test Files\s+\d/m;

export const auditLog = (log: string): LogAudit => {
    const completed = COMPLETION_MARKER.test(log);
    const truncatedBy = TRUNCATION_MARKERS.filter((marker) => log.includes(marker));
    const hits = TARGET_STRINGS
        .map((target) => ({ target, count: log.split(target).length - 1 }))
        .filter(({ count }) => count > 0);

    const verdict = hits.length > 0 ? 'dirty' : completed ? 'clean' : 'invalid';

    return { completed, truncatedBy, hits, verdict };
};

export const formatReport = (audit: LogAudit, source: string): string => {
    const lines = [`${audit.verdict.toUpperCase()}  ${source}`];

    if (!audit.completed) {
        lines.push('  no `Test Files` summary: the run did not reach its end-of-run phases,');
        lines.push('  so a zero-hit scan is not evidence that the diagnostics are gone.');
    }

    for (const marker of audit.truncatedBy) {
        lines.push(`  truncated by: ${marker}`);
    }

    for (const { target, count } of audit.hits) {
        lines.push(`  ${count} x ${target}`);
    }

    return lines.join('\n');
};

const [, , logPath] = process.argv;

if (logPath !== undefined) {
    const audit = auditLog(readFileSync(logPath, 'utf8'));
    process.stdout.write(`${formatReport(audit, logPath)}\n`);
    process.exitCode = audit.verdict === 'clean' ? 0 : 1;
}
```

- [ ] **Step 4: Add the scripts directory to type-checking**

Edit `tsconfig.json` — change the `include` array to:

```json
  "include": [
    "*.ts",
    "scripts/**/*.ts",
    "ClientApp/src/**/*",
    ".storybook/**/*",
    "tests/**/*"
  ],
```

- [ ] **Step 5: Run tests and type-check to verify they pass**

Run: `npm run test:unit -- --reporter=default tests/unit/quality/storybookLogAudit.test.ts && npm run type-check`
Expected: 5 tests PASS; `tsc --noEmit` exits 0.

- [ ] **Step 6: Prove the auditor against the historical false negative**

Run: `node scripts/audit-storybook-log.ts docs/change-record/storybbok_change_remaining_errors.md`
Expected: exit code 1, output beginning `INVALID  docs/change-record/storybbok_change_remaining_errors.md` and naming `JavaScript heap out of memory`.

This is the regression proof for F1: the artifact the previous attempt reported as clean is now correctly classified as unusable.

- [ ] **Step 7: Commit**

```bash
git add scripts/audit-storybook-log.ts tsconfig.json tests/unit/quality/storybookLogAudit.test.ts
git commit -m "test(tooling): add a run-log auditor that rejects truncated evidence"
```

---

## Task 2: Isolate the confounded dependency variable

**Rationale (F6):** `ast-v8-to-istanbul` — the V8-to-Istanbul remapper — moved 1.0.4 to 1.0.5 in the same commit as the remap fix. Until that is isolated, no claim about the JSON remap root cause is testable.

**Files:**
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Create: `docs/change-record/2026-08-30-storybook-remediation-audit.md` (started here, completed in Task 10)

**Interfaces:**
- Consumes: `installedVersions(packageName: string): string[]` — already defined at `tests/unit/config/dependencySecurity.test.ts:26`.
- Produces: a recorded, guarded version floor for the remapping cohort.

- [ ] **Step 1: Capture the exact lockfile delta as evidence**

```bash
git show 23f0a2f -- package-lock.json > /tmp/lockfile-delta.diff
git show 23f0a2f -- package-lock.json | grep -E "^[+-]\s+\"version\"" | sort | uniq -c
npm ls ast-v8-to-istanbul magicast obug std-env
```

Expected: the four version moves from F6, and `ast-v8-to-istanbul@1.0.5` resolved once.

- [ ] **Step 2: Determine whether the bump was intentional or incidental**

```bash
git log -1 --format=%H%n%s 23f0a2f
git diff 23f0a2f~1 23f0a2f -- package.json
```

Expected: `package.json` is **unchanged** by the commit. That establishes the lockfile moved without a declared dependency change — an incidental `npm install` re-resolution, consistent with the known lockfile-corruption defect (packages missing `resolved`).

Record the finding. Do **not** revert the lockfile: `package.json` declares no change, `npm ci` is reproducible against the current file, and reverting would reintroduce the missing `resolved` entries. The correct action is to pin the causally-relevant package with a guard so the next incidental re-resolution is loud.

- [ ] **Step 3: Write the failing guard test**

Append to `tests/unit/config/dependencySecurity.test.ts`:

```ts
describe("coverage remapping cohort", () => {
  // ast-v8-to-istanbul performs the V8-to-Istanbul remap that emitted the
  // `terms-config.json?import` parse failure. It moved 1.0.4 -> 1.0.5 as an
  // incidental lockfile re-resolution in 23f0a2f, confounding that commit's
  // remap fix with a dependency change. Pin it so the next incidental move is
  // visible rather than silent.
  it("resolves the V8-to-Istanbul remapper at exactly one reviewed version", () => {
    expect(installedVersions("ast-v8-to-istanbul")).toEqual(["1.0.5"]);
  });

  it("keeps the coverage provider aligned with the Vitest cohort", () => {
    expect(installedVersions("@vitest/coverage-v8")).toEqual(["4.1.11"]);
  });
});
```

- [ ] **Step 4: Run the guard**

Run: `npm run test:unit -- --reporter=default tests/unit/config/dependencySecurity.test.ts`
Expected: PASS. If `ast-v8-to-istanbul` resolves to more than one version or a different version, STOP and report — that is a blocker, not something to edit the expectation around.

- [ ] **Step 5: Establish whether the version bump alone changes the JSON remap**

```bash
git stash push --include-untracked
git checkout 23f0a2f~1 -- package-lock.json
npm ci
npm run test:storybook -- --coverage --reporter=default 2>&1 | tee /tmp/premap-baseline.log
node scripts/audit-storybook-log.ts /tmp/premap-baseline.log
```

Then restore:

```bash
git checkout HEAD -- package-lock.json
npm ci
git stash pop
```

Expected: the audit reports `dirty` with `Failed to parse` present at `ast-v8-to-istanbul@1.0.4`. That result attributes the JSON remap failure to the **configuration**, not the dependency bump, and clears the confound. If the audit instead reports `clean` at 1.0.4, the bump caused the failure and the whole Issue-3 fix must be re-scoped — STOP and report.

- [ ] **Step 6: Start the change record**

Create `docs/change-record/2026-08-30-storybook-remediation-audit.md` with a `## Dependency isolation` section holding the Step 1-5 outputs verbatim.

- [ ] **Step 7: Commit**

```bash
git add tests/unit/config/dependencySecurity.test.ts docs/change-record/2026-08-30-storybook-remediation-audit.md
git commit -m "test(deps): pin the V8-to-Istanbul remapper and record the 23f0a2f lockfile drift"
```

---

## Task 3: Replace the tautological coverage assertions with an artifact audit

**Rationale (F3, F4):** `coverageRemapPolicy.test.ts` and `vitestTopology.test.ts` assert the exported config object. They pass whether or not Vitest ever applies that object. Assert the emitted coverage report instead.

**Files:**
- Create: `scripts/audit-coverage-report.ts`
- Modify: `tests/unit/config/coverageRemapPolicy.test.ts`
- Test: `tests/unit/quality/coverageReportAudit.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export type CoverageReportAudit = {
      nonExecutableEntries: string[];
      executableEntryCount: number;
      verdict: 'clean' | 'dirty';
  };
  export const auditCoverageReport: (
      report: Record<string, unknown>,
      minimumExecutableEntries: number,
  ) => CoverageReportAudit;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/unit/quality/coverageReportAudit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { auditCoverageReport } from '../../../scripts/audit-coverage-report';

const entry = (path: string): [string, { path: string }] => [path, { path }];

const cleanReport = Object.fromEntries([
    entry('C:/repo/ClientApp/src/components/Footer/index.tsx'),
    entry('C:/repo/ClientApp/src/utils/index.ts'),
    entry('C:/repo/ClientApp/src/env.ts'),
]);

describe('storybook coverage report audit', () => {
    it('passes a report containing only executable application source', () => {
        const audit = auditCoverageReport(cleanReport, 3);

        expect(audit.nonExecutableEntries).toEqual([]);
        expect(audit.executableEntryCount).toBe(3);
        expect(audit.verdict).toBe('clean');
    });

    it('names any non-executable asset that reached the remapper', () => {
        const report = Object.fromEntries([
            ...Object.entries(cleanReport),
            entry('C:/repo/ClientApp/src/terms-config.json?import'),
        ]);

        const audit = auditCoverageReport(report, 3);

        expect(audit.nonExecutableEntries).toEqual([
            'C:/repo/ClientApp/src/terms-config.json?import',
        ]);
        expect(audit.verdict).toBe('dirty');
    });

    it('fails when coverage has been gutted rather than narrowed', () => {
        // Excluding the JSON asset must not be achievable by excluding the
        // application source that imports it.
        const audit = auditCoverageReport(Object.fromEntries([entry('C:/repo/ClientApp/src/env.ts')]), 3);

        expect(audit.executableEntryCount).toBe(1);
        expect(audit.verdict).toBe('dirty');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --reporter=default tests/unit/quality/coverageReportAudit.test.ts`
Expected: FAIL with `Failed to resolve import "../../../scripts/audit-coverage-report"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/audit-coverage-report.ts`:

```ts
/**
 * Audits an emitted V8 coverage report (coverage-final.json).
 *
 * The coverage *policy* lives in a config object, but Vitest 4 resolves
 * coverage from the root config only, so a project-level policy is inert on
 * some run paths. Asserting the config literal therefore proves nothing.
 * This auditor asserts the artifact the run actually produced.
 *
 * Usage: node scripts/audit-coverage-report.ts <coverage-final.json> <min-entries>
 */
import { readFileSync } from 'node:fs';

export type CoverageReportAudit = {
    nonExecutableEntries: string[];
    executableEntryCount: number;
    verdict: 'clean' | 'dirty';
};

const EXECUTABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

const withoutQuery = (id: string): string => id.split('?')[0];

const isExecutable = (id: string): boolean =>
    EXECUTABLE_EXTENSIONS.some((extension) => withoutQuery(id).endsWith(extension));

export const auditCoverageReport = (
    report: Record<string, unknown>,
    minimumExecutableEntries: number,
): CoverageReportAudit => {
    const ids = Object.keys(report);
    const nonExecutableEntries = ids.filter((id) => !isExecutable(id));
    const executableEntryCount = ids.length - nonExecutableEntries.length;

    const verdict =
        nonExecutableEntries.length === 0 && executableEntryCount >= minimumExecutableEntries
            ? 'clean'
            : 'dirty';

    return { nonExecutableEntries, executableEntryCount, verdict };
};

const [, , reportPath, minimum] = process.argv;

if (reportPath !== undefined) {
    const report = JSON.parse(readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
    const audit = auditCoverageReport(report, Number(minimum ?? 1));

    process.stdout.write(
        `${audit.verdict.toUpperCase()}  ${reportPath}\n` +
            `  executable entries: ${audit.executableEntryCount}\n` +
            audit.nonExecutableEntries.map((id) => `  non-executable: ${id}\n`).join(''),
    );
    process.exitCode = audit.verdict === 'clean' ? 0 : 1;
}
```

- [ ] **Step 4: Run tests and type-check to verify they pass**

Run: `npm run test:unit -- --reporter=default tests/unit/quality/coverageReportAudit.test.ts && npm run type-check`
Expected: 3 tests PASS; `tsc --noEmit` exits 0.

- [ ] **Step 5: Delete the tautological plugin test**

In `tests/unit/config/coverageRemapPolicy.test.ts`, delete the whole
`it("adapts Storybook manager runs to supported Vitest and JSON coverage APIs", ...)` block, plus the now-unused `vi` import and the `storybookVitestRuntimePlugin` import. It is superseded by Task 4's contract test. Keep the remaining assertions in that file — they still document intent, even though they are not the proof.

- [ ] **Step 6: Run the config suite**

Run: `npm run test:unit -- --reporter=default tests/unit/config tests/unit/coverage && npm run lint`
Expected: PASS, with no unused-import lint errors.

- [ ] **Step 7: Commit**

```bash
git add scripts/audit-coverage-report.ts tests/unit/quality/coverageReportAudit.test.ts tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "test(coverage): audit the emitted report instead of the config literal"
```

---

## Task 4: Give the `vitest.init` bridge a real contract test

**Rationale (F4):** The bridge is correct today. The risk is that it silently outlives its need, or silently stops working. Both are detectable by asserting the installed sources.

**Files:**
- Create: `tests/unit/config/storybookVitestContract.test.ts`

**Interfaces:**
- Consumes: `storybookVitestRuntimePlugin` from `vitest.storybook.runtime.ts` (already exported; `configureVitest({ vitest })` mutates `vitest.config.coverage.exclude` and reassigns `vitest.init`).
- Produces: an expiry guard that fails when either side of the contract moves.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/config/storybookVitestContract.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { storybookVitestRuntimePlugin } from '../../../vitest.storybook.runtime';

const require = createRequire(import.meta.url);

const readInstalled = (specifier: string): string =>
    readFileSync(require.resolve(specifier), 'utf8');

const vitestNodeSource = readInstalled('vitest/node');
const addonSource = readInstalled('@storybook/addon-vitest/dist/node/vitest.js');

describe('Storybook/Vitest runtime bridge contract', () => {
  // The bridge exists solely because @storybook/addon-vitest calls a Vitest API
  // that Vitest deprecated. Each half of that statement is asserted here, so the
  // bridge cannot quietly outlive its justification.

  it('still has a dependency-owned deprecated call to bridge', () => {
    // When this fails, Storybook has moved off init(): delete the init
    // assignment in vitest.storybook.runtime.ts and this test with it.
    expect(addonSource).toContain('this.vitest.init()');
  });

  it('bridges to an API that Vitest still exposes as the supported replacement', () => {
    expect(vitestNodeSource).toMatch(/async standalone\(\)/);
  });

  it('bridges to an API that is behaviourally identical to the deprecated one', () => {
    // Vitest's own init() is a deprecation log plus a delegation to standalone(),
    // which is what makes the bridge a no-op in behaviour rather than a change.
    expect(vitestNodeSource).toMatch(/init\(\)\s*\{[^}]*deprecate[^}]*return this\.standalone\(\)/s);
  });

  it('routes the deprecated call and keeps JSON out of manager-path remapping', () => {
    const standalone = vi.fn();
    const legacyInit = vi.fn();
    const vitest = {
      config: { coverage: { exclude: [] as string[] } },
      init: legacyInit,
      standalone,
    };

    storybookVitestRuntimePlugin.configureVitest({ vitest });

    void vitest.init();
    expect(standalone).toHaveBeenCalledOnce();
    expect(legacyInit).not.toHaveBeenCalled();
    expect(vitest.config.coverage.exclude).toContain('ClientApp/src/**/*.json');
  });
});
```

If `require.resolve('vitest/node')` resolves to a re-export shim rather than the chunk containing `init()`, resolve the chunk instead: read the shim, extract its single `from './chunks/...'` specifier, and read that file. Record whichever form you used in the change record.

- [ ] **Step 2: Run test to verify the contract holds and the assertions are live**

Run: `npm run test:unit -- --reporter=default tests/unit/config/storybookVitestContract.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 3: Prove the expiry guard actually fires**

Temporarily change the first assertion to `expect(addonSource).toContain('this.vitest.neverCalled()')` and re-run.
Expected: FAIL. Revert the edit immediately. This proves the guard reads the installed source rather than passing vacuously.

- [ ] **Step 4: Re-run and check static gates**

Run: `npm run test:unit -- --reporter=default tests/unit/config/storybookVitestContract.test.ts && npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/config/storybookVitestContract.test.ts
git commit -m "test(storybook): guard the vitest.init bridge against both sides of its contract"
```

---

## Task 5: Close the MSW lookup gap the log did not show

**Rationale (F5):** Four lookup types are requested by application code; two are mocked. Both handlers fall through on a non-match, so the gap reproduces the original warning silently.

**Files:**
- Modify: `.storybook/msw-handlers.ts`
- Modify: `ClientApp/src/storybook/storybookFixtures.ts`
- Test: `tests/unit/storybook/mswHandlers.test.ts`

**Interfaces:**
- Consumes: `CRMLookupTypes`, `LookupResponse` from `ClientApp/src/api/web-api-client` (generated, never edited); `lookupResponses`, `artefactTypeResponses`, `serviceResponses` from `ClientApp/src/storybook/storybookFixtures`.
- Produces:
  ```ts
  // ClientApp/src/storybook/storybookFixtures.ts
  export const paCategoryResponses: LookupResponse[];
  export const paInstrumentTypeResponses: LookupResponse[];

  // .storybook/msw-handlers.ts
  export const lookupResponsesByType: Partial<Record<CRMLookupTypes, LookupResponse[]>>;
  export const mswHandlers: RequestHandler[];
  ```

- [ ] **Step 1: Write the failing test**

Replace the body of `tests/unit/storybook/mswHandlers.test.ts` with:

```ts
import { globSync, readFileSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CRMLookupTypes } from '../../../ClientApp/src/api/web-api-client';
import { serviceResponses } from '../../../ClientApp/src/storybook/storybookFixtures';
import { lookupResponsesByType, mswHandlers } from '../../../.storybook/msw-handlers';

const server = setupServer(...mswHandlers);

const apiUrl = (path: string) => new URL(path, globalThis.location.origin);

/**
 * Derived from application source, not from a run log. The previous handler set
 * mocked exactly the two lookup types that appeared in one captured log, while
 * ClientApp/src/routes/ta/** requests two more. Enumerating the call sites is
 * what makes this test able to fail on the next unmocked lookup.
 */
const requestedLookupTypes = [
    ...new Set(
        globSync('ClientApp/src/**/*.{ts,tsx}')
            .filter((file) => !file.includes('web-api-client'))
            .flatMap((file) => [
                ...readFileSync(file, 'utf8').matchAll(/getLookup\(\s*CRMLookupTypes\.(\w+)/g),
            ].map((match) => match[1])),
    ),
];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Storybook MSW handlers', () => {
    it('finds the lookup call sites it is supposed to cover', () => {
        // Guards the enumeration itself: a regex that matched nothing would make
        // every case below vacuous.
        expect(requestedLookupTypes.length).toBeGreaterThanOrEqual(4);
        expect(requestedLookupTypes).toContain('PAPortalCategory');
    });

    it('returns the shared services fixture', async () => {
        const response = await fetch(apiUrl('/api/lookup/services'));

        expect(response.ok).toBe(true);
        await expect(response.json()).resolves.toEqual(serviceResponses);
    });

    it.each(requestedLookupTypes)(
        'answers every lookup type application code requests: %s',
        async (lookupTypeName) => {
            const lookupType = CRMLookupTypes[lookupTypeName as keyof typeof CRMLookupTypes];
            const url = apiUrl('/api/lookup');
            url.searchParams.set('LookupType', lookupType);

            const response = await fetch(url);

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toEqual(lookupResponsesByType[lookupType]);
        },
    );

    it('fails closed with 501 on an unmapped lookup type instead of falling through', async () => {
        // Falling through reaches MSW's unhandled-request path, which is the exact
        // warning this handler set exists to remove. A 501 surfaces the missing
        // fixture inside the story that needs it.
        const url = apiUrl('/api/lookup');
        url.searchParams.set('LookupType', 'NotARealLookupType');

        const response = await fetch(url);

        expect(response.status).toBe(501);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --reporter=default tests/unit/storybook/mswHandlers.test.ts`
Expected: FAIL — `lookupResponsesByType` is not exported, and the `PAPortalCategory` / `PAPortalInstrumentType` cases reach MSW's `onUnhandledRequest: 'error'`.

- [ ] **Step 3: Add the missing fixtures**

Append to `ClientApp/src/storybook/storybookFixtures.ts`:

```ts
export const paCategoryResponses: LookupResponse[] = [
    { id: 'pa-measuring-instruments', label: 'Measuring instruments' },
    { id: 'pa-weighing-instruments', label: 'Weighing instruments' },
];

export const paInstrumentTypeResponses: LookupResponse[] = [
    { id: 'pa-non-automatic-weighing', label: 'Non-automatic weighing instrument', parentId: 'pa-weighing-instruments' },
    { id: 'pa-utility-meter', label: 'Utility meter', parentId: 'pa-measuring-instruments' },
];
```

If `LookupResponse` requires fields beyond `id` / `label` / `parentId`, mirror the shape already used by `lookupResponses` in the same file — do not invent fields. `LookupResponse` is generated; read it from `ClientApp/src/api/web-api-client.ts`, never edit it.

- [ ] **Step 4: Replace the two fall-through handlers with one explicit map**

Replace `.storybook/msw-handlers.ts` with:

```ts
import { http, HttpResponse } from 'msw';
import { CRMLookupTypes, type LookupResponse } from '../ClientApp/src/api/web-api-client';
import {
    artefactTypeResponses,
    lookupResponses,
    paCategoryResponses,
    paInstrumentTypeResponses,
    serviceResponses,
} from '../ClientApp/src/storybook/storybookFixtures';

/**
 * One entry per CRMLookupTypes value that application code passes to
 * getLookup(). tests/unit/storybook/mswHandlers.test.ts enumerates those call
 * sites from source and fails when this map falls behind them.
 */
export const lookupResponsesByType: Partial<Record<CRMLookupTypes, LookupResponse[]>> = {
    [CRMLookupTypes.TCPortalMeasurementCategory]: lookupResponses,
    [CRMLookupTypes.TCArtefactTypePortalCategory]: artefactTypeResponses,
    [CRMLookupTypes.PAPortalCategory]: paCategoryResponses,
    [CRMLookupTypes.PAPortalInstrumentType]: paInstrumentTypeResponses,
};

export const mswHandlers = [
    http.get('/api/dashboard/*', () =>
        HttpResponse.json({
            items: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
        })
    ),
    http.get('/api/lookup/services', () => HttpResponse.json(serviceResponses)),
    // A single handler scoped to one endpoint the application owns. Returning
    // undefined here would fall through to MSW's unhandled-request path - the
    // very warning this file exists to remove - so an unmapped type fails closed
    // and surfaces inside the story that needs the fixture.
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType') as CRMLookupTypes | null;
        const fixture = lookupType === null ? undefined : lookupResponsesByType[lookupType];

        if (fixture === undefined) {
            return HttpResponse.json(
                { error: `No Storybook fixture for LookupType=${lookupType ?? '(missing)'}` },
                { status: 501 },
            );
        }

        return HttpResponse.json(fixture);
    }),
];
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- --reporter=default tests/unit/storybook/mswHandlers.test.ts && npm run type-check && npm run lint`
Expected: all cases PASS, including one generated case per lookup type found in source.

- [ ] **Step 6: Prove the gap is closed in the real story surface**

```bash
npm run test:storybook -- --reporter=default ClientApp/src/routes/ta 2>&1 | tee /tmp/ta-stories.log
node scripts/audit-storybook-log.ts /tmp/ta-stories.log
```

Expected: `CLEAN`. If the audit reports `INVALID`, the run did not complete — fix that before reading the result.

- [ ] **Step 7: Commit**

```bash
git add .storybook/msw-handlers.ts ClientApp/src/storybook/storybookFixtures.ts tests/unit/storybook/mswHandlers.test.ts
git commit -m "fix(storybook): mock every lookup type application code requests"
```

---

## Task 6: Restore a real topology invariant

**Rationale (F3, F8):** The invariant `expect(storybook.coverage).toBeUndefined()` was deleted to make the new config pass. The replacement asserts a literal that Vitest ignores on two of three paths. Assert the constraint that actually matters instead: because project-level coverage is inert under the aggregate root config, no script may run the aggregate config with coverage enabled.

**Files:**
- Modify: `tests/unit/config/vitestTopology.test.ts`

**Interfaces:**
- Consumes: the existing `storybook` project-config binding already declared at the top of `tests/unit/config/vitestTopology.test.ts`.
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

Replace the `it("owns only the Storybook executable-source coverage policy", ...)` block in `tests/unit/config/vitestTopology.test.ts` with:

```ts
  it("owns the Storybook coverage policy for the one path that applies it", () => {
    // Vitest 4 resolves coverage from the ROOT config only
    // (vitest/dist/chunks/cli-api...js, `get _coverageOptions()`). This block
    // therefore applies when `--config vitest.storybook.config.ts` makes this
    // file the root - i.e. the `test:storybook` script - and is inert when the
    // project is loaded through the aggregate `vitest.config.ts`.
    expect(storybook.coverage?.reportsDirectory).toBe(
      "./reports/coverage/storybook",
    );
    expect(storybook.coverage?.include).toEqual([
      "ClientApp/src/**/*.{ts,tsx}",
    ]);
  });

  it("never lets a script enable coverage through the aggregate root config", async () => {
    // Where project coverage is inert, enabling coverage would silently fall
    // back to Vitest defaults - reinstating the JSON remap failure and dropping
    // the unit config's 100% thresholds - with nothing to signal it.
    const rootConfig = (await import("../../../vitest.config")).default;
    expect(rootConfig.test?.coverage).toBeUndefined();

    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;
    const aggregateRunsWithCoverage = Object.entries(scripts).filter(
      ([, command]) =>
        command.includes("--coverage") && !command.includes("--config"),
    );

    expect(aggregateRunsWithCoverage).toEqual([]);
  });
```

Add `import { readFileSync } from "node:fs";` to the file's imports if it is not already present.

- [ ] **Step 2: Run test to verify the invariant holds**

Run: `npm run test:unit -- --reporter=default tests/unit/config/vitestTopology.test.ts`
Expected: PASS. If `aggregateRunsWithCoverage` is non-empty, that is a real defect this audit found — STOP and report it rather than relaxing the assertion.

- [ ] **Step 3: Prove the invariant fires**

Temporarily add `"probe:bad": "vitest run --coverage"` to `package.json` scripts, then re-run the test.
Expected: FAIL naming `probe:bad`. Remove the script immediately.

- [ ] **Step 4: Re-run and confirm the probe left nothing behind**

Run: `npm run test:unit -- --reporter=default tests/unit/config && npm run lint && git diff --stat package.json`
Expected: PASS; `package.json` shows no diff.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/config/vitestTopology.test.ts
git commit -m "test(config): guard the aggregate root config against inert coverage"
```

---

## Task 7: Root-cause the SlateEditor flake instead of inheriting the edit

**Rationale (F9):** `userEvent.click(textbox)` was added because the story went red under coverage. Either the click is the correct fix for a latent focus bug (keep it, with the reason recorded) or it masks a timing problem (replace it with a wait). Decide from evidence.

**Files:**
- Modify: `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no new exports.

- [ ] **Step 1: Reproduce the failure deterministically at the prior revision**

```bash
git stash push --include-untracked
git checkout 23f0a2f~1 -- ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx
npm run test:storybook -- --coverage --reporter=default ClientApp/src/components/SlateEditor 2>&1 | tee /tmp/slate-pre.log
npm run test:storybook -- --reporter=default ClientApp/src/components/SlateEditor 2>&1 | tee /tmp/slate-pre-nocov.log
```

Expected: red under `--coverage`, green without. If it is red in both, the flake is not coverage-related and the diagnosis below changes — record what you actually see.

- [ ] **Step 2: Distinguish focus from timing**

Restore the current version:

```bash
git checkout HEAD -- ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx
```

Hypothesis A (focus): the current `await userEvent.click(textbox)` fixes it — already the case if the story is green under coverage.

Hypothesis B (timing): remove the click and wrap the assertion in a wait, then run under coverage:

```tsx
        await userEvent.type(canvas.getByRole('textbox'), 'Hi');
        await waitFor(() => expect(canvas.getByText(/9\s*\/\s*500/)).toBeVisible());
```

Run: `npm run test:storybook -- --coverage --reporter=default ClientApp/src/components/SlateEditor`

- [ ] **Step 3: Keep the narrower fix and record why**

If B passes, prefer B — it preserves the original interaction and only relaxes the assertion's timing, which is what the spec's "preserve behaviour and assertions" asks for.

If B fails and A passes, the story was latently broken (Slate's `contenteditable` needs focus before `type` delivers input) — keep A and add the comment:

```tsx
        // Slate's contenteditable only receives typed input once focused;
        // userEvent.type alone passed by timing before coverage instrumentation
        // slowed the first keystroke. See
        // docs/change-record/2026-08-30-storybook-remediation-audit.md.
        await userEvent.click(textbox);
```

If both fail, STOP and report — the story has a defect neither edit addresses.

- [ ] **Step 4: Verify and restore the worktree**

Run: `npm run test:storybook -- --coverage --reporter=default ClientApp/src/components/SlateEditor 2>&1 | tee /tmp/slate-final.log && node scripts/audit-storybook-log.ts /tmp/slate-final.log && git stash pop`
Expected: `CLEAN`, and the stash restores cleanly.

- [ ] **Step 5: Commit**

```bash
git add ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx
git commit -m "fix(storybook): settle the SlateEditor counter assertion at its root cause"
```

---

## Task 8: Measure the manager-path OOM; do not fix it speculatively

**Rationale (F2):** The Storybook Test-panel path died at ~4 GB after 110 minutes. It runs in watch mode by dependency design and the addon flags its own state cleanup as insufficient. Raising the heap ceiling would hide it. Measure it, attribute it, and record it as an open item — the CLI path is the supported acceptance path.

**Files:**
- Modify: `docs/change-record/2026-08-30-storybook-remediation-audit.md`

**Interfaces:**
- Consumes: `scripts/audit-storybook-log.ts` from Task 1.
- Produces: an `## Open item: manager-path memory growth` section with measurements.

- [ ] **Step 1: Confirm which process holds the memory**

Start the manager and trigger a Test-panel coverage run:

```bash
npm run storybook 2>&1 | tee /tmp/manager.log
```

While the run is in progress, sample from a second shell:

```powershell
Get-Process node | Select-Object Id, @{n='RSS_MB';e={[int]($_.WorkingSet64/1MB)}}, StartTime | Sort-Object RSS_MB -Descending
```

Record the peak RSS per PID and which PID corresponds to `storybook dev`.

- [ ] **Step 2: Establish that the CLI path does not share the growth**

```bash
npm run test:storybook -- --coverage --reporter=default 2>&1 | tee /tmp/cli-coverage.log
node scripts/audit-storybook-log.ts /tmp/cli-coverage.log
```

Expected: the run completes (`Test Files 87 passed`) well inside the 8 GB ceiling the script already sets, and the audit reports a verdict other than `INVALID`.

- [ ] **Step 3: Attribute the growth**

Record in the change record:

* `@storybook/addon-vitest/dist/node/vitest.js:229` sets `watch: !0` — the manager holds a Vitest instance for the session's lifetime.
* `@storybook/addon-vitest/dist/node/vitest.js:167` — `// TODO: Clearing the whole internal state of Vitest might be too aggressive` — the addon's own note that `clearVitestState` is partial.
* Whether `maxWorkers: 1` in `vitest.storybook.config.ts` measurably changes the peak. Re-run Step 1 with `maxWorkers: 2` temporarily; revert either way.

- [ ] **Step 4: Write the open item; do not change the `storybook` script**

Add to `docs/change-record/2026-08-30-storybook-remediation-audit.md`:

```markdown
## Open item: Storybook manager-path memory growth (not fixed by this plan)

A long-lived `npm run storybook` session hosting @storybook/addon-vitest grows
without bound and dies at Node's default ~4 GB ceiling. Measured peak RSS: <fill in>.
Attribution: the addon holds a watch-mode Vitest instance for the session lifetime
and clears its state only partially (its own TODO at node/vitest.js:167).

Deliberately NOT fixed here:
- Adding --max-old-space-size to the `storybook` script raises the ceiling and
  hides the growth; it does not bound it.
- The supported acceptance path is `npm run test:storybook`, which already sets
  8192 MB and terminates. All acceptance evidence in this plan comes from it.

Follow-up: raise upstream against @storybook/addon-vitest with the measurements above.
```

- [ ] **Step 5: Commit**

```bash
git add docs/change-record/2026-08-30-storybook-remediation-audit.md
git commit -m "docs(change-record): record the Storybook manager-path memory growth as an open item"
```

---

## Task 9: Separate the conflated commit in the record

**Rationale (F7):** History is on a pushed branch (PR #1) and must not be rewritten. Make the ownership split legible and the revert executable instead.

**Files:**
- Modify: `docs/change-record/2026-08-30-storybook-remediation-audit.md`

**Interfaces:**
- Consumes: nothing.
- Produces: an `## Ownership split for 23f0a2f` section.

- [ ] **Step 1: Produce the file-by-file split**

```bash
git show --stat 23f0a2f
```

- [ ] **Step 2: Write the split**

Add to the change record:

```markdown
## Ownership split for 23f0a2f

`23f0a2f` bundles two unrelated concerns. Recorded here because history is on a
pushed branch and is not being rewritten.

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
- `vitest.storybook.config.ts`, `vitest.storybook.coverage.ts`, `vitest.storybook.runtime.ts`, `vitest.unit.config.ts`
- `tests/unit/analytics/googleAnalytics.test.tsx`, `tests/unit/config/coverageRemapPolicy.test.ts`,
  `tests/unit/config/vitestTopology.test.ts`, `tests/unit/coverage/coverageConfig.test.ts`,
  `tests/unit/storybook/mswHandlers.test.ts`

### Incidental, declared by neither
- `package-lock.json` (+72/-6). See `## Dependency isolation`.

### Revert recipe for the Storybook half only

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

- [ ] **Step 3: Verify the recipe is executable without applying it**

```bash
git revert --no-commit 23f0a2f && git revert --abort
git status --porcelain
```

Expected: no conflict on the dry run; the abort restores the worktree and `git status --porcelain` shows only this plan's in-progress files.

- [ ] **Step 4: Commit**

```bash
git add docs/change-record/2026-08-30-storybook-remediation-audit.md
git commit -m "docs(change-record): record the 23f0a2f ownership split and revert recipe"
```

---

## Task 10: Acceptance run and rubric scorecard

**Rationale:** The spec's acceptance criteria are only met when a **completed** run says so. Every gate below is read through the Task 1 auditor.

**Files:**
- Modify: `docs/change-record/2026-08-30-storybook-remediation-audit.md`

**Interfaces:**
- Consumes: `scripts/audit-storybook-log.ts` (Task 1), `scripts/audit-coverage-report.ts` (Task 3).
- Produces: the final report.

- [ ] **Step 1: Static gates**

```bash
npm run type-check
npm run lint
```

Expected: both exit 0.

- [ ] **Step 2: Full unit suite with coverage**

```bash
npm run test:unit:coverage -- --reporter=default 2>&1 | tee /tmp/acceptance-unit.log
node scripts/audit-storybook-log.ts /tmp/acceptance-unit.log
```

Expected: the summary line is present; test count is **at or above** the pre-change baseline (1495 per the branch record) plus this plan's additions.

- [ ] **Step 3: Storybook suite without coverage**

```bash
npm run test:storybook -- --reporter=default 2>&1 | tee /tmp/acceptance-storybook.log
node scripts/audit-storybook-log.ts /tmp/acceptance-storybook.log
```

Expected: `Test Files 87 passed (87)`, `Tests 218 passed (218)`, auditor verdict `CLEAN`.

- [ ] **Step 4: Storybook suite with coverage**

```bash
npm run test:storybook -- --coverage --reporter=default 2>&1 | tee /tmp/acceptance-storybook-coverage.log
node scripts/audit-storybook-log.ts /tmp/acceptance-storybook-coverage.log
node scripts/audit-coverage-report.ts reports/coverage/storybook/coverage-final.json 100
```

Expected: auditor verdict `CLEAN`; coverage audit `CLEAN` with zero non-executable entries and at least 100 executable entries. A `dirty` coverage audit with a low executable count means coverage was narrowed too far — that is a failure, not a pass.

- [ ] **Step 5: Storybook build**

```bash
npm run build-storybook 2>&1 | tee /tmp/acceptance-build.log
```

Expected: exit 0.

- [ ] **Step 6: Confirm no real analytics network access, in both directions**

```bash
grep -c "googletagmanager.com" /tmp/acceptance-storybook.log /tmp/acceptance-storybook-coverage.log
```

Expected: `0` in both.

Then confirm the production path is still covered:

```bash
npm run test:unit -- --reporter=default tests/unit/analytics/googleAnalytics.test.tsx
```

Expected: PASS, and the file must contain a **positive** case asserting `ReactGA.initialize` **is** called when `env.REACT_APP_GA_TRACKINGID` is set. If only negative cases exist, add the positive one before claiming this criterion — the guard `if (trackId && ReactGA.isInitialized === false)` is otherwise unproven in the direction that matters for production.

- [ ] **Step 7: Confirm the working tree is clean of unrelated change**

```bash
git status --porcelain
git diff --stat main...HEAD -- package.json package-lock.json
```

Expected: no unexpected entries; `package.json` unchanged by this plan, `tsconfig.json` changed only by Task 1's `include` addition, and `package-lock.json` unchanged by this plan.

- [ ] **Step 8: Write the final report**

Complete `docs/change-record/2026-08-30-storybook-remediation-audit.md` with:

1. Root cause for each of the three issue groups, each citing the file:line evidence from the Evidence Base.
2. Fix chosen per group and why it was the narrowest.
3. Every file changed, with justification.
4. Dependency changes: none by this plan; `23f0a2f`'s incidental lockfile drift recorded with old/new versions and the isolation result from Task 2 Step 5.
5. Tests added/modified, with counts.
6. Exact verification commands run (Steps 1-7 above).
7. Test count before/after.
8. Type-check, lint, build and coverage results.
9. Targeted log-search results **with the completion marker stated alongside** — never a bare "0 occurrences".
10. Explicit confirmation of analytics network-access prevention (Step 6).
11. Risks, limitations, follow-up: the manager-path OOM (Task 8), the 118-line `act(...)` backlog owned by `reports/stabilisation/warning-settlement.md`, and the lockfile-corruption defect.
12. Final `git status` / diff assessment.
13. A rubric scorecard scoring this work against the 100-point rubric in the spec, with the evidence for each line.

- [ ] **Step 9: Commit**

```bash
git add docs/change-record/2026-08-30-storybook-remediation-audit.md
git commit -m "docs(change-record): final Storybook diagnostic remediation audit report"
```

---

## Acceptance Criteria

The work is complete only when every line below is true **and** each is evidenced by a log whose auditor verdict is not `INVALID`.

| # | Criterion | Evidence |
| --- | --- | --- |
| 1 | No `vitest.init()` deprecation warning in any completed run | Task 10 Steps 3-4, auditor verdict `CLEAN` |
| 2 | The `init()` bridge is guarded on both sides and expires when Storybook moves | Task 4, 4 passing contract tests incl. the fired-guard proof |
| 3 | No unhandled MSW request for any lookup type application code requests | Task 5 source-derived exhaustiveness test; Task 10 Steps 3-4 |
| 4 | An unmapped lookup type fails closed rather than falling through | Task 5, 501 test |
| 5 | No real Google Tag Manager request during Storybook tests | Task 10 Step 6, `grep -c` returns 0 |
| 6 | Production analytics initialisation is positively asserted, not only negatively | Task 10 Step 6 |
| 7 | V8 coverage completes with no JSON parse/remap failure | Task 10 Step 4, coverage audit `CLEAN`, zero non-executable entries |
| 8 | Coverage is narrowed, not gutted | Task 10 Step 4, at least 100 executable entries |
| 9 | The coverage policy's inertness under the aggregate config cannot become a silent hole | Task 6 invariant + fired-guard proof |
| 10 | All 87 files / 218 story tests still pass | Task 10 Step 3 summary line |
| 11 | The unit suite is at or above its prior count | Task 10 Step 2 |
| 12 | Type-check, lint and Storybook build pass | Task 10 Steps 1, 5 |
| 13 | No unrelated files or dependencies changed by this plan | Task 10 Step 7 |
| 14 | The `23f0a2f` lockfile drift is isolated, guarded and recorded | Task 2 |
| 15 | Out-of-scope diagnostics are recorded, not suppressed | Task 8 and Task 10 Step 8 item 11 |
| 16 | No acceptance claim rests on a log scan over a truncated run | Task 1, enforced by `scripts/audit-storybook-log.ts` in every gate |
| 17 | `terms-config.json` still loads as data at runtime | The retained `it("loads the terms configuration as data")` case in `tests/unit/config/coverageRemapPolicy.test.ts`, run in Task 3 Step 6 and Task 10 Step 2 |

**Blocking conditions.** Stop and report with evidence rather than adjusting an expectation if:

* `ast-v8-to-istanbul` resolves at more than one version, or a version other than 1.0.5 (Task 2 Step 4).
* The JSON remap failure does **not** reproduce at `ast-v8-to-istanbul@1.0.4` (Task 2 Step 5) — that would mean the dependency bump, not the config, was the fix.
* An aggregate-config script enables coverage (Task 6 Step 2).
* The SlateEditor story fails under both hypotheses (Task 7 Step 3).
* Any acceptance log audits as `INVALID` twice in a row.

---

## Out of Scope — recorded, not fixed

* **36 `act(...)` warnings** in the captured log. Owned by Task C3 and documented with a three-mode settlement experiment and an attribution-drift proof in `reports/stabilisation/warning-settlement.md` (118 lines, 13 owner stories, measured at commit `430820c`). Do not re-open or re-diagnose them here.
* **Lockfile corruption** — 1272 packages missing `resolved`. Pre-existing and deferred on this branch. Task 2 guards only the one package causally implicated in the remap.
* **Chromatic interleaving** in the captured log. An artefact of how the evidence was captured, not a defect.
