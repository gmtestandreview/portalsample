# Type-Check Revalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve any reproducible TypeScript compiler errors while avoiding churn when the current direct type-check is already clean.

**Architecture:** Treat `npm run type-check` / `npx tsc --noEmit --pretty false` as the source of truth for TypeScript errors. If failures only occur inside combined commands such as `migration-check`, split them into TypeScript, Vitest, Storybook, and config-resolution buckets before changing source code.

**Tech Stack:** TypeScript 5.9, React 18, Vitest 4, Storybook 10, npm scripts.

---

## Current Baseline

As of 2026-06-02 in this workspace:

```powershell
npm run type-check
```

passes.

```powershell
npx tsc --noEmit --pretty false
```

also passes.

That means there are no currently reproducible direct TypeScript compiler errors in the workspace root. Any reported “type-check issues” are likely coming from a different command, stale output, a different checkout, or combined validation such as `npm run migration-check`.

## Task 1: Capture The Failing Command

**Files:**
- Create or update: `reports/type-check/2026-06-02-baseline.txt`
- Create or update: `reports/type-check/2026-06-02-failing-command.txt`

- [ ] **Step 1: Create reports directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path reports\type-check
```

Expected: directory exists.

- [ ] **Step 2: Capture direct compiler baseline**

Run:

```powershell
npx tsc --noEmit --pretty false *> reports\type-check\2026-06-02-baseline.txt
$LASTEXITCODE
```

Expected: exit code `0`.

- [ ] **Step 3: Capture the user-reported failing command**

If the failing command is unknown, run the likely combined gate:

```powershell
npm run migration-check *> reports\type-check\2026-06-02-failing-command.txt
$LASTEXITCODE
```

Expected: non-zero only if the current issue is not direct `tsc`.

- [ ] **Step 4: Extract TypeScript errors only**

Run:

```powershell
Select-String -Path reports\type-check\2026-06-02-failing-command.txt -Pattern 'error TS\d+:|TS\d+' | Set-Content reports\type-check\2026-06-02-ts-errors-only.txt
Get-Content reports\type-check\2026-06-02-ts-errors-only.txt
```

Expected: if this file is empty, there are no TypeScript compiler errors to fix.

## Task 2: Classify Failures Before Editing

**Files:**
- Create or update: `reports/type-check/2026-06-02-classification.md`

- [ ] **Step 1: Write classification report**

Create `reports/type-check/2026-06-02-classification.md` with this structure:

```md
# Type-Check Failure Classification

## Direct TypeScript

- `npm run type-check`: PASS/FAIL
- `npx tsc --noEmit --pretty false`: PASS/FAIL
- Reproducible TS errors: yes/no

## Combined Command

- Command: `npm run migration-check`
- Result: PASS/FAIL
- Failure bucket: TypeScript / Vitest config / Storybook test / Runtime test environment / Other

## Decision

- If direct TypeScript passes and TS error extraction is empty, do not edit application source for “type-check”.
- If direct TypeScript fails, proceed to Task 3.
```

- [ ] **Step 2: Stop if no TS errors exist**

If `2026-06-02-ts-errors-only.txt` is empty, record:

```md
Direct TypeScript is clean. Remaining failures are not type-check issues and should be handled under a separate Vitest/Storybook validation plan.
```

Expected: no source edits.

## Task 3: Fix Reproducible TypeScript Errors

**Files:**
- Modify only the files named by `npx tsc --noEmit --pretty false`
- Test: focused tests for any changed runtime behavior

- [ ] **Step 1: Group errors by root cause**

Run:

```powershell
Select-String -Path reports\type-check\2026-06-02-baseline.txt,reports\type-check\2026-06-02-failing-command.txt -Pattern 'error TS\d+:' |
    ForEach-Object { $_.Line } |
    Sort-Object |
    Set-Content reports\type-check\2026-06-02-errors-grouped.txt
```

Expected: grouped error list.

- [ ] **Step 2: Apply the smallest source fix per error group**

Use these rules:

- `TS2339` missing property: add the property to the owning type only if runtime data really provides it; otherwise guard before access.
- `TS2322` assignment mismatch: narrow or map values at the boundary; do not widen shared types to `any`.
- `TS2345` argument mismatch: validate or transform before calling; do not cast unless the surrounding code proves the value.
- `TS2532` / `TS18048` possibly undefined: add an early return, nullish fallback, or route redirect before use.
- `TS1484` type-only import: convert to `import type`.

- [ ] **Step 3: Re-run direct compiler**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: exit code `0`.

## Task 4: Verify No Regression

**Files:**
- Update: `reports/type-check/2026-06-02-classification.md`

- [ ] **Step 1: Run direct type-check**

Run:

```powershell
npm run type-check
```

Expected: PASS.

- [ ] **Step 2: Run relevant focused tests**

If source files changed, run the closest existing focused tests. For example:

```powershell
npm run test:unit -- tests/unit/routes/common/routeParams.test.ts --reporter=verbose
npm run test:unit -- tests/unit/instrumentation/appInsightsService.test.ts --reporter=verbose
```

Expected: PASS for tests covering changed behavior.

- [ ] **Step 3: Record final state**

Append to `reports/type-check/2026-06-02-classification.md`:

```md
## Final Verification

- `npm run type-check`: PASS
- `npx tsc --noEmit --pretty false`: PASS
- Focused tests: PASS / not required because no source changed
- Remaining non-TypeScript validation failures: listed separately
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-02-type-check-revalidation.md`.

Recommended execution path: run Task 1 and Task 2 first. If direct TypeScript remains clean, stop and create a separate plan for the actual failing gate, likely Vitest/Storybook validation rather than type-check.
