# Data Objects Catalogue — NMI Customer Portal
**Source:** `ClientApp/src/api/web-api-client.ts` + `authentication/` + `routes/`
**Date:** 2026-06-02
**Alignment note:** Open migration security set is SEC-008 (by-design), SEC-012 (architectural debt). SEC-010 closed 2026-06-04 (CRD-035). SEC-001, SEC-009, SEC-011 closed 2026-06-01 (CRD-029, CRD-031).

---

## Core DTOs and Interfaces

### `UserDto`
**Source:** `ClientApp/src/api/web-api-client.ts` (NSwag-generated)
**Purpose:** Server response from `AccountLoginClient.signIn` — the identity and account state for the authenticated user.
**Consumed by:** `AccountProvider.tsx` (transforms into `AccountDetails`)

| Field | Type | Notes |
|---|---|---|
| `acceptedTerms` | `boolean` | Whether user has accepted current T&C |
| `termsVersion` | `number` | Version of T&C user last accepted; compared to `TermsVersion` in `terms-config.json` |
| `accountCreationCompleted` | `boolean` | Whether org account setup wizard was completed |
| `accountContactCompleted` | `boolean` | Whether contact creation was completed |
| `defaultOrganisationId` | `string \| null` | CRM GUID of selected default org/branch; null if none selected |
| `homeAccountId` | `string` | MSAL home account ID for correlation |
| **Rules consuming:** | | RULE-001, RULE-002, RULE-004, RULE-005 |

---

### `AccountDetails` (in-memory context)
**Source:** `ClientApp/src/authentication/accountContext.tsx:27-75`
**Purpose:** Derived in-memory state held in React context. Computed from `UserDto` + MSAL account + org selection.
**Consumed by:** Every authenticated component via `useAccountState()` hook

| Field | Type | Notes |
|---|---|---|
| `userAcceptedTermsOfUse` | `boolean` | Computed: `acceptedTerms === true && termsVersion.toString() === currentTermsVersion` |
| `accountCreationCompleted` | `boolean` | From `UserDto` |
| `accountContactCompleted` | `boolean` | From `UserDto` |
| `defaultOrganisationId` | `string \| null` | CRM org GUID; also stored in `sessionStorage.targetOrganisation` |
| `organisationName` | `string` | Display name of selected org branch |
| `userName` | `string` | User's display name from MSAL account |
| `firstName` / `lastName` | `string` | From MSAL account claims |
| `homeAccountId` | `string` | For App Insights correlation |
| **Rules consuming:** | | RULE-001 through RULE-005, RULE-011 |

---

### `DashboardItemDto`
**Source:** `ClientApp/src/api/web-api-client.ts` (NSwag-generated)
**Purpose:** A single card in the dashboard tabs (Drafts / Requests / Instruments).
**Consumed by:** `requestItem.tsx`, `instrumentItem.tsx`, `dashboard/index.tsx`

| Field | Type | Notes |
|---|---|---|
| `referenceId` | `string` | RFQ reference; used as URL param and optimistic-override key |
| `quoteRequestStatus` | `QuoteStatus` | Current lifecycle status (see RULE-006) |
| `requestForQuote` | `RequestForQuoteDto` | Nested RFQ details |
| `quote` | `QuoteDto \| null` | Nested quote details; null until NMI creates a quote |
| `lastUpdated` | `Date \| null` | CRM last-updated timestamp; overridden optimistically |
| **Rules consuming:** | | RULE-006, RULE-007, RULE-010, RULE-011, RULE-016, RULE-020, RULE-021 |

---

### `RequestForQuoteDto`
**Source:** `ClientApp/src/api/web-api-client.ts`
**Purpose:** Core RFQ data as entered by the customer.

| Field | Type | Notes |
|---|---|---|
| `quoteRequestIdNum` | `number` | Numeric CRM ID |
| `manufacturer` | `string` | Instrument make (RULE-020 heading) |
| `model` | `string` | Instrument model (RULE-020 heading) |
| `serialNumber` | `string` | Max 100 chars (RULE-047) |
| `numberOfItems` | `number` | 1–100 (RULE-042) |
| `description` | `string` | Max 400 chars (RULE-047) |
| `testingAndCalibrationRequirements` | `string` | Max 2000 chars (RULE-047) |
| `preferredAvailabilityDate` | `string \| null` | Must be today or future if set (RULE-041) |
| `previousQuoteNumber` | `string \| null` | Optional reference (RULE-047) |
| `hideFromDashboard` | `boolean` | If true, card hidden from customer (RULE-016) |
| **Rules consuming:** | | RULE-013, RULE-016, RULE-020, RULE-039, RULE-041, RULE-042, RULE-047 |

---

### `QuoteDto`
**Source:** `ClientApp/src/api/web-api-client.ts`
**Purpose:** NMI-generated quotation details (available only after NMI has created a quote from the RFQ).

| Field | Type | Notes |
|---|---|---|
| `quotationId` | `string` | CRM Quote ID — used in URL post-acceptance (RULE-021) |
| `quoteRequestIdNum` | `number` | Links back to RFQ |
| `quoteRequestStatus` | `QuoteStatus` | Current quote lifecycle status |
| `artefactName` | `string \| null` | NMI-assigned name; replaces make/model in heading (RULE-020) |
| `outcomeDate` | `Date \| null` | Date of outcome action; set optimistically on acceptance (RULE-011) |
| `feePayable` | `number \| null` | Quote fee; hidden when status is QuoteExpired |
| `paymentTerms` | `string \| null` | `'Prepaid'` or other; drives RULE-017 |
| **Rules consuming:** | | RULE-007, RULE-009, RULE-011, RULE-017, RULE-021 |

---

### `InstrumentArtefactDto`
**Source:** `ClientApp/src/api/web-api-client.ts`
**Purpose:** NMI's record of the physical instrument/artefact on the Instruments tab.

| Field | Type | Notes |
|---|---|---|
| `tmasStatus` | `ReportStatus` | `Issued`, `Withdrawn`, `Expired`, `Cancelled`, `NotIssued` |
| `quoteId` | `string` | ID used for report PDF fetch |
| **Rules consuming:** | | RULE-019 |

---

### `AcceptQuotePreInfoDto`
**Source:** `ClientApp/src/api/web-api-client.ts`
**Purpose:** Pre-populated data loaded at the start of the Accept Quote wizard — org details, return address, payment terms.

| Field | Type | Notes |
|---|---|---|
| `paymentTerms` | `string` | `'Prepaid'` triggers prepayment rule (RULE-017) |
| `returnContact` | `ContactDto` | Default return contact |
| `reportRecipient` | `ContactDto` | Report delivery recipient |
| `returnAddress` | `AddressDto` | Physical return address |
| `returnMethod` | `string` | `'NMIWillArrange'` \| `'ClientWillProvide'` (RULE-043) |
| **Rules consuming:** | | RULE-017, RULE-043, RULE-044 |

---

### `ContactDto`
**Source:** `ClientApp/src/api/web-api-client.ts` + `ClientApp/src/validationSchemas/contactValidation.ts`
**Purpose:** Person contact record — used for account contacts, RFQ contacts, return contacts, and invoice contacts.

| Field | Type | Validation |
|---|---|---|
| `title` | `string` | 2–100 chars, nameAllowedFormat |
| `firstName` | `string` | 2–50 chars, nameAllowedFormat |
| `lastName` | `string` | 2–99 chars, nameAllowedFormat |
| `role` | `string` | 2–99 chars, allowedFormat(true) |
| `email` | `string` | max 100 chars, email regex |
| `phone` | `string \| null` | 6–12 chars, AU phone (RULE-032) |
| `mobile` | `string \| null` | 10–12 chars, AU mobile (RULE-032) |
| **Rules consuming:** | | RULE-034, RULE-038, RULE-044, RULE-047 |

---

### `OrganisationDto` / `AccountDetailsDto`
**Source:** `ClientApp/src/api/web-api-client.ts` + `ClientApp/src/routes/account/validation.ts`
**Purpose:** Customer organisation (company) registration details.

| Field | Type | Validation |
|---|---|---|
| `abn` | `string` | 11 digits, checksum validation (RULE-022); displayed as `## ### ### ###` (RULE-030) |
| `businessName` | `string` | 2–160 chars, allowedFormat(true) |
| `tradingName` | `string \| null` | 2–160 chars, allowedFormat(true) |
| `businessWebsiteAddress` | `string \| null` | max 100 chars, URL regex (RULE-048) |
| `streetAddress` | `AddressDto` | Full address schema |
| `postalAddress` | `AddressDto \| null` | Null if same-as-street (RULE-049) |
| **Rules consuming:** | | RULE-022, RULE-030, RULE-035, RULE-047, RULE-048, RULE-049 |

---

### `AddressDto`
**Source:** `ClientApp/src/validationSchemas/addressValidation.ts`
**Purpose:** Physical or postal address — Australian addresses only.

| Field | Type | Validation |
|---|---|---|
| `addressLine1` | `string` | max 250 chars, addressFormat() |
| `addressLine2` | `string \| null` | max 250 chars |
| `addressLine3` | `string \| null` | max 250 chars |
| `suburb` | `string` | max 80 chars |
| `state` | `State` enum | must be valid AU state value |
| `postcode` | `string` | exactly 4 digits, AU range (RULE-031) |
| `isManuallyEntered` | `boolean` | true = manual entry, false = autocomplete selected |
| `searchText` | `string \| null` | autocomplete input (required when `isManuallyEntered = false`) |
| **Rules consuming:** | | RULE-031, RULE-047, RULE-049 |

---

### `TargetOrganisation` (sessionStorage)
**Source:** `ClientApp/src/storage/targetOrganisation.ts:4-9`, `ClientApp/src/authentication/accountContext.tsx:27-30`
**Purpose:** Currently selected organisation ABN and name — written to sessionStorage for use by the API client's `TargetOrganisationAbn` header.
**Note:** Two independent interface definitions exist with identical shapes — see Debt #4 in ASSESSMENT.md.

| Field | Type | Notes |
|---|---|---|
| `targetOrganisationAbn` | `string` | ABN without spaces |
| `targetOrganisationName` | `string` | Display name |
| **Rules consuming:** | | SEC-001, SEC-010 (see ASSESSMENT.md security findings) |

---

### Status Enums

#### `QuoteStatus` (CRM string values)
**Source:** `ClientApp/src/routes/common/enums.ts:1-13`

| Enum member | CRM string value |
|---|---|
| `QuoteSubmitted` | `'Submitted'` |
| `QuoteInProgress` | `'Quote - In Progress'` |
| `QuoteAvailable` | `'Quote - Available'` |
| `QuoteAccepted` | `'Quote - Accepted'` |
| `QuoteDeclined` | `'Quote - Declined'` |
| `QuoteExpired` | `'Quote - Expired'` |
| `QuoteClosed` | `'Quote - Closed'` |
| `ReportIssued` | `'Report - Issued'` |
| `ReportInProgress` | `'Report - In progress'` |
| `ReportWithdrawn` | `'Report - Withdrawn'` |
| `ArtifactReceived` | `'Artefact - Received'` |

#### `DashboardItemStatus` (display labels)
**Source:** `ClientApp/src/routes/common/enums.ts:15-28`
Mirrors `QuoteStatus` plus adds `QuoteDrafted = 'Quote request drafted'` (client-only pre-submission state).

#### `ReportStatus` (instrument artefact)
**Source:** `ClientApp/src/routes/common/enums.ts:30-36`
Values: `Withdrawn`, `Issued`, `Expired`, `Cancelled`, `NotIssued`

#### `FormStepStatus` (wizard step completion)
**Source:** `ClientApp/src/api/web-api-client.ts:2879-2883`
Values: `NotStarted`, `Saved`, `Completed`

---

### Notification Tokens (sessionStorage)
**Source:** `ClientApp/src/storage/notification.ts`
**Purpose:** Short-lived one-shot notification flags written before a redirect and consumed (then cleared) on the target page.

| Key | Written by | Read by | Trigger |
|---|---|---|---|
| `'accepted-quote-id'` | `summaryAndAcceptProps.ts` | `dashboard/index.tsx` | Post-accept optimistic override (RULE-011) |
| `'view-quote-id'` | `dashboard/index.tsx` | `quotation/index.tsx` | Quotation view after optimistic override |
| `'rfqNotification'` | `requestForQuote/` wizard | `dashboard/index.tsx` | Post-RFQ-submit banner |
| `'acceptQuoteNotification'` | `acceptQuote/` wizard | `dashboard/index.tsx` | Post-acceptance banner |
| `'dashboardNotification'` | `dashboardNotifications.ts` | `dashboard/index.tsx` | Account creation success |

---

## Hardcoded Configuration Values (Should Be Externalised)

| Value | Current Setting | Source File:Line |
|---|---|---|
| NMI ABN | `74 599 608 295` | `summaryAndAccept.tsx:382` |
| NMI address | 36 Bradfield Road, West Lindfield NSW 2070 | `summaryAndAccept.tsx:383-388` |
| Terms of Use version | `"1"` | `terms-config.json:1` |
| Dashboard page size | `10` | `dashboard/index.tsx:51` |
| Report list page size | `10` | `measurementReport/indexList.tsx:36` |
| Address lookup max results | `10` | `accountDetails.tsx:83` |
| ABN modulus | `89` | `common.ts:149` |
| ABN weights | `[10,1,3,5,7,9,11,13,15,17,19]` | `common.ts:133` |
| PDF page (Available/other) | `2` | `helperFunctions.ts:134` |
| PDF page (Declined) | `3` | `helperFunctions.ts:126` |
| PDF page (Accepted/Issued) | `5` | `helperFunctions.ts:128` |
| Payment terms trigger | `'Prepaid'` | `paymentDetails.tsx:86` |
| Standard payment period | `30 days` | `paymentDetails.tsx:88` |
| Number of items max | `100` | `requestForQuote/validation.ts:93` |
| Postcode valid range 1 | `200–299` | `stringExtensions.ts:352` |
| Postcode valid range 2 | `800–9999` | `stringExtensions.ts:353` |
