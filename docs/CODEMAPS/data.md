<!-- Generated: 2026-10-21 | Files scanned: 1537 | Token estimate: ~450 -->

# Data Layer

> This is a frontend SPA — there is no database. Data lives in:
>
> 1. The NMI backend (via REST API)
> 2. `sessionStorage` (transient wizard state)
> 3. Local React state / context (ephemeral UI state)

## Key Domain Types (`ClientApp/src/types.ts`)

```ts
HttpStatusCode   — enum for error page routing
// (generated types live in web-api-client.ts)
```

## Wizard / Form State (sessionStorage)

Multi-step wizards persist step data across navigation using `SessionStorageCache`:

```text
ClientApp/src/storage/sessionStorageCache.ts   StorageCache interface
ClientApp/src/storage/notification.ts          dashboard/modal notification flags
ClientApp/src/storage/types.ts                 StorageCache interface
```

Keys written by domain:

| Key pattern | Domain | Cleared on |
|-------------|--------|-----------|
| `rfq:*` | Request For Quote wizard steps | RFQ submit / cancel |
| `ta:*` | Type Approval wizard steps | TA submit / cancel |
| `aq:*` | Accept Quote wizard steps | AQ submit / cancel |
| `notification:*` | Dashboard banners / modal shown flags | explicit clear calls |

## Validation Schemas (`ClientApp/src/validationSchemas/`)

All user-facing form validation uses Yup schemas:

```text
validationSchemas/
├── yupExtensions/
│   └── stringExtensions.ts    19 custom string methods (phone, postcode, abn, etc.)
├── stringPredicates.ts        Predicate functions for common string rules
└── [domain-specific schemas]  Per-wizard-step schemas
```

**Import requirement**: any schema using custom methods must import the side-effect module:

```ts
import '../../validationSchemas/yupExtensions';
```

## Auth State (`ClientApp/src/authentication/`)

```text
accountContext.tsx     AccountContext — MSAL account info, isAuthenticated
AccountProvider.tsx    Context provider — wraps app, exposes account
hooks.tsx              useAccount, useIsAuthenticated — consume auth state
authConfig.ts          MSAL config (client ID, tenant, scopes from env)
silentRequest.ts       Token acquisition scope builder
```

## No Database / No ORM

All persistent data (accounts, applications, quotes) is owned by the .NET backend. The SPA has no direct DB access.
