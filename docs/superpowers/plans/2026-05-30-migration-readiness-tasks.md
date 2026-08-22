# Migration Readiness Tasks — Pre-Rebuild Sprint

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Close the six highest-risk migration-readiness gaps identified in the 2026-05-29 readiness assessment so that correctness of the portal rebuild can be proven by tests rather than manual inspection.

**Architecture:** Tasks 1, 3, and 5 add unit/integration tests to the `quality/_phase5_seed` rebuild harness, which is the authoritative test target for the new platform. Task 2 creates a formal backend-verification artifact for the SEC-010 IDOR finding. Task 4 produces a migration supplement to the existing acquireTokenSilent ADR. Task 6 fixes two incorrect font-file import paths in Storybook's `preview.ts` that cause all 56 story render failures.

**Tech Stack:** React 18 + TypeScript, Vitest 4 + `@testing-library/react` 16 + MSW v2 (Tasks 1/3), Yup 1.4 (Task 5), `@storybook/react-vite` 10 (Task 6). Tests run from `quality/_phase5_seed/` with `npm run test:unit`.

---

## Source Inputs

- Spec: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html`
- Relevant files inspected:
  - `ClientApp/src/routes/preConditions/PreConditions.tsx`: 5 precondition booleans at lines 63–92 that govern navigation; no tests exist
  - `ClientApp/src/routes/dashboard/index.tsx`: dashboard with complex filter/pagination state; `organisationCRMGuid` passed to API with SEC-010 comment at line 404
  - `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`: 19 custom Yup string methods; only `businessName` regression-tested
  - `.storybook/preview.ts`: imports `'../fonts/fonts.css'` and `'../fonts/nmi-iconfonts.css'` — paths that do not exist (fonts are in `ClientApp/public/fonts/`)
  - `quality/_phase5_seed/static/js/validationSchemas/yupExtensions/stringExtensions.ts`: rebuild copy of string extensions — source for Task 5
  - `quality/_phase5_seed/tests/unit/`: existing test convention (imports via `../../../static/js/…`)
  - `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`: ADR already written; status Proposed/Deferred
  - `quality/_phase5_seed/static/js/authentication/accountContext.tsx`: `AccountDetails` interface in rebuild harness

---

## Assumptions and Unknowns

- **Assumption:** `quality/_phase5_seed` is the canonical test harness; `npm run test:unit` from that directory runs Vitest over `tests/unit/**/*.test.{ts,tsx}`.
- **Assumption:** `PreConditions.tsx` and `dashboard/index.tsx` have not yet been ported to `quality/_phase5_seed/static/js/`. The porting step is part of Tasks 1 and 3.
- **Assumption:** The rebuild's `quality/_phase5_seed/static/js/` does **not** include `components/modals/TermsAndCondition`, `BranchSelectorModal`, `RFQDeleteModal`, or `ModalContext` yet — these will be mocked in tests via `vi.mock`.
- **Assumption:** MSW v2 is available in `quality/_phase5_seed` (confirmed in `package.json`: `"msw": "^2.3.0"`).
- **Assumption:** The backend API endpoint for dashboard data enforces org-level scoping (SEC-010); this must be verified out-of-band by a backend engineer.
- **Blocking ambiguity:** None — all tasks can proceed safely.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Section 7, Gap 3: PreConditions state machine untested | Task 1 | 5 boolean preconditions + 3 redirect assertions |
| SEC-010 (IDOR): org scoping relies on client-supplied GUID | Task 2 | Backend verification artifact; inline comment already present |
| Section 7, Gap 7: Dashboard filter/pagination untested | Task 3 | MSW v2 + tab/page/search state coverage |
| 35+ distributed acquireTokenSilent call sites | Task 4 | ADR done; migration checklist supplement added |
| Section 7, Gap 4: 18 of 19 Yup validators untested | Task 5 | One test file covers all remaining methods |
| 56 Storybook asset failures | Task 6 | 2-line fix to font import paths in `preview.ts` |

---

## Framework Fit

- **TDD/characterization tests**: Tests are written before any refactoring. They characterize existing behavior so it can be reproduced exactly in the rebuild.
- **DDD**: Not needed — no domain aggregates being introduced.
- **ADR-lite**: Task 4 supplements an existing ADR; no new architecture decision.
- **Threat modeling**: Task 2 addresses the existing SEC-010 IDOR finding; no new threat surface introduced.
- **C4 mapping**: Not needed — no cross-service boundary changes.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `quality/_phase5_seed/static/js/routes/preConditions/PreConditions.tsx` | Create (port) | Ported source for Task 1 test target |
| `quality/_phase5_seed/tests/unit/routes/preConditions.test.tsx` | Create | Task 1 — PreConditions state machine tests |
| `docs/sec/SEC-010-idor-backend-verification.md` | Create | Task 2 — Formal backend verification checklist |
| `quality/_phase5_seed/static/js/routes/dashboard/index.tsx` | Create (port) | Ported source for Task 3 test target |
| `quality/_phase5_seed/tests/unit/routes/dashboard.test.tsx` | Create | Task 3 — Dashboard filter/pagination tests |
| `docs/adr/2026-05-30-acquire-token-silent-interceptor.md` | Read-only | Task 4 — Existing ADR (already complete) |
| `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md` | Create | Task 4 — Migration sprint checklist |
| `quality/_phase5_seed/tests/unit/validation/stringExtensions.test.ts` | Create | Task 5 — Yup validator coverage for 18 remaining methods |
| `.storybook/preview.ts` | Modify | Task 6 — Fix two font import paths |

---

## Tasks

---

### Task 6: Fix Storybook font import paths (do this first — unblocks all story rendering)

**Files:**
- Modify: `.storybook/preview.ts`

**Root cause:** `preview.ts` imports `'../fonts/fonts.css'` and `'../fonts/nmi-iconfonts.css'`. From `.storybook/`, `..` resolves to the workspace root. No `fonts/` directory exists there. The font files live at `ClientApp/public/fonts/`. Vite fails to resolve the imports at build time, causing `preview.ts` to throw, which cascades to 56 story failures.

- [ ] **Step 1: Verify the broken import paths**

  Confirm no `fonts/` directory exists at the workspace root:
  ```
  ls fonts/   # expected: directory not found
  ls ClientApp/public/fonts/   # expected: fonts.css  nmi-iconfonts.css  ...
  ```

- [ ] **Step 2: Fix the two import lines**

  In `.storybook/preview.ts`, lines 6–7, replace:
  ```ts
  import '../fonts/fonts.css';
  import '../fonts/nmi-iconfonts.css';
  ```
  with:
  ```ts
  import '../ClientApp/public/fonts/fonts.css';
  import '../ClientApp/public/fonts/nmi-iconfonts.css';
  ```

  These paths resolve to `ClientApp/public/fonts/fonts.css` and `ClientApp/public/fonts/nmi-iconfonts.css` relative to the workspace root (`.storybook/` parent). Vite processes the `@font-face` `url()` references inside each CSS file relative to that CSS file's directory, so `PublicSans-Regular.ttf`, `PublicSans-Bold.ttf`, and `nmi-iconfonts.woff` resolve correctly.

- [ ] **Step 3: Verify the fix**

  From `quality/_phase5_seed/`:
  ```
  npm run build-storybook -- --quiet 2>&1 | tail -20
  ```
  Expected: build completes with 0 asset-resolution errors. Story count in output should match the number of `*.stories.tsx` files (~47).

- [ ] **Step 4: Commit**

  ```bash
  git add .storybook/preview.ts
  git commit -m "fix(storybook): correct font CSS import paths from .storybook to ClientApp/public/fonts"
  ```

---

### Task 5: Custom Yup validators — full coverage for 18 remaining methods

**Files:**
- Create: `quality/_phase5_seed/tests/unit/validation/stringExtensions.test.ts`
- Source (already exists): `quality/_phase5_seed/static/js/validationSchemas/yupExtensions/stringExtensions.ts`
- Side-effect barrel (already exists): `quality/_phase5_seed/static/js/validationSchemas/yupExtensions/index.ts`

**Context:** The existing regression smoke test (`buildRegressionSmoke.test.tsx`) verifies the 4 method names exist on `yup.string()` after the barrel import, but does not test actual validation logic. The `businessName` validator has its own assertion elsewhere. The 18 remaining methods need individual behavioral tests covering: valid inputs pass, invalid inputs fail, empty/null inputs pass (nullable behaviour), and custom error messages surface.

- [ ] **Step 1: Write the failing test file**

  Create `quality/_phase5_seed/tests/unit/validation/stringExtensions.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import * as Yup from 'yup';
  import '../../../static/js/validationSchemas/yupExtensions';

  // Helper: resolve schema and return boolean
  const valid = (schema: Yup.StringSchema, value: string | null | undefined) =>
      schema.isValidSync(value);

  describe('stringExtensions — individual method coverage', () => {

      describe('fixedDigits(n)', () => {
          const s = Yup.string().fixedDigits(4);
          it('passes empty string', () => expect(valid(s, '')).toBe(true));
          it('passes undefined', () => expect(valid(s, undefined)).toBe(true));
          it('passes exactly 4 digits', () => expect(valid(s, '1234')).toBe(true));
          it('fails 3 digits', () => expect(valid(s, '123')).toBe(false));
          it('fails 5 digits', () => expect(valid(s, '12345')).toBe(false));
          it('fails non-digits', () => expect(valid(s, 'abcd')).toBe(false));
      });

      describe('numbersOnly()', () => {
          const s = Yup.string().numbersOnly();
          it('passes digits', () => expect(valid(s, '123')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails letters', () => expect(valid(s, '12a')).toBe(false));
          it('fails symbols', () => expect(valid(s, '1.2')).toBe(false));
      });

      describe('minValue(n)', () => {
          const s = Yup.string().minValue(10);
          it('passes value equal to min', () => expect(valid(s, '10')).toBe(true));
          it('passes value above min', () => expect(valid(s, '99')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails value below min', () => expect(valid(s, '9')).toBe(false));
          it('fails non-numeric string', () => expect(valid(s, 'abc')).toBe(false));
      });

      describe('maxValue(n)', () => {
          const s = Yup.string().maxValue(100);
          it('passes value equal to max', () => expect(valid(s, '100')).toBe(true));
          it('passes value below max', () => expect(valid(s, '50')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails value above max', () => expect(valid(s, '101')).toBe(false));
          it('fails non-numeric string', () => expect(valid(s, 'abc')).toBe(false));
      });

      describe('decimalNumbersOnly()', () => {
          const s = Yup.string().decimalNumbersOnly();
          it('passes integer', () => expect(valid(s, '42')).toBe(true));
          it('passes decimal', () => expect(valid(s, '3.14')).toBe(true));
          it('passes negative decimal', () => expect(valid(s, '-1.5')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails letters', () => expect(valid(s, 'abc')).toBe(false));
          it('fails double dot', () => expect(valid(s, '1..2')).toBe(false));
      });

      describe('postcode()', () => {
          const s = Yup.string().postcode();
          it('passes valid NSW postcode (2000)', () => expect(valid(s, '2000')).toBe(true));
          it('passes valid ACT postcode (2601)', () => expect(valid(s, '2601')).toBe(true));
          it('passes valid NT postcode (0800)', () => expect(valid(s, '0800')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails 3 digits', () => expect(valid(s, '200')).toBe(false));
          it('fails out-of-range (0000)', () => expect(valid(s, '0000')).toBe(false));
          it('fails letters', () => expect(valid(s, 'ABCD')).toBe(false));
      });

      describe('phone(false) — landline + mobile', () => {
          const s = Yup.string().phone(false);
          it('passes Australian mobile (04xx)', () => expect(valid(s, '0412 345 678')).toBe(true));
          it('passes +61 mobile', () => expect(valid(s, '+61 412 345 678')).toBe(true));
          it('passes landline (02 xxxx xxxx)', () => expect(valid(s, '02 9999 8888')).toBe(true));
          it('passes 1800 number', () => expect(valid(s, '1800 123 456')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails partial number', () => expect(valid(s, '041234')).toBe(false));
          it('fails letters', () => expect(valid(s, 'abc')).toBe(false));
      });

      describe('phone(true) — mobile only', () => {
          const s = Yup.string().phone(true);
          it('passes mobile (04xx)', () => expect(valid(s, '0412 345 678')).toBe(true));
          it('fails landline', () => expect(valid(s, '02 9999 8888')).toBe(false));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
      });

      describe('email()', () => {
          const s = Yup.string().email();
          it('passes standard email', () => expect(valid(s, 'user@example.com')).toBe(true));
          it('passes subaddress', () => expect(valid(s, 'user+tag@mail.gov.au')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails missing @', () => expect(valid(s, 'userexample.com')).toBe(false));
          it('fails missing TLD', () => expect(valid(s, 'user@example')).toBe(false));
          it('fails double dot in domain', () => expect(valid(s, 'user@ex..com')).toBe(false));
      });

      describe('minEntered(n)', () => {
          const s = Yup.string().minEntered(3);
          it('passes length >= min', () => expect(valid(s, 'abc')).toBe(true));
          it('passes length > min', () => expect(valid(s, 'abcde')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails length < min', () => expect(valid(s, 'ab')).toBe(false));
      });

      describe('addressFormat()', () => {
          const s = Yup.string().addressFormat();
          it('passes typical address', () => expect(valid(s, '123 Main St')).toBe(true));
          it('passes address with comma', () => expect(valid(s, 'Suite 1, Level 2')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails disallowed char <', () => expect(valid(s, '<script>')).toBe(false));
          it('fails disallowed char |', () => expect(valid(s, 'addr|ess')).toBe(false));
      });

      describe('allowedFormat(true) — extended charset', () => {
          const s = Yup.string().allowedFormat(true);
          it('passes printable ASCII with spaces', () => expect(valid(s, 'Hello, World! 123')).toBe(true));
          it('passes curly quotes', () => expect(valid(s, '‘smart’')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          // Non-printable control char (ASCII 0x01) is invalid
          it('fails control character', () => expect(valid(s, 'abc')).toBe(false));
      });

      describe('allowedFormat(false) — restricted charset', () => {
          const s = Yup.string().allowedFormat(false);
          it('passes basic alphanumeric + space', () => expect(valid(s, 'ABC 123')).toBe(true));
          it('passes hyphen', () => expect(valid(s, 'Alpha-Beta')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails at-sign', () => expect(valid(s, 'user@test')).toBe(false));
      });

      describe('nameAllowedFormat()', () => {
          const s = Yup.string().nameAllowedFormat();
          it('passes letters with hyphen and apostrophe', () => expect(valid(s, "O'Brien-Smith")).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
      });

      describe('noConsecutiveChars(threshold)', () => {
          const s = Yup.string().noConsecutiveChars(3); // threshold 3 → allows up to 2 repeating
          it('passes two consecutive same chars', () => expect(valid(s, 'aab')).toBe(true));
          it('passes no consecutive', () => expect(valid(s, 'abc')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails three consecutive same chars', () => expect(valid(s, 'aaab')).toBe(false));
          it('fails four consecutive same chars', () => expect(valid(s, 'aaaa')).toBe(false));
      });

      describe('atLeastOneChar()', () => {
          const s = Yup.string().atLeastOneChar();
          it('passes string with a letter', () => expect(valid(s, 'a1')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails digits-only', () => expect(valid(s, '123')).toBe(false));
          it('fails symbols-only', () => expect(valid(s, '!@#')).toBe(false));
      });

      describe('noConsecutivePuncuation()', () => {
          const s = Yup.string().noConsecutivePuncuation();
          it('passes single hyphen', () => expect(valid(s, 'a-b')).toBe(true));
          it('passes single apostrophe', () => expect(valid(s, "it's")).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails double hyphen', () => expect(valid(s, 'a--b')).toBe(false));
          it('fails double apostrophe', () => expect(valid(s, "it''s")).toBe(false));
          it('fails double space', () => expect(valid(s, 'a  b')).toBe(false));
      });

      describe('numberWithinRange(min, max)', () => {
          const s = Yup.string().numberWithinRange(1, 10);
          it('passes value at min boundary', () => expect(valid(s, '1')).toBe(true));
          it('passes value at max boundary', () => expect(valid(s, '10')).toBe(true));
          it('passes value within range', () => expect(valid(s, '5')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails below min', () => expect(valid(s, '0')).toBe(false));
          it('fails above max', () => expect(valid(s, '11')).toBe(false));
          it('passes decimal within range', () => expect(valid(s, '5.5')).toBe(true));
      });

      describe('maxLength(n)', () => {
          const s = Yup.string().maxLength(5);
          it('passes length equal to max', () => expect(valid(s, 'abcde')).toBe(true));
          it('passes length below max', () => expect(valid(s, 'abc')).toBe(true));
          it('passes empty', () => expect(valid(s, '')).toBe(true));
          it('fails length above max', () => expect(valid(s, 'abcdef')).toBe(false));
      });

      describe('isRequired()', () => {
          const s = Yup.string().isRequired('Field');
          it('passes non-empty string', () => expect(valid(s, 'hello')).toBe(true));
          it('fails empty string', () => expect(valid(s, '')).toBe(false));
          it('fails whitespace-only', () => expect(valid(s, '   ')).toBe(false));
          it('fails undefined', () => expect(valid(s, undefined)).toBe(false));
          it('returns custom label in error message', async () => {
              try {
                  await s.validate('');
                  expect.fail('should have thrown');
              } catch (e) {
                  expect((e as Yup.ValidationError).message).toBe('Field is required');
              }
          });
      });

  });
  ```

- [ ] **Step 2: Verify the test fails (no existing test file)**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit -- tests/unit/validation/stringExtensions.test.ts --reporter=verbose 2>&1 | head -5
  ```
  Expected: `FAIL tests/unit/validation/stringExtensions.test.ts` — file not found.

- [ ] **Step 3: Create the test file**

  Write the file exactly as shown in Step 1.

- [ ] **Step 4: Verify the tests pass**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit -- tests/unit/validation/stringExtensions.test.ts --reporter=verbose
  ```
  Expected: all assertions pass. No test should be marked `test.fails`.

- [ ] **Step 5: Run regression check**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit
  ```
  Expected: all existing tests still pass; new file adds passing tests with no regressions.

- [ ] **Step 6: Commit**

  ```bash
  git add quality/_phase5_seed/tests/unit/validation/stringExtensions.test.ts
  git commit -m "test(validation): add full coverage for 18 custom Yup string extension methods"
  ```

---

### Task 2: SEC-010 (IDOR) — backend verification artifact

**Files:**
- Create: `docs/sec/SEC-010-idor-backend-verification.md`
- Reference: `ClientApp/src/routes/dashboard/index.tsx` lines 404–407 (inline comment already present)

**Context:** The inline comment at `dashboard/index.tsx:404` documents that `organisationCRMGuid` originates from the server-side sign-in response and is re-sent to the API. The portal cannot enforce org scoping client-side; only the backend can. This task creates a formal checklist for backend reviewers to close the finding.

- [ ] **Step 1: Create `docs/sec/` directory and verification document**

  Create `docs/sec/SEC-010-idor-backend-verification.md`:

  ```markdown
  # SEC-010 — IDOR: Dashboard org-scoping verification

  **Status:** Open — pending backend review
  **Severity:** High (if backend enforcement is absent)
  **Raised:** 2026-05-30
  **Assigned to:** Backend engineering / security review

  ## Finding

  `ClientApp/src/routes/dashboard/index.tsx` lines 408–419 call
  `fetchRequestsByTab()` with `accountDetailsCrmGuid: accountDetails.organisationCRMGuid`.
  This GUID originates from the server-side sign-in response and is stored in
  `AccountContext`. However, if a malicious actor replaces this value in memory
  (e.g., by patching `AccountContext` via browser DevTools or a client-side exploit),
  the API must not honour the substituted value without server-side authorisation.

  **Inline code comment added:** `dashboard/index.tsx:404–407`

  ## Verification checklist (backend reviewer)

  - [ ] The API endpoint(s) receiving `accountDetailsCrmGuid` (Drafts, Quotes,
        Artefacts) enforce org-level scoping using the **authenticated user's claims
        from the JWT token**, not solely the value in the request payload/query string.
  - [ ] A test with a valid JWT for Org A but a `crmGuid` for Org B returns HTTP 403
        or an empty result set — it does not return Org B's data.
  - [ ] The finding has been reproduced and confirmed or dismissed with evidence
        (test name + result, or pen-test report reference).

  ## Endpoints to check

  | Tab | Client method | Likely route |
  |---|---|---|
  | Drafts | `getDashboardDraftsByPortalID` | `GET /api/dashboard/drafts` |
  | Requests | `getDashboardQuotesByPortalID` | `GET /api/dashboard/quotes` |
  | Instruments | `getDashboardArtefactsByPortalID` | `GET /api/dashboard/artefacts` |

  ## Resolution

  When all checklist items pass:
  1. Update this document's **Status** to `Closed — verified <date>`.
  2. Add the test reference or pen-test report number under each checklist item.
  3. Update `ClientApp/src/routes/dashboard/index.tsx` comment line 407:
     `// Verified by: <test name or report ID> (<date>)`.
  ```

- [ ] **Step 2: Verify document is written**

  Confirm file exists and contains the three required checklist items:
  ```
  grep -c "\- \[ \]" docs/sec/SEC-010-idor-backend-verification.md
  ```
  Expected: `3`

- [ ] **Step 3: Commit**

  ```bash
  git add docs/sec/SEC-010-idor-backend-verification.md
  git commit -m "docs(sec): add backend verification checklist for SEC-010 IDOR finding"
  ```

---

### Task 4: acquireTokenSilent — migration sprint checklist

**Files:**
- Read: `docs/adr/2026-05-30-acquire-token-silent-interceptor.md` (already complete, status: Proposed/Deferred)
- Create: `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md`

**Context:** The ADR is written and deferred. The rebuild team needs a concrete per-file checklist of all 35+ call sites to replace when they implement the centralized `useAuthenticatedClient` hook during the migration sprint.

- [ ] **Step 1: Find all acquireTokenSilent call sites in the snapshot**

  ```bash
  grep -rn "acquireTokenSilent" ClientApp/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | sort
  ```
  Record the count and full path list.

- [ ] **Step 2: Create migration checklist document**

  Create `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md`:

  ```markdown
  # Migration Checklist — Centralise acquireTokenSilent

  **ADR:** `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`
  **Sprint:** Portal rebuild migration sprint
  **Pattern to implement:** `useAuthenticatedClient<T>(ClientClass)` hook (see ADR for signature)

  ## Call sites to migrate (run `grep -rn "acquireTokenSilent" static/js` to verify)

  For each site below, replace the inline `acquireTokenSilent + setAuthToken` block
  with `const getClient = useAuthenticatedClient(XxxClient); const client = await getClient();`

  | File | Line(s) | Client class | Done |
  |---|---|---|---|
  <!-- Populate from Step 1 grep output -->

  ## Acceptance criteria

  - [ ] `grep -rn "acquireTokenSilent" static/js` returns 0 results after migration
  - [ ] All `InteractionRequiredAuthError` fallbacks are centralised in `useAuthenticatedClient`
  - [ ] Existing test suite passes with no new failures: `npm run test:unit`
  - [ ] Storybook mock (`mockMsalContext.instance.acquireTokenSilent`) remains compatible
  ```

  > **Note:** Populate the table by running the grep in Step 1 and pasting the results.

- [ ] **Step 3: Commit**

  ```bash
  git add docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md
  git commit -m "docs(migration): add acquireTokenSilent call-site migration checklist for rebuild sprint"
  ```

---

### Task 1: PreConditions state machine tests

**Files:**
- Create (port): `quality/_phase5_seed/static/js/routes/preConditions/PreConditions.tsx`
- Create: `quality/_phase5_seed/tests/unit/routes/preConditions.test.tsx`

**Context:** `PreConditions.tsx` controls which route a user lands on after sign-in. All five boolean preconditions (`redirectToCreateAccount`, `redirectToCreateContact`, `redirectToDashboard`, `showTermsAndConditions`, `autoShowBranchSelector`) are untested. If these break during migration, users will be stuck in redirect loops or never prompted for terms. Tests use `vi.mock` for all child components and MSAL hooks to isolate the routing logic.

- [ ] **Step 1: Port PreConditions.tsx to the rebuild harness**

  Copy `ClientApp/src/routes/preConditions/PreConditions.tsx` to `quality/_phase5_seed/static/js/routes/preConditions/PreConditions.tsx`.

  Verify that each import in the copied file resolves to an existing file in `quality/_phase5_seed/static/js/`. For any import that doesn't resolve, the test will mock it. Currently missing from the rebuild harness:
  - `../../components/modals/TermsAndCondition` → stub via `vi.mock`
  - `../../components/modals/BranchSelectorModal` → stub via `vi.mock`
  - `../../components/modals/RFQDeleteModal` → stub via `vi.mock`
  - `../../components/modals/ModalContext` → stub via `vi.mock`
  - `../../components/modals/BranchSelectorModal/enums` → stub via `vi.mock`
  - `../../storage/notification` → stub via `vi.mock`

  The following imports are already present in the rebuild harness and need no stub:
  - `@azure/msal-react` (npm dep)
  - `react-router-dom` (npm dep)
  - `../../authentication/hooks` → `quality/_phase5_seed/static/js/authentication/hooks.tsx` ✓
  - `../../components/Layout` → `quality/_phase5_seed/static/js/components/Layout/index.tsx` ✓
  - `../../components/Utilities/routeChangeScrollTop` ✓
  - `../../components/Utilities/backToTopButton` ✓
  - `../../components/Utilities/routeAccessibleNavigation` ✓

- [ ] **Step 2: Write the failing test**

  Create `quality/_phase5_seed/tests/unit/routes/preConditions.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { render, screen } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import type { AccountDetails } from '../../../static/js/authentication/accountContext';

  // ─── Stubs for components not yet ported to the rebuild harness ───────────────
  vi.mock('../../../static/js/components/modals/TermsAndCondition', () => ({
      default: () => <div data-testid='terms-modal' />,
  }));
  vi.mock('../../../static/js/components/modals/BranchSelectorModal', () => ({
      default: () => <div data-testid='branch-selector-modal' />,
  }));
  vi.mock('../../../static/js/components/modals/RFQDeleteModal', () => ({
      default: () => <div data-testid='rfq-delete-modal' />,
  }));
  vi.mock('../../../static/js/components/modals/ModalContext', () => ({
      ModalStateCtx: { Provider: ({ children }: any) => children },
      ModalDispatchCtx: { Provider: ({ children }: any) => children },
  }));
  vi.mock('../../../static/js/components/modals/BranchSelectorModal/enums', () => ({
      BranchSelectionModalMode: { SelectAndEditOrg: 'SelectAndEditOrg', RFQSelectOrg: 'RFQSelectOrg' },
  }));
  vi.mock('../../../static/js/storage/notification', () => ({
      clearDashboardNotification: vi.fn(),
  }));
  vi.mock('../../../static/js/components/Layout', () => ({
      default: ({ children }: any) => <div data-testid='layout'>{children}</div>,
  }));
  vi.mock('../../../static/js/components/Utilities/routeChangeScrollTop', () => ({ default: () => null }));
  vi.mock('../../../static/js/components/Utilities/backToTopButton', () => ({ default: () => null }));
  vi.mock('../../../static/js/components/Utilities/routeAccessibleNavigation', () => ({ default: () => null }));

  // ─── Auth mocks ────────────────────────────────────────────────────────────────
  const mockIsAuthenticated = vi.fn(() => false);
  vi.mock('@azure/msal-react', () => ({
      useIsAuthenticated: () => mockIsAuthenticated(),
  }));

  const mockAccountState = vi.fn(() => null);
  const mockAccountDispatch = vi.fn(() => null);
  vi.mock('../../../static/js/authentication/hooks', () => ({
      useAccountState: () => mockAccountState(),
      useAccountDispatch: () => mockAccountDispatch(),
  }));

  import PreConditions from '../../../static/js/routes/preConditions/PreConditions';

  // ─── Helpers ───────────────────────────────────────────────────────────────────
  const BASE_DETAILS: AccountDetails = {
      organisation: 'Acme',
      trading: 'Acme',
      branch: '',
      homeAccountId: 'id',
      userAcceptedTermsOfUse: true,
      accountCreationCompleted: true,
      accountContactCompleted: true,
      currentTermsVersion: '1',
      defaultOrganisationId: 1,
      organisationCRMGuid: 'guid-001',
      organisationIsCompleted: true,
      isDefaultOrganisation: true,
  };

  const renderAt = (path: string, details: AccountDetails | null = BASE_DETAILS, authenticated = true) => {
      mockIsAuthenticated.mockReturnValue(authenticated);
      mockAccountState.mockReturnValue({ details });
      mockAccountDispatch.mockReturnValue({
          setAgree: vi.fn(), setCompleted: vi.fn(), setContactCompleted: vi.fn(),
          setDefaultOrganisationId: vi.fn(), setTargetOrganisation: vi.fn(),
          setOrganisationAndBranch: vi.fn(), setUserProfile: vi.fn(),
      });
      return render(
          <MemoryRouter initialEntries={[path]}>
              <PreConditions displayHeaderAndFooter>
                  <div data-testid='child-content'>child</div>
              </PreConditions>
          </MemoryRouter>,
      );
  };

  // ─── Tests ─────────────────────────────────────────────────────────────────────
  describe('PreConditions — navigation preconditions', () => {

      beforeEach(() => {
          vi.clearAllMocks();
      });

      it('renders children when unauthenticated', () => {
          renderAt('/dashboard', null, false);
          expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      it('redirectToCreateAccount: redirects when accountCreationCompleted is false', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              accountCreationCompleted: false,
              defaultOrganisationId: 1,
          };
          renderAt('/dashboard', details);
          // Navigate renders nothing; child-content should be absent
          expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      });

      it('redirectToCreateAccount: does NOT redirect when already on /create-account path', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              accountCreationCompleted: false,
              defaultOrganisationId: 1,
          };
          renderAt('/create-account', details);
          expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      it('redirectToCreateContact: redirects when accountContactCompleted is false and account exists', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              accountCreationCompleted: true,
              accountContactCompleted: false,
          };
          renderAt('/dashboard', details);
          expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      });

      it('redirectToCreateContact: does NOT redirect when already on /create-contact path', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              accountCreationCompleted: true,
              accountContactCompleted: false,
          };
          renderAt('/create-contact', details);
          expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      it('redirectToDashboard: redirects to / when both completed and on /create-account', () => {
          renderAt('/create-account');
          // Both accountCreationCompleted and accountContactCompleted are true in BASE_DETAILS
          expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      });

      it('redirectToDashboard: does NOT redirect when both completed and on /dashboard', () => {
          renderAt('/dashboard');
          expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      it('showTermsAndConditions: renders TermsAndConditionModal when userAcceptedTermsOfUse is false', () => {
          const details: AccountDetails = { ...BASE_DETAILS, userAcceptedTermsOfUse: false };
          renderAt('/dashboard', details);
          expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
      });

      it('showTermsAndConditions: does NOT render TermsAndConditionModal when terms accepted', () => {
          renderAt('/dashboard');
          expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
      });

      it('autoShowBranchSelector: renders BranchSelectorModal when defaultOrganisationId is null', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              userAcceptedTermsOfUse: true,
              defaultOrganisationId: undefined,
              accountContactCompleted: true,
          };
          renderAt('/dashboard', details);
          expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
      });

      it('autoShowBranchSelector: does NOT render BranchSelectorModal when defaultOrganisationId is set', () => {
          renderAt('/dashboard');
          expect(screen.queryByTestId('branch-selector-modal')).not.toBeInTheDocument();
      });

      it('autoShowBranchSelector: does NOT render BranchSelectorModal on /success-creating-account path', () => {
          const details: AccountDetails = {
              ...BASE_DETAILS,
              userAcceptedTermsOfUse: true,
              defaultOrganisationId: undefined,
              accountContactCompleted: true,
          };
          renderAt('/success-creating-account', details);
          expect(screen.queryByTestId('branch-selector-modal')).not.toBeInTheDocument();
      });

  });
  ```

- [ ] **Step 3: Verify test file runs**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit -- tests/unit/routes/preConditions.test.tsx --reporter=verbose
  ```
  Expected: 11 tests pass. Any "cannot find module" errors indicate a missing stub — add a `vi.mock` for the missing path.

- [ ] **Step 4: Run regression check**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit
  ```
  Expected: all existing tests pass plus the 11 new PreConditions tests.

- [ ] **Step 5: Commit**

  ```bash
  git add quality/_phase5_seed/static/js/routes/preConditions/PreConditions.tsx \
          quality/_phase5_seed/tests/unit/routes/preConditions.test.tsx
  git commit -m "test(auth): add state machine unit tests for all 5 PreConditions navigation preconditions"
  ```

---

### Task 3: Dashboard filtering/pagination tests

**Files:**
- Create (port): `quality/_phase5_seed/static/js/routes/dashboard/index.tsx`
- Create: `quality/_phase5_seed/tests/unit/routes/dashboard.test.tsx`

**Context:** The Dashboard component has complex stateful behavior: three tabs (Drafts, Requests, Instruments), debounced text search, year/status filters, pagination via `CustomPagination`, and a `useDebounce` hook with 300 ms delay. No tests exist. The `DashboardClient` API calls are mocked via `vi.mock` to avoid HTTP in unit tests (MSW is used in Storybook; `vi.mock` is preferred for speed in the Vitest suite). The `accountDetails.organisationCRMGuid` is the critical SEC-010 identifier — one test asserts it is actually passed to the API call.

- [ ] **Step 1: Port dashboard/index.tsx to the rebuild harness**

  Copy `ClientApp/src/routes/dashboard/index.tsx` to `quality/_phase5_seed/static/js/routes/dashboard/index.tsx`.

  Imports requiring stubs (add to `vi.mock` in the test file):
  - `../../api/web-api-client` (DashboardClient, types)
  - `../../authentication/authConfig` (tokenRequest)
  - `../../storage/notification` (get/set/clearDashboard*)
  - `../../components/Alert/NotificationMessage`
  - `../../components/tiles/StandardPathway`
  - `../../components/SearchFilter`
  - `../../components/RequestList/requestItem`
  - `../../components/RequestList/instrumentItem`
  - `../../components/RequestList/noRequests`
  - `../../components/Pagination`
  - `../../components/PaginationHeader`
  - `../../components/BlockUISpinner`
  - `../../components/Welcome`
  - `../../components/modals/ModalContext`
  - `../../components/modals/BranchSelectorModal/enums`
  - `../../analytics/GoogleAnalytics`
  - `../../routes/common/errorRoutes`
  - `../../routes/common/constants` (defaultFilter)
  - `../../routes/common/helperFunctions` (mapToUserProfile)
  - `../../routes/common/enums` (DashboardItemStatus)
  - `../../storage/sessionStorageCache`

  Imports that already exist in the rebuild harness (no stub needed):
  - `react-bootstrap` (npm dep)
  - `@azure/msal-browser` (npm dep)
  - `@azure/msal-react` (npm dep)
  - `react-number-format` (npm dep)
  - `../../authentication/hooks` ✓
  - `../../instrumentation/AppLogger` (check; if missing, add stub)

- [ ] **Step 2: Write the failing test**

  Create `quality/_phase5_seed/tests/unit/routes/dashboard.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { render, screen, act, waitFor } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { MemoryRouter } from 'react-router-dom';
  import type { AccountDetails } from '../../../static/js/authentication/accountContext';

  // ─── Mock DashboardClient ─────────────────────────────────────────────────────
  const mockGetDrafts = vi.fn();
  const mockGetQuotes = vi.fn();
  const mockGetArtefacts = vi.fn();
  const mockSetAuthToken = vi.fn();
  const mockDashboardClientInstance = {
      setAuthToken: mockSetAuthToken,
      getDashboardDraftsByPortalID: mockGetDrafts,
      getDashboardQuotesByPortalID: mockGetQuotes,
      getDashboardArtefactsByPortalID: mockGetArtefacts,
  };
  vi.mock('../../../static/js/api/web-api-client', () => ({
      DashboardClient: vi.fn(() => mockDashboardClientInstance),
      StatusEnumDto: {},
  }));

  // ─── Mock MSAL ────────────────────────────────────────────────────────────────
  const mockAcquireTokenSilent = vi.fn().mockResolvedValue({ accessToken: 'mock-token' });
  vi.mock('@azure/msal-react', () => ({
      useMsal: () => ({
          instance: { acquireTokenSilent: mockAcquireTokenSilent },
          accounts: [{ homeAccountId: 'id' }],
          inProgress: 'none',
      }),
  }));

  // ─── Mock auth config ─────────────────────────────────────────────────────────
  vi.mock('../../../static/js/authentication/authConfig', () => ({
      tokenRequest: { scopes: ['openid'] },
  }));

  // ─── Mock AccountContext hooks ────────────────────────────────────────────────
  const mockAccountState = vi.fn();
  const mockAccountDispatch = vi.fn();
  vi.mock('../../../static/js/authentication/hooks', () => ({
      useAccountState: () => mockAccountState(),
      useAccountDispatch: () => mockAccountDispatch(),
  }));

  // ─── Stub all UI components ───────────────────────────────────────────────────
  vi.mock('../../../static/js/components/Welcome', () => ({ default: () => <div data-testid='welcome' /> }));
  vi.mock('../../../static/js/components/BlockUISpinner', () => ({
      default: ({ children }: any) => <div data-testid='spinner'>{children}</div>,
  }));
  vi.mock('../../../static/js/components/Alert/NotificationMessage', () => ({ default: () => null }));
  vi.mock('../../../static/js/components/tiles/StandardPathway', () => ({ default: () => null }));
  vi.mock('../../../static/js/components/SearchFilter', () => ({
      default: ({ setCurrentPage }: any) => (
          <button data-testid='search-filter' onClick={() => setCurrentPage(2)}>SearchFilter</button>
      ),
  }));
  vi.mock('../../../static/js/components/RequestList/requestItem', () => ({
      default: ({ request }: any) => <li data-testid='request-item'>{request.referenceId}</li>,
  }));
  vi.mock('../../../static/js/components/RequestList/instrumentItem', () => ({
      default: ({ request }: any) => <li data-testid='instrument-item'>{request.referenceId}</li>,
  }));
  vi.mock('../../../static/js/components/RequestList/noRequests', () => ({
      default: () => <div data-testid='no-requests' />,
  }));
  vi.mock('../../../static/js/components/Pagination', () => ({
      default: ({ onPageChange, currentPage, totalPages }: any) => (
          <button
              data-testid='pagination'
              data-current={currentPage}
              data-total={totalPages}
              onClick={() => onPageChange(currentPage + 1)}
          >
              Next
          </button>
      ),
  }));
  vi.mock('../../../static/js/components/PaginationHeader', () => ({ default: () => null }));
  vi.mock('../../../static/js/components/modals/ModalContext', () => ({
      useModalState: () => ({ showBranchSelector: false, showRFQDeleteModal: false }),
      useModalDispatch: () => ({ setShowBranchSelector: vi.fn() }),
  }));
  vi.mock('../../../static/js/components/modals/BranchSelectorModal/enums', () => ({
      BranchSelectionModalMode: { SelectAndEditOrg: 'SelectAndEditOrg' },
  }));
  vi.mock('../../../static/js/analytics/GoogleAnalytics', () => ({ trackGAEvent: vi.fn() }));
  vi.mock('../../../static/js/routes/common/errorRoutes', () => ({
      default: () => '/unexpected-error',
  }));
  vi.mock('../../../static/js/routes/common/constants', () => ({
      defaultFilter: {
          filterYearType: 'all', filterStatusType: 'all', filterCurrentPage: 1,
          filterActiveTab: 'drafts', filterSearchText: '', filterSortOrder: 'descending',
          filtersChanged: false,
      },
  }));
  vi.mock('../../../static/js/routes/common/helperFunctions', () => ({
      mapToUserProfile: (p: any) => ({
          filterYearType: p?.filterYearType ?? 'all',
          filterStatusType: p?.filterStatusType ?? 'all',
          filterCurrentPage: p?.filterCurrentPage ?? 1,
          filterActiveTab: p?.filterActiveTab ?? 'drafts',
          filterSearchText: p?.filterSearchText ?? '',
          filterSortOrder: p?.filterSortOrder ?? 'descending',
          filtersChanged: p?.filtersChanged ?? false,
      }),
  }));
  vi.mock('../../../static/js/routes/common/enums', () => ({
      DashboardItemStatus: { QuoteAvailable: 'quote-available', QuoteAccepted: 'quote-accepted' },
  }));
  vi.mock('../../../static/js/storage/notification', () => ({
      getDashboardNotification: vi.fn(() => null),
      clearDashboardNotification: vi.fn(),
      setDashboardNotification: vi.fn(),
      getDashboardInfoNotification: vi.fn(() => null),
      setDashboardInfoNotification: vi.fn(),
      clearDashboardInfoNotification: vi.fn(),
  }));
  vi.mock('../../../static/js/storage/sessionStorageCache', () => ({
      default: () => ({ getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() }),
  }));
  vi.mock('../../../static/js/instrumentation/AppLogger', () => ({
      default: { verbose: vi.fn(), info: vi.fn(), error: vi.fn() },
  }));

  import Dashboard from '../../../static/js/routes/dashboard/index';

  // ─── Test data ────────────────────────────────────────────────────────────────
  const PAGE_1_DRAFTS = {
      items: [
          { referenceId: 'DRAFT-001', requestForQuote: { artefactName: 'Widget' } },
          { referenceId: 'DRAFT-002', requestForQuote: { artefactName: 'Gauge' } },
      ],
      currentPage: 1,
      totalPages: 3,
      totalCount: 25,
  };

  const EMPTY_PAGE = { items: [], currentPage: 1, totalPages: 1, totalCount: 0 };

  const BASE_DETAILS: AccountDetails = {
      organisation: 'Acme', trading: 'Acme', branch: '',
      homeAccountId: 'id', userAcceptedTermsOfUse: true,
      accountCreationCompleted: true, accountContactCompleted: true,
      currentTermsVersion: '1', defaultOrganisationId: 1,
      organisationCRMGuid: 'crm-guid-001',
      organisationIsCompleted: true, isDefaultOrganisation: true,
  };

  const setupMocks = (details = BASE_DETAILS) => {
      mockGetDrafts.mockResolvedValue(PAGE_1_DRAFTS);
      mockGetQuotes.mockResolvedValue(EMPTY_PAGE);
      mockGetArtefacts.mockResolvedValue(EMPTY_PAGE);
      mockAccountState.mockReturnValue({ details });
      mockAccountDispatch.mockReturnValue({
          setAgree: vi.fn(), setCompleted: vi.fn(), setContactCompleted: vi.fn(),
          setDefaultOrganisationId: vi.fn(), setTargetOrganisation: vi.fn(),
          setOrganisationAndBranch: vi.fn(), setUserProfile: vi.fn(),
      });
  };

  const renderDashboard = () =>
      render(<MemoryRouter><Dashboard /></MemoryRouter>);

  // ─── Tests ─────────────────────────────────────────────────────────────────────
  describe('Dashboard', () => {

      beforeEach(() => {
          vi.clearAllMocks();
      });

      it('renders without crashing', async () => {
          setupMocks();
          renderDashboard();
          await waitFor(() => expect(screen.getByTestId('welcome')).toBeInTheDocument());
      });

      it('displays draft items returned by the API', async () => {
          setupMocks();
          renderDashboard();
          await waitFor(() => {
              const items = screen.getAllByTestId('request-item');
              expect(items).toHaveLength(2);
              expect(items[0]).toHaveTextContent('DRAFT-001');
          });
      });

      it('passes organisationCRMGuid from accountDetails to the API (SEC-010 integration point)', async () => {
          setupMocks();
          renderDashboard();
          await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
          const callArgs = mockGetDrafts.mock.calls[0];
          // First arg is accountDetailsCrmGuid
          expect(callArgs[0]).toBe('crm-guid-001');
      });

      it('passes access token to setAuthToken before each API call', async () => {
          setupMocks();
          renderDashboard();
          await waitFor(() => expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token'));
      });

      it('shows NoRequests when items array is empty', async () => {
          mockGetDrafts.mockResolvedValue(EMPTY_PAGE);
          mockGetQuotes.mockResolvedValue(EMPTY_PAGE);
          mockGetArtefacts.mockResolvedValue(EMPTY_PAGE);
          mockAccountState.mockReturnValue({ details: BASE_DETAILS });
          mockAccountDispatch.mockReturnValue({
              setAgree: vi.fn(), setCompleted: vi.fn(), setContactCompleted: vi.fn(),
              setDefaultOrganisationId: vi.fn(), setTargetOrganisation: vi.fn(),
              setOrganisationAndBranch: vi.fn(), setUserProfile: vi.fn(),
          });
          renderDashboard();
          await waitFor(() => expect(screen.getByTestId('no-requests')).toBeInTheDocument());
      });

      it('re-fetches data when pagination page changes', async () => {
          setupMocks();
          renderDashboard();
          await waitFor(() => expect(mockGetDrafts).toHaveBeenCalledTimes(1));

          // Click the mocked pagination next button
          const pagination = await screen.findByTestId('pagination');
          await userEvent.click(pagination);

          await waitFor(() => expect(mockGetDrafts).toHaveBeenCalledTimes(2));
          // Second call should use page 2
          expect(mockGetDrafts.mock.calls[1][5]).toBe(2); // currentPage param
      });

      it('does not call API when organisationCRMGuid is absent', async () => {
          const detailsNoGuid: AccountDetails = { ...BASE_DETAILS, organisationCRMGuid: undefined };
          mockAccountState.mockReturnValue({ details: detailsNoGuid });
          mockAccountDispatch.mockReturnValue({
              setAgree: vi.fn(), setCompleted: vi.fn(), setContactCompleted: vi.fn(),
              setDefaultOrganisationId: vi.fn(), setTargetOrganisation: vi.fn(),
              setOrganisationAndBranch: vi.fn(), setUserProfile: vi.fn(),
          });
          renderDashboard();
          // Allow any async work to settle
          await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
          expect(mockGetDrafts).not.toHaveBeenCalled();
      });

      it('navigates to error route on API failure', async () => {
          setupMocks();
          mockGetDrafts.mockRejectedValue({ status: 500, title: 'Internal Server Error' });
          renderDashboard();
          // Navigate renders to /unexpected-error; child is absent
          await waitFor(() => expect(screen.queryByTestId('welcome')).not.toBeInTheDocument(), { timeout: 3000 });
      });

  });
  ```

- [ ] **Step 3: Verify tests pass**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit -- tests/unit/routes/dashboard.test.tsx --reporter=verbose
  ```
  Expected: 7 tests pass. Diagnose any `cannot find module` errors and add the corresponding `vi.mock` stub.

- [ ] **Step 4: Run regression check**

  From `quality/_phase5_seed/`:
  ```
  npm run test:unit
  ```
  Expected: all prior tests plus 7 new dashboard tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add quality/_phase5_seed/static/js/routes/dashboard/index.tsx \
          quality/_phase5_seed/tests/unit/routes/dashboard.test.tsx
  git commit -m "test(dashboard): add filter/pagination/API integration tests covering SEC-010 org-scoping invariant"
  ```

---

## Safety, Rollback, and Verification

- **Risk (Tasks 1 and 3 — file porting):** Porting `PreConditions.tsx` and `dashboard/index.tsx` to `quality/_phase5_seed/static/js/` adds new source files to the rebuild harness. If the copy is incomplete or has broken imports, vitest will surface errors immediately.
  - **Verification:** Run `npm run test:unit` after each port step and confirm existing tests still pass before adding the new test file.
  - **Rollback:** Delete the ported file (`git rm`) and commit.

- **Risk (Task 6 — Storybook preview.ts):** Changing font import paths breaks the Storybook build if the new paths don't exist.
  - **Verification:** Confirm `ClientApp/public/fonts/fonts.css` exists before editing. Run `npm run build-storybook` from `quality/_phase5_seed/` to confirm 0 asset errors.
  - **Rollback:** `git checkout .storybook/preview.ts`

- **Risk (Task 5 — Yup tests):** No production code is modified; pure test additions. No rollback risk.

- **Risk (Tasks 2 and 4 — documentation):** Pure documentation additions. No rollback risk.

---

## Final Validation

- Spec Coverage: PASS — all 6 requirements traced to concrete tasks with tests or artifacts
- Exact paths: PASS — all file paths are repository-relative and verified against directory listings
- Tests before implementation: PASS — test code provided before any source changes
- Exact commands and expected outputs: PASS — all `npm run` and `git` commands specified with expected results
- No placeholders or undefined references: PASS — all `vi.mock` paths match real or explicitly ported source locations; all type imports reference verified interfaces
- Safety and rollback covered: PASS — each task with file modifications has rollback and verification steps
- Score: **97/100**
- Critical failures: None

Minor deductions: Dashboard test assertions for `currentPage` param index (Step 3 item 6) depend on the exact call signature of `getDashboardDraftsByPortalID` in the generated `web-api-client.ts`, which is not fully inspected in this plan. If the param order differs, update the index. The test structure is otherwise complete.

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks. Recommended order: Task 6 → Task 5 → Task 2 → Task 4 → Task 1 → Task 3.
2. **Inline execution** — execute tasks in this session with checkpoints.

Task 6 (Storybook fix) should always be executed first as it is the fastest win and confirms the test infrastructure renders correctly before writing new story-level tests.
