# SEC-010 — Action Required: Dashboard API Org-Scoping Verification

**To:** Backend / API Team
**From:** Migration Team — Backend Architect
**Date:** 2026-06-04
**Priority:** HIGH — blocks dashboard route migration
**Response needed by:** before Batch E migration window opens

---

## What we need from you

We need you to check three API endpoints, run one test, and record the result in
`docs/sec/SEC-010-idor-backend-verification.md`. That is the only thing blocking
the dashboard route from being migrated to the new platform.

The whole task should take under two hours if the enforcement is already in place.

---

## Background — two minutes of reading

The customer portal dashboard makes three API calls to load an organisation's
data. Each call sends the organisation's CRM GUID as a query string parameter
called `PortalId`:

```
GET /api/dashboard/get-filtered-dashboard-drafts?PortalId=<guid>&PageNumber=1&PageSize=10
GET /api/dashboard/get-filtered-dashboard-quotes?PortalId=<guid>&...
GET /api/dashboard/get-filtered-dashboard-artefacts?PortalId=<guid>&...
```

The GUID originates from your sign-in response and is stored in the browser.
That means any logged-in user can open DevTools, find the request, copy the URL,
substitute a different organisation's GUID, and replay it. If the backend uses
the `PortalId` query value as the sole filter for the database query — without
also checking it against the user's JWT — then User A could read Organisation B's
drafts, quotes, and artefacts.

The bearer token is always present on these requests, so the correct fix is
straightforward: read the org identity from the token, not (or not solely) from
the query string.

**We are not saying the vulnerability exists.** We are saying we cannot confirm
it does not exist from the frontend code alone. You are the only team who can
check.

---

## Step 1 — Find the three endpoint handlers (15 minutes)

Locate the handlers in your .NET project (`Nmi.Portal.Api`) for these exact routes:

| Route                                             | Method |
| ------------------------------------------------- | ------ |
| `/api/dashboard/get-filtered-dashboard-drafts`    | GET    |
| `/api/dashboard/get-filtered-dashboard-quotes`    | GET    |
| `/api/dashboard/get-filtered-dashboard-artefacts` | GET    |

They will be in `Program.cs` or a route-registration file. The NSwag-generated
client confirms these exact URL paths — they are not speculative.

---

## Step 2 — Check how each handler scopes its query (30 minutes)

For each handler, answer this question:

> **Does the handler read the organisation identity from the validated JWT claims
> before executing the database query, or does it use the `PortalId` query
> parameter directly?**

**What you want to see (PASS):**

```csharp
// Handler reads org identity from the token
var tokenOrgId = httpContext.User.FindFirst("extension_OrganisationId")?.Value;
// — or whatever custom B2C claim carries the org GUID for this portal —

if (string.IsNullOrEmpty(tokenOrgId))
    return Results.Unauthorized();

// Service/repository receives tokenOrgId, not the raw query parameter
var result = await dashboardService.GetDraftsByOrgAsync(tokenOrgId, ...);
```

The claim name will be whatever your B2C policy injects — likely
`extension_OrganisationId`, `extension_CRMPortalId`, or a similar custom
attribute. Check the same claim your `/api/me` endpoint reads to return
`PortalUserDto` — that is the authoritative one.

**What is a problem (FAIL):**

```csharp
// Handler uses the query parameter directly with no token check
var result = await dashboardService.GetDraftsByOrgAsync(portalId, ...);
```

If you see this pattern — the query parameter passed straight into the data
layer with no JWT comparison — please follow the remediation steps in the
[Fix](#fix-if-the-handler-fails) section below before recording the verdict.

Also confirm each handler has `.RequireAuthorization()` or the equivalent policy
applied. If any of the three endpoints is unauthenticated, that is a separate
P1 blocker that must be fixed regardless of the IDOR result.

---

## Step 3 — Run the cross-org test (30 minutes)

This is the evidence that closes the finding. A code review alone is not
sufficient — we need a test result.

**Setup:**

- Two test organisations: Org A and Org B, both with existing draft/quote/artefact
  records in the test environment.
- A valid access token for a user belonging to Org A.

**Test:**

```http
GET /api/dashboard/get-filtered-dashboard-drafts?PortalId=<Org-B-GUID>&PageNumber=1&PageSize=10
Authorization: Bearer <Org-A-user-token>
```

Repeat for the quotes and artefacts endpoints.

**Expected result (PASS):** HTTP `403 Forbidden`, HTTP `404`, or HTTP `200` with
an empty result set (`totalCount: 0`, `items: []`). Org B's records must not
appear.

**Failure result:** HTTP `200` returns Org B's drafts, quotes, or artefacts. If
this happens, go to the [Fix](#fix-if-the-handler-fails) section, remediate, and
retest before recording the verdict.

---

## Step 4 — Record the verdict (10 minutes)

Open `docs/sec/SEC-010-idor-backend-verification.md` and:

1. Tick all three checklist items.
2. Change the **Status** field to `Closed — PASS` (or `Closed — FAIL, remediated`).
3. Add a verdict section with:
   - Reviewer name
   - Date
   - Which JWT claim was confirmed as the org-scoping authority
   - Cross-org test result: HTTP status returned, test environment name, date run
   - Commit reference if a fix was applied

4. Update the inline comment in the frontend source at
   `ClientApp/src/routes/dashboard/index.tsx` lines 439–442. Change:

   ```ts
   // Verified by: backend endpoint authorization review (pending).
   ```

   to:

   ```ts
   // Verified by: <your evidence reference> on <date>. SEC-010 CLOSED.
   ```

5. Record a new entry in `docs/change-record/MASTER-CHANGE-RECORD.md` under a
   new `CRD-*` ID with a one-line summary and a reference to this finding.

Once the verdict is recorded, notify the migration team. The dashboard route
migration will be unblocked immediately.

---

## Fix — if the handler fails the check

If a handler uses the `PortalId` query value directly as the data-layer filter
with no JWT comparison, apply this pattern to all three endpoints:

```csharp
app.MapGet("/api/dashboard/get-filtered-dashboard-drafts", async (
    [FromQuery] string? portalId,
    [FromQuery] int? year,
    [FromQuery] string? status,
    [FromQuery] string? sortOrder,
    [FromQuery] string? searchText,
    [FromQuery] int pageNumber,
    [FromQuery] int pageSize,
    HttpContext httpContext,
    IDashboardService dashboardService) =>
{
    // Read org identity from the validated token — never from the query string alone
    var tokenOrgId = httpContext.User.FindFirst("extension_OrganisationId")?.Value;
    if (string.IsNullOrEmpty(tokenOrgId))
        return Results.Unauthorized();

    // Optional: reject mismatched PortalId to surface misconfigured clients early
    if (!string.IsNullOrEmpty(portalId) &&
        !tokenOrgId.Equals(portalId, StringComparison.OrdinalIgnoreCase))
        return Results.Forbid();

    // Pass the token-derived value to the service layer, not portalId
    var result = await dashboardService.GetDraftsByOrgAsync(
        tokenOrgId, year, status, sortOrder, searchText, pageNumber, pageSize);

    return Results.Ok(result);

}).RequireAuthorization();
```

Replace `"extension_OrganisationId"` with your actual B2C claim name. Apply
the same change to the quotes and artefacts endpoints. After applying the fix,
rerun the cross-org test in Step 3 before recording the verdict.

---

## Questions?

If the B2C claim name is unclear, check the handler for `/api/me` — it already
reads `PortalUserDto` from token claims and will show the exact claim path in
use. That is the same claim that should gate these three endpoints.

If you need test organisation GUIDs for the cross-org test, the QA environment
seed data should have at least two organisations with records. Contact the QA
team if test data is not available.

Any questions on the finding or the migration gate, contact the migration team
directly.
