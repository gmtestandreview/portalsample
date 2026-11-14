# Wizard Props Consolidation Implementation Plan

**Goal:** Remove the exact clones inside the acceptQuote and ta wizard
`*Props.ts` families without changing any step's load, save, redirect or error
behaviour.

**Architecture:** Two small, precisely named helpers.
`createAuthenticatedClient` replaces the repeated construct /
`acquireTokenSilent` / `setAuthToken` sequence. `acceptQuoteRedirectionOnError`
replaces the three identical redirect handlers. Each call site keeps its own
`try`/`catch`, logging and account guard, because those differ per step and are
not duplication.

**Tech Stack:** React 18, TypeScript (strict, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`), MSAL (`@azure/msal-browser`), NSwag clients in
`ClientApp/src/api/web-api-client.ts` (never edited), Vitest 5
(`vitest.unit.config.ts`), ESLint, Oxfmt, jscpd 5.

## Source Inputs

- jscpd exact-clone scan:
  `npx -y jscpd@5 ClientApp/src --format typescript,tsx --min-tokens 50 --min-lines 5 --ignore "**/*.test.*,**/*.stories.*,**/*.d.ts,**/__tests__/**,**/__fixtures__/**,**/fixtures/**" --reporters json,console --output <dir>`.
  Baseline: 378 files, 506 clones, 15.01% lines, 20.10% tokens.
- Clone ranges in scope:
  - acceptQuote:
    `deliveryAndReturnProps.ts:85-109 ~ paymentDetailsProps.ts:95-119` (25
    lines),
    `deliveryAndReturnProps.ts:88-109 ~ reportRecipientProps.ts:102-123`,
    `paymentDetailsProps.ts:104-121 ~ reportRecipientProps.ts:108-125`, and
    10-12 line client-setup clones at `deliveryAndReturnProps.ts:35-44` and
    `:66-76`, `paymentDetailsProps.ts:67-78`, `reportRecipientProps.ts:63-74`,
    `summaryAndAcceptProps.ts:34-43` and `:61-71`.
  - ta: `applicationAndInstrumentProps.ts:104-114` ~
    `organisationAndContactProps.ts:77-87` ~
    `supportingDocumentsProps.ts:77-87`;
    `applicationAndInstrumentProps.ts:104-116 ~ summaryAndSubmitProps.ts:97-109`;
    `organisationAndContactProps.ts:27-37 ~ supportingDocumentsProps.ts:25-35`.
- Files inspected:
  - `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts`,
    `paymentDetailsProps.ts`, `reportRecipientProps.ts`: the three
    `getRedirectionLocationOnError` handlers are textually identical.
  - `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`: its handler
    differs (`/request-for-quote/${id}/view-summary`, a different deletion
    message, `HttpStatusCode` enum constants), so it is retained as is.
  - `ClientApp/src/routes/ta/*Props.ts`, `ta/manage/appDetailsProps.ts`: same
    client-setup sequence, with per-step `try`/`catch` variants.
  - `ClientApp/src/authentication/silentRequest.ts`: `silentRequestFor(account)`
    is the existing token-request builder the helper reuses.
  - `tests/unit/routes/acceptQuote/props.test.ts` (redirect assertions near
    lines 231-258 and 303) and `tests/unit/routes/ta/props.test.ts`: existing
    behaviour tests that must stay green and unmodified.
  - `ClientApp/src/storybook/coverageManifest.json`,
    `scripts/storybook-coverage.mjs`: governance records for these files (see
    Safety).

## Assumptions and Unknowns

- Assumption: `AcceptQuoteClient` and `RequestForPatternApprovalClient` have a
  no-argument constructor and `setAuthToken(token: string)`. Verify before Task
  1 step 3 with `grep -n "setAuthToken" ClientApp/src/api/web-api-client.ts`.
- Assumption: call sites that use `tokenResult` for anything other than
  `setAuthToken(tokenResult.accessToken)` are left untouched; the implementer
  lists them in the task report.
- Kept per call site, not consolidated: load/save error handling (delivery load
  rethrows raw; payment and reportRecipient log, then rethrow or swallow),
  `discardChanges` variants, `hidingFields`, validation wiring, and
  `summaryAndAcceptProps` redirect handling.
- Human gate (not a code unknown): edits make the manifest digests for touched
  governed files stale; a reviewer must re-attest them (Safety section). The
  implementer never edits digests.

## Requirement Traceability

| Requirement                                                       | Task(s) | Notes                                                                  |
| ----------------------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| One authenticated-client helper used by acceptQuote steps         | 1       | New `authentication/authenticatedClient.ts`                            |
| One acceptQuote redirect handler replacing three identical copies | 1       | New `routes/acceptQuote/redirection.ts`                                |
| ta steps use the same client helper                               | 2       | No new ta helper                                                       |
| No behaviour change                                               | 1, 2    | Existing `props.test.ts` suites unmodified and green; new helper tests |
| Duplication measurably reduced under the same jscpd settings      | 1, 2    | Compare with the 506-clone baseline                                    |
| Governance not weakened                                           | 1, 2    | Reviewer re-attestation gate                                           |

## Framework Fit

Vertical slices (one family per task), test-first, risk-first (existing
characterisation tests are the safety net). No DDD, C4, ADR or threat model: the
helpers are internal plumbing with no new trust boundary and the token flow is
unchanged (still `silentRequestFor`). The helper must not log or return the
token.

## Files and Responsibilities

| Path                                                         | Action | Responsibility                                              |
| ------------------------------------------------------------ | ------ | ----------------------------------------------------------- |
| `ClientApp/src/authentication/authenticatedClient.ts`        | Create | `createAuthenticatedClient(ClientType, accounts, instance)` |
| `tests/unit/authentication/authenticatedClient.test.ts`      | Create | Helper unit tests                                           |
| `ClientApp/src/routes/acceptQuote/redirection.ts`            | Create | `acceptQuoteRedirectionOnError(id)`                         |
| `tests/unit/routes/acceptQuote/redirection.test.ts`          | Create | Handler unit tests                                          |
| `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts` | Modify | Use both helpers                                            |
| `ClientApp/src/routes/acceptQuote/paymentDetailsProps.ts`    | Modify | Use both helpers                                            |
| `ClientApp/src/routes/acceptQuote/reportRecipientProps.ts`   | Modify | Use both helpers                                            |
| `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`  | Modify | Client helper only                                          |
| `ClientApp/src/routes/ta/applicationAndInstrumentProps.ts`   | Modify | Client helper                                               |
| `ClientApp/src/routes/ta/organisationAndContactProps.ts`     | Modify | Client helper                                               |
| `ClientApp/src/routes/ta/summaryAndSubmitProps.ts`           | Modify | Client helper                                               |
| `ClientApp/src/routes/ta/supportingDocumentsProps.ts`        | Modify | Client helper                                               |
| `ClientApp/src/routes/ta/manage/appDetailsProps.ts`          | Modify | Client helper (one site)                                    |

## Tasks

### Task 1: acceptQuote family (both helpers, four step files)

#### Files

- Create: `ClientApp/src/authentication/authenticatedClient.ts`,
  `ClientApp/src/routes/acceptQuote/redirection.ts`
- Create (tests): `tests/unit/authentication/authenticatedClient.test.ts`,
  `tests/unit/routes/acceptQuote/redirection.test.ts`
- Modify: `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts`,
  `paymentDetailsProps.ts`, `reportRecipientProps.ts`,
  `summaryAndAcceptProps.ts`
- Test (existing, unmodified): `tests/unit/routes/acceptQuote/props.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/unit/authentication/authenticatedClient.test.ts`:

```ts
import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';
import { createAuthenticatedClient } from '../../../ClientApp/src/authentication/authenticatedClient';

class FakeClient {
  token: string | undefined;
  setAuthToken(token: string) {
    this.token = token;
  }
}

const account = { homeAccountId: 'home-1' } as AccountInfo;

describe(createAuthenticatedClient, () => {
  it('acquires a silent token for the first account and hands it to the client', async () => {
    expect.assertions(3);

    const acquireTokenSilent = vi
      .fn<IPublicClientApplication['acquireTokenSilent']>()
      .mockResolvedValue({ accessToken: 'token-1' } as never);
    const instance = {
      acquireTokenSilent,
    } as unknown as IPublicClientApplication;

    const client = await createAuthenticatedClient(
      FakeClient,
      [account],
      instance,
    );

    expect(client).toBeInstanceOf(FakeClient);
    expect(client.token).toBe('token-1');
    expect(acquireTokenSilent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ account }),
    );
  });

  it('propagates a token acquisition failure unchanged', async () => {
    expect.assertions(1);

    const failure = new Error('interaction required');
    const instance = {
      acquireTokenSilent: vi
        .fn<IPublicClientApplication['acquireTokenSilent']>()
        .mockRejectedValue(failure),
    } as unknown as IPublicClientApplication;

    await expect(
      createAuthenticatedClient(FakeClient, [account], instance),
    ).rejects.toBe(failure);
  });
});
```

`tests/unit/routes/acceptQuote/redirection.test.ts`: mock
`ClientApp/src/storage/notification` with the same `vi.mock` block used at the
top of `tests/unit/routes/acceptQuote/props.test.ts`, then assert:

- `(412, ErrorType.Load)` returns `/accept-quote/Q-1/view-summary` and sends no
  notification.
- `(404, ErrorType.Update)` returns `/` and calls `setDashboardNotification`
  once with
  `{ message: 'Another person has deleted this request. Your changes have not been saved.', severity: NotificationSeverity.Error }`.
- `(500, ErrorType.Load)` and `(412, ErrorType.Update)` return `undefined` and
  send no notification.

- [ ] **Step 2: Verify the tests fail**

Run:
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --reporter=default -c vitest.unit.config.ts tests/unit/authentication/authenticatedClient.test.ts tests/unit/routes/acceptQuote/redirection.test.ts`
Expected: FAIL with "Failed to resolve import" for the two missing modules.

- [ ] **Step 3: Implement the minimal change**

`ClientApp/src/authentication/authenticatedClient.ts`:

```ts
import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { silentRequestFor } from './silentRequest';

interface TokenAuthenticatedClient {
  setAuthToken(token: string): void;
}

/** Builds an API client and authenticates it with a silent token for the first account. */
export const createAuthenticatedClient = async <
  T extends TokenAuthenticatedClient,
>(
  ClientType: new () => T,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
): Promise<T> => {
  const client = new ClientType();
  const tokenResult = await instance.acquireTokenSilent(
    silentRequestFor(accounts[0]),
  );
  client.setAuthToken(tokenResult.accessToken);
  return client;
};
```

`ClientApp/src/routes/acceptQuote/redirection.ts`: move the existing
`getRedirectionLocationOnError` body from `deliveryAndReturnProps.ts` verbatim
and export it as
`acceptQuoteRedirectionOnError = (id: string) => (errorCode: number, errorType: ErrorType) => ...`.
Move the imports it needs (`ErrorType`, `setDashboardNotification`,
`NotificationSeverity`) and use `HttpStatusCode.PreconditionFailed` and
`HttpStatusCode.NotFound` directly in place of the `preconditionFailedStatus` /
`notFoundStatus` constants.

In `deliveryAndReturnProps.ts`, `paymentDetailsProps.ts` and
`reportRecipientProps.ts`: delete the local `getRedirectionLocationOnError`,
`preconditionFailedStatus` and `notFoundStatus`, import
`acceptQuoteRedirectionOnError`, and use
`getRedirectionLocationOnError: acceptQuoteRedirectionOnError(id)` in the
returned props.

In all four step files, replace each exact sequence

```ts
const client = new AcceptQuoteClient();
const tokenResult = await instance.acquireTokenSilent(
  silentRequestFor(accounts[0]),
);
client.setAuthToken(tokenResult.accessToken);
```

with
`const client = await createAuthenticatedClient(AcceptQuoteClient, accounts, instance);`.
Keep every surrounding `if (accounts.length > 0)`, `try`/`catch`, `AppLogger`
call and `throw` exactly as is. Remove imports that become unused (ESLint names
them). Do not touch `summaryAndAcceptProps.ts`'s own redirect handler.

- [ ] **Step 4: Verify the new tests pass**

Run the Step 2 command. Expected: PASS, 2 files.

- [ ] **Step 5: Run relevant regression checks**

Run:
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --reporter=default -c vitest.unit.config.ts tests/unit/routes/acceptQuote tests/unit/routes/workflowStepComponents.test.tsx tests/unit/routes/workflowWrappers.test.tsx`
Expected: all pass, no new stderr warnings.

Run: `npm run type-check` and
`npx eslint ClientApp/src/authentication ClientApp/src/routes/acceptQuote tests/unit/authentication tests/unit/routes/acceptQuote`
Expected: exit 0, no warnings.

Run:
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --reporter=default --config vitest.storybook.config.ts ClientApp/src/routes/acceptQuote`
Expected: all pass.

Run: `npm run test:unit:coverage` Expected: exit 0 with all four metrics at 100%
(the new helpers' branches are covered by the new tests).

Run the jscpd command from Source Inputs. Expected: the acceptQuote props clones
listed above no longer appear and the total clone count is below 506.

- [ ] **Step 6: Commit**

```bash
git add ClientApp/src/authentication/authenticatedClient.ts ClientApp/src/routes/acceptQuote tests/unit/authentication/authenticatedClient.test.ts tests/unit/routes/acceptQuote/redirection.test.ts
git commit -m "refactor: share authenticated client setup and acceptQuote redirect handler"
```

### Task 2: ta family (client helper, five step files)

Depends on Task 1 (the helper must exist and be committed).

#### Files

- Modify: `ClientApp/src/routes/ta/applicationAndInstrumentProps.ts`,
  `organisationAndContactProps.ts`, `summaryAndSubmitProps.ts`,
  `supportingDocumentsProps.ts`,
  `ClientApp/src/routes/ta/manage/appDetailsProps.ts`
- Test (existing, unmodified): `tests/unit/routes/ta/props.test.ts`,
  `tests/unit/routes/ta/applicationForTypeApproval.test.tsx`,
  `tests/unit/routes/ta/appDetails.test.tsx`

- [ ] **Step 1: Characterise before editing**

Run the baseline:
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --reporter=default -c vitest.unit.config.ts tests/unit/routes/ta`
Expected: all pass. Record the pass count. Then confirm each save and load path
in the five files has a test that reaches it: `npm run test:unit:coverage` must
already show 100% for these files (it does at the plan's base commit). If a path
is not covered, stop and report; do not refactor an uncovered path.

- [ ] **Step 2: Verify the safety net would fail on a broken swap**

In `ClientApp/src/routes/ta/organisationAndContactProps.ts` temporarily change
one `setAuthToken(tokenResult.accessToken)` argument to `''` and run
`tests/unit/routes/ta/props.test.ts`. Expected: at least one test fails. Undo
the temporary edit by hand and confirm with
`git diff -- ClientApp/src/routes/ta/organisationAndContactProps.ts` that the
file is unchanged. If nothing fails, add the missing assertion for
`setAuthToken` to the existing test before continuing.

- [ ] **Step 3: Implement the minimal change**

In each of the five files, replace each exact sequence

```ts
const client = new RequestForPatternApprovalClient();
const tokenResult = await instance.acquireTokenSilent(
  silentRequestFor(accounts[0]),
);
client.setAuthToken(tokenResult.accessToken);
```

with
`const client = await createAuthenticatedClient(RequestForPatternApprovalClient, accounts, instance);`
and import `createAuthenticatedClient` from
`../../authentication/authenticatedClient`
(`../../../authentication/authenticatedClient` in `ta/manage/`). Leave a site
untouched, and list it in the task report, when `tokenResult` is used for
anything other than `setAuthToken`. Keep each `try`/`catch`, `AppLogger` call,
the `valuesToSave` cloning and the `delete valuesToSave...` statements
unchanged. Remove imports that become unused.

- [ ] **Step 4: Verify the characterisation tests still pass**

Run the Step 1 command. Expected: same pass count as the baseline, no new stderr
warnings.

- [ ] **Step 5: Run relevant regression checks**

Run: `npm run type-check`, then `npx eslint ClientApp/src/routes/ta` Expected:
exit 0, no warnings.

Run:
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --reporter=default --config vitest.storybook.config.ts ClientApp/src/routes/ta`
Expected: all pass.

Run: `npm run test:unit:coverage` Expected: exit 0 with all four metrics at
100%.

Run the jscpd command from Source Inputs. Expected: the ta props clones listed
above no longer appear; record the final clone, line and token figures against
the 506 / 15.01% / 20.10% baseline.

- [ ] **Step 6: Commit**

```bash
git add ClientApp/src/routes/ta
git commit -m "refactor: use shared authenticated client setup in ta wizard props"
```

## Safety, Rollback, and Verification

- Risk: authentication flow. The helper performs the same three operations in
  the same order as the code it replaces (construct,
  `acquireTokenSilent(silentRequestFor(accounts[0]))`, `setAuthToken`). The risk
  is a call site where an error was caught differently; keeping each
  `try`/`catch` in place and running the existing behaviour suites unmodified
  covers it.
- Risk: governance. Each touched file with a manifest record has a digest that
  will go stale, and the two new files add exports with no claim.
  `node scripts/storybook-coverage.mjs --mode source --manifest ClientApp/src/storybook/coverageManifest.json --source-root .`
  reports them. Implementers must not edit `coverageManifest.json`. After each
  task the controller prepares an updated review package
  (`docs/review-packages/`) and the reviewer re-attests; only then are digests
  and new claims written.
- Verification: type-check, lint, unit coverage at 100%, Storybook tests for the
  touched route directories, jscpd with the baseline settings, manifest CLI diff
  against the pre-task error list (only the files touched by the task may change
  status).
- Rollback: each task is one commit. `git revert <task commit>` restores the
  previous state; nothing is data-changing or deployed.

## Final Validation

- Requirement coverage: PASS (every row in the traceability table maps to a
  task)
- Exact paths: PASS (all paths taken from the inspected tree; helper locations
  are new and named)
- Tests before implementation: PASS (Task 1 writes failing helper tests first;
  Task 2 relies on existing behaviour suites and checks them with a
  deliberate-failure probe)
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered where needed: PASS
- Score: self-assessed 96/100 (not independently reviewed)
- Critical failures: None known

## Execution Handoff

- Plan path: `docs/plans/2026-11-12-wizard-props-consolidation.md`
- Blocking unknowns: none for the code; the reviewer re-attestation of touched
  manifest records is required before the branch is considered governance-clean.
  The earlier sign-off is not yet reflected in the manifest (the CLI still
  reports 328 errors, 57 of them under acceptQuote and ta), so confirm it was
  recorded.
- Supported execution mode: subagent-driven-development, sequential (Task 2
  depends on Task 1).
