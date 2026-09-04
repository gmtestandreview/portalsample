# Business Rules — NMI Customer Portal
**Source:** `ClientApp/src` · **Date:** 2026-06-02
**Extraction method:** Three parallel subagent lenses (Calculations / Validations / State & Lifecycle)
**Alignment note:** Open migration security set is SEC-008 (by-design), SEC-012 (architectural debt). SEC-010 closed 2026-06-04 (CRD-035). SEC-001, SEC-009, SEC-011 closed 2026-06-01 (CRD-029, CRD-031).

---

> ## ⚠️ VERIFICATION STATUS — read before using this register (2026-09-02, CRD-044)
>
> **The line numbers in this document are unreliable. Do not navigate by them, and do not take a rule
> to a BA or to Legal for signature on the strength of its citation.**
>
> A verification pass on 2026-09-02 examined 21 citations in detail and found **18 wrong**, including
> five P0 rules, with three pointing past the end of the file entirely. Every *file path* is correct;
> the *line numbers* are not. That pattern indicates the register was generated against an earlier
> tree and never reconciled.
>
> | | |
> | --- | --- |
> | Rules in the summary table | 53 |
> | Rules with a detail section | 47 — **6 are listed but never defined** (RULE-023/024/025/029/030/051) |
> | Citations examined in detail | 21 — **18 miscited**, 3 correct |
> | Specifications verified against code | **3 of 53** (RULE-022 sound · RULE-035 was wrong, corrected · RULE-042 sound but incomplete) |
>
> **Two substantive defects were found, not just bad line numbers:**
>
> - **RULE-035** claimed the ASIC charset excludes `&`. It does not. Corrected under CRD-043; the SME
>   question built on that premise was void.
> - **RULE-022** is specified correctly but **`isValidAbn` is never called anywhere in the client**.
>   The rule asserts that ABNs "are validated using the official ATO checksum"; on the client, they
>   are not. Needs a backend answer.
>
> The other 50 specifications are **unverified**, not known-wrong. Full evidence and recommendations:
> `docs/change-record/2026-09-02-business-rules-verification.md`. Tracked as `RULES-REGISTER-001`.


## Summary Table

> **The Source column names the file only — the precise line lives in each rule's own section.**
> Changed 2026-09-02 (CRD-045). Carrying line numbers in two places doubled the surface that rots and
> guaranteed the two would disagree, which is exactly what the CRD-044 audit found. The file name is
> stable; the line number is not, so only one place owns it. Both are checked by
> `npm run lint:rules`, which runs in CI.


| ID | Name | Category | Priority | Source | Confidence |
|---|---|---|---|---|---|
| RULE-001 | Account creation gate | Lifecycle | P0 | `PreConditions.tsx` | High |
| RULE-002 | Contact creation gate | Lifecycle | P0 | `PreConditions.tsx` | High |
| RULE-003 | Post-onboarding redirect | Lifecycle | P1 | `PreConditions.tsx` | High |
| RULE-004 | Terms of Use version gate | Lifecycle | P0 | `AccountProvider.tsx`, `terms-config.json` | High |
| RULE-005 | Branch selection gate | Lifecycle | P0 | `PreConditions.tsx` | High |
| RULE-006 | Quote status lifecycle (12 states) | Lifecycle | P0 | `enums.ts`, `quoteStatus.ts` | High |
| RULE-007 | Status → document mapping | Lifecycle | P0 | `helperFunctions.ts` | High |
| RULE-008 | PDF page number by status | Lifecycle | P1 | `helperFunctions.ts` | Medium |
| RULE-009 | Proceed/decline button eligibility | Lifecycle | P1 | `quoteStatus.ts`, `quotation/index.tsx` | High |
| RULE-010 | Dashboard action menu by status | Lifecycle | P0 | `requestItem.tsx`, `instrumentItem.tsx` *(corrected CRD-045)* | High |
| RULE-011 | Optimistic UI status override | Lifecycle | P1 | `dashboard/index.tsx` | High |
| RULE-012 | Decline is irreversible | Policy | P0 | `quotation/index.tsx` *(corrected CRD-045)* | High |
| RULE-013 | RFQ submission is irreversible | Policy | P0 | `requestForQuote/index.tsx` | High |
| RULE-014 | Quote acceptance is irreversible | Policy | P0 | `acceptQuote/index.tsx` | High |
| RULE-015 | Recalibration eligibility by status | Lifecycle | P1 | `requestItem.tsx`, `instrumentItem.tsx` *(corrected CRD-045)* | High |
| RULE-016 | Dashboard item suppression | Lifecycle | P1 | `requestItem.tsx` | High |
| RULE-017 | Payment terms: Prepaid vs 30-day | Policy | P0 | `paymentDetails.tsx`, `submittedSuccess.tsx` | High |
| RULE-018 | Draft-save capability per wizard | Policy | P1 | `requestForQuote/index.tsx`, `acceptQuote/index.tsx` | High |
| RULE-019 | Report link hidden for Withdrawn | Lifecycle | P1 | `reportList.tsx`, `instrumentItem.tsx` | High |
| RULE-020 | Artefact heading display rule | Lifecycle | P2 | `quoteStatus.ts`, `requestItem.tsx` | High |
| RULE-021 | View-quotation URL selection | Lifecycle | P1 | `quoteStatus.ts`, `requestItem.tsx` | High |
| RULE-022 | ABN checksum algorithm | Calculation | P0 | `common.ts` | High |
| RULE-023 | Pagination item-range display | Calculation | P2 | `PaginationHeader/index.tsx` | High |
| RULE-024 | Responsive pagination button count | Calculation | P2 | `useVisiblePageRange.tsx` | High |
| RULE-025 | Pagination window-centering | Calculation | P2 | `Pagination/index.tsx` | High |
| RULE-026 | AUD currency formatting | Calculation | P1 | `utils/index.ts` | High |
| RULE-027 | Date parsing dispatch | Calculation | P1 | `utils/index.ts` | High |
| RULE-028 | Reporting period abbreviation | Calculation | P2 | `utils/index.ts` | High |
| RULE-029 | Phone auto-format selection | Calculation | P2 | `NumberInput/index.tsx` | High |
| RULE-030 | ABN display mask | Calculation | P2 | `accountDetails.tsx` | High |
| RULE-031 | Australian postcode range | Validation | P1 | `stringExtensions.ts` | High |
| RULE-032 | Phone number format (AU) | Validation | P1 | `stringExtensions.ts` | High |
| RULE-033 | Email address format | Validation | P1 | `stringExtensions.ts` | High |
| RULE-034 | Name charset (no accented chars) | Validation | P1 | `stringExtensions.ts` | High |
| RULE-035 | Business name charset (ASIC) | Validation | P0 | `stringExtensions.ts` | Medium |
| RULE-036 | No consecutive identical chars | Validation | P1 | `stringExtensions.ts` | High |
| RULE-037 | No consecutive punctuation | Validation | P1 | `stringExtensions.ts` | High |
| RULE-038 | At-least-one phone number | Validation | P1 | `contactValidation.ts` | High |
| RULE-039 | RFQ multi-branch confirmation | Validation | P1 | `requestForQuote/validation.ts` | High |
| RULE-040 | Acceptance T&C checkbox | Validation | P0 | `acceptQuote/validation.ts` | High |
| RULE-041 | Preferred date not in the past | Validation | P1 | `requestForQuote/validation.ts` | High |
| RULE-042 | Number of items range (1–100) | Validation | P1 | `requestForQuote/validation.ts` *(annotated 2026-09-02, CRD-043)* | High |
| RULE-043 | Carrier details when client ships | Validation | P1 | `acceptQuote/validation.ts` | High |
| RULE-044 | Invoice contact for different person | Validation | P1 | `acceptQuote/validation.ts` | High |
| RULE-045 | Date format DD/MM/YYYY, ceil 9999 | Validation | P1 | `common.ts` | High |
| RULE-046 | isFutureDate strict vs today-ok | Validation | P1 | `common.ts` | Medium |
| RULE-047 | Field character limits catalogue | Validation | P1 | multiple | High |
| RULE-048 | Website URL format | Validation | P2 | `common.ts` | High |
| RULE-049 | Postal address same-as-street | Validation | P1 | `account/validation.ts` | High |
| RULE-050 | NMI ABN hardcoded | Policy | P0 | `summaryAndAccept.tsx` *(corrected CRD-044)* | High |
| RULE-051 | NMI address hardcoded | Policy | P1 | `summaryAndAccept.tsx` *(corrected CRD-044)* | High *(detail section written CRD-045)* |
| RULE-052 | Terms version config | Policy | P0 | `terms-config.json` | High |
| RULE-053 | Dashboard/report page size | Policy | P2 | `dashboard/index.tsx` | High |

---

## Category: Lifecycle & State Machines

### RULE-001: Account Creation Gate
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/routes/preConditions/PreConditions.tsx:64-67`
**Plain English:** A newly authenticated user who has not completed account creation is always redirected to `/create-account`, overriding any other navigation target.
**Specification:**
```
Given  an authenticated user
When   accountCreationCompleted === false
  AND  the current path does NOT include 'create-account'
Then   hard-redirect to /create-account
```
**Parameters:** `accountCreationCompleted` boolean flag, set by `AccountProvider.toAccountDetails()` from server `UserDto`
**Edge cases handled:** Check fires on every render of PreConditions; path-string matching (`path?.includes('create-account')`) means `/success-creating-account` also passes this guard
**Suspected defect:** Path-string matching could fail if route paths are renamed; should use React Router `useMatch` with route constants from `routes/common/constants.ts`
**Confidence:** High

---

### RULE-002: Contact Creation Gate
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/routes/preConditions/PreConditions.tsx:69-73`
**Plain English:** Once account creation is complete, a user without a completed contact record is redirected to `/create-contact`.
**Specification:**
```
Given  an authenticated user where accountCreationCompleted === true
When   accountContactCompleted === false
  AND  path does NOT include 'create-contact' or 'create-account'
Then   hard-redirect to /create-contact
```
**Parameters:** `accountContactCompleted` boolean, computed from server `UserDto`
**Edge cases handled:** Check is subordinate to RULE-001 (account must be done first — `!redirectToCreateAccount` condition)
**Confidence:** High

---

### RULE-003: Post-Onboarding Dashboard Redirect
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/preConditions/PreConditions.tsx:75-79`
**Plain English:** A fully onboarded user who somehow navigates to the setup routes is bounced back to the dashboard.
**Specification:**
```
Given  accountCreationCompleted === true AND accountContactCompleted === true
When   user navigates to any path containing 'create-account' or 'create-contact'
Then   redirect to / (dashboard root)
```
**Confidence:** High

---

### RULE-004: Terms of Use Version Gate
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/authentication/AccountProvider.tsx:25-27`, `ClientApp/src/terms-config.json:1`
**Plain English:** Before accessing any dashboard content, a user must have accepted the current version of the Terms of Use. Accepting an earlier version counts as not accepted.
**Specification:**
```
Given  an authenticated user
When   user.acceptedTerms !== true
  OR   user.termsVersion.toString() !== currentTermsVersion
Then   show TermsAndConditionModal (blocking) — no page content accessible
And    on acceptance, call AccountLoginClient.acceptTerms; setAgree() in AccountContext
```
**Parameters:**
- Current terms version: `"1"` (from `ClientApp/src/terms-config.json`)
- Comparison is string equality: `user.termsVersion.toString() === "1"`
**Edge cases handled:** Version is string-compared; a stored integer `1` and config string `"1"` match via `.toString()`. Incrementing the JSON value forces all users to re-accept.
**Confidence:** High

---

### RULE-005: Branch Selection Gate
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/routes/preConditions/PreConditions.tsx:84-88`, `ClientApp/src/components/modals/BranchSelectorModal/index.tsx:173`
**Plain English:** After accepting T&C, if the user has no default organisation selected, a blocking branch-selector modal is shown. The user cannot dismiss it without selecting an organisation.
**Specification:**
```
Given  userAcceptedTermsOfUse === true AND accountContactCompleted === true
  AND  defaultOrganisationId === null
  AND  path does NOT include 'success-creating-account'
When   any protected page loads
Then   BranchSelectorModal is auto-shown and is not dismissible
And    on selection: setDefaultOrganisationId(orgId), setOrganisationAndBranch(name)
And    if accountCreationCompleted was false: setCompleted() is also called here
```
**Parameters:** None — the gate is purely flag-based
**Edge cases handled:** The `success-creating-account` path exclusion prevents an infinite redirect loop immediately after the create-account wizard completes
**Confidence:** High

---

### RULE-006: Quote Status Lifecycle
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/routes/common/enums.ts:1-28`, `ClientApp/src/routes/common/quoteStatus.ts`
**Plain English:** Every RFQ and quote request moves through a defined set of statuses controlled by the NMI CRM. The portal can only trigger two transitions (Accept, Decline); all others are server-side.
**Specification:**
```
Given  a RequestForQuoteDto with field quoteRequestStatus
Then   valid status values are:
  QuoteStatus.QuoteSubmitted    = 'Submitted'
  QuoteStatus.QuoteInProgress   = 'Quote - In Progress'
  QuoteStatus.QuoteAvailable    = 'Quote - Available'
  QuoteStatus.QuoteAccepted     = 'Quote - Accepted'
  QuoteStatus.QuoteDeclined     = 'Quote - Declined'
  QuoteStatus.QuoteExpired      = 'Quote - Expired'
  QuoteStatus.QuoteClosed       = 'Quote - Closed'
  QuoteStatus.ReportIssued      = 'Report - Issued'
  QuoteStatus.ReportInProgress  = 'Report - In progress'
  QuoteStatus.ReportWithdrawn   = 'Report - Withdrawn'
  QuoteStatus.ArtifactReceived  = 'Artefact - Received'

Customer-triggered transitions:
  QuoteAvailable → QuoteDeclined  (via QuoteClient.declineQuote)
  QuoteAvailable → QuoteAccepted  (via AcceptQuoteClient submission)

Terminal states (no further customer action): QuoteDeclined, QuoteExpired, QuoteClosed, ReportWithdrawn

Pre-submission (draft) state: QuoteDrafted — exists only in DashboardItemStatus enum, not in QuoteStatus
```
**Edge cases handled:** `QuoteDrafted` is a client-only concept — drafts have never been submitted to CRM and have no `QuoteStatus` value
**Confidence:** High

---

### RULE-007: Status → Downloadable Document Mapping
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/routes/common/helperFunctions.ts:22-74`
**Plain English:** The PDF document served to a customer for a given record depends entirely on its current status. Different statuses serve fundamentally different documents (offer vs acceptance vs report).
**Specification:**
```
Given  a QuoteStatus and a calling context (quotation-tab or not)

When   status is QuoteAccepted OR ArtifactReceived
Then   fetch getQuoteRequestAcceptedPDFByID

When   status is QuoteDeclined
Then   fetch getQuoteRequestRejectedPDFByID

When   status is QuoteAvailable OR QuoteClosed
Then   fetch getQuoteOfferPDFByQuoteID

When   status is ReportIssued AND context is quotation-tab
Then   fetch getQuoteRequestAcceptedPDFByID

When   status is ReportIssued AND context is NOT quotation-tab
Then   fetch getQuoteReportPDFByID

When   status is ReportInProgress
Then   fetch getQuoteRequestAcceptedPDFByID

When   status is any other value (including QuoteSubmitted, QuoteInProgress, ReportWithdrawn)
Then   return a permanently-pending Promise (no document)
```
**Parameters:** All API method names are compile-time string literals in `web-api-client.ts`
**Suspected defect:** The `default` branch returns a Promise that can never resolve or reject — any caller that `await`s it will hang indefinitely. See Debt #8 in ASSESSMENT.md.
**Confidence:** High

---

### RULE-008: PDF Initial Page Number by Status
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/common/helperFunctions.ts:123-134`
**Plain English:** The PDF viewer opens to a specific page depending on the quote's status, reflecting which section of the document is most relevant to the customer's current situation.
**Specification:**
```
Given  a QuoteStatus value
When   the PDF viewer is opened
Then:
  status === QuoteDeclined              → open page 3
  status in [QuoteAccepted, ArtifactReceived, ReportIssued, ReportInProgress] → open page 5
  any other status                      → open page 2
```
**Parameters:** Page numbers 2, 3, 5 — hardcoded against a specific version of NMI's PDF template
**Suspected defect:** Any change to the PDF template page layout silently breaks this rule
**Confidence:** Medium — rule is correct as coded; correctness of page numbers depends on template version unknown to this analysis

---

### RULE-009: Proceed/Decline Button Eligibility
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/common/quoteStatus.ts:14-22`, `ClientApp/src/routes/quotation/index.tsx:124-127`
**Plain English:** The "Proceed with quote" and "Decline quote" buttons are hidden once any final outcome has been recorded; only a "Back to dashboard" button remains.
**Specification:**
```
Given  a user on the Quotation detail page
When   status is NOT in [QuoteDeclined, QuoteAccepted, QuoteExpired, QuoteClosed,
                          ReportIssued, ReportWithdrawn, ReportInProgress, ArtifactReceived]
Then   show: "Cancel" + "Decline quote" + "Proceed with quote"

When   status IS in that list
Then   show: "Back to dashboard" only
```
**Parameters:** `proceedDeclineValidStatuses` set (8 values) — `quoteStatus.ts:14-22`
**Edge cases handled:** `QuoteAvailable` is the only status not in the list — it is the sole actionable state from the customer's perspective
**Confidence:** High

---

### RULE-010: Dashboard Action Menu by Status
**Category:** Lifecycle
**Priority:** P0
**Source:** `ClientApp/src/components/RequestList/requestItem.tsx:394-478`, `ClientApp/src/components/RequestList/instrumentItem.tsx:254-310` *(corrected 2026-09-02, CRD-045 - previous citation was past end of file)*
**Plain English:** Each dashboard card exposes a specific subset of actions depending on the record's status. This is the master gating table for all customer-initiated workflow actions.
**Specification:**
```
Draft (QuoteDrafted):
  → Edit request (/request-for-quote/:id)
  → Delete request

QuoteAvailable:
  → View/accept quotation (/quotation/:referenceId)
  → View request

ReportIssued (requestItem):
  → View report (/report/:quoteId)
  → View request
  → Request recalibration (/request-for-quote-copy/:referenceId)

ReportWithdrawn (requestItem):
  → Request recalibration
  → View quotation
  → View request

QuoteAccepted, ArtifactReceived, ReportInProgress:
  → View quotation (via validQuoteIdStatus URL)
  → View request

QuoteDeclined, QuoteExpired, QuoteClosed, QuoteSubmitted, QuoteInProgress:
  → View request only

InstrumentItem differences:
  ReportInProgress: adds "Request recalibration"
  ReportIssued: "View latest report" + "Request recalibration" (no "View request" fallback)
```
**Confidence:** High

---

### RULE-011: Optimistic UI Status Override Post-Acceptance
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/dashboard/index.tsx:176-203`, `ClientApp/src/routes/quotation/index.tsx:192-199`
**Plain English:** Immediately after a customer accepts a quote and returns to the dashboard, the portal optimistically shows the record as accepted before CRM has propagated the status change.
**Specification:**
```
Given  'accepted-quote-id' token is present in sessionStorage (written by summaryAndAcceptProps.ts)
When   Dashboard loads and finds item with referenceId === stored token
  AND  item.quoteRequestStatus === QuoteAvailable
Then   override item.quoteRequestStatus → QuoteAccepted
  And  copy requestForQuote.artefactName to quote.artefactName
  And  override lastUpdated to now
  And  move item to top of list
  And  store referenceId as 'view-quote-id' in sessionStorage
  And  remove 'accepted-quote-id' from sessionStorage

Given  'view-quote-id' token is present
When   /quotation/:id loads and quoteData.quoteRequestIdNum === stored token
  AND  quoteData.quoteRequestStatus === QuoteAvailable
Then   override quoteData.quoteRequestStatus → QuoteAccepted
  And  set quoteData.outcomeDate to now
  And  remove 'view-quote-id' from sessionStorage
```
**Parameters:** sessionStorage keys: `'accepted-quote-id'`, `'view-quote-id'`
**Confidence:** High — SME question: Does CRM guarantee status will have updated by the next natural page load, or can the optimistic override and real CRM value diverge over a longer period?

---

### RULE-012: Decline is Irreversible
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/routes/quotation/index.tsx:122-142` *(corrected 2026-09-02, CRD-045 - previous citation was past end of file)* - the `declineQuote` handler
**Plain English:** Declining a quotation permanently ends that quote opportunity; the action cannot be undone from the portal.
**Specification:**
```
Given  a user who clicks "Decline quote" and confirms the modal
When   QuoteClient.declineQuote is called and succeeds
Then   status transitions to QuoteDeclined (server-side)
  And  no further customer actions are available on this record
  And  the UI displays: "Note: Declining this quote cannot be undone"
```
**Confidence:** High

---

### RULE-013: RFQ Submission is Irreversible
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/routes/requestForQuote/index.tsx:83-86`
**Plain English:** Once a Request for Quote has been submitted, the customer cannot make further changes through the portal.
**Specification:**
```
Given  a user on the RFQ Summary step who confirms submission
When   RequestForQuoteClient.submitApplication succeeds
Then   status transitions to QuoteSubmitted
  And  the record moves from the Drafts tab to the Requests tab on the dashboard
  And  the Edit action is no longer available
  And  the UI warned: "Once you have submitted this request, you will not be able to make any further changes in the Portal."
```
**Confidence:** High

---

### RULE-014: Quote Acceptance is Irreversible
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/routes/acceptQuote/index.tsx:42-45`
**Plain English:** Once a customer accepts a quote, no further changes can be made through the portal.
**Specification:**
```
Given  a user on the Accept Quote Summary step who confirms acceptance
When   AcceptQuoteClient submission succeeds
Then   status transitions to QuoteAccepted (optimistically shown immediately)
  And  no further customer actions are available on this quote
  And  the UI warned: "Once you have accepted this quote, you will not be able to make any further changes in the Portal."
```
**Confidence:** High

---

### RULE-015: Recalibration Request Eligibility
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/components/RequestList/requestItem.tsx:454-469`, `ClientApp/src/components/RequestList/instrumentItem.tsx:296-301` *(corrected 2026-09-02, CRD-045 - previous citation was past end of file)*
**Plain English:** A customer can copy a completed or withdrawn RFQ as a recalibration request only when the original has reached specific end states.
**Specification:**
```
Given  a dashboard item

For requestItem:
When   status is ReportIssued OR ReportWithdrawn
Then   "Request recalibration" action is available → /request-for-quote-copy/:referenceId

For instrumentItem:
When   status is ReportIssued OR ReportInProgress OR ReportWithdrawn
Then   "Request recalibration" is available
```
**Parameters:** Route: `/request-for-quote-copy/:referenceId`
**Confidence:** High — SME question: Is `ReportInProgress` recalibration eligibility intentional? It allows requesting recalibration before the current calibration is complete.

---

### RULE-016: Dashboard Item Suppression
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/components/RequestList/requestItem.tsx:492`
**Plain English:** An RFQ record with `hideFromDashboard = true` is completely hidden from the customer's view, even if it exists in CRM.
**Specification:**
```
Given  a DashboardItemDto where requestForQuote.hideFromDashboard === true
When   the RequestItem component renders
Then   the entire card element is not rendered (return null)
```
**Edge cases handled:** InstrumentItem does not apply this check — only RequestItem
**Confidence:** High — SME question: What business event sets `hideFromDashboard = true`? The portal treats it as a terminal suppression state.

---

### RULE-017: Payment Terms — Prepaid vs 30-Day Invoice
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/routes/acceptQuote/paymentDetails.tsx:86-97`, `ClientApp/src/routes/acceptQuote/submittedSuccess.tsx:50-91`
**Plain English:** After accepting a quote, customers on "Prepaid" terms must pay before calibration commences. All other customers receive standard 30-day invoice terms.
**Specification:**
```
Given  a customer has completed the Accept Quote wizard

When   acceptQuotePreInfo.paymentTerms === 'Prepaid'   (exact case-sensitive string)
Then   display: "An invoice will be forwarded following receipt of this accepted quotation.
                 Payment of the invoice is required and calibration may only commence
                 once payment has been received."

When   paymentTerms is any other value (including undefined/null)
Then   display: "Invoices must be paid within 30 days of NMI invoice date.
                 Clients not meeting this condition may have this option withdrawn on
                 future occasions."
```
**Parameters:**
- Trigger string: `'Prepaid'` (hardcoded case-sensitive match)
- Standard payment period: `30 days`
- Consequence of non-payment: option may be withdrawn
**Confidence:** High — SME question: Are there other valid `paymentTerms` values besides `'Prepaid'` that the portal might receive? All non-Prepaid values fall to the 30-day rule.

---

### RULE-018: Draft-Save Capability by Wizard
**Category:** Policy
**Priority:** P1
**Source:** `ClientApp/src/routes/requestForQuote/index.tsx:117`, `ClientApp/src/routes/acceptQuote/index.tsx:39`, `ClientApp/src/routes/account/create/index.tsx:18`, `ClientApp/src/routes/contact/create/index.tsx:18`
**Plain English:** Multi-step workflows (RFQ, Accept Quote) support saving progress as a draft. Single-step onboarding workflows (Create Account, Create Contact) do not.
**Specification:**
```
Request for Quote:  canSaveDraft = true  → WizardRoutedStep shows "Save and exit" button
Accept Quote:       canSaveDraft = true  → WizardRoutedStep shows "Save and exit" button
Create Account:     canSaveDraft = false → no "Save and exit" button
Create Contact:     canSaveDraft = false → no "Save and exit" button
```
**Edge cases handled:** `UnsavedFormPrompt` component still guards against accidental navigation for all wizards regardless of `canSaveDraft`
**Confidence:** High

---

### RULE-019: Report Link Hidden for Withdrawn Status
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/measurementReport/reportList.tsx:95`, `ClientApp/src/components/RequestList/instrumentItem.tsx:362`
**Plain English:** A withdrawn measurement report cannot be viewed or downloaded.
**Specification:**
```
Given  an instrument artefact record
When   artefact.tmasStatus === ReportStatus.Withdrawn ('Withdrawn')
Then   "View report" link is hidden
  And  "View latest report" button is hidden
  And  "Request recalibration" remains available
```
**Confidence:** High

---

### RULE-020: Artefact Heading Display Rule
**Category:** Lifecycle
**Priority:** P2
**Source:** `ClientApp/src/routes/common/quoteStatus.ts:35-40`, `ClientApp/src/components/RequestList/requestItem.tsx:371-375`
**Plain English:** Once NMI receives the physical instrument, the dashboard card heading switches from the customer's make/model entry to NMI's formal artefact name.
**Specification:**
```
Given  a dashboard card item

When   status is in [ArtifactReceived, ReportInProgress, QuoteAccepted, ReportWithdrawn, ReportIssued]
Then   heading = quote.artefactName  (NMI-supplied)

Otherwise
Then   heading = requestForQuote.manufacturer + " " + requestForQuote.model
  Or   "Draft Request For Quote" if both are empty
```
**Parameters:** `viewArtefactHeadingStatus` set in `quoteStatus.ts:35-40`
**Confidence:** High

---

### RULE-021: View-Quotation URL Selection
**Category:** Lifecycle
**Priority:** P1
**Source:** `ClientApp/src/routes/common/quoteStatus.ts:24-28`, `ClientApp/src/components/RequestList/requestItem.tsx:152-153`
**Plain English:** After acceptance, quotation links use the CRM Quote ID rather than the original RFQ reference ID.
**Specification:**
```
Given  a dashboard item with a "View quotation" action

When   status is in [ArtifactReceived, ReportInProgress, QuoteAccepted, ReportIssued]
Then   navigate to /quotation/{dashboardQuoteDto.quotationId}   (CRM quote ID)

Otherwise
Then   navigate to /quotation/{referenceId}                     (RFQ reference ID)
```
**Parameters:** `validQuoteIdStatus` set in `quoteStatus.ts:24-28`
**Confidence:** High

---

## Category: Calculations

### RULE-022: ABN Checksum Algorithm
**Category:** Calculation
**Priority:** P0
**Source:** `ClientApp/src/validationSchemas/common.ts:133-149`
**Plain English:** Australian Business Numbers are validated using the official Australian Taxation Office weighted checksum algorithm.
**Specification:**
```
Given  an 11-digit string (no whitespace)
When   ABN checksum validation runs
Then:
  1. Must be exactly 11 characters, contain no whitespace
  2. Subtract 1 from the first digit: d[0] = d[0] - 1
  3. Multiply each digit by its weight: [10,1,3,5,7,9,11,13,15,17,19]
  4. Sum all products
  5. Valid if sum % 89 === 0

Example: "51824753556"
  d[0]=4, weights=[10,1,3,5,7,9,11,13,15,17,19]
  sum = 40+1+24+10+28+63+55+39+75+85+114 = 534; 534 % 89 = 0 → VALID
```
**Parameters:**
- Weight array: `[10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]`
- Modulus: `89`
- Required length: `11`
- First-digit adjustment: subtract `1`
**Edge cases handled:** Whitespace → immediate fail; NaN → sum is NaN → modulo fails; wrong length → immediate fail
**Confidence:** High

---

### RULE-026: AUD Currency Formatting
**Category:** Calculation
**Priority:** P1
**Source:** `ClientApp/src/utils/index.ts:248-256`
**Plain English:** All monetary amounts are displayed in Australian dollars with locale-correct symbol, thousands separators, and two decimal places.
**Specification:**
```
Given  a numeric amount
When   formatCurrencyAmount(amount) runs
Then   result = amount.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
  And  undefined/null input returns null

Example: 12500.5 → "$12,500.50"
```
**Confidence:** High

---

### RULE-027: Date Parsing Dispatch
**Category:** Calculation
**Priority:** P1
**Source:** `ClientApp/src/utils/index.ts:77-103`
**Plain English:** The portal accepts dates in two formats — Australian short form (dd/MM/yyyy) and ISO 8601 — and selects the parser based on string length.
**Specification:**
```
Given  a date string value
When   parseDate(value) runs
Then:
  if value.length === 10 → parse with format "dd/MM/yyyy"   (AU short date)
  else                   → parse with format "yyyy-MM-dd'T'HH:mm:ssxxx" (ISO 8601)
  In both cases: time components zeroed (setHours/Minutes/Seconds/Milliseconds = 0)

parseDateUTC always uses ISO format regardless of length
```
**Parameters:** The 10-character branch encodes Australian date convention (dd/MM/yyyy, not MM/dd/yyyy)
**Confidence:** High

---

### RULE-028: Reporting Period Abbreviation
**Category:** Calculation
**Priority:** P2
**Source:** `ClientApp/src/utils/index.ts:197-204`
**Plain English:** Financial year strings are shortened to a compact form for display.
**Specification:**
```
Given  a period string
When   abbreviateReportingPeriod(period) runs
Then:
  "FY 2021-2022" → "2021-22"   (first year + last 2 digits of second year)
  "CY 2021"      → "2021"      (calendar year — strip prefix only)
```
**Edge cases handled:** None — no guard for unexpected prefix values or malformed strings
**Confidence:** High

---

## Category: Validations

### RULE-031: Australian Postcode Range
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:349-357`
**Plain English:** Postcodes must be exactly 4 digits and fall within valid Australian ranges.
**Specification:**
```
Given  a postcode string value
When   postcode() validation runs
Then:
  Must be exactly 4 characters long
  Parsed as integer, must satisfy:
    (num >= 200 AND num <= 299)   ← ACT block
  OR (num >= 800 AND num <= 9999) ← all other Australian postcodes

"2000" → VALID (800–9999)  "0200" → VALID (200–299)
"0100" → INVALID           "200"  → INVALID (length ≠ 4)
```
**Parameters:** Ranges hardcoded: `200–299`, `800–9999`
**Confidence:** High — SME note: Postcodes 1000–1999 (NSW/ACT PO Box ranges) fall within 800–9999 and are accepted. Is this intentional for postal addresses?

---

### RULE-032: Australian Phone Number Format
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:426-427`
**Plain English:** Phone numbers must match a recognised Australian format — landline, mobile, 1800/1300 freecall, or 13-series short number.
**Specification:**
```
Landline regex: /^(?:\+61 ?|0)[2-47-8] ?\d{4} ?\d{4}|1[38]00 ?\d{3} ?\d{3}|13 ?\d{2} ?\d{2}$/
Mobile regex:   /^(?:\+61 ?|0)4\d{2} ?\d{3} ?\d{3}$/

phone(mobileOnly=false): passes if EITHER regex matches
phone(mobileOnly=true):  passes only if mobile regex matches

Field limits (contactValidation.ts):
  Phone:  minEntered(6), maxLength(12)
  Mobile: minEntered(10), maxLength(12)
```
**Parameters:** Regex literals hardcoded; area codes `[2-47-8]` (excludes 5 and 6, per AU geography)
**Confidence:** High — SME question: Does maxLength(12) intentionally exclude some `+61`-prefixed variants with spaces?

---

### RULE-033: Email Address Format
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:467`
**Plain English:** Email addresses must match a custom RFC 5321-aligned regex and cannot exceed 100 characters.
**Specification:**
```
Regex: /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9-]){0,62}\.[a-zA-Z](-?[a-zA-Z0-9])+$/
Max length: 100 chars (common.ts:131)

"user@example.com" → VALID
"user@.example.com" → INVALID (leading dot in domain)
"user@example" → INVALID (no TLD)
```
**Confidence:** High

---

### RULE-034: Name Field Charset (No Accented Characters)
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:644-676`
**Plain English:** Person name fields (first name, last name, title) only accept ASCII letters, hyphen, space, and apostrophe — accented characters are rejected.
**Specification:**
```
nameAllowedFormat(extended=false) regex: /^[-–—A-Za-z ']*$/
  Allows: ASCII hyphen, en-dash (U+2013), em-dash (U+2014), A–Z, a–z, space, apostrophe

"O'Brien-Smith" → VALID
"José" → INVALID  (é = U+00E9, not in charset)
"Müller" → INVALID
```
**Parameters:** `extended = false` used for all person-name fields
**Suspected defect:** The `extended = true` mode regex has only an end-anchor `$` but no start-anchor `^` — only validates the last character
**Confidence:** High for normal case — **SME question: Should person names accept diacritical characters (é, ü, ñ)?**

---

### RULE-035: Business Name Charset (ASIC-Aligned)
**Category:** Validation
**Priority:** P0
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:713-741` *(corrected 2026-09-02, CRD-043 — the previously cited 678-707 range is a different validator)*
**Plain English:** Business and trading names must conform to the character set defined in the ASIC CompanyName Business Rules message implementation guide (v1.7).
**Specification:**
```
businessName() regex: /^[A-Za-z0-9!@#$%^&*()?;:=_\-/\.,'{}| "]+$/

"Smith & Sons Pty Ltd" → VALID    (& IS in the charset — corrected 2026-09-02, CRD-043)
"Smith+Sons" → INVALID (+ not in charset)
"ACME Corp. Pty Ltd" → VALID
```
**Parameters:** Character set referenced to ASIC BRS message implementation guide v1.7 (comment in source)
**Confidence:** High *(raised from Medium 2026-09-02, CRD-043)*

> **CORRECTION — 2026-09-02 (CRD-043). The previous entry was factually wrong and its SME question
> rested on a false premise.** It stated that the ASIC-referenced charset *excludes* `&` and that
> `"Smith & Sons Pty Ltd"` is INVALID. **Both claims are wrong.** The charset printed one line above
> contains `&` in the `!@#$%^&*` run, and the live validator accepts the name. Verified by executing
> the regex from `stringExtensions.ts:735` against the register's own worked examples:
>
> | Input | Register claimed | Actual |
> | --- | --- | --- |
> | `Smith & Sons Pty Ltd` | INVALID | **VALID** |
> | `Smith & Jones` | (implied INVALID) | **VALID** |
> | `O'Brien & Co` | — | **VALID** |
> | `Smith+Sons` | INVALID | INVALID *(claim was correct)* |
> | `ACME Corp. Pty Ltd` | VALID | VALID *(claim was correct)* |
>
> **Likely cause:** the `&amp;` in the original line is an HTML-escaping artefact, so the charset was
> probably mis-read through an HTML rendering step rather than from source.
>
> **Consequence had this not been caught:** the BA was being asked to rule on whether `&` should be
> permitted, when it already is. An answer of "yes, allow `&`" would have prompted a change to a
> regex that is already correct — introducing risk into a P0 validator to fix a defect that does not
> exist. **No source change is required for `&`.**
>
> **What remains genuinely open for the BA:** whether the ASIC BRS v1.7 charset as a whole is still
> the correct reference, and whether any *other* character it excludes (notably `+`) should be
> permitted. That question stands; the `&` question does not.

---

### RULE-036: No Consecutive Identical Characters
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:568-607`
**Plain English:** Fields cannot contain a run of the same letter repeated more than the threshold number of times (default: 3 in a row is rejected).
**Specification:**
```
Given  threshold = 3 (default)
Then   regex = /([a-z])\1{2,}/i  (matches 3+ consecutive identical letters)

"aaab" → INVALID (3 consecutive a's)
"aab"  → VALID   (only 2 consecutive)
"aaaa" → INVALID
```
**Parameters:** Default threshold: `3` (hardcoded in `stringExtensions.ts:573`)
**Edge cases handled:** Minimum enforced threshold is `2`; case-insensitive; only applies to letters, not digits or punctuation
**Confidence:** High

---

### RULE-037: No Consecutive Punctuation
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:502`
**Plain English:** Adjacent apostrophes, hyphens, or spaces (including Unicode variants) are rejected in name and text fields.
**Specification:**
```
Characters covered: space, ASCII apostrophe ', U+2019 ', ASCII hyphen -, U+2013 –, U+2014 —
Regex: /([ '’\-–—])\1+/

"O''Brien"   → INVALID (double apostrophe)
"Smith--Jones" → INVALID (double hyphen)
"Test  Value"  → INVALID (double space)
"O'Brien"    → VALID
```
**Confidence:** High

---

### RULE-038: At Least One Phone Number (Contact Form)
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/contactValidation.ts:42-53`
**Plain English:** A contact record must have at least one phone number (landline or mobile); both cannot be blank simultaneously.
**Specification:**
```
Given  a contact form with required=true
When   both phone AND mobile are empty/blank
Then   error shown on both fields: "[field] is required"
When   either phone OR mobile has a valid value
Then   the empty one is accepted (optional)
```
**Confidence:** High

---

### RULE-039: RFQ Multi-Branch Confirmation Gate
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/requestForQuote/validation.ts:23-28`
**Plain English:** When a customer has more than one registered branch, they must explicitly confirm they have selected the correct branch before an RFQ can proceed.
**Specification:**
```
Given  organisationCount > 1 (multiple branches registered)
When   the Organisation & Contact step is submitted
Then   isCorrectBranchOrLocation is required
  And  value of 'No' → error: "Please select a branch/location name before proceeding."
  And  value of 'Yes' → passes

Given  organisationCount === 1
Then   isCorrectBranchOrLocation is not required
```
**Confidence:** High

---

### RULE-040: Quote Acceptance T&C Checkbox Mandatory
**Category:** Validation
**Priority:** P0
**Source:** `ClientApp/src/routes/acceptQuote/validation.ts:136-137`
**Plain English:** A customer must explicitly tick the acceptance-of-terms checkbox before their quote acceptance can be submitted. This is a legal acknowledgement.
**Specification:**
```
Given  the Summary and Accept step of the Accept Quote wizard
When   acceptanceOfQuote === false (checkbox not ticked)
Then   submit is blocked with: "You must accept our terms before accepting this quotation"
When   acceptanceOfQuote === true
Then   submit proceeds
```
**Confidence:** High

---

### RULE-041: Preferred Availability Date Must Not Be in the Past
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/requestForQuote/validation.ts:123-136`
**Plain English:** If a customer specifies a preferred instrument availability date on an RFQ, it must be today or a future date.
**Specification:**
```
Given  preferredInstrumentOrArtefactAvailabilityDate is provided (field is optional)
When   validation runs
Then:
  now = formatDateStringToUTC(new Date())  ← today UTC midnight
  val = formatDateStringToUTC(new Date(value))
  VALID if val >= now   (today is acceptable)
  INVALID if val < now  → error: "Cannot select a date earlier than today"

Given  field is blank/null
Then   passes (no date is valid)
```
**Confidence:** High

---

### RULE-042: Number of Items Range (1–100)
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/requestForQuote/validation.ts:91-96` (`instrumentAndRequestSubmitValidation`) **and `:189-195`** (`instrumentAndRequestSaveValidation`) *(corrected and completed 2026-09-02, CRD-044 - previously cited 88-93 and documented only one of the two sites)*
**Plain English:** The number of instruments/artefacts on a single RFQ must be between 1 and 100.
**Specification:**
```
numberOfItems: yup.number()
  .min(1, 'Number of items cannot be less than 1')
  .max(100, 'Number of items cannot be greater than 100')
  .required()
```
**Parameters:** Min: `1`, Max: `100` (hardcoded)

> **Completed 2026-09-02 (CRD-044) — the rule is implemented twice, not once.**
> `instrumentAndRequestSubmitValidation` (`:91-96`) makes `numberOfItems` **required**;
> `instrumentAndRequestSaveValidation` (`:189-195`) makes it **nullable**, so a draft can be saved
> incomplete, while still enforcing the same 1-100 bounds when a value is present (consistent with
> RULE-018 draft-save). The register previously documented only the submit site. Both are now
> annotated in source. **Any change to the bounds must be applied to both schemas**, or submit and
> draft validation will silently diverge.
**Confidence:** High — SME question: Is 100 a hard operational limit or a guess?

---

### RULE-043: Carrier Details Required When Client Provides Shipping
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/acceptQuote/validation.ts:47-73`
**Plain English:** When the customer selects "client will provide courier" as the return method, carrier name and account number become mandatory.
**Specification:**
```
Given  returnMethod === 'ClientWillProvide'
Then:
  carrierName: required, min 2, max 100 chars
  carrierAccountNumberOrPrePaidReference: required, min 2, max 100 chars
  carrierContactPerson: optional, min 2, max 100 chars
  carrierContactPhone: optional, AU phone format
  packagingNotes: optional, max 300 chars
  insuranceNotes: optional, max 300 chars
  specialInstructions: optional, max 300 chars

Given  returnMethod !== 'ClientWillProvide'
Then   all carrier fields are not required
```
**Confidence:** High

---

### RULE-044: Invoice Contact Required for Different Person
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/acceptQuote/validation.ts:114-118`
**Plain English:** When the customer directs the invoice to someone other than themselves, that person's contact details (at minimum email) become required.
**Specification:**
```
Given  invoiceSentTo === InvoiceSentToValues.DifferentPerson
Then   contactSchemaEmailOnly() applies: email required, phone/mobile optional

Given  invoiceSentTo !== 'DifferentPerson'
Then   contact fields not required
```
**Confidence:** High

---

### RULE-045: Date Format and Ceiling
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/common.ts:65-75`, `common.ts:40`
**Plain English:** All date inputs must be in DD/MM/YYYY format and cannot exceed year 9999.
**Specification:**
```
Date format: DD/MM/YYYY only
Year ceiling: parsedDate <= new Date(9999, 12, 31)

"32/01/2024" → INVALID (day 32)
"01/13/2024" → INVALID (month 13)
"01/01/10000" → INVALID (exceeds year 9999)
```
**Suspected defect:** `new Date(9999, 12, 31)` uses zero-based months, constructing January 31, 10000 — the effective ceiling is Jan 31, 10000, not Dec 31, 9999
**Confidence:** High

---

### RULE-046: isFutureDate vs Today-Inclusive Inconsistency
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/validationSchemas/common.ts:91-108`
**Plain English:** Two different "must be a future date" validators exist with different semantics — one allows today, the other requires strictly tomorrow or later.
**Specification:**
```
common.ts isFutureDate():
  Uses isAfter(dateValue, startOfDay(new Date()))
  Today → FAILS (not strictly after today's start)

requestForQuote/validation.ts preferred date:
  Uses formatDateStringToUTC(new Date()) and >= comparison
  Today → PASSES

These validators are NOT interchangeable.
```
**Confidence:** Medium — **SME question: Is the difference between these two date validators intentional? Which forms use `isFutureDate()`?**

---

### RULE-047: Field Character Limits Catalogue
**Category:** Validation
**Priority:** P1
**Source:** Multiple validation files
**Plain English:** Every text field in the portal has a defined maximum (and in most cases minimum) character length.
**Specification:**

| Field | Min | Max | Charset |
|---|---|---|---|
| Contact first name | 2 | 50 | nameAllowedFormat |
| Contact last name | 2 | 99 | nameAllowedFormat |
| Contact title | 2 | 100 | nameAllowedFormat |
| Contact role | 2 | 99 | allowedFormat(true) |
| Email | — | 100 | custom email regex |
| Phone | 6 | 12 | AU phone |
| Mobile | 10 | 12 | AU mobile |
| Business/trading name | 2 | 160 | allowedFormat(true) |
| Branch/location name | 2 | 160 | allowedFormat(true) |
| Business website | — | 100 | URL regex |
| Address line 1/2/3 | — | 250 | addressFormat() |
| Suburb | — | 80 | allowedFormat(true) |
| Instrument serial number | 1 | 100 | serialNumMatchRegEx |
| Manufacturer | 2 | 100 | default |
| Model | 2 | 100 | default |
| Instrument description | 2 | 400 | extAlphaNumMultiLine |
| Testing/calibration requirements | 2 | 2000 | extAlphaNumMultiLine |
| Previous quote/report number | 2 | 100 | default |
| PO number | — | 20 | default |
| Return organisation name | — | 400 | default |
| Report recipient org name | — | 400 | default |
| Carrier name | 2 | 100 | default |
| Carrier account/reference | 2 | 100 | default |
| Dispute detail | — | 300 | default |
| Packaging/insurance/special instructions | — | 300 | default |

**Confidence:** High

---

### RULE-048: Website URL Format
**Category:** Validation
**Priority:** P2
**Source:** `ClientApp/src/validationSchemas/common.ts:111`
**Plain English:** Business website URLs may omit the protocol but must have a valid domain with a 2–6 character TLD.
**Specification:**
```
Regex: /^(?!\.)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)(?<!\.)$/

"measurement.gov.au" → VALID (protocol optional)
"https://example.com" → VALID
".invalid.com" → INVALID (starts with period)
"http://x.toolongext" → INVALID (TLD > 6 chars)
```
**Confidence:** High

---

### RULE-049: Postal Address Same-as-Street Toggle
**Category:** Validation
**Priority:** P1
**Source:** `ClientApp/src/routes/account/validation.ts:25-29`
**Plain English:** When "postal address same as street address" is checked, the postal address fields are suppressed and require no input.
**Specification:**
```
Given  postalAddressSameAsStreetAddress === true
Then   postalAddress fields: not validated, not required

Given  postalAddressSameAsStreetAddress === false
Then   postalAddress: addressSchema applies (all required fields enforced)
```
**Confidence:** High

---

## Category: Policy / Configuration

### RULE-050: NMI ABN Hardcoded in Contract Display
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx:374` *(corrected 2026-09-02, CRD-044 - previously cited 382, which is a different element)*
**Plain English:** NMI's Australian Business Number is hardcoded in the Accept Quote summary page as part of the legal contract display.
**Specification:**
```
NMI ABN displayed: "74 599 608 295"
NMI address displayed:
  "36 Bradfield Road"
  "West Lindfield NSW 2070"

Any change to NMI's registered ABN or address requires a code deployment.
```
**Parameters:** Both values are string literals in `summaryAndAccept.tsx:374-380` *(corrected 2026-09-02, CRD-044)*
**Confidence:** High

---

### RULE-051: NMI Registered Address Hardcoded in Contract Display

**Category:** Policy
**Priority:** P1
**Source:** `ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx:376-380`
**Plain English:** The National Measurement Institute's registered postal address is hardcoded as
literal JSX in the quote acceptance summary, immediately below the ABN (RULE-050), and is presented
to the customer as part of the contract they are accepting.

*Written 2026-09-02 (CRD-045). This rule was listed in the summary table but had no detail section,
so Legal was being asked to confirm a rule the register never stated. See `RULES-REGISTER-001`.*

**Specification:**
```
Rendered verbatim in the accept-quote summary, one <span> per line:

  National Measurement Institute        (line 372)
  ABN 74 599 608 295                    (line 374 - RULE-050)
  36 Bradfield Road                     (line 376)
  West Lindfield NSW 2070               (line 378)
  Australia                             (line 380)

No conditional logic, no environment lookup, no API call. The value is identical for every user,
every organisation and every environment, including production.
```

**Parameters:**

- Street: `36 Bradfield Road` (string literal)
- Locality/state/postcode: `West Lindfield NSW 2070` (string literal)
- Country: `Australia` (string literal)

**Confidence:** High — the values and their location are verified. What is *unverified* is whether
they are current, which is Legal's call.

> **Open for Legal — P2 backlog item 17.** Confirm that `36 Bradfield Road, West Lindfield NSW 2070`
> is NMI's current registered address for contract display. This text appears in a document the
> customer legally accepts, so a stale address is a contract defect, not a cosmetic one.
>
> **Inconsistency found 2026-09-02 (CRD-045) — resolve alongside the above.** A second copy of the
> address exists at `ClientApp/src/storybook/storybookFixtures.ts:184` as
> `nmiFacilityAddress: '36 Bradfield Road, Lindfield NSW 2070'` — **`Lindfield`, not `West
> Lindfield`.** Same street number and road, different suburb. One of the two is wrong, or the
> fixture deliberately describes a *facility* address distinct from the *registered* address (its
> field name suggests the latter, but the identical street argues against it). Legal should confirm
> which suburb is correct; whichever it is, the two should not silently disagree.
>
> **Recommendation 2026-06-04 (unchanged):** externalise to `VITE_NMI_ADDRESS` in the target
> platform rather than re-hardcoding it, so a future address change is a configuration edit and not
> a code change. Pair with `VITE_NMI_ABN` from RULE-050 — they are displayed together and should
> move together.

---

### RULE-052: Terms of Use Version Configuration
**Category:** Policy
**Priority:** P0
**Source:** `ClientApp/src/terms-config.json:1`
**Plain English:** The current Terms of Use version number is stored in a JSON config file. Incrementing it forces all existing users to re-accept the updated terms on next login.
**Specification:**
```
{ "TermsVersion": "1" }

To trigger re-acceptance for all users:
  Increment "TermsVersion" in terms-config.json → rebuild and deploy
  All users whose stored termsVersion !== new value will see the modal
```
**Parameters:** Current value: `"1"`
**Confidence:** High

---

### RULE-053: Dashboard and Report Page Size
**Category:** Policy
**Priority:** P2
**Source:** `ClientApp/src/routes/dashboard/index.tsx:51`, `ClientApp/src/routes/measurementReport/indexList.tsx:36`
**Plain English:** All paginated lists in the portal show 10 items per page.
**Specification:**
```
Dashboard (all 3 tabs): DEFAULT_DASHBOARD_PAGESIZE = 10 (dashboard/index.tsx:51)
Measurement report list: pageSize = 10 (measurementReport/indexList.tsx:36)
These are separate constants — changing one does NOT change the other.
```
**Parameters:** Both hardcoded to `10`
**Confidence:** High

---

## Rules Requiring SME Confirmation

The following rules have Medium confidence or unresolved questions that require a human subject-matter expert before migration:

| ID | Rule | Question |
|---|---|---|
| RULE-004 | Terms version gate | Is version `"1"` the correct current version? Has a re-acceptance ever been triggered? |
| RULE-008 | PDF page numbers | Are page numbers 2/3/5 hardcoded against a specific PDF template version? Will they survive a template redesign? |
| RULE-011 | Optimistic UI override | Does CRM guarantee status update within one page-load cycle, or can the optimistic and real values diverge? |
| RULE-015 | Recalibration for ReportInProgress | Is allowing recalibration request while current calibration is still in progress intentional? |
| RULE-016 | `hideFromDashboard` flag | What business event sets this flag? Is it NMI administrative action, cancellation, or automated? |
| RULE-017 | Payment terms | Are there valid `paymentTerms` values other than `'Prepaid'`? All non-Prepaid values fall to 30-day terms. |
| RULE-022 | ABN client-side validation | Is `isValidAbn` enforced client-side before account creation, or only server-side? No Yup `.test()` call using it was found. |
| RULE-034 | Name charset | Should person name fields accept accented/diacritical characters (é, ü, ñ)? Currently rejected. |
| RULE-035 | Business name charset (ASIC) | ~~Can business names contain `&`?~~ **Resolved by inspection 2026-09-02 (CRD-043) — `&` IS already permitted; the original question rested on a false premise.** Still open: is ASIC BRS v1.7 the correct reference, and should any other excluded character (notably `+`) be permitted? |
| RULE-036 | Consecutive chars | Is the default threshold of 3 (max 2 repeating) correct for all fields, or should some fields be stricter/looser? |
| RULE-042 | Number of items 1–100 | Is 100 a hard operational limit (lab capacity / system constraint) or an informal cap? |
| RULE-046 | Date validator inconsistency | The `isFutureDate()` in `common.ts` rejects today; the RFQ preferred-date rule accepts today. Is this intentional? |
| RULE-047 | PO number max 20 chars | Is 20 a business constraint (e.g., ERP field limit) or an arbitrary cap? |
| RULE-050 | NMI ABN hardcoded | Verify `74 599 608 295` is current NMI ABN; verify `36 Bradfield Road, West Lindfield NSW 2070` is current registered address. |

**P0 rules requiring SME confirmation (flagged as migration blockers):**
- **RULE-035** (Business name charset) — affects account creation; wrong charset could block valid businesses. **Narrowed 2026-09-02 (CRD-043):** the `&` concern is void — `&` is already accepted. The residual question is the charset's overall ASIC alignment, not any specific character.
- **RULE-050** (NMI ABN/address) — appears in legal contract display; must be correct before go-live
