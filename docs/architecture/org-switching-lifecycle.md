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
AccountContext ALSO writes to sessionStorage:
  sessionStorage.setItem('targetOrganisation', JSON.stringify({
      targetOrganisationAbn: abn,
      targetOrganisationName: name,
  }))
      ↓
Next API client instantiation reads sessionStorage at construction time:
  new DashboardClient()
  → AuthorizedApiBase.targetOrganisation = sessionStorage.getItem('targetOrganisation')
      ↓
transformOptions() injects header on every request:
  headers.TargetOrganisationAbn = targetOrganisationJson.targetOrganisationAbn
```

## Why the construction-time read is safe in the current codebase

Every NSwag-generated API client is constructed **inside a `useEffect`** or async
handler, never cached across renders:

```ts
// e.g. Dashboard component — new instance on every effect execution
const client = new DashboardClient();  // reads sessionStorage NOW
client.setAuthToken(token);
await client.getDashboardDraftsByPortalID(...);
```

When the user switches org, the React state update triggers a re-render, the
`useEffect` dependency array detects the change, and a new client instance is
created that reads the updated `sessionStorage` value.

**Risk:** If any code were to cache a `*Client` instance across renders or across
org-switch events, that cached instance would silently send stale
`TargetOrganisationAbn` values to the backend. No such caching exists in the
current codebase, but this is a hidden contract that must be preserved in the
rebuild.

## Header injected

| Header | Value | Source |
|---|---|---|
| `TargetOrganisationAbn` | ABN string | `sessionStorage['targetOrganisation'].targetOrganisationAbn` |

This header is injected by `AuthorizedApiBase.transformOptions()` and is present
on every request made by any `*Client` class that extends `AuthorizedApiBase`
(all generated NSwag clients: `DashboardClient`, `QuoteClient`, `UsersClient`,
`RequestForQuoteClient`, etc.).

## Rebuild recommendation

In the rebuilt portal, `AuthorizedApiBase` should receive the target organisation
via constructor argument or React context rather than reading from `sessionStorage`
at construction time:

```ts
// Option A: pass via constructor
const client = new DashboardClient(accountState.details.targetOrganisation?.targetOrganisationAbn);

// Option B: centralise via useAuthenticatedClient hook (see ADR)
const getClient = useAuthenticatedClient(DashboardClient, targetOrgAbn);
```

This removes the implicit `sessionStorage` coupling and makes the data flow
explicit, traceable, and unit-testable.

## Files involved

| File | Role |
|---|---|
| `ClientApp/src/api/web-api-client.ts:10–35` | `AuthorizedApiBase` — construction-time sessionStorage read + header injection |
| `ClientApp/src/authentication/accountContext.tsx` | `setTargetOrganisation` dispatch — writes to React state AND sessionStorage |
| `ClientApp/src/storage/sessionStorageCache.ts` | Low-level sessionStorage wrapper used for other keys |
| All `*Client` classes in `web-api-client.ts` | Extend `AuthorizedApiBase`; inherit the org-switch header behaviour |
