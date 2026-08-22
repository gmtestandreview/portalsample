# ADR: Centralise acquireTokenSilent via an MSAL auth interceptor

**Date:** 2026-05-30  
**Status:** Proposed — deferred to migration sprint  
**Deciders:** Portal rebuild team

## Context

`instance.acquireTokenSilent({ ...tokenRequest, account: accounts[0] })` is called at 35+ sites across the portal. Each site independently handles token acquisition, sets `client.setAuthToken(tokenResult.accessToken)`, and (inconsistently) handles `InteractionRequiredAuthError`.

## Current-state contract (must remain stable until migration)

### Canonical call pattern

```typescript
const tokenResult = await instance.acquireTokenSilent({
    ...tokenRequest,
    account: accounts[0],
});
client.setAuthToken(tokenResult.accessToken);
```

### Token request shape and scope intent

From `ClientApp/src/authentication/authConfig.ts`:

- `tokenRequest = { scopes }`
- `scopes = [REACT_APP_B2C_READ_SCOPE, REACT_APP_B2C_USER_IMPERSONATION_SCOPE]`

This keeps route-level API calls aligned on one delegated-permission set.

### Why `accounts[0]` is used

The current SPA assumes a single interactive account context and selects the first MSAL account as the active identity for silent token retrieval.

### Rationale for retaining this pattern pre-migration

- It is already broadly implemented and operational across route modules.
- It aligns with existing route-level error boundaries and loading states.
- Replacing it piecemeal in this snapshot would introduce high churn with limited additional confidence before the rebuild.

## Decision

Defer this refactor until the migration sprint. Do not change the existing pattern in this codebase — the current approach works and the risk of partial refactoring outweighs the benefit before migration.

## Proposed pattern (for reference in the rebuild)

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

## Consequences

- Reduces 35+ token-acquisition blocks to 1 implementation.
- Centralises `InteractionRequiredAuthError` fallback to `acquireTokenPopup`.
- Each call site becomes 2 lines instead of 5–7.
- **Migration risk if done now:** partial refactoring of 35+ sites in the snapshot repo would be high-churn and high-risk without full test coverage of each flow.
