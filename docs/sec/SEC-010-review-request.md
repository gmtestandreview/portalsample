# SEC-010 IDOR — Backend Verification Review Request

**Finding:** SEC-010
**CWE:** CWE-639 (Authorisation Bypass Through User-Controlled Key)
**Severity:** Medium
**Requested by:** NMI Portal migration team
**Date issued:** 2026-05-31
**Required before:** Migration of `ClientApp/src/routes/dashboard/index.tsx`
**Checklist:** `docs/sec/SEC-010-idor-backend-verification.md`

---

## Background

The NMI Portal dashboard (`ClientApp/src/routes/dashboard/index.tsx`) retrieves organisation-specific records — drafts, quotes, and artefacts — by passing `accountDetails.organisationCRMGuid` as a parameter to three API calls (`getDashboardDraftsByPortalID`, `getDashboardQuotesByPortalID`, `getDashboardArtefactsByPortalID`). This GUID originates from the server-side sign-in response and is held in the browser via `AccountContext` and session storage, meaning it is a client-controlled value at the point of each API request. The IDOR risk is that an attacker who manipulates this GUID — via browser DevTools, a client-side script injection, or a compromised extension — could supply a different organisation's GUID and receive that organisation's data if the backend does not independently verify the caller's authority to access it.

## What the Backend Team Must Verify

The full verification checklist is at `docs/sec/SEC-010-idor-backend-verification.md`. The four most critical points are:

1. **JWT-claim enforcement** — Each of the three dashboard endpoints (`/api/portal/{portalId}/dashboard/drafts`, `.../quotes`, `.../artefacts`) must derive the authorised organisation identity exclusively from the caller's validated JWT claims (e.g. `oid`, `extension_OrganisationId`, or equivalent Azure AD B2C custom claim), not from the `organisationCRMGuid` value supplied in the request payload or query string.

2. **Cross-org isolation test** — A test must be executed using a valid JWT for Organisation A together with the `organisationCRMGuid` of Organisation B. The API must return HTTP 403 or an empty result set — it must not return Organisation B's data.

3. **No sole reliance on client-supplied GUID** — The backend must not treat the `{portalId}` route parameter as a trusted authority for access control. It is acceptable to use the GUID for routing, but the final data-access decision must be made against the JWT claim.

4. **Evidence recorded** — The outcome of the cross-org test (test name, commit reference, or pen-test report reference) must be documented so the inline comment at `dashboard/index.tsx:404–407` can be updated from `(pending)` to a verified state.

## Required Response

The backend team must return one of:

**PASS** — Server enforces organisation scoping on all dashboard API endpoints. The frontend inline comment (added at `dashboard/index.tsx` on 2026-05-30) may be retained as documentation. Migration of the dashboard route may proceed.

**FAIL** — Server does not enforce organisation scoping. A server-side fix must be implemented and deployed before the dashboard route migration can proceed. The migration team must be notified of the fix deployment before Batch A migration begins.

## Response Format

Update `docs/sec/SEC-010-idor-backend-verification.md` with:
- Verdict: PASS or FAIL
- Reviewer name and role
- Date reviewed
- If FAIL: description of required server-side fix and estimated fix delivery date

## Migration Gate

This review is a hard gate. Phase 5 Batch A migration of the dashboard route cannot proceed until this request is returned with a signed verdict.
