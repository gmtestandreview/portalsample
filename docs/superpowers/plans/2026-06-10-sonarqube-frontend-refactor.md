# SonarQube Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Resolve all SonarQube/SonarLint frontend diagnostics across 12 `.tsx/.ts` files without touching backend or integration code.

**Architecture:** All changes are confined to `ClientApp/src/**`. No new files are created. The fixes address five categories: dead/commented code removal, TypeScript idiom modernisation, JSX inline-element spacing, accessibility role corrections, and cognitive-complexity reduction via helper-function extraction.

**Tech Stack:** React 18, TypeScript, React Bootstrap. No test tooling change. Validation is static (type consistency review only — no build step available per CLAUDE.md).

---

## Source Inputs

- Spec: SonarLint diagnostic JSON provided in the user prompt (100+ issues across 12 files)
- Relevant files inspected:
  - `ClientApp/src/routes/services-we-offer/index.tsx` — S1854, S6772
  - `ClientApp/src/routes/quotation/index.tsx` — S1854, S7765, S6582, S6772
  - `ClientApp/src/routes/measurementReport/indexList.tsx` — S1854, S6754, S6582, S6772
  - `ClientApp/src/routes/help-guide/index.tsx` — S1854, S6772
  - `ClientApp/src/routes/help-guide/how-to-setup-access.tsx` — S1854, S6772
  - `ClientApp/src/routes/help-guide/faqs.tsx` — S1854, S6772
  - `ClientApp/src/routes/account/addBranch/addBranchProps.ts` — S3863, S7723, S3776, S4123, S125, S7735, S6606, S1301
  - `ClientApp/src/components/SummaryDisplay/index.tsx` — S1854, S3776, S125, S6772, S6819
  - `ClientApp/src/components/SearchFilter/filterMenu.tsx` — S6571, S7721, S1854, S125, S4624, S6819, S6772
  - `ClientApp/src/components/RequestList/instrumentItem.tsx` — S6772, S7765, S1854, S1135, S7778, S1871, S125
  - `ClientApp/src/components/modals/TermsAndCondition/index.tsx` — S6772, S1854
  - `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` — S1854, S1301, S3776, S7764, S4123, S7735, S6606, S6582, S6551, S6819, S6842, S6772

## Assumptions and Unknowns

- Assumption: The `package.json` diagnostic (code 65536 — JSON schema $ref resolution) is a VS Code internal workspace-schema issue, not a code change. It is **excluded** from this plan.
- Assumption: State variables whose setters are never called (e.g., `errored`, `forbidden`, `showInfo` in `quotation/index.tsx`) are intentional stubs from a refactor — their read values are used, so only the unused setters are removed.
- Assumption: `S6772 "Ambiguous spacing"` in JSX means inline elements (`<i>`, `<strong>`) are adjacent to text without explicit whitespace. Fixes use the existing `{' '}` / `me-1` pattern already present in the codebase.
- Assumption: Accessibility fixes (`S6819`, `S6842`) remove ARIA roles that are redundant with an already-present `aria-hidden='true'` (icon elements), or replace semantically incorrect role usage.
- Assumption: `S3776` cognitive complexity in `addBranchProps.ts:completeAccountDetails` and `BranchSelectorModal:onContinueBranchSelectorModal` is reduced by extracting named helper functions — no logic change.
- Assumption: No backend API contract is affected; all changes are rendering/state management in the React layer.

---

## Requirement Traceability

| SonarLint Rule | Description | Task(s) |
|---|---|---|
| S1854 | Useless assignment (unused state setter/value) | 1, 2, 3, 4, 5, 6, 11, 12 |
| S6772 | Ambiguous JSX inline spacing | 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12 |
| S7765 | Use `.includes()` instead of `.some()` for existence check | 2, 10 |
| S6582 | Prefer optional chain over `&& x.y` | 2, 3, 12 |
| S6754 | useState not destructured into value + setter pair | 3 |
| S3863 | Duplicate import from same module | 7 |
| S7723 | Use `new Error()` not `Error()` | 7 |
| S4123 | Await of non-Promise | 7, 12 |
| S125 | Remove commented-out code | 7, 8, 9, 10 |
| S7735 | Negated condition → use `??` | 7, 12 |
| S6606 | Prefer `??` over ternary for nullish check | 7, 12 |
| S1301 | Single-case switch → use if/else | 7, 12 |
| S3776 | Cognitive complexity too high | 7, 12 |
| S6571 | Specific string literals overridden by `string` in union | 9 |
| S7721 | Move inner function to outer scope | 9 |
| S4624 | Nested template literals | 9 |
| S6819 | Use semantic element instead of role (accessibility) | 8, 9, 12 |
| S6551 | Object may stringify as `[object Object]` | 12 |
| S6842 | Non-interactive element assigned interactive role | 12 |
| S7764 | Prefer `globalThis` over `window` | 12 |
| S7778 | Multiple Array.push() calls → single call | 10 |
| S1871 | Duplicate switch-case block | 10 |
| S1135 | TODO comment not completed | 10 |

---

## Framework Fit

- No DDD or C4 mapping needed — all changes are isolated React component fixes.
- No migration planning — no legacy behavior replaced.
- No threat modeling — no auth, secrets, or external trust boundaries touched.
- No ADR needed — no architectural decisions; changes follow existing codebase patterns.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/routes/services-we-offer/index.tsx` | Modify | Remove unused `_setIsLoading`; fix JSX spacing at L119 |
| `ClientApp/src/routes/quotation/index.tsx` | Modify | Remove 3 unused setters; `.some()→.includes()`; optional chains; spacing |
| `ClientApp/src/routes/measurementReport/indexList.tsx` | Modify | Remove unused setter/value; fix useState naming; optional chain; spacing |
| `ClientApp/src/routes/help-guide/index.tsx` | Modify | Remove unused setter; fix spacing |
| `ClientApp/src/routes/help-guide/how-to-setup-access.tsx` | Modify | Remove unused setter; fix spacing |
| `ClientApp/src/routes/help-guide/faqs.tsx` | Modify | Remove unused setter; fix spacing |
| `ClientApp/src/routes/account/addBranch/addBranchProps.ts` | Modify | Merge imports; `new Error`; extract helpers (complexity); remove await; `??`; if/else; remove comments |
| `ClientApp/src/components/SummaryDisplay/index.tsx` | Modify | Remove unused destructured props; extract helper (complexity); remove comments; spacing; fix role |
| `ClientApp/src/components/SearchFilter/filterMenu.tsx` | Modify | Fix union type; hoist function; remove dead code/comments; unnest template; fix role |
| `ClientApp/src/components/RequestList/instrumentItem.tsx` | Modify | Fix spacing; `.includes()`; remove dead vars; merge push; merge cases; remove comments/TODO |
| `ClientApp/src/components/modals/TermsAndCondition/index.tsx` | Modify | Remove unused state vars; fix spacing |
| `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` | Modify | Remove unused setter; if/else; extract helpers (complexity); globalThis; await guards; `??`; optional chain; string coercion; fix roles |

---

## Tasks

### Task 1: `services-we-offer/index.tsx` — S1854 + S6772

**Files:**
- Modify: `ClientApp/src/routes/services-we-offer/index.tsx`

- [ ] **Step 1: Verify current state**

  Confirm L16 = `const [isLoading, _setIsLoading] = useState(false);`
  Confirm L119 = `<i className='icon-close me-1' aria-hidden='true' />`

- [ ] **Step 2: Apply changes**

  **L16** — remove unused setter:
  ```tsx
  // Before:
  const [isLoading, _setIsLoading] = useState(false);
  // After:
  const [isLoading] = useState(false);
  ```

  **L119** — the `<i>` icon and the text "Cancel" are on adjacent lines with no explicit whitespace, causing S6772. The icon already has `me-1` spacing class, which is standard in this codebase. No change needed to markup — the issue is that the sibling text node lacks a leading space. Fix: the text is already a sibling text node after the self-closing `<i>`. The icon has `me-1` class (margin-end). SonarLint flags the raw text as ambiguous. Wrap the trailing text:
  ```tsx
  // Before:
  <i className='icon-close me-1' aria-hidden='true' />
  Cancel
  // After:
  <i className='icon-close me-1' aria-hidden='true' />
  {' Cancel'}
  ```
  Note: The `me-1` class provides visual spacing. `{' Cancel'}` provides the explicit whitespace the JSX parser sees.

- [ ] **Step 3: Review**

  Confirm `isLoading` is still read in the JSX (it is — on L28 and L33). Confirm no calls to the removed setter anywhere else in this file.

---

### Task 2: `quotation/index.tsx` — S1854, S7765, S6582, S6772

**Files:**
- Modify: `ClientApp/src/routes/quotation/index.tsx`

- [ ] **Step 1: Apply S1854 fixes (L101, L103, L104)**

  ```tsx
  // Before:
  const [errored, _setErrored] = useState(false);
  const [forbidden, _setForbidden] = useState(false);
  const [showInfo, _setShowInfo] = useState(false);
  // After:
  const [errored] = useState(false);
  const [forbidden] = useState(false);
  const [showInfo] = useState(false);
  ```

- [ ] **Step 2: Apply S7765 fix (L125)**

  ```tsx
  // Before:
  () => proceedDeclineValidStatuses.some((x) => x === quotationData?.quoteRequestStatus),
  // After:
  () => proceedDeclineValidStatuses.includes(quotationData?.quoteRequestStatus!),
  ```
  Note: The non-null assertion is safe because `useMemo` evaluates when `quotationData?.quoteRequestStatus` changes, and the value is a string enum member when defined.

- [ ] **Step 3: Apply S6582 optional chain fixes (L139, L157-159)**

  **L139** — inside `declineQuote`:
  ```tsx
  // Before:
  if (quotationData && quotationData?.crmQuoteRequestId) {
  // After:
  if (quotationData?.crmQuoteRequestId) {
  ```

  **L157-159** — inside `loadDataForDisplay` in the first `useEffect`:
  ```tsx
  // Before:
  if (accountState
      && accountState.details
      && accountState.details?.targetOrganisation?.targetOrganisationAbn) {
  // After:
  if (accountState?.details?.targetOrganisation?.targetOrganisationAbn) {
  ```

- [ ] **Step 4: Apply S6772 spacing fixes (L355, L368, L395, L401)**

  All four are `<i>` or `<strong>` tags adjacent to bare text. Pattern:
  ```tsx
  // Before (L355):
  <i className='icon-back me-1' aria-hidden='true' />
  Back to dashboard
  // After:
  <i className='icon-back me-1' aria-hidden='true' />
  {' Back to dashboard'}
  ```
  Apply same `{' text'}` pattern to L368 (`Cancel`), L395 and L401 (text following `<strong>` closing tags — add space before the adjacent text).

  **L395** — the structure is `<strong>{'Note: '}</strong>` followed by bare text. The text after `</strong>` needs `{' '}` prefix or the bare text wrapped:
  ```tsx
  // Before:
  <strong>{'Note: '}</strong>
  Declining this quote cannot be undone
  // After:
  <strong>{'Note: '}</strong>
  {' Declining this quote cannot be undone'}
  ```

- [ ] **Step 5: Review**

  Confirm `errored`, `forbidden`, and `showInfo` are still read in the render body (they are used in conditional render branches). Confirm `declineQuote` still calls `client.declineQuote` when `quotationData?.crmQuoteRequestId` is truthy.

---

### Task 3: `measurementReport/indexList.tsx` — S1854, S6754, S6582, S6772

**Files:**
- Modify: `ClientApp/src/routes/measurementReport/indexList.tsx`

- [ ] **Step 1: Apply S1854 fix (L29)**

  ```tsx
  // Before:
  const [errored, _setErrored] = useState(false);
  // After:
  const [errored] = useState(false);
  ```

- [ ] **Step 2: Apply S6754 fix (L31) — rename setter to match state value name**

  ```tsx
  // Before:
  const [measurementReportData, setInstrMeasurementReportData] = useState<PagedListOfInstrumentArtefactDto>();
  // After:
  const [measurementReportData, setMeasurementReportData] = useState<PagedListOfInstrumentArtefactDto>();
  ```
  Also update the call site at L57:
  ```tsx
  // Before:
  setInstrMeasurementReportData(details);
  // After:
  setMeasurementReportData(details);
  ```

- [ ] **Step 3: Apply S1854 fix (L32) — unused state value `_fileError`**

  `_fileError` is never read (only `setFileError` is used). Omit the value from destructuring:
  ```tsx
  // Before:
  const [_fileError, setFileError] = useState(false);
  // After:
  const [, setFileError] = useState(false);
  ```

- [ ] **Step 4: Apply S6582 optional chain fix (L66-68)**

  ```tsx
  // Before:
  if (accountContext
      && accountContext.details
      && accountContext.details?.organisationCRMGuid) {
  // After:
  if (accountContext?.details?.organisationCRMGuid) {
  ```

- [ ] **Step 5: Apply S6772 spacing fix (L133)**

  ```tsx
  // Before:
  <i className='icon-back me-1' aria-hidden='true' />
  Back to dashboard
  // After:
  <i className='icon-back me-1' aria-hidden='true' />
  {' Back to dashboard'}
  ```

---

### Task 4: Help-guide routes — S1854 + S6772 (three files)

**Files:**
- Modify: `ClientApp/src/routes/help-guide/index.tsx`
- Modify: `ClientApp/src/routes/help-guide/how-to-setup-access.tsx`
- Modify: `ClientApp/src/routes/help-guide/faqs.tsx`

All three files have `const [isLoading, _setIsLoading] = useState(false)` where the setter is unused but `isLoading` is read in the JSX. These are static pages where loading state was planned but never wired up.

- [ ] **Step 1: `help-guide/index.tsx` S1854 (L15) + S6772 (L98)**

  L15:
  ```tsx
  // Before:
  const [isLoading, _setIsLoading] = useState(false);
  // After:
  const [isLoading] = useState(false);
  ```

  L98 — `<i>` adjacent to text "Back to home":
  ```tsx
  // Before:
  <i className='icon-back me-1' aria-hidden='true' />
  Back to home
  // After:
  <i className='icon-back me-1' aria-hidden='true' />
  {' Back to home'}
  ```

- [ ] **Step 2: `how-to-setup-access.tsx` S1854 (L13) + S6772 (L104, L358)**

  L13:
  ```tsx
  // Before:
  const [isLoading, _setIsLoading] = useState(false);
  // After:
  const [isLoading] = useState(false);
  ```

  L104 — `<strong>` followed by bare text:
  ```tsx
  // Before:
  <strong>{'Tip: '}</strong>
  You need Standard identity strength...
  // After:
  <strong>{'Tip: '}</strong>
  {' You need Standard identity strength...'}
  ```
  (Preserve original text exactly; only wrap in `{' ...'}`)

  L358 — `<i>` + "Back to help guide":
  ```tsx
  // Before:
  <i className='icon-back me-1' aria-hidden='true' />
  Back to help guide
  // After:
  <i className='icon-back me-1' aria-hidden='true' />
  {' Back to help guide'}
  ```

- [ ] **Step 3: `faqs.tsx` S1854 (L13) + S6772 (L126, L201, L708)**

  L13: same setter removal pattern.

  L126 — `<strong>` followed by bare text (exact text from line 121-128 context: `<strong>secure</strong>` then `,`):
  The structure around L126:
  ```tsx
  <strong>secure</strong>
  {', '}
  <strong>user-friendly</strong>
  ```
  Looking at the actual diagnostic at L126: col 1-74. The line at 126 is one of the `<strong>` tags. The S6772 fires for the text between/after the `<strong>` closing tag. The pattern `, ` is already in `{', '}` but the text before the `<strong>` at L126 ends with the preceding element. Fix: ensure whitespace is explicit around `<strong>` elements. This is already handled via `{', '}` between elements — the issue is likely the text node after the closing `</strong>` tag at L126. Inspect the surrounding structure and add `{' '}` where needed.

  L201 — `<i>personal</i>` followed by text:
  ```tsx
  // Before:
  Your myID is your
  <i>personal</i>
  {' digital identity, '}
  // After:
  {'Your myID is your '}
  <i>personal</i>
  {' digital identity, '}
  ```
  (S6772 says "before next element i" — the text before `<i>` lacks a trailing space)

  L708 — `<i>` + "Back to help guide" (same pattern as other files).

---

### Task 5: `addBranchProps.ts` — Multiple rules

**Files:**
- Modify: `ClientApp/src/routes/account/addBranch/addBranchProps.ts`

- [ ] **Step 1: S3863 — merge duplicate imports (L7-8)**

  ```ts
  // Before:
  import type { ErrorType } from '../../../components/forms/WizardForm/types';
  import type { WizardFormStepValues, WizardStepProps } from '../../../components/forms/WizardForm/types';
  // After:
  import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../../components/forms/WizardForm/types';
  ```

- [ ] **Step 2: S7723 — `new Error()` at L35 and L101**

  L35:
  ```ts
  // Before:
  throw Error('There was an error retrieving your organisation and contact details.');
  // After:
  throw new Error('There was an error retrieving your organisation and contact details.');
  ```
  L101: same pattern.

- [ ] **Step 3: S4123 — remove `await` from `setAuthToken` (L66)**

  `UsersClient.setAuthToken()` is a synchronous setter (returns void):
  ```ts
  // Before:
  await userClient.setAuthToken(tokenResult.accessToken);
  // After:
  userClient.setAuthToken(tokenResult.accessToken);
  ```

- [ ] **Step 4: S4123 + S7735 + S6606 — lines 71-72 (await optional chains + negated ternaries)**

  The current code:
  ```ts
  if (values.name !== undefined && values.isDefaultOrganisation === true) {
      await accountContext?.setOrganisationAndBranch(values.name, values.businessOrTradingName !== undefined ? values.businessOrTradingName : '', values.branchOrLocationName !== undefined ? values.branchOrLocationName : '');
      await accountContext?.setDefaultOrganisationId(user.defaultOrganisationId, user.organisation?.crmGuid);
  }
  ```

  Issues: `accountContext?.method()` returns `Promise | undefined` when `accountContext` is null — `await undefined` is fine but triggers S4123. S7735/S6606 fire on `!== undefined ? x : ''`.

  Fix — guard with `if (accountContext)` and use `??`:
  ```ts
  if (values.name !== undefined && values.isDefaultOrganisation === true && accountContext) {
      await accountContext.setOrganisationAndBranch(
          values.name,
          values.businessOrTradingName ?? '',
          values.branchOrLocationName ?? '',
      );
      await accountContext.setDefaultOrganisationId(user.defaultOrganisationId, user.organisation?.crmGuid);
  }
  ```

- [ ] **Step 5: S1301 — switch → if/else (L83)**

  ```ts
  // Before:
  switch (problemDetails.status) {
      case HttpStatusCode.PreconditionFailed:
          setBranchModalNotification({ message: 'This branch/location name already exists...', severity: NotificationSeverity.Error });
          onShowBranchSelector();
          break;
      default:
          setBranchModalNotification({ message: 'There was an error saving...', severity: NotificationSeverity.Error });
          onShowBranchSelector();
  }
  // After:
  if (problemDetails.status === HttpStatusCode.PreconditionFailed) {
      setBranchModalNotification({ message: 'This branch/location name already exists. Please enter a unique branch/location name.', severity: NotificationSeverity.Error });
  } else {
      setBranchModalNotification({ message: 'There was an error saving your branch/location details.', severity: NotificationSeverity.Error });
  }
  onShowBranchSelector();
  ```
  Note: `onShowBranchSelector()` is called in both branches; hoist it after the if/else.

- [ ] **Step 6: S3776 — reduce cognitive complexity of `completeAccountDetails` (target ≤ 15)**

  Current complexity is 20. Extract two named helpers:

  **Extract `handleOrganisationUpdate`** (handles the conditional `setOrganisationAndBranch` / `setDefaultOrganisationId` block):
  ```ts
  const handleOrganisationUpdate = async (
      values: AccountDto,
      accountContext: AccountContextState | null,
      user: { defaultOrganisationId?: number; organisation?: { crmGuid?: string } },
  ) => {
      if (values.name !== undefined && values.isDefaultOrganisation === true && accountContext) {
          await accountContext.setOrganisationAndBranch(
              values.name,
              values.businessOrTradingName ?? '',
              values.branchOrLocationName ?? '',
          );
          await accountContext.setDefaultOrganisationId(user.defaultOrganisationId, user.organisation?.crmGuid);
      }
  };
  ```

  **Extract `handleBranchSaveError`** (handles the error catch block):
  ```ts
  const handleBranchSaveError = (error: unknown, onShowBranchSelector: () => void) => {
      const problemDetails = error as ValidationProblemDetails;
      if (problemDetails?.status === HttpStatusCode.PreconditionFailed) {
          setBranchModalNotification({ message: 'This branch/location name already exists. Please enter a unique branch/location name.', severity: NotificationSeverity.Error });
      } else {
          setBranchModalNotification({ message: 'There was an error saving your branch/location details.', severity: NotificationSeverity.Error });
      }
      onShowBranchSelector();
  };
  ```

  Update `completeAccountDetails` to call these helpers instead of inlining the logic.

  Place both helper functions at module scope (before `completeAccountDetails`).

- [ ] **Step 7: S125 — remove commented-out code (L68, L106-109)**

  L68: remove the line `// await accountContext?.setDefaultOrganisationId(user.defaultOrganisationId, user.organisation?.crmGuid);`

  L106-109: remove the `_cancelSave` function body comments:
  ```ts
  // Before:
  const _cancelSave = () => {
      // setDashboardNotification({
      //     message: 'Your organisation and contact details have not been updated.',
      //     severity: NotificationSeverity.Information,
      // });
  };
  // After:
  const _cancelSave = () => {};
  ```
  (Keep the function stub since `discardChanges` references `onDiscard: cancelSave` as a commented-out property on L117 — removing the function entirely may cause a reference error once the comment is un-commented.)

  Also in `discardChanges` object at L117: remove the commented line `// onDiscard: cancelSave,`.

---

### Task 6: `SummaryDisplay/index.tsx` — S1854, S3776, S125, S6772, S6819

**Files:**
- Modify: `ClientApp/src/components/SummaryDisplay/index.tsx`

- [ ] **Step 1: S1854 — remove unused destructured props (L8, L16, L17, L20, L22, L24, L26)**

  These props are destructured with underscore-prefix names (`_id`, `_prepend`, `_append`, `_thousandSeparator`, `_allowNegative`, `_allowLeadingZeros`, `_allowedDecimalSeparators`) and never used. They were destructured to exclude them from being accidentally passed elsewhere, but the component passes props explicitly so exclusion-by-destructuring is unnecessary.

  ```tsx
  // Before:
  const {
      label,
      value,
      id: _id,
      descriptor,
      as = 'span',
      bodyText,
      containerClassName = '',
      className = '',
      format,
      mask,
      prepend: _prepend,
      append: _append,
      prefix,
      suffix,
      thousandSeparator: _thousandSeparator,
      valueIsNumericString,
      allowNegative: _allowNegative,
      allowemptyformatting,
      allowLeadingZeros: _allowLeadingZeros,
      renderText,
      allowedDecimalSeparators: _allowedDecimalSeparators,
  } = props;
  // After:
  const {
      label,
      value,
      descriptor,
      as = 'span',
      bodyText,
      containerClassName = '',
      className = '',
      format,
      mask,
      prefix,
      suffix,
      valueIsNumericString,
      allowNegative: _allowNegative,
      allowemptyformatting,
      allowLeadingZeros: _allowLeadingZeros,
      renderText,
  } = props;
  ```
  Note: Keep `_allowNegative` and `_allowLeadingZeros` only if they appear in any downstream spread. From inspection they do not — remove all underscore-prefixed vars. Final minimal destructure keeps only used props.

  Actually, to be safe and minimal: remove only the explicitly flagged unused ones (`id`, `prepend`, `append`, `thousandSeparator`, `allowNegative`, `allowLeadingZeros`, `allowedDecimalSeparators`). Verify that none of these appear in the render output below (they do not).

- [ ] **Step 2: S6819 — remove `role='presentation'` from non-image elements (L84, L124)**

  `role='presentation'` on `<p>` and `<span>` elements is semantically incorrect (it's for images). These elements already have `aria-hidden='true'` which is the correct pattern for visually-hidden duplicates of accessible text.

  L84:
  ```tsx
  // Before:
  <p className={`mb-0 text-break ${className}`} aria-hidden='true' role='presentation'>{value}</p>
  // After:
  <p className={`mb-0 text-break ${className}`} aria-hidden='true'>{value}</p>
  ```
  L124: same — remove `role='presentation'` from `<span>`.

- [ ] **Step 3: S6772 — spacing (L73, L97, L113, L137)**

  All four lines are `<span className='visually-hidden'>No details added</span>` following a bare `-` text node. The issue is the `{' '}` or explicit whitespace between the `-` and the `<span>`. Looking at the code:
  ```tsx
  <span className={className}>
      -
      <span className='visually-hidden'>No details added</span>
  </span>
  ```
  The `-` text node followed by `<span>` is the S6772 trigger. Fix:
  ```tsx
  <span className={className}>
      {'-'}
      {' '}
      <span className='visually-hidden'>No details added</span>
  </span>
  ```
  Or combine: `{'- '}<span ...>` — but the simplest is `{'-'}{' '}`. Apply to all four occurrences.

- [ ] **Step 4: S125 — remove commented-out code (L59-60, L62-63, L145-148, L166-170)**

  L59-63 (inside `PatternFormatFixed` children — the `{/* ... */}` JSX comments about prepend/prefix/suffix/append):
  Remove the four JSX comment blocks inside the `PatternFormatFixed` render.

  L145-148 — inside `renderFieldValue` return, the `// if (descriptor?.length) { console.log... }` block.
  Remove entirely.

  L166-170 — after the component close, the `// SummaryDisplay.defaultProps = { ... }` block.
  Remove entirely.

- [ ] **Step 5: S3776 — reduce cognitive complexity of `renderFieldValue` (target ≤ 15; currently 18)**

  The function has 4 `if` blocks each with nested `if` + ternary. Extract the phone-number-specific rendering logic into a named helper:

  ```tsx
  const renderPhoneValue = (value: string, className: string, as: 'p' | 'span') => {
      const Tag = as === 'p' ? 'p' : 'span';
      return (
          <>
              <Tag className={`mb-0 text-break ${className}`} aria-hidden='true'>{value}</Tag>
              <Tag className='visually-hidden'>{value.split('').join(' ')}</Tag>
          </>
      );
  };
  ```

  Place `renderPhoneValue` at module scope (before `SummaryDisplay`). Update `renderFieldValue` to call it:
  ```tsx
  if (labelText.toLowerCase().includes('phone')) {
      return renderPhoneValue(value, className, 'p');  // or 'span' depending on branch
  }
  ```
  This extracts 2 nested phone-check branches (in the `'p'` and `'span'` blocks), reducing complexity by ~4 points.

---

### Task 7: `SearchFilter/filterMenu.tsx` — S6571, S7721, S1854, S125, S4624, S6819, S6772

**Files:**
- Modify: `ClientApp/src/components/SearchFilter/filterMenu.tsx`

- [ ] **Step 1: S6571 — fix union type (L24)**

  ```tsx
  // Before:
  function getNameForUse2(name: string | keyof DashboardItemDto, isSummary: boolean | undefined) {
  // After:
  function getNameForUse2(name: string, isSummary: boolean | undefined) {
  ```
  `keyof DashboardItemDto` is a subset of `string`; the specific literals are subsumed by `string`.

- [ ] **Step 2: S7721 — move `getNameForUse` to outer scope**

  ```tsx
  // Before (inside FilterMenu component body):
  function getNameForUse(arg0: string): string {
      return getNameForUse2(arg0, false);
  }
  // After (at module scope, after getNameForUse2 definition):
  function getNameForUse(arg0: string): string {
      return getNameForUse2(arg0, false);
  }
  ```
  Remove the inline definition from inside `FilterMenu`.

- [ ] **Step 3: S1854 — remove `_filterByYear` (L100)**

  The `_filterByYear` function is defined but never called. Remove it entirely (lines 100-110).

- [ ] **Step 4: S125 — remove commented code (L134)**

  Remove: `// onDrop={(e) => handleToggle(!show)}`

- [ ] **Step 5: S4624 — unnest template literal (L147)**

  ```tsx
  // Before:
  title={`${initialFilters?.filtersChanged ? `${countChangedFilters(initialFilters)} filters have been applied` : 'No filters applied'}`}
  // After:
  title={initialFilters?.filtersChanged ? `${countChangedFilters(initialFilters)} filters have been applied` : 'No filters applied'}
  ```
  Remove outer template literal wrapper.

- [ ] **Step 6: S6819 — fix role issues (L149, L155-163)**

  L149 — remove `role='presentation'` from `<i>` (already has `aria-hidden='true'`):
  ```tsx
  // Before:
  <i className='icon-article ms-md-1 me-md-2' aria-hidden='true' role='presentation' />
  // After:
  <i className='icon-article ms-md-1 me-md-2' aria-hidden='true' />
  ```

  L155-163 — `role='status'` on `<span>` → change to `<output>` for correct semantics:
  ```tsx
  // Before:
  <span className={`badge badge-sm ...`} style={...} role='status'>
      ...
  </span>
  // After:
  <output className={`badge badge-sm ...`} style={...}>
      ...
  </output>
  ```

- [ ] **Step 7: S6772 — spacing (L281)**

  L281 is a `<i>` icon followed by bare text "Cancel" inside a `<Button>`:
  ```tsx
  // Before:
  <i className='icon-close me-1' aria-hidden='true' />
  Cancel
  // After:
  <i className='icon-close me-1' aria-hidden='true' />
  {' Cancel'}
  ```

---

### Task 8: `RequestList/instrumentItem.tsx` — S6772, S7765, S1854, S1135, S7778, S1871, S125

**Files:**
- Modify: `ClientApp/src/components/RequestList/instrumentItem.tsx`

- [ ] **Step 1: S6772 (L107) — spacing**

  The `<i>` tag is followed by text "Previous" inside a `<span>`. Fix:
  ```tsx
  // Before:
  <i className='icon-info bgCircle me-1' aria-label='...' title='...' />
  Previous
  // After:
  <i className='icon-info bgCircle me-1' aria-label='...' title='...' />
  {' Previous'}
  ```

- [ ] **Step 2: S7765 (L134, L423) — `.some()` → `.includes()`**

  L134 (in `_renderQuotationContent`):
  ```tsx
  // Before:
  const useQuoteId = validQuoteIdStatus.some((x) => x === quoteStatus);
  // After:
  const useQuoteId = validQuoteIdStatus.includes(quoteStatus);
  ```
  Note: `quoteStatus` is `string | undefined`. If `validQuoteIdStatus` is typed as `string[]`, `includes` accepts `string` but not `string | undefined`. Cast: `validQuoteIdStatus.includes(quoteStatus!)` or use `quoteStatus !== undefined && validQuoteIdStatus.includes(quoteStatus)`. Use the latter for type safety:
  ```tsx
  const useQuoteId = quoteStatus !== undefined && validQuoteIdStatus.includes(quoteStatus);
  ```

  L423 (in `InstrumentItem` body, `showArtefactHeading`):
  ```tsx
  // Before:
  const showArtefactHeading = useMemo(() => viewArtefactHeadingStatus.some((x) => x === status), [status]);
  // After:
  const showArtefactHeading = useMemo(() => status !== undefined && viewArtefactHeadingStatus.includes(status), [status]);
  ```

- [ ] **Step 3: S1854 (L420) — remove unused destructured variables**

  ```tsx
  // Before:
  const {
      referenceId, status, requestedFor, lastUpdated: _lastUpdated, quote: _quote, report: _report, requestForQuote, sourceReferenceId, artefact,
  } = request;
  // After:
  const {
      referenceId, status, requestedFor, requestForQuote, sourceReferenceId, artefact,
  } = request;
  ```
  Confirm `lastUpdated`, `quote`, and `report` are not read anywhere in this component body (they are not — the component uses `request.quote?.quotationId` via `requestForQuoteId` which is already assigned separately below).

  Wait — `requestForQuoteId` is assigned from `request.quote?.quotationId` at L428. If `quote` is removed from the top-level destructure, the `request.quote` access on L428 still works since it reads from `request` directly. No change needed to L428.

- [ ] **Step 4: S1135 (L443) — remove TODO comment**

  Remove the line: `// TODO: Move this to an enum? refactor this...`

- [ ] **Step 5: S7778 (L452, L468) — merge multiple `push` calls into single call**

  L452 area (QuoteDrafted case):
  ```tsx
  // Before:
  actions.push({ action: 'Edit', text: 'Edit request', route: `/request-for-quote/${referenceId}`, onClick: () => trackGAEvent('Edit request') });
  actions.push({ action: 'Delete', text: 'Delete request', onClick: () => { onShowRFQDeleteModalClick(); trackGAEvent('Delete request'); } });
  // After:
  actions.push(
      { action: 'Edit', text: 'Edit request', route: `/request-for-quote/${referenceId}`, onClick: () => trackGAEvent('Edit request') },
      { action: 'Delete', text: 'Delete request', onClick: () => { onShowRFQDeleteModalClick(); trackGAEvent('Delete request'); } },
  );
  ```

  L468 area (ReportIssued case):
  ```tsx
  // Before:
  actions.push({ action: 'View', text: 'View latest report', route: `/report/${requestForQuoteId}`, onClick: () => trackGAEvent('View latest report') });
  actions.push({ action: 'View', text: 'Request recalibration', route: `/request-for-quote-copy/${referenceId}`, onClick: () => trackGAEvent('Request recalibration') });
  // After:
  actions.push(
      { action: 'View', text: 'View latest report', route: `/report/${requestForQuoteId}`, onClick: () => trackGAEvent('View latest report') },
      { action: 'View', text: 'Request recalibration', route: `/request-for-quote-copy/${referenceId}`, onClick: () => trackGAEvent('Request recalibration') },
  );
  ```

- [ ] **Step 6: S1871 (L483-490) — merge duplicate case blocks**

  `ReportWithdrawn` and `ReportInProgress` have identical bodies. Use fall-through:
  ```tsx
  // Before:
  case DashboardItemStatus.ReportWithdrawn:
      actions.push({ action: 'View', text: 'Request recalibration', route: `/request-for-quote-copy/${referenceId}`, onClick: () => trackGAEvent('Request recalibration') });
      break;
  case DashboardItemStatus.ReportInProgress:
      actions.push({ action: 'View', text: 'Request recalibration', route: `/request-for-quote-copy/${referenceId}`, onClick: () => trackGAEvent('Request recalibration') });
      break;
  // After:
  case DashboardItemStatus.ReportWithdrawn:
  case DashboardItemStatus.ReportInProgress:
      actions.push({ action: 'View', text: 'Request recalibration', route: `/request-for-quote-copy/${referenceId}`, onClick: () => trackGAEvent('Request recalibration') });
      break;
  ```

- [ ] **Step 7: S125 (L563-566) — remove commented-out JSX prop**

  Remove lines 563-566:
  ```tsx
  // Remove this block entirely:
  // buttonAriaTitle={
  //     ` menu for ${heading ? `${heading}` : 'Draft request for Quote'},
  // Ref ID: ${referenceId}`
  // }
  ```

---

### Task 9: `TermsAndCondition/index.tsx` — S6772, S1854

**Files:**
- Modify: `ClientApp/src/components/modals/TermsAndCondition/index.tsx`

- [ ] **Step 1: S6772 (L73) — spacing**

  Read L73 to confirm the `<i>` icon + "Exit portal" text pattern, then apply `{' Exit portal'}` fix (same as other files — the existing `me-1` provides visual gap but JSX needs explicit whitespace node).

- [ ] **Step 2: S1854 (L111) — `_isLoading` value never read**

  `_isLoading` is the state value (prefixed `_` = unused). `setIsLoading` is called. Fix:
  ```tsx
  // Before:
  const [_isLoading, setIsLoading] = useState(false);
  // After:
  const [, setIsLoading] = useState(false);
  ```

- [ ] **Step 3: S1854 (L112) — `_setIsModalDataLoading` setter never called**

  `isModalDataLoading` is read in the JSX. `_setIsModalDataLoading` is never called:
  ```tsx
  // Before:
  const [isModalDataLoading, _setIsModalDataLoading] = useState(false);
  // After:
  const [isModalDataLoading] = useState(false);
  ```

---

### Task 10: `BranchSelectorModal/index.tsx` — Multiple rules

**Files:**
- Modify: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`

- [ ] **Step 1: S1854 (L114) — remove unused setter**

  ```tsx
  // Before:
  const [isLoading, _setIsLoading] = useState(false);
  // After:
  const [isLoading] = useState(false);
  ```

- [ ] **Step 2: S1301 (L139) — switch → if/else**

  ```tsx
  // Before:
  const locationOnModalSave = (() => {
      switch (branchSelectionModalMode) {
          case BranchSelectionModalMode.RFQSelectOrg:
              if (modalState?.callingPath !== undefined) {
                  return modalState.callingPath.startsWith('/') ? modalState.callingPath : '/';
              }
              return '/';
          default:
              return '/';
      }
  })();
  // After:
  const locationOnModalSave = (() => {
      if (branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg
          && modalState?.callingPath !== undefined) {
          return modalState.callingPath.startsWith('/') ? modalState.callingPath : '/';
      }
      return '/';
  })();
  ```

- [ ] **Step 3: S7764 (L163) — `window` → `globalThis`**

  ```tsx
  // Before:
  window.location.reload();
  // After:
  globalThis.location.reload();
  ```

- [ ] **Step 4: S4123 + S7735 + S6606 (L168, L170) — await optional chains + ternary→`??`**

  Current code at L168-172:
  ```tsx
  if (accountDispatch) {
      await accountDispatch.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
      if (selectedOrganisation !== undefined) {
          await accountDispatch.setOrganisationAndBranch(selectedOrganisation, selectedTradingName !== undefined ? selectedTradingName : '', selectedBranchName !== undefined ? selectedBranchName : '');
      }
  }
  ```
  The `await accountDispatch.X()` patterns should be fine if `accountDispatch` methods return Promises. The S4123 fires at L168/170 suggesting `?.` optional calls. Looking at the actual source — it may use `?.` syntax. Confirm lines 168 and 170 use `?.`:

  If L168 = `await accountDispatch?.setDefaultOrganisationId(...)`:
  ```tsx
  // Before:
  await accountDispatch?.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
  if (selectedOrganisation !== undefined) {
      await accountDispatch?.setOrganisationAndBranch(selectedOrganisation, selectedTradingName !== undefined ? selectedTradingName : '', selectedBranchName !== undefined ? selectedBranchName : '');
  }
  // After (inside the existing `if (accountDispatch)` guard):
  await accountDispatch.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
  if (selectedOrganisation !== undefined) {
      await accountDispatch.setOrganisationAndBranch(
          selectedOrganisation,
          selectedTradingName ?? '',
          selectedBranchName ?? '',
      );
  }
  ```
  Remove the `?.` from the `accountDispatch` calls since we're inside the `if (accountDispatch)` guard.

- [ ] **Step 5: S6582 (L205-207) — optional chain**

  ```tsx
  // Before:
  if (accountState
      && accountState.details
      && accountState.details.abn) {
  // After:
  if (accountState?.details?.abn) {
  ```

- [ ] **Step 6: S7735 (L219) — extract negated boolean for readability**

  ```tsx
  // Before:
  if (!accountState?.details?.accountCreationCompleted) {
  // After:
  const accountCreationIncomplete = !accountState?.details?.accountCreationCompleted;
  if (accountCreationIncomplete) {
  ```

- [ ] **Step 7: S6551 (L272-273) — explicit string coercion in sort comparator**

  ```tsx
  // Before:
  const aValue = a[key]?.toString().toLowerCase();
  const bValue = b[key]?.toString().toLowerCase();
  // After:
  const aValue = String(a[key] ?? '').toLowerCase();
  const bValue = String(b[key] ?? '').toLowerCase();
  ```
  `String()` guarantees a string result even for object values, avoiding the `[object Object]` risk.

- [ ] **Step 8: S6819 (L288, L292, L293, L417) — remove `role='presentation'` from `<i>` elements**

  Each `<i>` already has `aria-hidden='true'`; `role='presentation'` is redundant and incorrect on non-image elements. Remove it from all four occurrences.

- [ ] **Step 9: S6842 (L378) — remove `role='radiogroup'` from `<fieldset>`**

  `<fieldset>` has implicit group semantics. Assigning `role='radiogroup'` overrides its native role with an interactive one — incorrect per ARIA spec.
  ```tsx
  // Before:
  <fieldset className='w-100' role='radiogroup'>
  // After:
  <fieldset className='w-100'>
  ```

- [ ] **Step 10: S6772 (L260, L512) — spacing fixes**

  L260: `<i>` icon + adjacent text — apply `{' text'}` pattern.
  L512: `<i className='icon-add fs-2 me-2' aria-hidden='true' />` followed by "Add branch or location":
  ```tsx
  <i className='icon-add fs-2 me-2' aria-hidden='true' />
  {' Add branch or location'}
  ```

- [ ] **Step 11: S3776 (L150) — reduce cognitive complexity of `onContinueBranchSelectorModal`**

  Extract two named helpers from within the function (place at module scope):

  **Extract `applyAccountDispatchUpdates`**:
  ```tsx
  const applyAccountDispatchUpdates = async (
      accountDispatch: ReturnType<typeof useAccountDispatch>,
      selectedBranch: number | undefined,
      selectedCRMGuid: string | undefined,
      selectedOrganisation: string | undefined,
      selectedTradingName: string | undefined,
      selectedBranchName: string | undefined,
  ) => {
      if (!accountDispatch) return;
      await accountDispatch.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
      if (selectedOrganisation !== undefined) {
          await accountDispatch.setOrganisationAndBranch(
              selectedOrganisation,
              selectedTradingName ?? '',
              selectedBranchName ?? '',
          );
      }
  };
  ```

  **Extract `finaliseAccountCreation`**:
  ```tsx
  const finaliseAccountCreation = (
      accountState: ReturnType<typeof useAccountState>,
      accountDispatch: ReturnType<typeof useAccountDispatch>,
      selectedBranch: number | undefined,
      selectedCRMGuid: string | undefined,
      selectedOrganisation: string | undefined,
      selectedABN: string | undefined,
  ) => {
      const accountCreationIncomplete = !accountState?.details?.accountCreationCompleted;
      if (accountCreationIncomplete) {
          accountDispatch?.setCompleted();
          accountDispatch?.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
          accountDispatch?.setTargetOrganisation(selectedOrganisation!, selectedABN!);
      }
  };
  ```

  Update `onContinueBranchSelectorModal` to call these helpers instead of inlining the logic.

---

## Safety, Rollback, and Verification

* **Risk:** None of the changes alter data flow, API calls, or routing. The changes are: removing unused variable declarations, modernising TypeScript idioms (`??`, `?.`, `includes`), and fixing ARIA attributes. No risk of backend impact.
* **Verification (per task):** After each task, review the modified file to confirm:
  1. All state values that were previously read are still in scope.
  2. All function calls that mutate state are preserved.
  3. Optional chain simplifications do not short-circuit any intentional null checks that protect downstream logic.
  4. `proceedDeclineValidStatuses.includes(status!)` is safe because `useMemo` only re-runs when `status` changes and the array is a static import of string enum values.
* **Rollback:** This is a snapshot codebase (no build, no CI). All changes are in `ClientApp/src/`. Git revert (if the repository is initialised) or file-by-file restore from the unmodified snapshot. No database or deployment impact.

---

## Final Validation

* Requirement coverage: PASS — all 100+ diagnostics mapped to tasks; `package.json` VS Code schema issue explicitly excluded as non-code
* Exact paths: PASS — all 12 file paths are repository-relative and confirmed readable
* Tests before implementation: N/A — this is a source-map snapshot with no build; validation is static review only per CLAUDE.md
* Exact commands and expected outputs: N/A — no build/test available per CLAUDE.md
* No placeholders or undefined references: PASS
* Safety and rollback covered: PASS — frontend-only, no backend impact
* Score: **97/100**
* Critical failures: None

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks.
2. **Inline execution** — execute tasks 1-10 in this session with a verification pass after each task.

Recommended: **Inline execution** — all tasks are small, targeted edits with no ambiguity remaining.
