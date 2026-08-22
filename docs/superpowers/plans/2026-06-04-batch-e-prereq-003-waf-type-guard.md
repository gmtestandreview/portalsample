# BATCH-E-PREREQ-003: WAF-TYPE-001 — Typed Guard for WAF Error Shape

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Replace the unsafe inline type cast in `errorState.ts` used to detect Azure WAF violations with a formally typed TypeScript type guard (`isWafError`), enabling safe WAF detection in the Item 6 wizard port without relying on `[key: string]: any` escape hatches.

**Architecture:** Create a new file `ClientApp/src/types/wafError.ts` containing the `WafErrorShape` interface and the `isWafError(error: unknown): error is WafErrorShape` type predicate. Update `ClientApp/src/components/forms/WizardForm/errorState.ts` to import and use the predicate instead of the current inline cast. The generated `web-api-client.ts` (which owns the `[key: string]: any` index signatures on `ProblemDetails`) is never touched.

**Tech Stack:** TypeScript 5, Vitest, `ClientApp/src/components/forms/WizardForm/errorState.ts` (the sole existing consumer of WAF detection logic).

---

## Source Inputs

- Spec: WAF-TYPE-001 / BATCH-E-PREREQ-003 ticket ("typed guard for WAF 412 error shape; gates Item 6 wizard port")
- Relevant files inspected:
  - `ClientApp/src/components/forms/WizardForm/errorState.ts:10–23`: `resolveForbiddenState` function — current WAF detection via inline cast `(error as { headers?: { server?: string } }).headers?.server`
  - `ClientApp/src/components/forms/WizardForm/types.ts:40–49`: `WizardStepError` discriminated union — `wafViolation` variant already typed
  - `ClientApp/src/api/web-api-client.ts:2985,2991,2997`: `ProblemDetails`, `HttpValidationProblemDetails`, `ValidationProblemDetails` — all carry `[key: string]: any` index signatures (generated; never-edit)
  - `ClientApp/src/api/web-api-client.ts:3634,3637,3654`: `SwaggerException` class — `headers: { [key: string]: any; }` (generated; never-edit)
  - `ClientApp/src/types.ts:14`: `HttpStatusCode.PreconditionFailed = 412` — confirms 412 is a known status code in the type system

---

## Assumptions and Unknowns

- Assumption: The WAF detection heuristic (`server` header starting with `'Microsoft-Azure-Application-Gateway'`) is the correct and agreed-upon detection strategy — it is already in production in `errorState.ts` and is not changed by this plan.
- Assumption: The ticket title says "WAF 412 error shape" but the existing code triggers WAF detection on HTTP **403** (Forbidden), not 412. The typed guard is status-code-agnostic by design — it checks only for the WAF server header. This is correct: the guard should be usable for any status code where WAF headers may appear, including 412 if Azure WAF ever returns it.
- Assumption: `web-api-client.ts` is generated/vendor and must not be modified (confirmed by CLAUDE.md edit boundaries).
- Blocking ambiguity: none.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Remove inline `as { headers?: ... }` cast from `errorState.ts` | Task 1 (guard), Task 2 (wiring) | Cast replaced by `isWafError` predicate |
| Typed guard usable in Item 6 wizard port without `[key: string]: any` | Task 1 | `isWafError` accepts `unknown`, returns typed predicate — no escape hatch needed |
| `WafErrorShape` interface formally documents the error structure | Task 1 | Interface in `wafError.ts` serves as living documentation |
| No change to WAF detection heuristic (server header prefix) | Task 2 | Constant `AZURE_WAF_SERVER_PREFIX` extracted but value unchanged |
| No modification to generated `web-api-client.ts` | All tasks | Confirmed by CLAUDE.md — never edit generated/vendor files |
| Tests cover: positive WAF detection, negative (non-WAF 403), null/non-object error | Task 1 | 6 unit tests |

---

## Framework Fit

- **TDD**: Tests written first; `isWafError` is a pure function — straightforward to unit test with no mocking needed.
- **Threat modelling**: The WAF guard is security-adjacent (detects when the Azure Application Gateway has blocked a request). The guard must not produce false positives (classifying a domain 403 as WAF) or false negatives (missing a WAF block). The existing heuristic is maintained; the guard makes it more auditable.
- **DDD / C4 / migration planning**: Not needed.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/types/wafError.ts` | **Create** | `WafErrorShape` interface + `isWafError` type predicate + `AZURE_WAF_SERVER_PREFIX` constant |
| `ClientApp/src/types/wafError.test.ts` | **Create** | Unit tests for the type predicate |
| `ClientApp/src/components/forms/WizardForm/errorState.ts` | **Modify** | Import `isWafError`, replace inline cast in `resolveForbiddenState` |
| `ClientApp/src/api/web-api-client.ts` | **Do not touch** | Generated; `[key: string]: any` in `ProblemDetails` etc. is expected and out of scope |

---

## Tasks

### Task 1: Create the `isWafError` type guard

**Files:**
- Create: `ClientApp/src/types/wafError.ts`
- Test: `ClientApp/src/types/wafError.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `ClientApp/src/types/wafError.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { isWafError, AZURE_WAF_SERVER_PREFIX } from './wafError';

  describe('isWafError', () => {
      it('returns true for an error shaped like an Azure WAF response', () => {
          const error = {
              headers: { server: 'Microsoft-Azure-Application-Gateway/2.5' },
          };
          expect(isWafError(error)).toBe(true);
      });

      it('returns true when server header is exactly the prefix (no version suffix)', () => {
          const error = {
              headers: { server: AZURE_WAF_SERVER_PREFIX },
          };
          expect(isWafError(error)).toBe(true);
      });

      it('returns false for a normal 403 error (no WAF header)', () => {
          const error = {
              headers: { server: 'nginx/1.21.0' },
          };
          expect(isWafError(error)).toBe(false);
      });

      it('returns false when headers is absent', () => {
          expect(isWafError({ status: 403 })).toBe(false);
      });

      it('returns false for null', () => {
          expect(isWafError(null)).toBe(false);
      });

      it('returns false for a non-object primitive', () => {
          expect(isWafError('string error')).toBe(false);
          expect(isWafError(42)).toBe(false);
          expect(isWafError(undefined)).toBe(false);
      });

      it('returns false when headers.server is not a string', () => {
          expect(isWafError({ headers: { server: 12345 } })).toBe(false);
          expect(isWafError({ headers: { server: null } })).toBe(false);
      });

      it('returns false when headers itself is not an object', () => {
          expect(isWafError({ headers: 'flat-string' })).toBe(false);
          expect(isWafError({ headers: null })).toBe(false);
      });
  });
  ```

- [ ] **Step 2: Verify the tests fail**

  Run in target repository: `npx vitest run ClientApp/src/types/wafError.test.ts`

  Expected: 8 failures — `Cannot find module './wafError'`

- [ ] **Step 3: Implement the type guard**

  Create `ClientApp/src/types/wafError.ts`:

  ```ts
  export const AZURE_WAF_SERVER_PREFIX = 'Microsoft-Azure-Application-Gateway';

  export interface WafErrorShape {
      headers: {
          server: string;
      };
  }

  /**
   * Type predicate: returns true when `error` carries an Azure Application
   * Gateway server header, indicating the request was blocked by the WAF.
   *
   * Works for any HTTP status code — the detection heuristic is the server
   * header, not the status code. Accepts `unknown` so callers need no cast.
   */
  export function isWafError(error: unknown): error is WafErrorShape {
      if (error === null || typeof error !== 'object') return false;
      const candidate = error as Record<string, unknown>;
      if (candidate.headers === null || typeof candidate.headers !== 'object') return false;
      const headers = candidate.headers as Record<string, unknown>;
      return (
          typeof headers.server === 'string' &&
          headers.server.startsWith(AZURE_WAF_SERVER_PREFIX)
      );
  }
  ```

  Design decisions:
  - `WafErrorShape.headers.server` is typed as `string` (not `string | undefined`) because `isWafError` only returns `true` when `server` is a present, non-null string — the interface reflects the post-narrowing shape.
  - `AZURE_WAF_SERVER_PREFIX` is exported so tests and future callers can reference the constant rather than hardcoding the string.
  - The function accepts `unknown` (not `any`) so the caller's existing `error: unknown` signature in `resolveErrorState` flows through without any cast at the call site.

- [ ] **Step 4: Verify the tests pass**

  Run: `npx vitest run ClientApp/src/types/wafError.test.ts`

  Expected: 8 tests passing, 0 failures.

- [ ] **Step 5: Run relevant regression checks**

  Run: `npx vitest run ClientApp/src/`

  Expected: all pre-existing tests continue to pass.

- [ ] **Step 6: Commit**

  ```bash
  git add ClientApp/src/types/wafError.ts ClientApp/src/types/wafError.test.ts
  git commit -m "feat: add isWafError type predicate (WAF-TYPE-001)"
  ```

---

### Task 2: Wire `isWafError` into `errorState.ts`

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/errorState.ts`

- [ ] **Step 1: Write the failing test (integration)**

  Create `ClientApp/src/components/forms/WizardForm/errorState.test.ts` (or add to existing if one exists):

  ```ts
  import { describe, it, expect } from 'vitest';
  import { resolveErrorState } from './errorState';
  import { ErrorType } from './types';
  import { AZURE_WAF_SERVER_PREFIX } from '../../../types/wafError';

  describe('resolveErrorState — WAF detection', () => {
      it('classifies a 403 with WAF server header as wafViolation', () => {
          const wafError = {
              status: 403,
              headers: { server: `${AZURE_WAF_SERVER_PREFIX}/2.5` },
          };
          const result = resolveErrorState(wafError, undefined, ErrorType.Update);
          expect(result.kind).toBe('wafViolation');
      });

      it('classifies a 403 without WAF header as serverError', () => {
          const domainError = {
              status: 403,
              headers: { server: 'nginx/1.21.0' },
          };
          const result = resolveErrorState(domainError, undefined, ErrorType.Update);
          expect(result.kind).toBe('serverError');
      });

      it('classifies a 403 with no-third-party-access title as noThirdPartyAccess (takes priority over WAF check)', () => {
          const noAccessError = {
              status: 403,
              title: 'No third-party access',
              headers: {},
          };
          const result = resolveErrorState(noAccessError, undefined, ErrorType.Update);
          expect(result.kind).toBe('noThirdPartyAccess');
      });

      it('does not classify a WAF-header error as wafViolation on Load (only on Update)', () => {
          const wafError = {
              status: 403,
              headers: { server: `${AZURE_WAF_SERVER_PREFIX}/2.5` },
          };
          const result = resolveErrorState(wafError, undefined, ErrorType.Load);
          // Load path: 403 → resolveForbiddenState → isWafError true BUT errorType is Load
          // Per current logic: WAF detection only applies on Update
          expect(result.kind).toBe('serverError');
      });
  });
  ```

  Note on test 4: The current `resolveForbiddenState` only checks for WAF when `errorType === ErrorType.Update` (line 16 of `errorState.ts`). This test pins that intentional behaviour so it is not accidentally removed.

- [ ] **Step 2: Verify the tests fail**

  Run: `npx vitest run ClientApp/src/components/forms/WizardForm/errorState.test.ts`

  Expected: tests 1 and 2 may pass (existing behaviour works), but the test file itself fails to compile if `wafError.ts` import path is wrong — this confirms the wiring step is needed.

  If all 4 tests pass already (because the existing inline cast is functionally equivalent): proceed to Step 3 anyway, as the goal is replacing the unsafe cast with the typed predicate.

- [ ] **Step 3: Update `errorState.ts`**

  Apply the following exact diff to `ClientApp/src/components/forms/WizardForm/errorState.ts`:

  **Add import** — insert after the existing imports at the top of the file:

  ```ts
  import { isWafError } from '../../../types/wafError';
  ```

  **Replace** the `resolveForbiddenState` function body (lines 10–23):

  Before:
  ```ts
  function resolveForbiddenState(
      error: unknown,
      serverError: ProblemDetails,
      errorType: ErrorType,
  ): WizardStepError {
      if (serverError.title?.includes('No third-party access')) return { kind: 'noThirdPartyAccess' };
      if (errorType === ErrorType.Update) {
          const server = (error as { headers?: { server?: string } }).headers?.server;
          if (server?.startsWith('Microsoft-Azure-Application-Gateway')) {
              return { kind: 'wafViolation', details: serverError };
          }
      }
      return { kind: 'serverError', details: serverError };
  }
  ```

  After:
  ```ts
  function resolveForbiddenState(
      error: unknown,
      serverError: ProblemDetails,
      errorType: ErrorType,
  ): WizardStepError {
      if (serverError.title?.includes('No third-party access')) return { kind: 'noThirdPartyAccess' };
      if (errorType === ErrorType.Update && isWafError(error)) {
          return { kind: 'wafViolation', details: serverError };
      }
      return { kind: 'serverError', details: serverError };
  }
  ```

  Changes:
  - The two-statement `if` block (assign `server`, then check with `?.startsWith`) is replaced by a single `isWafError(error)` call — same runtime behaviour, but the structure check is now in the type guard.
  - The `as { headers?: { server?: string } }` unsafe cast is eliminated entirely from this file.
  - The eslint-disable comment on line 1 of `types.ts` (`/* eslint-disable @typescript-eslint/no-explicit-any */`) is unrelated — do not touch `types.ts`.

- [ ] **Step 4: Verify the tests pass**

  Run: `npx vitest run ClientApp/src/components/forms/WizardForm/errorState.test.ts`

  Expected: 4 tests passing.

- [ ] **Step 5: Confirm TypeScript is clean**

  Run: `npx tsc --noEmit`

  Expected: exit code 0, no errors in `errorState.ts` or `wafError.ts`.

- [ ] **Step 6: Run full regression**

  Run: `npx vitest run ClientApp/src/`

  Expected: all tests pass.

- [ ] **Step 7: Commit**

  ```bash
  git add ClientApp/src/components/forms/WizardForm/errorState.ts ClientApp/src/components/forms/WizardForm/errorState.test.ts
  git commit -m "refactor: use isWafError predicate in errorState — removes unsafe inline cast (WAF-TYPE-001)"
  ```

---

### Task 3: Verify Item 6 wizard port import is unblocked

- [ ] **Step 1: Confirm the export surface is usable from a wizard route**

  In the target repository, open any wizard step `onSaveAndNext` handler (e.g., in `ClientApp/src/routes/`) and verify that the following import compiles without error:

  ```ts
  import { isWafError } from '../../types/wafError';
  // or, from a deeper path:
  import { isWafError } from '../../../types/wafError';
  ```

  This confirms that Item 6 wizard port files can use `isWafError` directly without any `[key: string]: any` cast.

- [ ] **Step 2: Document closure in the open-items backlog**

  Add the following line to `docs/change-record/OPEN-ITEMS-BACKLOG.md` in the "Closed" section:

  ```
  | WAF-TYPE-001 | Typed guard for WAF error shape | CLOSED 2026-06-05 | `isWafError` predicate in `ClientApp/src/types/wafError.ts` |
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add docs/change-record/OPEN-ITEMS-BACKLOG.md
  git commit -m "docs: close WAF-TYPE-001 — isWafError predicate shipped"
  ```

---

## Safety, Rollback, and Verification

- **Risk (false positive):** `isWafError` could incorrectly classify a non-WAF 403 if a proxy happens to send `Microsoft-Azure-Application-Gateway` in its server header for unrelated reasons. This is the same risk the existing inline cast carries — the heuristic is unchanged.
- **Risk (type narrowing):** After `isWafError(error)` returns `true`, `error` is narrowed to `WafErrorShape`. The `serverError` variable (cast as `ProblemDetails`) is used separately for the `details` payload — these are independent casts and do not conflict.
- **Verification:** `npx tsc --noEmit` exits 0; `npx vitest run` passes; `errorState.ts` contains no `as {` casts after the change.
- **Rollback:** `git revert` the two commits (Task 1 and Task 2). Because `wafError.ts` is a new file with no callers other than `errorState.ts`, reverting both commits returns the codebase to its prior state with zero side effects.

---

## Final Validation

- Requirement coverage: PASS (inline cast removed, typed guard created, Item 6 import unblocked, WAF-TYPE-001 closed)
- Exact paths: PASS
- Tests before implementation: PASS (8 unit tests + 4 integration tests written first)
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered: PASS
- **Score: 97/100**
- Critical failures: None

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks.
2. **Inline execution** — execute tasks in this session with checkpoints.
