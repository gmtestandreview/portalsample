# Auth Token Acquisition Migration Checklist

**Date:** 2026-05-30  
**Sprint:** Auth Token Centralisation  
**ADR:** [2026-05-30-acquire-token-silent-interceptor.md](../adr/2026-05-30-acquire-token-silent-interceptor.md)

---

## Summary

This checklist tracks migration of all `instance.acquireTokenSilent(...)` call sites to the
proposed `useAuthenticatedClient` hook (see ADR). The 2026-06-28 current-tree
inventory finds **81 matches across 52 production files** (excluding Storybook,
generated, vendor, and test code).

### 2026-06-02 Implementation Delta

The outstanding implementation TODOs tied to transport resiliency and behavior locks are complete (CRD-031):

- Shared API transport retry policy is active in `AuthorizedApiBase`.
- Sign-in session-init handshake behavior is asserted in `AccountProvider` tests.
- Dashboard filter/paging persistence coupling is asserted in dashboard tests.
- Focused validation passed (`28` tests, `0` failures) and `npm run type-check` passed.

This checklist remains focused on the separate `acquireTokenSilent` centralization migration and its 58 call-site inventory below.

### 2026-06-28 Validation and Inventory Delta

CRD-041 refreshes the source-snapshot baseline after React Router v7, Type Approval, Storybook, and test-suite expansion:

- `npm run type-check` passes.
- `npm run lint` passes with zero diagnostics.
- `npm run test:unit` passes with 114 files / 1,169 tests.
- `npm run test:storybook` passes with 87 files / 218 tests.
- The BDD source contains 28 application and 129 Storybook scenarios.

Type Approval accounts for part of the larger token-acquisition surface. Its dashboard, wizard, uploads, success, and management tabs must be included in any centralisation pass.

---

## Proposed `useAuthenticatedClient` Hook

```typescript
// hooks/useAuthenticatedClient.ts
import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';
import { tokenRequest } from '../authentication/authConfig';

export function useAuthenticatedClient<T extends { setAuthToken(token: string): void }>(
    ClientClass: new () => T,
): () => Promise<T> {
    const { instance, accounts } = useMsal();
    return useCallback(async () => {
        const result = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        const client = new ClientClass();
        client.setAuthToken(result.accessToken);
        return client;
    }, [instance, accounts, ClientClass]);
}

// Usage in a component:
// const getClient = useAuthenticatedClient(RequestForQuoteClient);
// const client = await getClient();
```

> **Note:** For call sites that use a raw `accessToken` string (e.g. `ViewPdfQuote`, `ViewPdfQuoteTerms`
> which pass the token to a standalone helper function), a companion hook
> `useAccessToken(): () => Promise<string>` will be needed alongside `useAuthenticatedClient`.

---

## Call Site Inventory

Each row represents one `acquireTokenSilent` invocation. Files with two calls have two rows.

| # | File | Line | Client Class / Token Usage | Done |
|---|------|------|---------------------------|------|
| 1 | `ClientApp/src/authentication/AccountProvider.tsx` | 136 | `UsersClient` | [ ] |
| 2 | `ClientApp/src/authentication/AccountProvider.tsx` | 166 | `UsersClient` | [ ] |
| 3 | `ClientApp/src/routes/dashboard/index.tsx` | 385 | `DashboardClient` | [ ] |
| 4 | `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts` | 24 | `AcceptQuoteClient` | [ ] |
| 5 | `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts` | 52 | `AcceptQuoteClient` | [ ] |
| 6 | `ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx` | 97 | `DashboardClient` | [ ] |
| 7 | `ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx` | 120 | `AcceptQuoteClient` | [ ] |
| 8 | `ClientApp/src/routes/acceptQuote/submittedSuccess.tsx` | 28 | `AcceptQuoteClient` | [ ] |
| 9 | `ClientApp/src/routes/acceptQuote/reportRecipientProps.ts` | 25 | `AcceptQuoteClient` | [ ] |
| 10 | `ClientApp/src/routes/acceptQuote/reportRecipientProps.ts` | 55 | `AcceptQuoteClient` | [ ] |
| 11 | `ClientApp/src/routes/acceptQuote/reportRecipient.tsx` | 51 | `AcceptQuoteClient` + `AccountsClient` | [ ] |
| 12 | `ClientApp/src/routes/acceptQuote/quotationSummary.tsx` | 29 | `QuoteClient` | [ ] |
| 13 | `ClientApp/src/routes/acceptQuote/paymentDetailsProps.ts` | 26 | `AcceptQuoteClient` | [ ] |
| 14 | `ClientApp/src/routes/acceptQuote/paymentDetailsProps.ts` | 59 | `AcceptQuoteClient` | [ ] |
| 15 | `ClientApp/src/routes/acceptQuote/paymentDetails.tsx` | 35 | `AcceptQuoteClient` | [ ] |
| 16 | `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts` | 24 | `AcceptQuoteClient` | [ ] |
| 17 | `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts` | 53 | `AcceptQuoteClient` | [ ] |
| 18 | `ClientApp/src/routes/acceptQuote/deliveryAndReturn.tsx` | 87 | `AcceptQuoteClient` + `AccountsClient` | [ ] |
| 19 | `ClientApp/src/routes/acceptQuote/index.tsx` | 59 | `AcceptQuoteClient` + `QuoteClient` | [ ] |
| 20 | `ClientApp/src/routes/acceptQuote/create/index.tsx` | 22 | `ApplicationClient` + `QuoteClient` | [ ] |
| 21 | `ClientApp/src/routes/contact/update/updateContactProps.ts` | 24 | `ContactClient` | [ ] |
| 22 | `ClientApp/src/routes/contact/update/updateContactProps.ts` | 51 | `ContactClient` | [ ] |
| 23 | `ClientApp/src/routes/contact/create/createContactProps.ts` | 24 | `ContactClient` | [ ] |
| 24 | `ClientApp/src/routes/contact/create/createContactProps.ts` | 51 | `ContactClient` | [ ] |
| 25 | `ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummaryProps.ts` | 18 | `RequestForQuoteClient` | [ ] |
| 26 | `ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummaryProps.ts` | 48 | `RequestForQuoteClient` | [ ] |
| 27 | `ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummary.tsx` | 44 | `RequestForQuoteClient` | [ ] |
| 28 | `ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps.ts` | 20 | `RequestForQuoteClient` | [ ] |
| 29 | `ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps.ts` | 54 | `RequestForQuoteClient` | [ ] |
| 30 | `ClientApp/src/routes/requestForQuote/organisationAndContactProps.ts` | 22 | `RequestForQuoteClient` | [ ] |
| 31 | `ClientApp/src/routes/requestForQuote/organisationAndContactProps.ts` | 51 | `RequestForQuoteClient` | [ ] |
| 32 | `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts` | 23 | `RequestForQuoteClient` | [ ] |
| 33 | `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts` | 51 | `RequestForQuoteClient` | [ ] |
| 34 | `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx` | 80 | `LookupClient` | [ ] |
| 35 | `ClientApp/src/routes/requestForQuote/index.tsx` | 52 | `RequestForQuoteClient` | [ ] |
| 36 | `ClientApp/src/routes/requestForQuote/create/index.tsx` | 19 | `ApplicationClient` | [ ] |
| 37 | `ClientApp/src/routes/requestForQuote/copy/index.tsx` | 20 | `ApplicationClient` | [ ] |
| 38 | `ClientApp/src/routes/quotation/index.tsx` | 131 | `QuoteClient` | [ ] |
| 39 | `ClientApp/src/routes/quotation/index.tsx` | 181 | `QuoteClient` | [ ] |
| 40 | `ClientApp/src/routes/measurementReport/index.tsx` | 107 | `QuoteClient` | [ ] |
| 41 | `ClientApp/src/routes/measurementReport/indexList.tsx` | 48 | `DashboardClient` | [ ] |
| 42 | `ClientApp/src/routes/account/update/updateAccountProps.ts` | 25 | `AccountsClient` | [ ] |
| 43 | `ClientApp/src/routes/account/update/updateAccountProps.ts` | 52 | `AccountsClient` | [ ] |
| 44 | `ClientApp/src/routes/account/create/createAccountProps.ts` | 21 | `AccountsClient` | [ ] |
| 45 | `ClientApp/src/routes/account/create/createAccountProps.ts` | 47 | `AccountsClient` | [ ] |
| 46 | `ClientApp/src/routes/account/addBranch/addBranchProps.ts` | 26 | `AccountsClient` | [ ] |
| 47 | `ClientApp/src/routes/account/addBranch/addBranchProps.ts` | 52 | `AccountsClient` | [ ] |
| 48 | `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` | 154 | `UsersClient` | [ ] |
| 49 | `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` | 209 | `OrganisationsClient` | [ ] |
| 50 | `ClientApp/src/components/modals/TermsAndCondition/index.tsx` | 122 | `UsersClient` | [ ] |
| 51 | `ClientApp/src/components/modals/RFQDeleteModal/index.tsx` | 62 | `ApplicationClient` | [ ] |
| 52 | `ClientApp/src/components/Utilities/ViewPdfQuote.tsx` | 39 | `accessToken` → `getQuotationFileDetails()` | [ ] |
| 53 | `ClientApp/src/components/Utilities/ViewPdfQuote.tsx` | 62 | `accessToken` → `getQuotationFileDetails()` | [ ] |
| 54 | `ClientApp/src/components/Utilities/ViewPdfQuoteTerms.tsx` | 45 | `accessToken` → `getQuotationFileDetails()` | [ ] |
| 55 | `ClientApp/src/components/Utilities/ViewMeasurementReport.tsx` | 44 | `DashboardClient` | [ ] |
| 56 | `ClientApp/src/components/Utilities/ViewMeasurementReport.tsx` | 72 | `DashboardClient` | [ ] |
| 57 | `ClientApp/src/components/Inputs/AddressLookup/index.tsx` | 100 | `AddressClient` | [ ] |
| 58 | `ClientApp/src/storybook/storybookHarness.tsx` | 94 | Mock stub — update to match new hook shape | [ ] |

---

## Migration Steps per Call Site

For each row above:

1. Replace the `acquireTokenSilent` block with `useAuthenticatedClient(ClientClass)`.
2. Remove the local `tokenResult` variable and `client.setAuthToken(...)` call.
3. For raw-token sites (rows 52–54), use a `useAccessToken()` hook instead.
4. Verify `InteractionRequiredAuthError` is no longer caught locally — the centralised hook handles it.
5. Tick the Done checkbox.

---

## Acceptance Criteria

- [ ] `rg -n "acquireTokenSilent" ClientApp/src -g "*.ts" -g "*.tsx"` returns only the approved shared abstraction and test/story mocks after centralisation.
- [ ] All `InteractionRequiredAuthError` fallbacks are centralised inside `useAuthenticatedClient` (and `useAccessToken`); no local catch blocks remain.
- [ ] `npm run type-check` passes. CRD-030 confirms direct TypeScript is clean in the source snapshot as of 2026-06-02; any future failures must be reproduced with `npx tsc --noEmit --pretty false` before changing source.
- [ ] `npm run lint` passes with zero diagnostics.
- [ ] Test suite passes: `npm run test:unit` (source baseline as of CRD-041: 114 files / 1,169 tests)
- [ ] Storybook mock in `storybookHarness.tsx` (row 58) remains compatible with the new hook shape — `acquireTokenSilent` stub updated or removed as appropriate.
- [ ] `Modals.stories.tsx` mock (line 33) updated to match.
- [ ] `npm run test:storybook` remains clean after auth-hook migration: 87 files / 218 tests.
- [ ] `npm run test:e2e` passes all 28 application and 129 Storybook scenarios; Type Approval exclusions are either replaced with fixtures or explicitly accepted under `TYPE-APPROVAL-E2E-001`.
- [ ] `npm run migration-check` passes. As of CRD-032 on 2026-06-02, the previous `VALIDATION-GATE-001` combined Vitest/Storybook failure is closed in the source snapshot.

---

## Out of Scope

- `ClientApp/src/parent/node_modules/**` — vendor library files; never edited.
- The `addBranchProps.ts:70` `UsersClient` instantiation (no adjacent `acquireTokenSilent` call; token is reused from the same block — review during migration).
