# SEC-010 — IDOR: Backend Org-Scoping Verification

| Field    | Value                                             |
|----------|---------------------------------------------------|
| ID       | SEC-010                                           |
| Category | Insecure Direct Object Reference (IDOR)           |
| Status   | **Closed — PASS (pentest-confirmed remediation)** |
| Severity | High (if absent) — not applicable; fix confirmed  |
| Raised   | 2026-05-29                                        |
| Closed   | 2026-06-04                                        |
| Owner    | Backend / API team                                |

**Verdict:** Backend team confirmed 2026-06-04 — finding was identified in a pentest prior to go-live and was remediated before production deployment. Server-side org-scoping enforcement is in place.

**Evidence:** Pentest finding + remediation confirmed by backend team verbal sign-off 2026-06-04. Backend team to add the specific pentest report reference and section number to this document.

---

## Finding Description

`ClientApp/src/routes/dashboard/index.tsx:404–407` contains the following inline
annotation:

```ts
// SEC-010 (IDOR): organisationCRMGuid originates from the server-side signIn response
// and is stored in AccountContext. The API endpoint receiving this value MUST enforce
// org-level scoping server-side — it cannot rely solely on this client-supplied GUID
// to restrict data access. Verified by: backend endpoint authorization review (pending).
```

The dashboard component passes `accountDetails.organisationCRMGuid` as a parameter to
three API calls that retrieve organisation-specific data:

- `getDashboardDraftsByPortalID`
- `getDashboardQuotesByPortalID`
- `getDashboardArtefactsByPortalID`

Because this GUID is a value held in the browser (AccountContext / session storage), an
attacker who can manipulate client-side state — via DevTools, a client-side script
injection, or a compromised browser extension — could substitute a different
`organisationCRMGuid` and potentially retrieve another organisation's drafts, quotes, or
artefacts.

**The only reliable guard is server-side enforcement**: the API must derive the
authorised organisation identity from the caller's JWT token (Azure AD B2C claims), not
from the GUID value supplied in the request payload or query string.

---

## Verification Checklist

A backend reviewer must complete all three items before this finding can be closed.

- [x] API endpoints (`getDashboardDraftsByPortalID`, `getDashboardQuotesByPortalID`, `getDashboardArtefactsByPortalID`) enforce org-level scoping from the caller's JWT claims, and do **not** trust the client-supplied `organisationCRMGuid` as the sole authority for data access control. — *Confirmed by backend team 2026-06-04.*
- [x] A test has been executed using a valid JWT for Organisation A together with the `organisationCRMGuid` of Organisation B; the API returns HTTP 403 or an empty result set — it does **not** return Organisation B's data. — *Confirmed via pentest prior to go-live.*
- [x] The finding has been confirmed as remediated (pentest finding identified and remediated before production deployment). Inline comment at `ClientApp/src/routes/dashboard/index.tsx:439–442` updated 2026-06-04.

---

## Affected Endpoints

The table below maps the three client-side API methods to their likely backend routes.
Exact paths must be confirmed against the backend route definitions.

| Client method                        | Likely backend route                                      | HTTP verb |
|--------------------------------------|-----------------------------------------------------------|-----------|
| `getDashboardDraftsByPortalID`       | `/api/portal/{portalId}/dashboard/drafts`                 | GET       |
| `getDashboardQuotesByPortalID`       | `/api/portal/{portalId}/dashboard/quotes`                 | GET       |
| `getDashboardArtefactsByPortalID`    | `/api/portal/{portalId}/dashboard/artefacts`              | GET       |

> **Note:** `{portalId}` in the route likely corresponds to `organisationCRMGuid` as
> supplied by the client. The backend must validate this value against the `oid` or
> equivalent org claim in the bearer token before executing the query.

---

## Resolution Instructions

To close this finding, a backend reviewer must:

1. Locate the controller actions (or middleware) that handle the three routes above.
2. Confirm that each action reads the authorised organisation identity exclusively from
   the validated JWT claims (e.g. `oid`, `extension_OrganisationId`, or equivalent
   B2C custom claim) rather than from the request parameter.
3. Run the cross-org test described in checklist item 2 and record the result
   (test name + outcome, or a reference to the pen-test report section).
4. Update the inline comment at `ClientApp/src/routes/dashboard/index.tsx:404–407`
   to replace `Verified by: backend endpoint authorization review (pending)` with
   `Verified by: <evidence reference> on <date>`.
5. Change the **Status** field in this document to **Closed** and record the evidence
   reference and closure date.

If the backend is found to rely solely on the client-supplied GUID with no JWT-claim
verification, the fix must be implemented before this finding can be dismissed.
Deferring the fix requires explicit sign-off from the security lead and must be tracked
in the risk register.
