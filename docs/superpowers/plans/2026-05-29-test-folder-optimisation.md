# Test Folder Optimisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all test source under `tests/`, all test output artifacts under `reports/`, and fix a stale lint script left over from the `static/js/` rename.

**Architecture:** Two independent concerns tackled together because they share `playwright.config.ts`. Test sources move from scattered root locations into a structured `tests/` tree. Test artifacts (currently four separate root-level directories) merge under an expanded `reports/` directory that already exists. No test logic changes — only paths.

**Tech Stack:** Vitest · Playwright · playwright-bdd · V8 coverage · JUnit XML reporting

---

## Current vs Target Structure

```
BEFORE                              AFTER
─────────────────────────────────── ──────────────────────────────────────────
<root>/                             <root>/
│                                   │
├── features/           ──────────► ├── tests/
│   ├── account/                    │   ├── unit/             (unchanged)
│   ├── auth/                       │   └── e2e/              (NEW)
│   ├── quote/                      │       ├── features/     (was root features/ minus steps/)
│   ├── rfq/                        │       │   ├── account/
│   ├── storybook/                  │       │   ├── auth/
│   └── steps/          ──────────► │       │   ├── quote/
│                                   │       │   ├── rfq/
├── tests/                          │       │   └── storybook/
│   └── unit/ (unchanged)           │       └── steps/        (was features/steps/)
│                                   │
├── test-results/       ──────────► ├── reports/
├── playwright-report/  ──────────► │   ├── coverage/         (was root coverage/)
├── coverage/           ──────────► │   ├── playwright/       (was root playwright-report/)
│                                   │   ├── test-results/     (was root test-results/)
├── reports/                        │   └── vitest/           (unchanged)
│   └── vitest/                     │       └── junit.xml
│       └── junit.xml  (unchanged)  │
```

## Files Changed (content edits)

| File | What changes |
|------|-------------|
| `playwright.config.ts` | `features` glob, `steps` glob, `outputDir`, HTML reporter `outputFolder` |
| `vitest.config.ts` | `coverage.reportsDirectory` |
| `package.json` | `lint` script stale path (`static/js/` → `ClientApp/src/`) |
| `.gitignore` | Add `reports/coverage/`, `reports/playwright/`, `reports/test-results/`, `reports/vitest/` |

## Files Deleted (stale artifacts)

| Path | Why |
|------|-----|
| `test-results/` (entire folder) | Stale Playwright run output; regenerated on next `npm run test:e2e` |
| `playwright-report/` (entire folder) | Stale HTML report; regenerated on next `npm run test:e2e` |
| `coverage/` (entire folder) | Stale coverage data; regenerated on next `npm run test:unit:coverage` |

## Files Moved (no content changes)

| From | To |
|------|----|
| `features/account/` | `tests/e2e/features/account/` |
| `features/auth/` | `tests/e2e/features/auth/` |
| `features/quote/` | `tests/e2e/features/quote/` |
| `features/rfq/` | `tests/e2e/features/rfq/` |
| `features/storybook/` | `tests/e2e/features/storybook/` |
| `features/steps/` | `tests/e2e/steps/` |

---

## Rubric

| # | Criterion | Verification |
|---|-----------|-------------|
| R1 | `features/` no longer exists at project root | `Test-Path "features"` → False |
| R2 | All `.feature` files accessible under `tests/e2e/features/` | `(Get-ChildItem -Recurse -Filter "*.feature" "tests\e2e\features").Count` = 25 |
| R3 | Step definitions accessible at `tests/e2e/steps/` | `Test-Path "tests\e2e\steps\common.steps.ts"` → True |
| R4 | `playwright.config.ts` references new paths | `grep "tests/e2e" playwright.config.ts` → 2 matches (features + steps) |
| R5 | `playwright.config.ts` outputs to `reports/` | `grep "reports/" playwright.config.ts` → 2 matches (outputDir + outputFolder) |
| R6 | `vitest.config.ts` coverage points to `reports/coverage/unit` | `grep "reports/coverage" vitest.config.ts` → 1 match |
| R7 | Stale artifact directories removed | `test-results/`, `playwright-report/`, `coverage/` all do not exist at root |
| R8 | lint script fixed | `grep "ClientApp/src" package.json` includes the lint entry |
| R9 | `.gitignore` covers all report outputs | `grep "reports/" .gitignore` → 4 entries |
| R10 | TypeScript compiles | `npm run type-check` exits 0 |

---

## Test Plan

### Gate 1 — After folder moves (Task 1)
```powershell
# Feature file count should be 25 (5 business + 20 storybook)
(Get-ChildItem -Recurse -Filter "*.feature" "tests\e2e\features").Count
# Expected: 25

# Steps files present
Get-ChildItem "tests\e2e\steps"
# Expected: common.steps.ts, storybook.steps.ts

# Root features/ is gone
Test-Path "features"
# Expected: False
```

### Gate 2 — After config updates (Tasks 2–4)
```bash
# No stale feature/ or static/js/ references in configs
grep -n "features/" playwright.config.ts | grep -v "tests/e2e"
# Expected: zero matches

grep -n "static/js" package.json
# Expected: zero matches

grep -n "coverage/unit" vitest.config.ts | grep -v "reports/"
# Expected: zero matches
```

### Gate 3 — After cleanup + .gitignore update (Tasks 5–6)
```powershell
# Stale output dirs gone
Test-Path "test-results"; Test-Path "playwright-report"; Test-Path "coverage"
# Expected: all False

# Reports structure intact
Test-Path "reports\vitest\junit.xml"
# Expected: True
```

### Gate 4 — Final
```bash
npm run type-check
# Expected: exits 0, zero errors
```

---

## Task 1: Move features/ to tests/e2e/

**Files:**
- Move: `features/steps/` → `tests/e2e/steps/`
- Move: `features/` → `tests/e2e/features/`

The steps are moved first to avoid nesting them under `tests/e2e/features/steps/`.

- [ ] **Step 1: Verify source exists**

```powershell
Test-Path "features"
# Expected: True

(Get-ChildItem -Recurse -Filter "*.feature" "features").Count
# Record this number — should be 25
```

- [ ] **Step 2: Create the e2e directory**

```powershell
New-Item -ItemType Directory -Force "tests\e2e"
```

- [ ] **Step 3: Move steps/ out first (before moving the parent)**

```powershell
Move-Item -Path "features\steps" -Destination "tests\e2e\steps"
```

- [ ] **Step 4: Move the remaining features/ contents into tests/e2e/features/**

```powershell
Move-Item -Path "features" -Destination "tests\e2e\features"
```

- [ ] **Step 5: Verify (Gate 1)**

```powershell
# Feature count matches baseline
(Get-ChildItem -Recurse -Filter "*.feature" "tests\e2e\features").Count
# Expected: 25

# Steps are at the right level (NOT inside features/)
Test-Path "tests\e2e\steps\common.steps.ts"
# Expected: True

Test-Path "tests\e2e\steps\storybook.steps.ts"
# Expected: True

# Root features/ is gone
Test-Path "features"
# Expected: False
```

---

## Task 2: Update playwright.config.ts

**Files:**
- Modify: `playwright.config.ts`

Read the file first. Then make exactly these 4 changes:

- [ ] **Step 1: Update the defineBddConfig paths**

Find:
```ts
const testDir = defineBddConfig({
    features: 'features/**/*.feature',
    steps: 'features/steps/**/*.ts',
});
```

Replace with:
```ts
const testDir = defineBddConfig({
    features: 'tests/e2e/features/**/*.feature',
    steps: 'tests/e2e/steps/**/*.ts',
});
```

- [ ] **Step 2: Add outputDir for Playwright test results**

Find the `export default defineConfig({` block opening and the `testDir,` line. Add `outputDir` immediately after `testDir`:

```ts
export default defineConfig({
    testDir,
    outputDir: 'reports/test-results',
    fullyParallel: true,
```

- [ ] **Step 3: Update the HTML reporter output folder**

Find:
```ts
    reporter: [['html', { open: 'never' }], ['list']],
```

Replace with:
```ts
    reporter: [['html', { open: 'never', outputFolder: 'reports/playwright' }], ['list']],
```

- [ ] **Step 4: Verify**

```bash
grep -n "tests/e2e" playwright.config.ts
# Expected: 2 matches (features + steps globs)

grep -n "reports/" playwright.config.ts
# Expected: 2 matches (outputDir + outputFolder)

grep -n "features/" playwright.config.ts | grep -v "tests/e2e"
# Expected: 0 matches (no stale references)
```

---

## Task 3: Update vitest.config.ts coverage output path

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Update reportsDirectory**

Find:
```ts
        reportsDirectory: './coverage/unit',
```

Replace with:
```ts
        reportsDirectory: './reports/coverage/unit',
```

- [ ] **Step 2: Verify**

```bash
grep -n "reportsDirectory" vitest.config.ts
# Expected: reportsDirectory: './reports/coverage/unit'

grep -n "coverage/unit" vitest.config.ts | grep -v "reports/"
# Expected: zero matches
```

---

## Task 4: Fix stale lint script in package.json

**Files:**
- Modify: `package.json`

The `lint` script still references `static/js/` — the old path before the folder restructure renamed it to `ClientApp/src/`.

- [ ] **Step 1: Read the scripts block to confirm the stale path**

The current lint script is:
```json
"lint": "eslint \"static/js/**/*.{ts,tsx}\"",
```

- [ ] **Step 2: Fix it**

Replace:
```json
"lint": "eslint \"static/js/**/*.{ts,tsx}\"",
```

With:
```json
"lint": "eslint \"ClientApp/src/**/*.{ts,tsx}\"",
```

- [ ] **Step 3: Verify**

```bash
grep -n "static/js" package.json
# Expected: zero matches

grep -n "lint" package.json
# Expected: "lint": "eslint \"ClientApp/src/**/*.{ts,tsx}\""
```

---

## Task 5: Delete stale artifact directories

**Files:**
- Delete: `test-results/` (16 Playwright run directories)
- Delete: `playwright-report/` (stale HTML report + data/)
- Delete: `coverage/` (stale coverage HTML — actual coverage is in `coverage/unit/`)

These are all test run outputs, not source files. They will be regenerated in the correct location (`reports/`) on the next test run.

- [ ] **Step 1: Confirm these are output artifacts, not source**

```powershell
# test-results contains only Playwright result directories (no .ts or .feature files)
Get-ChildItem -Recurse "test-results" -Filter "*.ts" | Measure-Object
# Expected: 0

# playwright-report contains only HTML/data (no .ts or .feature files)
Get-ChildItem -Recurse "playwright-report" -Filter "*.ts" | Measure-Object
# Expected: 0

# coverage contains only HTML/JSON reports
Get-ChildItem -Recurse "coverage" -Filter "*.ts" | Measure-Object
# Expected: 0
```

If any count is non-zero, stop and investigate before deleting.

- [ ] **Step 2: Delete the three stale artifact directories**

```powershell
Remove-Item -Recurse -Force "test-results"
Remove-Item -Recurse -Force "playwright-report"
Remove-Item -Recurse -Force "coverage"
```

- [ ] **Step 3: Verify they are gone**

```powershell
Test-Path "test-results"; Test-Path "playwright-report"; Test-Path "coverage"
# Expected: False False False
```

- [ ] **Step 4: Verify reports/vitest/junit.xml survived**

```powershell
Test-Path "reports\vitest\junit.xml"
# Expected: True
```

---

## Task 6: Update .gitignore

**Files:**
- Modify: `.gitignore`

Current `.gitignore` already ignores `dist/`, `storybook-static/`, and stale compiled CSS/JS artifacts. It needs entries for the new consolidated `reports/` output subdirectories. The `reports/vitest/junit.xml` is a CI output artefact and should also be gitignored.

- [ ] **Step 1: Read current .gitignore to confirm state**

Current content (for reference — read the file to confirm):
```
# Dependencies
node_modules/

# Build output
dist/
storybook-static/

# Compiled artifacts (webpack outputs to dist/, not ClientApp/)
ClientApp/css/main.*.css
ClientApp/css/main.*.css.map
ClientApp/src/main.*.js
ClientApp/src/main.*.js.map

# TypeScript
*.tsbuildinfo

# Test output
coverage/
test-results/
playwright-report/

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
```

- [ ] **Step 2: Replace the Test output section**

Find:
```
# Test output
coverage/
test-results/
playwright-report/
```

Replace with:
```
# Test output (all artifacts consolidated under reports/)
reports/coverage/
reports/playwright/
reports/test-results/
reports/vitest/
```

- [ ] **Step 3: Verify**

```bash
grep -n "reports/" .gitignore
# Expected: 4 lines

grep -n "^coverage/\|^test-results/\|^playwright-report/" .gitignore
# Expected: zero matches (old paths removed)
```

---

## Task 7: Final verification (Gate 4)

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run all rubric checks**

```powershell
# R1 — features/ gone from root
Write-Host "R1:" (!(Test-Path "features"))

# R2 — all .feature files present
Write-Host "R2:" (Get-ChildItem -Recurse -Filter "*.feature" "tests\e2e\features").Count "features (expected 25)"

# R3 — step definitions present
Write-Host "R3:" (Test-Path "tests\e2e\steps\common.steps.ts")

# R7 — stale artifact dirs gone
Write-Host "R7 test-results:" (!(Test-Path "test-results"))
Write-Host "R7 playwright-report:" (!(Test-Path "playwright-report"))
Write-Host "R7 coverage:" (!(Test-Path "coverage"))

# R9 — reports/ gitignored
Write-Host "R9 entries:"
Select-String "reports/" .gitignore
```

- [ ] **Step 2: Run type-check (R10)**

```bash
npm run type-check
```

Expected: exits 0 with zero TypeScript errors.

- [ ] **Step 3: Spot-check lint script works**

```bash
npm run lint -- --max-warnings 0
```

Expected: lints `ClientApp/src/**/*.{ts,tsx}` without "no files found" errors. (Some lint warnings may exist — that's pre-existing.)

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|----------------|------|
| Optimise `tests\unit` location | `tests/unit/` stays; `features/` joins it under `tests/e2e/` (Task 1) |
| Consolidate `test-results` | → `reports/test-results/` via playwright.config.ts `outputDir` (Tasks 2 + 5) |
| Consolidate `reports\vitest` | Already under `reports/`; gitignored (Task 6) |
| Consolidate `playwright-report` | → `reports/playwright/` via playwright.config.ts `outputFolder` (Tasks 2 + 5) |
| Consolidate `coverage` | → `reports/coverage/unit/` via vitest.config.ts (Tasks 3 + 5) |
| Lint script stale path | Fixed in package.json (Task 4) |

**Placeholder scan:** All steps contain exact file paths, exact commands, and exact code. No TBDs.

**Path arithmetic (verified):**

| Config | Old path | New path | Resolves to |
|--------|---------|---------|-------------|
| `playwright.config.ts` features | `features/**/*.feature` | `tests/e2e/features/**/*.feature` | `tests/e2e/features/account/create-account.feature` etc. ✓ |
| `playwright.config.ts` steps | `features/steps/**/*.ts` | `tests/e2e/steps/**/*.ts` | `tests/e2e/steps/common.steps.ts` ✓ |
| `playwright.config.ts` outputDir | (default: `test-results`) | `reports/test-results` | `reports/test-results/` ✓ |
| `playwright.config.ts` outputFolder | (default: `playwright-report`) | `reports/playwright` | `reports/playwright/` ✓ |
| `vitest.config.ts` reportsDirectory | `./coverage/unit` | `./reports/coverage/unit` | `reports/coverage/unit/` ✓ |

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-test-folder-optimisation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
