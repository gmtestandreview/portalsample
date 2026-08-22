# Playwright BDD v9 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade this source-map capture snapshot from `playwright-bdd` v8.5.1 to the latest v9.x release, remove the vulnerable older Cucumber dependency tree, and keep the BDD E2E suite reproducible.

**Architecture:** This is a dependency and test-runner migration, not an app behavior change. Keep source edits scoped to package metadata, Playwright BDD configuration/reporters if needed, BDD step signatures only if v9 generation fails, CI Node verification, and migration evidence documentation.

**Tech Stack:** React 18, TypeScript, npm 11, Node 20+, Playwright Test 1.60, Playwright-BDD 9, Cucumber messages/gherkin/expression packages, GitHub Actions.

---

## Source Notes

- Playwright-BDD v9 raises the minimum Node.js version to 20+, removes the deprecated `enrichReporterData` option, changes default Cucumber JUnit test-case naming, skips Cucumber JSON attachments by default, validates step definition arity more strictly, and deprecates `junit-modern` in favor of `junit`.
- `npm view playwright-bdd version peerDependencies dependencies --json` currently reports `9.0.0` and peer dependency `@playwright/test >=1.44`. This repo already declares `@playwright/test` as `^1.60.0`.
- The root `package.json` already declares `"engines": { "node": ">=20.0.0" }`.
- Current local shell Node is `v24.16.0`.
- GitHub Actions currently uses Node `22` in `.github/workflows/pr.yml` and `.github/workflows/release.yml`, which satisfies the v9 Node floor.

## File Structure

- Modify `package.json`: change only `devDependencies.playwright-bdd` from `^8.5.1` to `^9.0.0`; keep existing npm scripts unless execution proves `test:e2e` must call `bddgen`.
- Modify `package-lock.json`: regenerate with npm so `playwright-bdd` and its Cucumber dependency tree resolve to v9-compatible versions.
- Inspect, and modify only if needed, `playwright.config.ts`: confirm there is no removed `enrichReporterData`; add Cucumber reporters only if the project already needs Cucumber-format artifacts; avoid changing existing Playwright HTML/list reporting unnecessarily.
- Inspect, and modify only if needed, `tests/e2e/steps/common.steps.ts`: fix any v9 arity failures reported by `bddgen`.
- Inspect, and modify only if needed, `tests/e2e/steps/storybook.steps.ts`: fix any v9 arity failures reported by `bddgen`.
- Inspect, and modify only if needed, `.github/workflows/pr.yml`: only adjust if CI has a real BDD generation gap or Node floor mismatch after local verification.
- Inspect, and modify only if needed, `.github/workflows/release.yml`: only adjust if Node setup diverges from the package engine floor after local verification.
- Create `docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md`: capture dependency diff, audit result, generation result, E2E result, and any reporter behavior decision.

## Migration Policy

- Do not edit generated/vendor/captured files: `ClientApp/src/api/web-api-client.ts`, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, `ClientApp/webpack/**`.
- Do not edit `.features-gen/**` by hand. Regenerate it with `npx bddgen`; commit generated files only if they are already tracked and changed by generation.
- Keep reporter behavior stable unless there is an existing Cucumber reporter dependency. The current `playwright.config.ts` uses Playwright `html` and `list`, not `cucumberReporter`, so v9 JUnit/JSON behavior changes are audit points, not mandatory config changes.
- Treat step arity errors as useful compile-time failures. Fix the step signature to match the expression captures plus doc string/data table arguments; do not weaken the BDD config to hide the error.

### Task 1: Baseline And Version Evidence

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Read: `playwright.config.ts`
- Read: `tests/e2e/steps/common.steps.ts`
- Read: `tests/e2e/steps/storybook.steps.ts`
- Read: `.github/workflows/pr.yml`
- Read: `.github/workflows/release.yml`
- Create later: `docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md`

- [ ] **Step 1: Confirm the current dependency and runtime baseline**

Run:

```bash
node --version
npm --version
npm ls playwright-bdd @playwright/test @cucumber/messages @cucumber/gherkin @cucumber/cucumber-expressions @cucumber/tag-expressions --depth=3
npm audit --audit-level=high
```

Expected:

```text
node --version is v20.0.0 or greater
npm ls shows playwright-bdd@8.5.1 before migration
npm audit reports the current vulnerability state that triggered this migration, or exits non-zero with the vulnerable dependency path
```

- [ ] **Step 2: Confirm the latest v9 release and peer requirements**

Run:

```bash
npm view playwright-bdd version peerDependencies dependencies --json
```

Expected:

```json
{
  "version": "9.0.0",
  "peerDependencies": {
    "@playwright/test": ">=1.44"
  }
}
```

If npm reports a newer `9.x` version, use that version in Task 2 instead of `9.0.0`.

- [ ] **Step 3: Check for removed or deprecated v9 config**

Run:

```bash
rg -n "enrichReporterData|junit-modern|cucumberReporter\\(|skipAttachments|nameFormat" playwright.config.ts tests .github docs package.json
```

Expected:

```text
No enrichReporterData matches.
No junit-modern matches.
No cucumberReporter matches unless a Cucumber reporter was added by another branch.
```

If `enrichReporterData` appears in `playwright.config.ts`, delete only that option:

```ts
const testDir = defineBddConfig({
    features: 'tests/e2e/features/**/*.feature',
    steps: 'tests/e2e/steps/**/*.ts',
});
```

- [ ] **Step 4: Commit the baseline evidence only if repository policy wants evidence before code**

Usually skip this commit because no files have changed. If the implementation session creates a temporary baseline note, commit it separately:

```bash
git status --short
git add docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md
git commit -m "docs: capture playwright bdd v9 baseline"
```

### Task 2: Upgrade Package Metadata And Lockfile

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Update the package and lockfile with npm**

Run:

```bash
npm install --save-dev playwright-bdd@^9.0.0
```

If Task 1 found a newer latest `9.x`, run this instead:

```bash
npm install --save-dev playwright-bdd@^9
```

Expected:

```text
package.json devDependencies.playwright-bdd changes from ^8.5.1 to ^9.0.0 or the latest ^9.x range.
package-lock.json resolves node_modules/playwright-bdd to 9.x.
```

- [ ] **Step 2: Verify the direct dependency diff is scoped**

Run:

```bash
git diff -- package.json package-lock.json
```

Expected `package.json` direct change:

```diff
-    "playwright-bdd": "^8.5.1",
+    "playwright-bdd": "^9.0.0",
```

Expected lockfile shape:

```text
node_modules/playwright-bdd version is 9.x.
@cucumber/messages resolves to 32.x.
@cucumber/gherkin resolves to 39.x.
@cucumber/cucumber-expressions resolves to 19.x.
@cucumber/tag-expressions resolves to 9.x.
```

- [ ] **Step 3: Verify the installed dependency tree**

Run:

```bash
npm ls playwright-bdd @cucumber/messages @cucumber/gherkin @cucumber/cucumber-expressions @cucumber/tag-expressions --depth=3
```

Expected:

```text
playwright-bdd@9.x
@cucumber/messages@32.x somewhere under playwright-bdd
@cucumber/gherkin@39.x somewhere under playwright-bdd
@cucumber/cucumber-expressions@19.x somewhere under playwright-bdd
@cucumber/tag-expressions@9.x somewhere under playwright-bdd
```

- [ ] **Step 4: Commit package update**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade playwright-bdd to v9"
```

### Task 3: Generate BDD Tests And Fix v9 Arity Failures

**Files:**
- Modify only if generation fails: `tests/e2e/steps/common.steps.ts`
- Modify only if generation fails: `tests/e2e/steps/storybook.steps.ts`
- Generated by command if tracked: `.features-gen/**`

- [ ] **Step 1: Run BDD generation**

Run:

```bash
npx bddgen
```

Expected:

```text
BDD generation completes without errors.
```

If this passes, skip to Step 6.

- [ ] **Step 2: If generation fails with arity errors, map the failing expression to the step signature**

Run:

```bash
rg -n "GivenStep|WhenStep|ThenStep|Given\\(|When\\(|Then\\(" tests/e2e/steps
```

Use the error message from `npx bddgen` to find the exact step. Apply one of these concrete fixes.

For a Cucumber expression with one capture:

```ts
WhenStep('the user navigates to {string}', async ({ page }, path: string) => {
    await page.goto(path);
    await waitForAppReady(page);
});
```

For a Cucumber expression with two captures:

```ts
WhenStep('the user finds the request {string} with status {string}', async ({ page }, referenceId: string, _status: string) => {
    lastReferenceId = referenceId;
    const requestsTab = page.getByRole('tab', { name: /requests/i }).first();
    if (await requestsTab.count()) {
        await requestsTab.click();
    }
    const requestCard = page.locator(`[id="RefId-${referenceId}"]:visible`).first();
    await expect(requestCard).toBeVisible({ timeout: 15000 });
    await requestCard.scrollIntoViewIfNeeded();
});
```

For a Cucumber expression with zero captures:

```ts
ThenStep('the quotation summary should be displayed', async ({ page }) => {
    const visibleQuotation = page.locator(':text-matches("quotation|quote details", "i"):visible').first();
    if (await visibleQuotation.count()) {
        await expect(visibleQuotation).toBeVisible();
        return;
    }
    await expect(page.locator('body')).toBeVisible();
});
```

- [ ] **Step 3: Add data table or doc string argument only when the feature text requires it**

If `npx bddgen` reports a step with a data table, use this shape:

```ts
import type { DataTable } from '@cucumber/cucumber';

GivenStep('the user has these dashboard requests:', async ({ page }, table: DataTable) => {
    const rows = table.hashes();
    for (const row of rows) {
        mockRequestStatusByReference.set(row.referenceId, row.status);
    }
    await mockApiDefaults(page);
});
```

If `npx bddgen` reports a step with a doc string, use this shape:

```ts
ThenStep('the story iframe should contain the following text:', async ({ page }, expectedText: string) => {
    await expect(page.locator('body')).toContainText(expectedText);
});
```

Only add these examples if the current `.feature` files actually contain a matching data table or doc string.

- [ ] **Step 4: Re-run generation after each arity fix**

Run:

```bash
npx bddgen
```

Expected:

```text
BDD generation completes without arity validation errors.
```

- [ ] **Step 5: Review generated-file diff**

Run:

```bash
git status --short
git diff -- .features-gen tests/e2e/steps
```

Expected:

```text
Step file changes are limited to signature fixes required by v9.
.features-gen changes are generated output only, if that directory is tracked.
```

- [ ] **Step 6: Commit BDD generation and signature fixes**

If files changed:

```bash
git add tests/e2e/steps .features-gen
git commit -m "test: regenerate bdd tests for playwright-bdd v9"
```

If no files changed:

```bash
git status --short
```

Expected:

```text
No step or generated spec changes remain after the dependency commit.
```

### Task 4: Reporter Compatibility Audit

**Files:**
- Inspect: `playwright.config.ts`
- Modify only if needed: `playwright.config.ts`
- Create later: `docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md`

- [ ] **Step 1: Confirm current Playwright reporter configuration**

Run:

```bash
Get-Content -Path playwright.config.ts
```

Expected current reporter block:

```ts
reporter: [['html', { open: 'never', outputFolder: 'reports/playwright' }], ['list']],
```

- [ ] **Step 2: Keep Playwright reporters unchanged when no Cucumber reports are required**

No code change is required if `playwright.config.ts` still has no `cucumberReporter(...)` call.

Expected decision text for the change record:

```text
Reporter decision: no cucumberReporter is configured in this snapshot, so v9 JUnit nameFormat and JSON skipAttachments behavior do not change the current report outputs. Existing Playwright HTML/list reporters remain unchanged.
```

- [ ] **Step 3: If a Cucumber JUnit reporter exists on another branch, preserve old naming explicitly**

If this pattern exists:

```ts
cucumberReporter('junit-modern', { outputFile: 'cucumber-report/report.xml' })
```

Change it to:

```ts
cucumberReporter('junit', {
    outputFile: 'cucumber-report/report.xml',
    nameFormat: 'playwright',
})
```

If this pattern exists:

```ts
cucumberReporter('junit', { outputFile: 'cucumber-report/report.xml' })
```

Change it to:

```ts
cucumberReporter('junit', {
    outputFile: 'cucumber-report/report.xml',
    nameFormat: 'playwright',
})
```

- [ ] **Step 4: If a Cucumber JSON reporter depends on attachments, opt back in explicitly**

If this pattern exists and downstream tooling reads screenshots, traces, or videos from JSON:

```ts
cucumberReporter('json', { outputFile: 'cucumber-report/report.json' })
```

Change it to:

```ts
cucumberReporter('json', {
    outputFile: 'cucumber-report/report.json',
    skipAttachments: false,
})
```

If JSON attachments are not consumed, leave the v9 default in place and document:

```text
JSON reporter decision: attachments are not consumed from Cucumber JSON, so v9 skipAttachments default is accepted.
```

- [ ] **Step 5: Verify reporter config type-checks**

Run:

```bash
npm run type-check
```

Expected:

```text
TypeScript exits 0.
```

- [ ] **Step 6: Commit reporter compatibility changes if any were needed**

If `playwright.config.ts` changed:

```bash
git add playwright.config.ts
git commit -m "test: align bdd reporters with v9"
```

If no reporter change was needed:

```bash
git status --short
```

### Task 5: CI And Script Alignment

**Files:**
- Inspect: `.github/workflows/pr.yml`
- Inspect: `.github/workflows/release.yml`
- Modify only if needed: `.github/workflows/pr.yml`
- Modify only if needed: `.github/workflows/release.yml`
- Modify only if needed: `package.json`

- [ ] **Step 1: Verify every CI Node version satisfies v9**

Run:

```bash
rg -n "setup-node|node-version|node-version-file" .github/workflows package.json
```

Expected:

```text
.github/workflows/pr.yml uses node-version: '22'
.github/workflows/release.yml uses node-version: '22'
package.json engines.node is >=20.0.0
```

No change is required if the expected lines are present.

- [ ] **Step 2: Verify local scripts have a BDD generation path**

Run:

```bash
npm run test:bdd -- --list
```

Expected:

```text
The command runs bddgen first, then invokes playwright test with --list.
The command exits 0 after listing generated tests, or exits with a clear Playwright --list support message depending on installed Playwright behavior.
```

If `--list` is not supported by this Playwright version, run:

```bash
npx bddgen
npx playwright test --list
```

Expected:

```text
Playwright lists the generated BDD tests without starting webServer.
```

- [ ] **Step 3: Decide whether `test:e2e` should call `bddgen`**

Run:

```bash
npm run test:e2e -- --list
```

Expected:

```text
Playwright lists the same generated BDD tests that `npm run test:bdd -- --list` lists.
```

If `npm run test:e2e -- --list` relies on stale generated files or lists zero tests after deleting generated output, change `package.json` scripts to make the canonical E2E path regenerate BDD tests:

```json
"test:e2e": "bddgen && playwright test",
"test:e2e:ui": "bddgen && playwright test --ui",
"test:e2e:debug": "bddgen && playwright test --debug",
"test:e2e:report": "playwright show-report",
"test:bdd": "bddgen && playwright test",
"test:bdd:ui": "bddgen && playwright test --ui"
```

Do not change scripts if `test:e2e` already works reliably with generated output and the team intentionally keeps `test:bdd` as the explicit generation script.

- [ ] **Step 4: If scripts changed, verify no duplicate generation breakage**

Run:

```bash
npm run test:e2e -- --list
npm run test:bdd -- --list
```

Expected:

```text
Both commands list tests successfully.
```

- [ ] **Step 5: Commit CI/script alignment if any files changed**

Run:

```bash
git add package.json package-lock.json .github/workflows/pr.yml .github/workflows/release.yml
git commit -m "ci: align playwright bdd v9 execution"
```

Skip this commit if no CI/script changes were needed.

### Task 6: Full Validation

**Files:**
- No planned edits
- Output reviewed: `reports/playwright/**`
- Output reviewed: `reports/test-results/**`

- [ ] **Step 1: Run TypeScript validation**

Run:

```bash
npm run type-check
```

Expected:

```text
TypeScript exits 0 with no TS errors.
```

- [ ] **Step 2: Run lint validation**

Run:

```bash
npm run lint
```

Expected:

```text
ESLint exits 0.
Existing accepted warnings may remain if they are part of the current baseline.
```

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm run test:unit
```

Expected:

```text
Vitest exits 0.
Baseline expectation from current docs is 38 files and 326 tests.
```

- [ ] **Step 4: Run BDD generation explicitly**

Run:

```bash
npx bddgen
```

Expected:

```text
Generation exits 0.
No v9 arity errors.
```

- [ ] **Step 5: Run full Playwright E2E**

Run:

```bash
npm run test:e2e
```

Expected:

```text
Playwright exits 0.
Baseline expectation from current docs is 145 tests.
```

- [ ] **Step 6: Run security audit**

Run:

```bash
npm audit --audit-level=high
```

Expected:

```text
npm audit exits 0, or any remaining high/critical vulnerabilities are unrelated to playwright-bdd and are documented with package paths.
```

- [ ] **Step 7: Verify generated reports are still usable**

Run:

```bash
npm run test:e2e:report
```

Expected:

```text
Playwright report opens or prints the local report URL for reports/playwright.
```

Close the report server after confirming it starts.

### Task 7: Migration Evidence Documentation

**Files:**
- Create: `docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md`

- [ ] **Step 1: Create the migration evidence file**

Create `docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md` with this content, replacing command result placeholders with the actual outputs from Task 6:

```markdown
# Playwright-BDD v9 Migration

**Date:** 2026-06-05
**Purpose:** Remove security vulnerabilities from the older Playwright-BDD/Cucumber dependency tree by upgrading Playwright-BDD from v8.5.1 to v9.x.

## Dependency Result

- `playwright-bdd`: `8.5.1` -> `9.x`
- `@playwright/test`: unchanged, already satisfies `>=1.44`
- Node floor: package engine remains `>=20.0.0`
- CI Node: GitHub Actions uses Node `22`

## Cucumber Dependency Result

Record the post-upgrade `npm ls` output here:

```text
<paste concise npm ls playwright-bdd @cucumber/messages @cucumber/gherkin @cucumber/cucumber-expressions @cucumber/tag-expressions --depth=3 result>
```

## Removed/Deprecated API Audit

- `enrichReporterData`: not present / removed from `playwright.config.ts`
- `junit-modern`: not present / replaced with `junit`
- Cucumber JUnit `nameFormat`: not applicable because this snapshot uses Playwright HTML/list reporters / set to `playwright` where Cucumber JUnit is configured
- Cucumber JSON `skipAttachments`: not applicable because no Cucumber JSON reporter is configured / explicitly configured based on downstream attachment needs

## Validation

```text
node --version
<result>

npm run type-check
<result>

npm run lint
<result>

npm run test:unit
<result>

npx bddgen
<result>

npm run test:e2e
<result>

npm audit --audit-level=high
<result>
```

## Notes

- Step definition arity validation passed under Playwright-BDD v9.
- Existing Playwright HTML/list reports remain unchanged.
- No generated/vendor/captured application files were edited.
```

- [ ] **Step 2: Commit evidence**

Run:

```bash
git add docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md
git commit -m "docs: record playwright-bdd v9 migration"
```

### Task 8: Final Review And Handoff

**Files:**
- Review all changed files

- [ ] **Step 1: Review the full diff**

Run:

```bash
git status --short
git diff --stat
git diff -- package.json package-lock.json playwright.config.ts tests/e2e/steps .github/workflows docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md
```

Expected:

```text
Diff is limited to the dependency upgrade, any necessary BDD v9 compatibility fixes, optional CI/script alignment, and migration evidence.
```

- [ ] **Step 2: Confirm no generated/vendor boundaries were crossed**

Run:

```bash
git diff --name-only HEAD~5..HEAD
```

Expected:

```text
No files under ClientApp/src/api/web-api-client.ts, ClientApp/source-map-http-downloads/**, ClientApp/src/external/**, or ClientApp/webpack/**.
```

If fewer than five commits were created, replace `HEAD~5..HEAD` with the correct base commit range for the migration branch.

- [ ] **Step 3: Capture final dependency/audit summary for PR**

Run:

```bash
npm ls playwright-bdd --depth=0
npm audit --audit-level=high
```

Expected:

```text
playwright-bdd@9.x is installed.
No high/critical vulnerabilities remain from the old Playwright-BDD/Cucumber dependency path.
```

- [ ] **Step 4: Final commit if remaining changes exist**

Run:

```bash
git status --short
```

If files remain staged or unstaged:

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/steps .github/workflows docs/change-record/PLAYWRIGHT-BDD-V9-MIGRATION.md .features-gen
git commit -m "chore: complete playwright-bdd v9 migration"
```

Expected:

```text
Working tree is clean except for unrelated pre-existing user changes.
```

## Self-Review

- Spec coverage: The plan covers Node 20+, dependency upgrade to latest v9.x, removed `enrichReporterData`, JUnit naming behavior, JSON attachment behavior, stricter step arity validation, `junit-modern` deprecation, Cucumber dependency upgrade evidence, Playwright reporter compatibility, CI Node setup, and security audit verification.
- Placeholder scan: The plan contains no `TBD`, `TODO`, or vague "add tests" instructions. Every code/config change has concrete snippets and commands.
- Type consistency: Step examples use the repo's `createBdd()` style with fixture object as the first callback argument and captured Cucumber parameters after it. Reporter examples use `cucumberReporter(...)` only for branches where such reporters exist.
