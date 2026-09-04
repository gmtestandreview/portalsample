# Precondition redirect matrix

**Status:** Derived from code, 2026-09-01. **Updated the same day** — the API contract was confirmed with the backend team and AN-1 was fixed; see [Resolution](#resolution-2026-09-01).

## Resolution 2026-09-01

The backend team and product confirmed:

1. `defaultOrganisationId` is **`number` when provisioned, absent when not — never `null`.**
2. Absent means "never provisioned".
3. The default organisation is provisioned **before the first user fetch**, via the Australian Government [Relationship Authorisation Manager (RAM)](https://info.authorisationmanager.gov.au/). RAM requires myID, and myID is required to sign in at all — so **every authenticated user necessarily has a provisioned organisation.**
4. Intended: organisation **absent** + creation incomplete → `/create-contact`.
5. Intended: the create-account redirect fires only when the **organisation exists** but setup is incomplete.

That inverts the original AN-1 finding. Because the server never sends `null`, the old strict `!== null` guard was **always true**, so it never blocked — and the intended "no organisation → `/create-contact`" path could never execute. Users with no organisation would have been sent to `/create-account`, contrary to (4).

**Fixed:** `PreConditions.tsx` now uses loose `!= null`, which covers both `null` and `undefined` and matches the already-correct `hasDefaultOrganisationId()` in `BranchSelectorModal`. Regression tests `4a`/`4b`/`4c` were added and **fail without the fix**. The change is a no-op in production given RAM.

**Not fixed — deliberately.** `autoShowBranchSelector` (line 91) still uses strict `=== null` and remains dead. Making it live would open `BranchSelectorModal` for an organisation-less user, and that modal renders with `backdrop='static'`, `keyboard={false}`, and **both close affordances gated on `defaultOrganisationIdSet`** — so the user would be trapped in an undismissable dialog. Fixing it requires disabling *Continue* until a branch is selected and providing an exit path. Pinned by test `14a`.
**Source of truth:** [`ClientApp/src/routes/preConditions/PreConditions.tsx`](../../ClientApp/src/routes/preConditions/PreConditions.tsx) lines 69–93 (predicates) and 152–162 (evaluation order)
**Applies to:** 35 of the 41 paths registered in `App.tsx` — 32 wrapped in `<AuthenticatedElement>` (which mounts `<PreConditions>` internally) and 3 mounting `<PreConditions>` directly (`/server-error`, `/not-found`, and the `*` catch-all).

The 6 paths that bypass this logic entirely are `/`, `/sign-out`, `/sign-out-helper`, `/help-guide`, `/help-guide/how-to-setup-access` and `/help-guide/faqs`.

## Why this document exists

`PreConditions` decides, on every authenticated route render, whether the user sees the page they asked for or is redirected into onboarding. That decision is the product of four interacting boolean expressions over account state and the current path. The logic is not documented anywhere else — not in `ARCHITECTURE.md`, not in an ADR, and not in the replacement platform, which has not yet implemented it.

Until this table existed, the only way to know what the portal does for a given account state was to read and mentally evaluate four chained `&&` expressions. That makes the contract unreviewable, and it makes the migration unverifiable: there is nothing to test the new implementation against.

**This table is the behavioural contract.** Any reimplementation must reproduce it, including the four anomalies recorded below — or change them deliberately, with a decision recorded.

## How this table was derived

The predicates were transcribed verbatim from `PreConditions.tsx` into a standalone evaluator and the input space enumerated exhaustively. The rows below are generated output, not hand-reasoning. The path-matching claims in the next section were likewise verified by running `String.prototype.includes` against every path registered in `App.tsx` rather than by inspection.

No application code was executed and no tests were run to produce this document.

## Inputs

Four fields are read, all via optional chaining from `account?.details`:

| Symbol | Field | Values that matter |
| --- | --- | --- |
| **A** | `accountCreationCompleted` | `true`, `false`, absent/`undefined` |
| **C** | `accountContactCompleted` | `true`, `false`, absent/`undefined` |
| **O** | `defaultOrganisationId` | `null`, a value, absent/`undefined` |
| **T** | `userAcceptedTermsOfUse` | `true`, `false`, absent/`undefined` |

`account` is itself `null` unless **both** `useAccountState()` and `useAccountDispatch()` return truthy values (line 30). `isAuthenticated` comes from `useIsAuthenticated()`; when it is `false` every predicate short-circuits to `false` and the requested page renders.

Every comparison is strict (`=== true`, `=== false`, `!== null`). This matters — see anomalies **AN-3** and **AN-4**.

## Path categories

Matching uses substring `path.includes(...)`, not route matching. Four categories are relevant:

| Key | Matches when path contains | Example routes |
| --- | --- | --- |
| **P1** | `create-account` | `/create-account`, `/create-account/step-2` |
| **P2** | `create-contact` | `/create-contact` |
| **P3** | `success-creating-account` | `/success-creating-account` |
| **P4** | none of the above | `/dashboard`, `/request-for-quote/:id`, `/ta/:id/manage`, … |

**Verified: no accidental collisions exist today.** Checked against all registered paths:

- `/success-creating-account` does **not** contain `create-account` (the substring is `creating-account`) — so P3 is genuinely distinct from P1.
- `/update-contact/*` does **not** contain `create-contact`.
- `/update-organisation/:id/*` matches none of the three.

This is correct today but fragile: it holds by coincidence of wording, not by construction. Any future path containing one of these substrings silently joins that exclusion set. See **AN-5**.

## Evaluation order

The three redirects are evaluated as an if/else-if chain and the **first match wins** (lines 152–162):

```
1. redirectToCreateAccount  →  <Navigate to='/create-account' />
2. redirectToCreateContact  →  <Navigate to='/create-contact' />
3. redirectToDashboard      →  <Navigate to='/' />
4. otherwise                →  render children
```

The predicates themselves:

```ts
redirectToCreateAccount = isAuthenticated
  && O !== null                       // note: NOT "O is set"
  && A === false
  && !path.includes('create-account')

redirectToCreateContact = isAuthenticated
  && !redirectToCreateAccount         // explicit precedence
  && C === false
  && !path.includes('create-contact')
  && !path.includes('create-account')

redirectToDashboard = isAuthenticated
  && A === true
  && C === true
  && (path.includes('create-account') || path.includes('create-contact'))
```

## The truth table

All 32 combinations of A × C × (O is null) × path category, with `isAuthenticated = true` and `account.details` populated. The final column shows whether the branch-selector modal opens automatically (assuming `T === true`; see [Modal orchestration](#modal-orchestration)).

| A | C | O is null | Path | Outcome | Auto branch selector |
| :-: | :-: | :-: | :-: | --- | :-: |
| true | true | yes | P1 `/create-account` | → `/` | open |
| true | true | yes | P2 `/create-contact` | → `/` | open |
| true | true | yes | P3 `/success-creating-account` | render page | — |
| true | true | yes | P4 other | render page | open |
| true | true | no | P1 | → `/` | — |
| true | true | no | P2 | → `/` | — |
| true | true | no | P3 | render page | — |
| true | true | no | P4 | render page | — |
| true | false | yes | P1 | render page | — |
| true | false | yes | P2 | render page | — |
| true | false | yes | P3 | → `/create-contact` | — |
| true | false | yes | P4 | → `/create-contact` | — |
| true | false | no | P1 | render page | — |
| true | false | no | P2 | render page | — |
| true | false | no | P3 | → `/create-contact` | — |
| true | false | no | P4 | → `/create-contact` | — |
| false | true | yes | P1 | render page | open |
| false | true | yes | P2 | render page | open |
| false | true | yes | P3 | render page | — |
| false | true | yes | P4 | render page | open |
| false | true | no | P1 | render page | — |
| false | true | no | P2 | → `/create-account` | — |
| false | true | no | P3 | → `/create-account` | — |
| false | true | no | P4 | → `/create-account` | — |
| false | false | yes | P1 | render page | — |
| false | false | yes | P2 | render page | — |
| false | false | yes | **P3** | **→ `/create-contact`** | — |
| false | false | yes | **P4** | **→ `/create-contact`** | — |
| false | false | no | P1 | render page | — |
| false | false | no | P2 | → `/create-account` | — |
| false | false | no | P3 | → `/create-account` | — |
| false | false | no | P4 | → `/create-account` | — |

The two bolded rows are **AN-1**.

### Reading the table

- **P1 never redirects to `/create-account`** and **P2 never redirects to `/create-contact`** — each destination excludes itself, which is what makes the chain terminate.
- **A user with both flags `true` cannot stay on an onboarding path.** Rows 1, 2, 5, 6 push them to `/`.
- **`O is null` suppresses the create-account redirect entirely.** Compare rows 22–24 against 26–28: identical account flags, opposite destinations.

## Indeterminate states

Behaviour when fields are absent rather than `false`. Path is P4 (`/dashboard`) in every case.

| State | Reachable? | Outcome | Note |
| --- | --- | --- | --- |
| `account === null` (context not ready) | **yes** | render page | All predicates short-circuit. **AN-4** |
| `details = {}` (all fields absent) | **no** | — | `toAccountDetails` coerces A, C and T with `!!(...)`, so once `details` exists all three are strict booleans. This state cannot occur. |
| `O` absent, A `false`, C `false` | **yes** | → `/create-contact` *(after fix; was `/create-account`)* | The only real "no organisation" state. **AN-3** |
| `O` is `null`, A `false`, C `false` | **no** | — | The API never emits `null` — confirmed with the backend team 2026-09-01. |
| `O` is a value, A `false`, C `false` | **yes** | → `/create-account` | Organisation exists, setup incomplete. |
| `A` absent, C `false`, O set | **no** | — | `A` is always a strict boolean (see above). |

## Termination

Every reachable account state settles within one redirect. Following each redirect to its fixed point from `/dashboard`:

| A | C | O | Path taken | Settles |
| :-: | :-: | :-: | --- | :-: |
| true | true | null | `/dashboard` | yes |
| true | true | set | `/dashboard` | yes |
| true | false | null | `/dashboard` → `/create-contact` | yes |
| true | false | set | `/dashboard` → `/create-contact` | yes |
| false | true | null | `/dashboard` | yes |
| false | true | set | `/dashboard` → `/create-account` | yes |
| false | false | null | `/dashboard` → `/create-contact` | yes |
| false | false | set | `/dashboard` → `/create-account` | yes |

**No redirect loops exist.** This is a genuine property of the current design and must be preserved — a reimplementation that makes rule 3 target `/dashboard` instead of `/` would need re-checking, because `/dashboard` is inside the guarded tree whereas `/` is not.

## Anomalies

Each of these is a behaviour a reimplementation will either reproduce or change. None should be changed by accident.

### AN-1 — RESOLVED AND FIXED. A user with no organisation was sent to create an *account*, not a *contact*

> **Superseded by the [Resolution](#resolution-2026-09-01).** The analysis below described the `null`
> case, which the confirmed contract makes unreachable. The real defect was the mirror image: the
> guard never blocked, so organisation-less users went to `/create-account` instead of the intended
> `/create-contact`. Fixed with loose `!= null`. Retained for the reasoning trail.

`redirectToCreateAccount` requires `defaultOrganisationId !== null`. A user with `defaultOrganisationId === null` and `accountCreationCompleted === false` therefore fails rule 1, falls through to rule 2, and is redirected to `/create-contact` — despite account creation being incomplete.

This reads as inverted. It is plausible the flow is deliberate: if the backend provisions a default organisation during first sign-in, then `null` may mean "provisioning has not run yet", and sending such a user to contact creation could be intended sequencing. That interpretation is not recorded anywhere.

**Action:** confirm the intended flow with the backend team before reimplementing. Do not silently "fix" the polarity — if it is load-bearing, changing it breaks onboarding; if it is a defect, it should be fixed with a test that pins the corrected behaviour.
**Evidence:** `PreConditions.tsx:70`, truth table rows 27–28. Confidence: High that the behaviour occurs; Unknown whether it is intended.

### AN-2 — `redirectToDashboard` navigates to `/`, not `/dashboard`

The variable is named for a destination it does not use (line 161). `/` is the public `Home` route in `App.tsx` and is wrapped in neither `AuthenticatedElement` nor `PreConditions`, so this redirect exits the guarded tree entirely.

That exit is what guarantees termination (see above), so the behaviour is probably correct and only the *name* is wrong. But a reimplementer reading the name rather than the target would plausibly route to `/dashboard`, re-enter `PreConditions`, and need to re-derive termination.

**Action:** preserve the target `/`. Rename the predicate.
**Evidence:** `PreConditions.tsx:80,161`; `App.tsx` route table. Confidence: High.

### AN-3 — An absent `defaultOrganisationId` behaves differently from a `null` one

`O !== null` is `true` when `O` is `undefined`. So a response that **omits** the field routes the user to `/create-account`, while a response that sends `"defaultOrganisationId": null` routes the same user to `/create-contact`.

Routing therefore depends on the API's JSON serialisation policy for null fields — a coupling that is invisible from the client code and would not survive a backend serialiser change, an OpenAPI regeneration, or the move to `openapi-typescript` in the target platform.

**Action:** normalise the field at the boundary (coerce absent → `null`) before evaluating any redirect, and assert the chosen policy in a test.
**Evidence:** `PreConditions.tsx:70`; indeterminate-state table rows 3–4. Confidence: High.

### AN-4 — Redirects are suppressed while account state loads

Because every comparison is strict, `account === null` or an unpopulated `details` object yields `false` for all four predicates, and the requested page renders. A user who has not completed onboarding will therefore briefly see the real page before account state arrives and the redirect fires.

This is not an authorisation hole — `MsalAuthenticationTemplate` in `AuthenticatedElement` gates authentication independently, so an unauthenticated user never reaches this code. It is a flash of content the user is not yet entitled to *see in this flow*, and it is observable behaviour that a reimplementation with a loading state would change.

**Action:** decide explicitly whether the new implementation renders, blocks, or shows a loading state while account details resolve. Any of the three is defensible; picking one by accident is not.
**Evidence:** `PreConditions.tsx:30,69–93`; indeterminate-state table rows 1–2. Confidence: High.

### AN-5 — Path matching is substring-based, not route-based

`path.includes('create-account')` matches any path containing that substring anywhere. No collisions exist today (verified above), but the safety is coincidental. A future route such as `/admin/create-account-template` would silently join P1 and disable the create-account redirect on itself.

**Action:** match on route identity in the reimplementation, not on substrings.
**Evidence:** `PreConditions.tsx:72,77–78,83–84`; collision check against all `App.tsx` paths. Confidence: High.

### AN-6 — `children` is typed `any` at the security boundary

`PreConditionsProps.children` is `any` (line 21), disabling type checking at the component that owns four authentication-dependent redirects.

**Action:** type as `ReactNode` in the reimplementation. The target's `RequireAuth` is the place not to repeat this.
**Evidence:** `PreConditions.tsx:21`. Confidence: High.

## Modal orchestration

A separate concern that shares the same component and the same inputs. It does **not** affect redirects, and redirects are evaluated first — so a redirecting render never shows a modal.

| Modal | Condition |
| --- | --- |
| Terms & Conditions | `isAuthenticated && T === false` |
| Branch selector (automatic) | `isAuthenticated && T === true && O === null && C === true && !path.includes('success-creating-account')` |
| Branch selector (manual) | `modalState.showBranchSelector`, seeded from `getBranchModalNotification()` in session storage, or set via `ModalDispatchCtx` |
| RFQ delete | `modalState.showRFQDeleteModal` only |

Three behaviours worth recording:

1. **T&C and the automatic branch selector are mutually exclusive** — one requires `T === false`, the other `T === true`.
2. **The branch selector latches.** The effect at lines 98–106 sets `showBranchSelector: true` when `autoShowBranchSelector` becomes true, but nothing sets it back to `false` when the condition lapses. Once opened it stays in state until an explicit `setShowBranchSelector(false)`. Combined with `showBranchSelector = autoShowBranchSelector || modalState.showBranchSelector` (line 95), this is a one-way latch by design — reproduce it deliberately or change it deliberately.
3. **The RFQ delete modal renders only in the with-layout branch.** `renderWithLayout` includes `<RFQDeleteModal />`; `renderWithoutLayout` does not. It therefore cannot appear on any route passing `displayHeaderAndFooter={false}` — which is every wizard route. Confirm this is intended.

Any open modal sets `isModalOpen`, which applies `inert` to the content wrapper (line 168) — a documented workaround for React 18 lacking `inert` support. React 19 supports `inert` natively, so the target platform should use the real attribute.

## Migration checklist

- [x] Confirm **AN-1** with the backend team — done 2026-09-01; contract confirmed, fix applied
- [x] Normalise absent vs `null` `defaultOrganisationId` (**AN-3**) — resolved by loose `!= null`; the API never emits `null`
- [ ] Fix `AccountProvider.tsx:53` `isDefaultOrganisation` — always `true` for the same reason. Confirmed as intended and **never read anywhere in app code**, so consider deleting the field rather than fixing it
- [ ] Make `autoShowBranchSelector` live — requires fixing the `BranchSelectorModal` trap first (disable *Continue* without a selection; provide an exit when no organisation is set)
- [ ] Decide the loading-state policy (**AN-4**)
- [ ] Port this table into the target as executable tests before implementing the redirects
- [ ] Preserve `/` as rule 3's target, or re-verify termination (**AN-2**)
- [ ] Replace substring matching with route matching (**AN-5**)
- [ ] Reproduce or consciously change the branch-selector latch
- [ ] Use native `inert` rather than the React 18 workaround

## Related

- [`runtime-contracts.md`](runtime-contracts.md) — the broader set of behaviours the migration must preserve
- [`org-switching-lifecycle.md`](org-switching-lifecycle.md) — branch selector and target-organisation storage
- [`ClientApp/src/authentication/AuthenticatedElement.tsx`](../../ClientApp/src/authentication/AuthenticatedElement.tsx) — the guard that wraps `PreConditions`
