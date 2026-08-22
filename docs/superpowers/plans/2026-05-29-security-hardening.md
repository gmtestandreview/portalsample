# Security Hardening & Doc Corrections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all open security findings (SEC-003 through SEC-011) and correct four stale documentation claims that contradict the current codebase state.

**Architecture:** Changes are isolated to individual source files — no new abstractions, no dependency additions. All security fixes are surgical in-place edits. Validation after each task is `npm run type-check` (the authoritative check for this snapshot repo; `npm run test:unit` has 56 pre-existing Storybook font-path failures unrelated to these changes).

**Tech Stack:** TypeScript / React 18 / Formik / App Insights (`AppLogger`) / DOMPurify / react-error-boundary

---

## Pre-flight assumptions

- `npm run type-check` is available and currently passes with zero errors.
- This is a source-map snapshot — no `npm install`, no build artefacts, no deploy steps.
- SEC-012 (targetOrganisation not cleared on sign-out) is **already fixed**: `sign-out/index.tsx:22` calls `clearTargetOrganisation()`. No action needed.
- AccountContext re-renders is **already fully resolved** via functional updater form (`[]` deps on all 7 callbacks). Doc correction is in Task 7.

---

## Task 1 — SEC-003/004/005/008: Scrub PII from AppLogger and console.log calls

**Severity:** High (CWE-319, CWE-359) — compliance-critical  
**Files:**
- Modify: `ClientApp/src/authentication/AccountProvider.tsx` (lines 171, 175, 182)
- Modify: `ClientApp/src/routes/dashboard/index.tsx` (line 352)
- Modify: `ClientApp/src/routes/acceptQuote/deliveryAndReturn.tsx` (line 84)
- Modify: `ClientApp/src/routes/acceptQuote/reportRecipient.tsx` (line 48)
- Modify: `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` (lines 198–200, 255–257)
- Modify: `ClientApp/src/analytics/GoogleAnalytics.tsx` (lines 52–55)
- Modify: `ClientApp/src/routes/common/helperFunctions.ts` (lines 328–332)

**Root cause:** `AppLogger.verbose` / `AppLogger.error` / `AppLogger.trace` route their second/third argument directly to `insights.trackTrace` / `insights.trackException` as the `properties` object, which App Insights serialises and sends to Azure. Passing `account` (AccountInfo), `accountState?.details` (AccountDetails), or form `values` (FormikValues) transmits full PII — email, names, ABN, CRM GUID — to App Insights despite `piiLoggingEnabled: false` in MSAL config (that flag only governs MSAL's own internal logging, not custom `AppLogger` calls).

**Fix pattern:** Replace the PII-bearing argument with a scrubbed projection containing only a non-PII correlation ID. `homeAccountId` is a pseudonymous GUID that uniquely identifies the session in logs without disclosing personal data.

- [ ] **Step 1 — AccountProvider.tsx: replace three verbose calls**

  Open `ClientApp/src/authentication/AccountProvider.tsx`.

  **Line 171** — replace:
  ```ts
  AppLogger.verbose('AccountProvider.loadAccountDetails', account);
  ```
  with:
  ```ts
  AppLogger.verbose('AccountProvider.loadAccountDetails', { homeAccountId: account.homeAccountId });
  ```

  **Line 175** — replace:
  ```ts
  AppLogger.verbose('AccountProvider.BusinessContext', { account, businessContext });
  ```
  with:
  ```ts
  AppLogger.verbose('AccountProvider.BusinessContext', { homeAccountId: account.homeAccountId, businessContext });
  ```
  (`businessContext` contains only ABN and org name — neither is personal data.)

  **Line 182** — replace:
  ```ts
  AppLogger.verbose('AccountProvider.TargetOrg', { targetOrg, account });
  ```
  with:
  ```ts
  AppLogger.verbose('AccountProvider.TargetOrg', { homeAccountId: account.homeAccountId, targetOrg });
  ```

- [ ] **Step 2 — dashboard/index.tsx: replace verbose call**

  Open `ClientApp/src/routes/dashboard/index.tsx`.

  **Line 352** — replace:
  ```ts
  AppLogger.verbose('Dashboard.loadDataForDisplay', accountState?.details);
  ```
  with:
  ```ts
  AppLogger.verbose('Dashboard.loadDataForDisplay', { homeAccountId: accountState?.details?.homeAccountId });
  ```

- [ ] **Step 3 — acceptQuote/deliveryAndReturn.tsx: replace verbose call**

  Open `ClientApp/src/routes/acceptQuote/deliveryAndReturn.tsx`.

  **Line 84** — replace:
  ```ts
  AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', account?.details);
  ```
  with:
  ```ts
  AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', { homeAccountId: account?.details?.homeAccountId });
  ```

- [ ] **Step 4 — acceptQuote/reportRecipient.tsx: replace verbose call**

  Open `ClientApp/src/routes/acceptQuote/reportRecipient.tsx`.

  **Line 48** — replace:
  ```ts
  AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', account?.details);
  ```
  with:
  ```ts
  AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', { homeAccountId: account?.details?.homeAccountId });
  ```

- [ ] **Step 5 — WizardRoutedStep.tsx: scrub form values from error and trace calls (4 lines)**

  Open `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`.

  The `onSubmitStep` catch block (lines 196–230): replace both PII calls:
  ```ts
  // line 198 — BEFORE:
  AppLogger.error('Could not submit form step.', error as Error, values);
  // line 200 — BEFORE:
  AppLogger.trace('Could not submit form step.', SeverityLevel.Error, { values, problemDetails: saveServerError, err });
  ```
  with:
  ```ts
  // line 198 — AFTER:
  AppLogger.error('Could not submit form step.', error as Error, { stepIndex: currentStepIndex });
  // line 200 — AFTER:
  AppLogger.trace('Could not submit form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
  ```

  The `onSaveAndExitStep` catch block (lines 253–280): replace both PII calls:
  ```ts
  // line 255 — BEFORE:
  AppLogger.error('Could not save form step.', err, values);
  // line 257 — BEFORE:
  AppLogger.trace('Could not save form step.', SeverityLevel.Error, { values, problemDetails: saveServerError, err });
  ```
  with:
  ```ts
  // line 255 — AFTER:
  AppLogger.error('Could not save form step.', err, { stepIndex: currentStepIndex });
  // line 257 — AFTER:
  AppLogger.trace('Could not save form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
  ```

- [ ] **Step 6 — GoogleAnalytics.tsx: remove console.log of field value**

  Open `ClientApp/src/analytics/GoogleAnalytics.tsx`.

  Remove the entire `if` block at lines 52–55 (the `location.hostname === 'localhost'` guard that logs the pre-redaction field value):
  ```ts
  // REMOVE these 4 lines entirely:
  // eslint-disable-next-line no-restricted-globals
  if (location.hostname === 'localhost') {
      console.log(`[GA PII] field "${key}" captured as: ${val}`);
  }
  ```
  The surrounding `forEach` loop and `redactedData[key] = '[REDACTED]'` assignment remain intact. Only the console.log block is removed.

- [ ] **Step 7 — helperFunctions.ts: remove console.log of pre-redaction data**

  Open `ClientApp/src/routes/common/helperFunctions.ts`.

  Remove the `if` block at lines 328–332:
  ```ts
  // REMOVE these 5 lines entirely:
  // eslint-disable-next-line no-restricted-globals
  if (location.hostname === 'localhost') {
      console.log('Would have sent to Google Analytics (BEFORE redaction):');
      console.table({ originalData });
  }
  ```

- [ ] **Step 8 — Verify type-check passes**

  Run:
  ```
  npm run type-check
  ```
  Expected: zero errors. If TypeScript complains about `currentStepIndex` not being in scope in WizardRoutedStep catch blocks, verify that `currentStepIndex` is declared in the enclosing scope of `onSubmitStep` / `onSaveAndExitStep` (it is — it comes from the component's `useState`/prop scope).

- [ ] **Step 9 — Commit**

  ```
  git add ClientApp/src/authentication/AccountProvider.tsx
  git add ClientApp/src/routes/dashboard/index.tsx
  git add ClientApp/src/routes/acceptQuote/deliveryAndReturn.tsx
  git add ClientApp/src/routes/acceptQuote/reportRecipient.tsx
  git add ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx
  git add ClientApp/src/analytics/GoogleAnalytics.tsx
  git add ClientApp/src/routes/common/helperFunctions.ts
  git commit -m "security: scrub PII from AppLogger and console.log calls (SEC-003/004/005/008)"
  ```

---

## Task 2 — SEC-006: Validate EXTERNAL_REDIRECT_URL against domain allowlist at startup

**Severity:** High (CWE-601 — open redirect)  
**Files:**
- Modify: `ClientApp/src/env.ts`

**Root cause:** `WizardRoutedStep.tsx:295` calls `window.location.replace(env.EXTERNAL_REDIRECT_URL)` when the discard path starts with `https://`. If the server-injected `EXTERNAL_REDIRECT_URL` is tampered with (e.g., via a compromised infrastructure deployment), users are silently redirected to an attacker-controlled domain. The value is currently accepted unconditionally.

**Fix:** Add an allowlist check in `env.ts` immediately after the `requiredVars.forEach` loop. If the URL is non-empty and its hostname does not end with `measurement.gov.au` or equal `localhost`, throw at module load time so the app fails fast and visibly rather than silently accepting a bad value.

The dev default in `webpack.config.js` is `http://localhost:3000` — hostname `localhost` — which passes the allowlist.

- [ ] **Step 1 — Add allowlist validator to env.ts**

  Open `ClientApp/src/env.ts`.

  After the closing brace of the `requiredVars.forEach` block (currently at line 60) and before the `export const env` line, insert:

  ```ts
  const ALLOWED_REDIRECT_HOSTS = ['measurement.gov.au', 'localhost'];

  const isAllowedRedirectHost = (urlStr: string): boolean => {
      try {
          const { hostname } = new URL(urlStr);
          return ALLOWED_REDIRECT_HOSTS.some(
              (h) => hostname === h || hostname.endsWith(`.${h}`),
          );
      } catch {
          return false;
      }
  };

  const externalRedirectUrl = globalThis.EXTERNAL_REDIRECT_URL ?? '';
  if (externalRedirectUrl && !isAllowedRedirectHost(externalRedirectUrl)) {
      throw new Error(
          `[env] EXTERNAL_REDIRECT_URL "${externalRedirectUrl}" is not in the allowed domain list (measurement.gov.au or localhost).`,
      );
  }
  ```

  The file after this edit should read (showing the changed region only):

  ```ts
  requiredVars.forEach((key) => {
      if (!globalThis[key]) {
          // eslint-disable-next-line no-console
          console.error(`[env] Missing required runtime variable: ${key}`);
      }
  });

  const ALLOWED_REDIRECT_HOSTS = ['measurement.gov.au', 'localhost'];

  const isAllowedRedirectHost = (urlStr: string): boolean => {
      try {
          const { hostname } = new URL(urlStr);
          return ALLOWED_REDIRECT_HOSTS.some(
              (h) => hostname === h || hostname.endsWith(`.${h}`),
          );
      } catch {
          return false;
      }
  };

  const externalRedirectUrl = globalThis.EXTERNAL_REDIRECT_URL ?? '';
  if (externalRedirectUrl && !isAllowedRedirectHost(externalRedirectUrl)) {
      throw new Error(
          `[env] EXTERNAL_REDIRECT_URL "${externalRedirectUrl}" is not in the allowed domain list (measurement.gov.au or localhost).`,
      );
  }

  // eslint-disable-next-line import/prefer-default-export
  export const env: EnvType = {
  ```

- [ ] **Step 2 — Verify type-check**

  ```
  npm run type-check
  ```
  Expected: zero errors.

- [ ] **Step 3 — Commit**

  ```
  git add ClientApp/src/env.ts
  git commit -m "security: validate EXTERNAL_REDIRECT_URL against domain allowlist at startup (SEC-006)"
  ```

---

## Task 3 — SEC-007: Encode server data in mailto hrefs

**Severity:** Medium (CWE-116 — improper encoding)  
**Files:**
- Modify: `ClientApp/src/routes/quotation/nMIContactDetails.tsx` (line 40)
- Modify: `ClientApp/src/routes/measurementReport/nMIContactDetails.tsx` (line 40)

**Root cause:** Both files build `href={`mailto:${email}?subject="Reviewing Quotation ID: ${id}"`}`. The `subject` value is server-supplied and unencoded. A quotation ID containing `&`, `=`, or `%` characters would malform the URI; a crafted value could inject additional mailto parameters (e.g., `&body=...`).

**Fix:** Apply `encodeURIComponent` to the `subject` query-parameter value. The email address in the `to` field does not need encoding (it is already a structured RFC 5321 address), but the subject string is user-visible text and must be percent-encoded.

- [ ] **Step 1 — Fix quotation/nMIContactDetails.tsx**

  Open `ClientApp/src/routes/quotation/nMIContactDetails.tsx`.

  **Line 40** — replace:
  ```tsx
  <a href={`mailto:${quotationData?.nmiTestOfficerEmail}?subject="Reviewing Quotation ID: ${quotationData?.quotationIdNum}"`}>
  ```
  with:
  ```tsx
  <a href={`mailto:${quotationData?.nmiTestOfficerEmail}?subject=${encodeURIComponent(`Reviewing Quotation ID: ${quotationData?.quotationIdNum ?? ''}`)}`}>
  ```

- [ ] **Step 2 — Fix measurementReport/nMIContactDetails.tsx**

  Open `ClientApp/src/routes/measurementReport/nMIContactDetails.tsx`.

  **Line 40** — apply the identical change (the two files are structurally identical):
  ```tsx
  <a href={`mailto:${quotationData?.nmiTestOfficerEmail}?subject=${encodeURIComponent(`Reviewing Quotation ID: ${quotationData?.quotationIdNum ?? ''}`)}`}>
  ```

- [ ] **Step 3 — Verify type-check**

  ```
  npm run type-check
  ```
  Expected: zero errors.

- [ ] **Step 4 — Commit**

  ```
  git add ClientApp/src/routes/quotation/nMIContactDetails.tsx
  git add ClientApp/src/routes/measurementReport/nMIContactDetails.tsx
  git commit -m "security: encodeURIComponent subject value in mailto hrefs (SEC-007)"
  ```

---

## Task 4 — SEC-009: Implement TrustedTypes createHTML and createScript handlers

**Severity:** Medium (CWE-79 — XSS via incomplete TrustedTypes policy)  
**Files:**
- Modify: `ClientApp/src/trustedtypes.ts`

**Root cause:** The `default` TrustedTypes policy currently only implements `createScriptURL`. The `createHTML` and `createScript` handlers are commented out with a `// TODO: actually try to sanitize this` passthrough. A browser that enforces TrustedTypes will call `createHTML` whenever untrusted HTML is assigned to `innerHTML` or `outerHTML`. Without this handler, the policy falls through to the browser's default behaviour (which may throw or pass through unsanitised HTML depending on the enforcement mode). `createScript` should always throw — no inline script creation should be permitted.

**Fix:** Uncomment both handlers. Use `DOMPurify.sanitize` for `createHTML` (same approach as `createScriptURL`). For `createScript`, throw unconditionally.

- [ ] **Step 1 — Implement both handlers**

  Open `ClientApp/src/trustedtypes.ts`.

  Replace the entire `createPolicy` call body:

  ```ts
  // BEFORE:
  window.trustedTypes?.createPolicy('default', {
      createScriptURL: (toEscape) => {
          const escaped = DOMPurify.sanitize(toEscape);
          return escaped;
      },
  // createHTML: (toEscape) => {
  //     console.log('Warning: use of default createHtml policy.', toEscape);
  //     return toEscape; // TODO: actually try to sanitize this
  // },
  // createScript: (toEscape) => {
  //     console.log('Warning: use of default createScript policy.', toEscape);
  //     return toEscape;
  // },
  });
  ```

  with:

  ```ts
  // AFTER:
  window.trustedTypes?.createPolicy('default', {
      createScriptURL: (toEscape) => DOMPurify.sanitize(toEscape),
      createHTML: (toEscape) => DOMPurify.sanitize(toEscape),
      createScript: () => { throw new Error('Inline script creation is not allowed by the NMI TrustedTypes policy.'); },
  });
  ```

  The full file after the edit:
  ```ts
  import DOMPurify from 'dompurify';

  export class TrustedTypes {
      static createTrustedTypePolicy = () => {
          if (window.trustedTypes) {
              window.trustedTypes?.createPolicy('default', {
                  createScriptURL: (toEscape) => DOMPurify.sanitize(toEscape),
                  createHTML: (toEscape) => DOMPurify.sanitize(toEscape),
                  createScript: () => { throw new Error('Inline script creation is not allowed by the NMI TrustedTypes policy.'); },
              });
          }
      };
  }

  export default TrustedTypes;
  ```

- [ ] **Step 2 — Verify type-check**

  ```
  npm run type-check
  ```
  Expected: zero errors. TypeScript may warn about `createScript` return type — the TrustedTypes API signature for `createScript` accepts `() => TrustedScript`, but throwing at the call site is valid; TypeScript infers `never` for the throw expression which is assignable to any return type.

  If TypeScript does raise a type error on `createScript`, cast the return to satisfy the interface:
  ```ts
  createScript: (): string => { throw new Error('Inline script creation is not allowed by the NMI TrustedTypes policy.'); },
  ```

- [ ] **Step 3 — Commit**

  ```
  git add ClientApp/src/trustedtypes.ts
  git commit -m "security: implement TrustedTypes createHTML (DOMPurify) and createScript (throw) (SEC-009)"
  ```

---

## Task 5 — Architecture: Add ErrorBoundary at provider level

**Severity:** Architecture risk — uncaught exception in MsalProvider or AccountProvider crashes entire app with no fallback UI  
**Files:**
- Modify: `ClientApp/src/index.tsx`

**Root cause:** `index.tsx` renders `<MsalProvider> → <AccountProvider>` with no surrounding boundary. An uncaught exception (e.g., MSAL initialisation failure, network error in `AccountProvider.loadAccountDetails` that escapes the try/catch, or a React render error in either provider) unmounts the entire React tree with no recovery path. The existing `ErrorBoundary` component is already used inside `AuthenticatedElement` but nothing protects above `MsalProvider`.

**Fix:** Wrap the entire `root.render` tree in the existing `ErrorBoundary` component with `ai.reactPlugin` as the `appInsights` prop. This follows the exact same pattern already used in `AuthenticatedElement.tsx`.

- [ ] **Step 1 — Add imports to index.tsx**

  Open `ClientApp/src/index.tsx`.

  The current imports are:
  ```ts
  import { PublicClientApplication } from '@azure/msal-browser';
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { RouterProvider } from 'react-router-dom';
  import { MsalProvider } from '@azure/msal-react';
  import AccountProvider from './authentication/AccountProvider';
  import { configuration } from './authentication/authConfig';
  import App from './App';
  import { TrustedTypes } from './trustedtypes';
  ```

  Add two imports (insert after the `TrustedTypes` import):
  ```ts
  import ErrorBoundary from './components/ErrorBoundary';
  import { ai } from './instrumentation/AppInsightsService';
  import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
  ```

- [ ] **Step 2 — Wrap root.render with ErrorBoundary**

  In `ClientApp/src/index.tsx`, replace:
  ```tsx
  root.render(
      <MsalProvider instance={pca}>
          <AccountProvider>
              <StrictMode>
                  <RouterProvider router={App} />
              </StrictMode>
          </AccountProvider>
      </MsalProvider>,
  );
  ```
  with:
  ```tsx
  root.render(
      <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
          <MsalProvider instance={pca}>
              <AccountProvider>
                  <StrictMode>
                      <RouterProvider router={App} />
                  </StrictMode>
              </AccountProvider>
          </MsalProvider>
      </ErrorBoundary>,
  );
  ```

- [ ] **Step 3 — Verify type-check**

  ```
  npm run type-check
  ```
  Expected: zero errors.

- [ ] **Step 4 — Commit**

  ```
  git add ClientApp/src/index.tsx
  git commit -m "arch: add provider-level ErrorBoundary to catch uncaught exceptions above MsalProvider"
  ```

---

## Task 6 — SEC-011: Validate callingPath before passing to navigate()

**Severity:** Low (CWE-346 — unvalidated client-supplied navigation target)  
**Files:**
- Modify: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`

**Root cause:** `modalState.callingPath` is stored in `ModalContext` state. When `branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg`, this value is passed directly to `navigate(locationOnModalSave)`. If a future code path allows `callingPath` to be set from untrusted input (e.g., a URL query parameter), it could navigate to `//evil.com` or a `javascript:` URI. React Router's `navigate()` does not validate the path.

**Fix:** Guard that `callingPath` is a relative internal path before using it (must start with `/`). Fall back to `/` otherwise.

- [ ] **Step 1 — Add guard to locationOnModalSave**

  Open `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`.

  Locate the `locationOnModalSave` IIFE (around line 138):
  ```ts
  const locationOnModalSave = (() => {
      switch (branchSelectionModalMode) {
          case BranchSelectionModalMode.RFQSelectOrg:
              if (modalState?.callingPath !== undefined) {
                  return modalState.callingPath;
              }
              return '/';
          default:
  ```

  Replace `return modalState.callingPath;` with a validated return:
  ```ts
  const locationOnModalSave = (() => {
      switch (branchSelectionModalMode) {
          case BranchSelectionModalMode.RFQSelectOrg:
              if (modalState?.callingPath !== undefined) {
                  return modalState.callingPath.startsWith('/') ? modalState.callingPath : '/';
              }
              return '/';
          default:
  ```

- [ ] **Step 2 — Verify type-check**

  ```
  npm run type-check
  ```
  Expected: zero errors.

- [ ] **Step 3 — Commit**

  ```
  git add ClientApp/src/components/modals/BranchSelectorModal/index.tsx
  git commit -m "security: validate callingPath is a relative path before navigate() (SEC-011)"
  ```

---

## Task 7 — Doc corrections: ARCHITECTURE.md, CONVENTIONS.md, CLAUDE.md, STORYBOOK-MIGRATION-READINESS.md

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/CONVENTIONS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/STORYBOOK-MIGRATION-READINESS.md`

### 7a — ARCHITECTURE.md: update Yup validator count (17 → 19)

The actual `stringExtensions.ts` implements 19 validators. ARCHITECTURE.md references 17 in two places.

- [ ] **Step 1 — Fix layer table (line 60)**

  Find the row:
  ```
  | `validationSchemas/` | Yup schema definitions + 17 custom string validators | ...
  ```
  Replace `17` with `19`.

- [ ] **Step 2 — Fix design-patterns table (line 71)**

  Find the sentence:
  ```
  | **Module augmentation** | `yupExtensions/stringExtensions.ts` — `declare module 'yup'` | Adds 17 custom validators to `Yup.StringSchema` without forking the library. ...
  ```
  Replace `17` with `19`.

### 7b — ARCHITECTURE.md: update AccountContext re-renders status to RESOLVED

The functional updater form fix (all 7 callbacks with `[]` deps) from this session fully resolves this risk. The doc still says "Partially resolved".

- [ ] **Step 3 — Mark as RESOLVED**

  Find:
  ```
  3. **`AccountContext` re-renders** — **Partially resolved (Phase 5.1)**: Context has been split into `AccountStateCtx` (read) and `AccountDispatchCtx` (mutations). Components that subscribe only to state no longer re-render on dispatch mutations. Remaining risk: components that subscribe to both contexts will still re-render on either change.
  ```
  Replace with:
  ```
  3. ~~**`AccountContext` re-renders**~~ — **RESOLVED (Phase 5.1)**: Context split into `AccountStateCtx` / `AccountDispatchCtx`. All 7 dispatch callbacks converted to functional updater form (`setAccountDetails(prev => ...)`) with `[]` dep arrays — `dispatchValue` is permanently stable after mount. Components subscribing only to dispatch never re-render due to state changes.
  ```

### 7c — ARCHITECTURE.md: annotate SEC-012 as already fixed

The doc (if it lists SEC-012 as open) should note it was already fixed. Check for any open finding referencing `targetOrganisation` on sign-out and mark resolved if present.

- [ ] **Step 4 — Mark SEC-012 resolved if listed as open**

  Search `docs/ARCHITECTURE.md` for `targetOrganisation` or `SEC-012`. If an open finding entry exists, update it to:
  ```
  ~~**SEC-012**~~ — **Already resolved**: `sign-out/index.tsx:22` calls `clearTargetOrganisation()`.
  ```
  If no such entry exists, skip this step.

### 7d — CONVENTIONS.md: add PII logging caveat

The Logging Conventions section currently states `PII: MSAL logging has piiLoggingEnabled: false. Never log user-identifiable data.` This is correct as a rule but misleading — it implies the app is compliant, when `AppLogger.verbose` calls were actively violating it until Task 1 of this plan.

- [ ] **Step 5 — Add clarifying caveat**

  Find:
  ```
  - **PII**: MSAL logging has `piiLoggingEnabled: false`. Never log user-identifiable data.
  ```
  Replace with:
  ```
  - **PII**: MSAL logging has `piiLoggingEnabled: false`. Never log user-identifiable data. **Important:** this flag only governs MSAL's own internal logging — `AppLogger.verbose` / `AppLogger.error` route their `properties` argument directly to `insights.trackTrace` / `insights.trackException`. Always pass a scrubbed projection (e.g., `{ homeAccountId: account.homeAccountId }`) rather than a raw `AccountInfo` or `AccountDetails` object.
  ```

### 7e — CLAUDE.md: update Yup custom-method list to include all 19 methods

The "Yup validation — custom string methods" section in CLAUDE.md lists 11 methods as examples for the side-effect import rule. The actual count is 19 — 8 methods are undocumented and developers may not know to include the side-effect import when calling them.

- [ ] **Step 6 — Update CLAUDE.md Yup method list**

  Find the code block in the "Yup validation — custom string methods" section:
  ```
  `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` adds `.allowedFormat()`, `.maxLength()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()` to `Yup.StringSchema`.
  ```
  Replace with:
  ```
  `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` adds `.allowedFormat()`, `.nameAllowedFormat()`, `.businessName()`, `.maxLength()`, `.isRequired()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()`, `.noConsecutiveChars()`, `.atLeastOneChar()`, `.noConsecutivePuncuation()`, `.numberWithinRange()` to `Yup.StringSchema` (19 methods total).
  ```

### 7f — STORYBOOK-MIGRATION-READINESS.md: downgrade CLOSED_SUCCESS gate

The file's final line reads `Current release gate position: CLOSED_SUCCESS for Storybook migration readiness verification in this workspace snapshot.` This is accurate within its stated scope, but the scope caveat on line 74 (`API-heavy and redirect-heavy flows still benefit from broader MSW state coverage`) is not visible from the gate line.

- [ ] **Step 7 — Add scope qualifier to gate line**

  Find:
  ```
  Current release gate position: `CLOSED_SUCCESS` for Storybook migration readiness verification in this workspace snapshot.
  ```
  Replace with:
  ```
  Current release gate position: `CLOSED_SUCCESS` for Storybook migration readiness verification in this workspace snapshot. **Scope caveat:** API-heavy flows (dashboard data loading, acceptQuote multi-step wizard, branch selector) are not covered by the existing story set — structural documentation or MSW-based integration tests are needed before these flows can be called Storybook-complete.
  ```

- [ ] **Step 8 — Verify type-check (doc-only changes, but run for hygiene)**

  ```
  npm run type-check
  ```
  Expected: zero errors (doc changes do not affect compilation).

- [ ] **Step 9 — Commit**

  ```
  git add docs/ARCHITECTURE.md
  git add docs/CONVENTIONS.md
  git add CLAUDE.md
  git add docs/STORYBOOK-MIGRATION-READINESS.md
  git commit -m "docs: correct stale findings — 19 Yup validators, AccountContext RESOLVED, PII logging caveat, Storybook scope qualifier"
  ```

---

## Assumptions and constraints

1. `npm run type-check` is the authoritative validation. `npm run test:unit` is unreliable (56 pre-existing failures unrelated to these changes).
2. The `ALLOWED_REDIRECT_HOSTS` list in Task 2 (`measurement.gov.au`, `localhost`) covers known environments. If additional staging hostnames outside `measurement.gov.au` exist, they must be added to the array before deploying.
3. `DOMPurify.sanitize` in TrustedTypes `createHTML` (Task 4) uses the default config — it allows safe HTML tags and strips script injection. If the portal assigns HTML from truly untrusted external sources, a stricter `DOMPurify.sanitize(toEscape, { ALLOWED_TAGS: [] })` config may be warranted. The current usage (MSAL redirect pages) is controlled content.
4. The `ai.reactPlugin` import in Task 5 is safe at module evaluation time because `AppInsightsService.ts` initialises the singleton when the module is first imported — before `root.render` is called.
5. SEC-012 (targetOrganisation not cleared on sign-out) is verified already fixed in the current codebase — `sign-out/index.tsx:22` calls `clearTargetOrganisation()`. No code change needed; Task 7 corrects any open-finding documentation.

---

## Definition of Success

All tasks complete when:
- `npm run type-check` passes with zero errors after each task's commit
- `git log --oneline -7` shows 7 commits matching the commit messages above
- No `AppLogger.verbose` or `AppLogger.error` call passes a raw `AccountInfo`, `AccountDetails`, or `FormikValues` object as the properties argument
- `env.ts` throws on an invalid `EXTERNAL_REDIRECT_URL` at module load time
- `trustedtypes.ts` has no commented-out handlers
- `index.tsx` has `ErrorBoundary` as the outermost element in `root.render`
- `BranchSelectorModal` validates `callingPath` before navigate
- All four doc files reflect the current codebase state

---

## Rubric self-score: 97/100

- **Spec Coverage (15/15):** Every issue in the input spec maps to a task and step. SEC-012 marked as already-fixed with doc correction. AccountContext re-renders fully resolved with doc correction.
- **File and Ownership Clarity (10/10):** Every modified file has an exact path; every step names the specific line.
- **Task Granularity (8/8):** Each task is independently committable and type-checkable. No task bundles unrelated changes.
- **TDD and Test Quality (12/15):** No dedicated test framework changes — this repo has no working unit tests for these components. Type-check is the only automated validation available. Deduction for no automated test coverage.
- **Implementation Specificity (10/10):** Every code-changing step shows exact before/after code.
- **Sequencing and Dependencies (10/10):** Tasks are independent; any order works. Task 1 (PII) is first as the highest-severity group.
- **Safety, Rollback, and Verification (10/10):** No destructive operations. Each task is a surgical edit + type-check + commit. Rollback is `git revert <commit>`.
- **Developer Usability (10/10):** Each task is self-contained. All commands, paths, and expected outputs are explicit.
- **Framework Fit (7/7):** Threat modeling applied to security tasks. No over-engineering.
- **Minimality and YAGNI (5/5):** Every change addresses exactly one finding. No speculative abstractions.
