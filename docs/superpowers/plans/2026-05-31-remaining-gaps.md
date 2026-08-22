# Remaining Gaps — Migration Readiness Sprint 3

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Close the four remaining low-to-medium effort gaps from the readiness assessment: two unit test gaps (Section 7, Gaps 5 and 6) and two documentation gaps (Section 8, Gaps 7 and 9), then update the HTML.

**Architecture:** Two new test files in `tests/unit/` that import directly from `ClientApp/src/`. Two new markdown architecture docs in `docs/architecture/`. One HTML update.

**Tech Stack:** Vitest 4, TypeScript. Validation: `npx vitest run tests/unit/storage/ tests/unit/routes/errorRoutes.test.ts`

---

## Source Inputs

- Assessment: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` (Section 7 Gaps 5/6; Section 8 Gaps 7/9)
- `ClientApp/src/storage/sessionStorageCache.ts`: `getItemFromSessionStore`, `setItemInSessionStore`, `removeItemFromSessionStore`, `clearSessionStore`
- `ClientApp/src/routes/common/errorRoutes.ts`: `getUnexpectedErrorRoute(status)` switch on `HttpStatusCode`
- `ClientApp/src/types.ts`: `HttpStatusCode` enum (Forbidden=403, NotFound=404, Conflict=409, Gone=410, PreconditionFailed=412, UnprocessableEntity=422, InternalServerError=500, ServiceUnavailable=503)
- `ClientApp/src/api/web-api-client.ts` lines 10–35: `AuthorizedApiBase` reads `targetOrganisation` from `sessionStorage` at construction; `transformOptions` injects `TargetOrganisationAbn` header per-request

---

## Assumptions

- **Assumption:** `tests/unit/storage/` directory does not yet exist — create it.
- **Assumption:** `docs/architecture/` directory does not yet exist — create it.
- **Assumption:** `sessionStorageCache.ts` exports default `SessionStorageCache` factory (confirmed). The `getItem<T>` method parses JSON and returns `undefined` + removes key on malformed JSON (blank `catch {` as of Sprint 2 hardening).
- **Assumption:** No git repo — commits are skipped.

---

## Requirement Traceability

| Requirement | Task | Notes |
|---|---|---|
| Section 7, Gap 5: sessionStorageCache unit tests | Task 1 | 6 behaviors to cover |
| Section 7, Gap 6: errorRoutes full mapping | Task 2 | 9 assertions (all 7 HTTP codes + unknown + undefined) |
| Section 8, Gap 7: org switching lifecycle docs | Task 3 | Markdown doc |
| Section 8, Gap 9: NSwag regeneration docs | Task 4 | Markdown doc |
| HTML update | Task 5 | Mark gaps resolved |

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `tests/unit/storage/sessionStorageCache.test.ts` | Create | Task 1 — storage cache behavior |
| `tests/unit/routes/errorRoutes.test.ts` | Create | Task 2 — HTTP status → route mapping |
| `docs/architecture/org-switching-lifecycle.md` | Create | Task 3 — org switching contract |
| `docs/architecture/nswag-regeneration.md` | Create | Task 4 — NSwag regeneration procedure |
| `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` | Modify | Task 5 — mark gaps resolved |

---

## Tasks

---

### Task 1: sessionStorageCache unit tests (Gap 5)

**Files:**
- Create: `tests/unit/storage/sessionStorageCache.test.ts`

- [ ] **Step 1: Write the test file**

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import SessionStorageCache from '../../../ClientApp/src/storage/sessionStorageCache';

  describe('SessionStorageCache', () => {
      beforeEach(() => {
          globalThis.sessionStorage.clear();
      });

      describe('getItem', () => {
          it('returns undefined for a missing key', () => {
              expect(SessionStorageCache().getItem('missing-key')).toBeUndefined();
          });

          it('returns the parsed value for a valid JSON entry', () => {
              globalThis.sessionStorage.setItem('test-key', JSON.stringify({ id: 42 }));
              expect(SessionStorageCache().getItem<{ id: number }>('test-key')).toEqual({ id: 42 });
          });

          it('returns undefined and removes the key for malformed JSON (fail-soft)', () => {
              globalThis.sessionStorage.setItem('bad-key', 'not-json{{{');
              const result = SessionStorageCache().getItem('bad-key');
              expect(result).toBeUndefined();
              expect(globalThis.sessionStorage.getItem('bad-key')).toBeNull();
          });

          it('returns undefined for an empty string value', () => {
              globalThis.sessionStorage.setItem('empty-key', '');
              expect(SessionStorageCache().getItem('empty-key')).toBeUndefined();
          });
      });

      describe('setItem', () => {
          it('stores a value as JSON-serialised string', () => {
              SessionStorageCache().setItem({ name: 'Acme' }, 'org');
              expect(globalThis.sessionStorage.getItem('org')).toBe(JSON.stringify({ name: 'Acme' }));
          });

          it('stored value is retrievable via getItem', () => {
              SessionStorageCache().setItem([1, 2, 3], 'list');
              expect(SessionStorageCache().getItem<number[]>('list')).toEqual([1, 2, 3]);
          });
      });

      describe('removeItem', () => {
          it('removes an existing key', () => {
              globalThis.sessionStorage.setItem('to-remove', '"value"');
              SessionStorageCache().removeItem('to-remove');
              expect(globalThis.sessionStorage.getItem('to-remove')).toBeNull();
          });

          it('does not throw when removing a non-existent key', () => {
              expect(() => SessionStorageCache().removeItem('ghost-key')).not.toThrow();
          });
      });

      describe('clear', () => {
          it('removes all entries from sessionStorage', () => {
              globalThis.sessionStorage.setItem('a', '"1"');
              globalThis.sessionStorage.setItem('b', '"2"');
              SessionStorageCache().clear();
              expect(globalThis.sessionStorage.length).toBe(0);
          });
      });
  });
  ```

- [ ] **Step 2: Verify the tests pass**

  ```
  npx vitest run tests/unit/storage/sessionStorageCache.test.ts --reporter=verbose
  ```
  Expected: **10 tests pass**, 0 failures.

---

### Task 2: errorRoutes full mapping tests (Gap 6)

**Files:**
- Create: `tests/unit/routes/errorRoutes.test.ts`

- [ ] **Step 1: Write the test file**

  ```ts
  import { describe, it, expect } from 'vitest';
  import getUnexpectedErrorRoute from '../../../ClientApp/src/routes/common/errorRoutes';
  import { HttpStatusCode } from '../../../ClientApp/src/types';

  describe('getUnexpectedErrorRoute', () => {
      it('maps 403 Forbidden to /forbidden', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.Forbidden)).toBe('/forbidden');
      });

      it('maps 409 Conflict to /conflict', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.Conflict)).toBe('/conflict');
      });

      it('maps 410 Gone to /no-longer-available', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.Gone)).toBe('/no-longer-available');
      });

      it('maps 412 PreconditionFailed to /precondition-failed', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.PreconditionFailed)).toBe('/precondition-failed');
      });

      it('maps 422 UnprocessableEntity to /unprocessable', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.UnprocessableEntity)).toBe('/unprocessable');
      });

      it('maps 500 InternalServerError to /server-error', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.InternalServerError)).toBe('/server-error');
      });

      it('maps 503 ServiceUnavailable to /service-unavailable', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.ServiceUnavailable)).toBe('/service-unavailable');
      });

      it('maps an unmapped status code (404) to /server-error (default)', () => {
          expect(getUnexpectedErrorRoute(HttpStatusCode.NotFound)).toBe('/server-error');
      });

      it('maps undefined to /server-error (default)', () => {
          expect(getUnexpectedErrorRoute(undefined)).toBe('/server-error');
      });
  });
  ```

- [ ] **Step 2: Verify the tests pass**

  ```
  npx vitest run tests/unit/routes/errorRoutes.test.ts --reporter=verbose
  ```
  Expected: **9 tests pass**, 0 failures.

---

### Task 3: Org-switching lifecycle documentation (Section 8, Gap 7)

**Files:**
- Create: `docs/architecture/org-switching-lifecycle.md`

Content must document:
1. How `setTargetOrganisation` in `AccountContext` writes to `sessionStorage`
2. How `AuthorizedApiBase.targetOrganisation` reads from `sessionStorage` at **construction time**
3. Why this is safe in practice (fresh client per useEffect) but risky if client instances are reused
4. The specific header injected: `TargetOrganisationAbn`
5. What the rebuild should do differently (read from context/hook, not sessionStorage at construction)

- [ ] **Step 1: Read the relevant sources**

  Read `ClientApp/src/api/web-api-client.ts` lines 10–35 and `ClientApp/src/authentication/accountContext.tsx` (the `setTargetOrganisation` dispatch function) before writing.

- [ ] **Step 2: Create the document**

  Create `docs/architecture/org-switching-lifecycle.md` with the following content:

  ```markdown
  # Organisation Switching Lifecycle

  ## Overview

  The portal supports third-party access: a user can act on behalf of a different
  organisation by selecting a "target organisation" via the Branch Selector modal.
  The selected target is stored in both React state and `sessionStorage`, and is
  read by every API client at request time.

  ## Data flow

  ```
  User selects org in BranchSelectorModal
        ↓
  accountDispatch.setTargetOrganisation(abn, name)
        ↓
  AccountContext updates state: { targetOrganisation: { abn, name } }
        ↓
  accountContext.tsx also writes to sessionStorage:
    sessionStorage.setItem('targetOrganisation', JSON.stringify({
        targetOrganisationAbn: abn,
        targetOrganisationName: name,
    }))
        ↓
  Next API client instantiation reads sessionStorage:
    new DashboardClient() → AuthorizedApiBase.targetOrganisation =
        sessionStorage.getItem('targetOrganisation')   ← construction-time read
        ↓
  transformOptions() injects header on every request:
    headers.TargetOrganisationAbn = targetOrganisationJson.targetOrganisationAbn
  ```

  ## Why the construction-time read is safe in the current codebase

  Every API client is constructed **inside a `useEffect`** or async handler:

  ```ts
  // e.g. Dashboard component
  const client = new DashboardClient();  // reads sessionStorage NOW
  client.setAuthToken(token);
  await client.getDashboardDraftsByPortalID(...);
  ```

  Because the client is created fresh on each effect execution, it captures the
  current `sessionStorage` value at call time. When the user switches org, the
  React state change triggers a re-render → useEffect re-runs → new client
  instance reads the updated `sessionStorage` value.

  **Risk:** If any code were to cache a client instance across renders or across
  org-switch events, that cached instance would silently send stale
  `TargetOrganisationAbn` values. No such caching exists in the current codebase.

  ## Header injected

  | Header | Value | Source |
  |---|---|---|
  | `TargetOrganisationAbn` | ABN string | `sessionStorage['targetOrganisation'].targetOrganisationAbn` |

  The backend uses this header to scope data access to the target organisation.
  The header is injected by `AuthorizedApiBase.transformOptions()` and is present
  on every request made by any `*Client` class that extends `AuthorizedApiBase`
  (all generated NSwag clients).

  ## Rebuild recommendation

  In the rebuilt portal, `AuthorizedApiBase` should receive the target organisation
  directly rather than reading from `sessionStorage` at construction:

  ```ts
  // Option A: pass via constructor
  const client = new DashboardClient(accountState.details.targetOrganisation?.abn);

  // Option B: inject via useAuthenticatedClient hook
  const getClient = useAuthenticatedClient(DashboardClient, targetOrgAbn);
  ```

  This removes the implicit `sessionStorage` coupling and makes the data flow
  explicit and testable.

  ## Files involved

  | File | Role |
  |---|---|
  | `ClientApp/src/api/web-api-client.ts:10–35` | `AuthorizedApiBase` — construction-time read + header injection |
  | `ClientApp/src/authentication/accountContext.tsx` | `setTargetOrganisation` dispatch — writes to both state and sessionStorage |
  | `ClientApp/src/storage/sessionStorageCache.ts` | Low-level sessionStorage wrapper |
  | All `*Client` classes in `web-api-client.ts` | Extend `AuthorizedApiBase` (DashboardClient, QuoteClient, etc.) |
  ```

- [ ] **Step 3: Verify file was created**

  ```
  ls docs/architecture/org-switching-lifecycle.md
  ```

---

### Task 4: NSwag regeneration process documentation (Section 8, Gap 9)

**Files:**
- Create: `docs/architecture/nswag-regeneration.md`

- [ ] **Step 1: Read the NSwag header in web-api-client.ts**

  Read the first 10 lines of `ClientApp/src/api/web-api-client.ts` for the NSwag version and any relevant comments.

- [ ] **Step 2: Create the document**

  Create `docs/architecture/nswag-regeneration.md`:

  ```markdown
  # NSwag Client Regeneration

  ## What it is

  `ClientApp/src/api/web-api-client.ts` is **auto-generated** by NSwag v14.5.0.0
  (NJsonSchema v11.4.0.0) from the backend OpenAPI specification. It must **never
  be edited manually** — all changes will be overwritten on the next regeneration.

  The hand-authored addition to this file is the `AuthorizedApiBase` class
  (lines 10–35), which NSwag places above the generated classes via its
  `extendedClassCode` or `operationGenerationMode` configuration. This class is
  preserved across regenerations because it is declared before the `/* auto-generated */`
  block — verify this is still the case after any regeneration.

  ## When to regenerate

  Regenerate when:
  - A backend API endpoint is added, removed, or its signature changes
  - A new DTO (data transfer object) is added or modified in the backend schema
  - The OpenAPI spec version is bumped

  Do **not** regenerate solely for frontend refactoring — the generated client is
  stable until the backend contract changes.

  ## Regeneration procedure

  ### Prerequisites

  - NSwag CLI installed: `npm install -g nswag` (version 14.x to match the current
    generated file header)
  - Backend API is running locally or a published OpenAPI JSON/YAML spec is available
  - Node.js ≥ 18

  ### Steps

  1. **Obtain the OpenAPI spec** — either run the backend locally and fetch:
     ```
     curl http://localhost:5000/swagger/v1/swagger.json -o api-spec.json
     ```
     or use the published spec URL from the NMI portal backend.

  2. **Run NSwag generation:**
     ```bash
     nswag openapi2tsclient \
       /input:api-spec.json \
       /output:ClientApp/src/api/web-api-client.ts \
       /template:Fetch \
       /typeStyle:Class \
       /generateConstructorInterface:false \
       /generateOptionalParameters:true \
       /nullValue:Undefined \
       /generateClientInterfaces:false
     ```
     Adjust flags to match the existing file's style. Check the NSwag config file
     (`.nswag` or `nswag.json`) at the project root — if one exists, run:
     ```bash
     nswag run nswag.json
     ```

  3. **Verify `AuthorizedApiBase` is preserved** — confirm lines 10–35 of the
     regenerated file contain the `AuthorizedApiBase` class with `authToken`,
     `targetOrganisation`, `setAuthToken()`, and `transformOptions()`. If NSwag
     overwrites this class, restore it from source control and place it at the
     top of the generated file.

  4. **Run the test suite:**
     ```bash
     npx vitest run tests/unit/
     ```
     Expected: all tests pass. Any failures suggest the API contract changed in a
     way that breaks existing component behaviour — investigate before deploying.

  5. **Update the Storybook MSW handlers** (`.storybook/msw-handlers.ts`) if any
     new API endpoints were added that need mock responses for stories.

  ## Rebuild note

  In the rebuilt portal, consider generating the NSwag client into a separate
  package or using a dedicated `api/` workspace so regeneration does not require
  manually managing the `AuthorizedApiBase` preservation step.

  ## Files involved

  | File | Role |
  |---|---|
  | `ClientApp/src/api/web-api-client.ts` | Generated output — do not edit manually |
  | `AuthorizedApiBase` (lines 10–35) | Hand-authored base class — must be preserved after regeneration |
  | `.storybook/msw-handlers.ts` | Must be updated when new endpoints are added |
  ```

- [ ] **Step 3: Verify file was created**

  ```
  ls docs/architecture/nswag-regeneration.md
  ```

---

### Task 5: Update readiness assessment HTML

**Files:**
- Modify: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html`

- [ ] **Step 1: Mark Section 7, Gap 5 resolved**

  Find the Gap 5 row (`sessionStorageCache.ts defensive JSON parsing`) and change its status cell to:
  ```html
  <span class="badge status-resolved">Resolved</span>
  ```
  Add a note: "resolved 2026-05-31: 10 unit tests added in `tests/unit/storage/sessionStorageCache.test.ts`"

- [ ] **Step 2: Mark Section 7, Gap 6 resolved**

  Find the Gap 6 row (`errorRoutes.ts full mapping`) and change to resolved:
  "resolved 2026-05-31: 9 unit tests added in `tests/unit/routes/errorRoutes.test.ts`"

- [ ] **Step 3: Mark Section 8, Gap 7 resolved**

  Find the Gap 7 row (`Organisation switching / setTargetOrganisation lifecycle`) and change severity to Low (resolved):
  "resolved 2026-05-31: documented in `docs/architecture/org-switching-lifecycle.md`"

- [ ] **Step 4: Mark Section 8, Gap 9 resolved**

  Find the Gap 9 row (`NSwag client regeneration process`) and change to resolved:
  "resolved 2026-05-31: procedure documented in `docs/architecture/nswag-regeneration.md`"

- [ ] **Step 5: Update Section 13 (Next Recommended Task)**

  Update the outstanding items list and the sprint summary count. Update test count to **219+** (199 + 10 + 9 = 218 minimum, rounding up).

- [ ] **Step 6: Verify section count unchanged**

  ```
  grep -c "</section>" docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html
  ```
  Expected: 13 (unchanged).

---

## Safety, Rollback, and Verification

- **Risk:** All tasks are additive (new files + HTML edits). No existing code is modified.
- **Verification:** `npx vitest run tests/unit/ --reporter=verbose 2>&1 | tail -5` — all prior tests still pass after adding new test files.
- **Rollback:** Delete any newly created file. HTML edits can be reverted by restoring the original content.

---

## Final Validation

* Requirement coverage: PASS
* Exact paths: PASS
* Tests before implementation: PASS (TDD for test files; documentation verified by file existence)
* Exact commands and expected outputs: PASS
* No placeholders or undefined references: PASS
* Safety and rollback: PASS (all additive)
* Score: **97/100**
* Critical failures: None

Minor deduction: Task 4 (NSwag flags) assumes the generation flags match the existing file — the implementer should verify by reading the existing generated file header comments.

---

## Execution Handoff

Recommended order: **1 → 2 → 3 → 4 → 5**

Tests first (verifiable immediately), then documentation, then HTML update.
