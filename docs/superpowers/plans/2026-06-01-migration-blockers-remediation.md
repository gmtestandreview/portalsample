# Migration Blockers Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the six Priority 1 migration blockers so the portal can proceed to target-platform migration with security, runtime configuration, and route-parameter risks resolved.

**Architecture:** Keep fixes small and local: add reusable URL/route utilities, harden affected first-party call sites, and add unit tests around the migration-gating behavior. Treat `ClientApp/src/api/web-api-client.ts` as generated-but-patched for this snapshot; preserve its generated shape and only alter `AuthorizedApiBase`.

**Tech Stack:** React 18, TypeScript, React Router v6, MSAL v3, Vitest, React Testing Library, NSwag-generated API client.

---

## Scope And Evidence

This plan resolves:

| ID | Blocker | Primary files |
| --- | --- | --- |
| `SEC-MOD-003` | `window.open()` without explicit `noopener` / URL encoding review | `ClientApp/src/routes/quotation/quoteDetails.tsx`, `ClientApp/src/routes/measurementReport/reportDetails.tsx`, `ClientApp/src/routes/common/helperFunctions.ts` |
| `SEC-MOD-009` | External Qualtrics links missing explicit `noopener noreferrer` | `ClientApp/src/routes/requestForQuote/created/index.tsx`, `ClientApp/src/components/Header/NavbarMessage.tsx`, `ClientApp/src/routes/dashboard/index.tsx` |
| `RUNTIME-ENV-001` | `process.env.NODE_ENV` usage in first-party runtime code | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| `BRIEF-SEC-001` | Fresh `TargetOrganisationAbn` read per API request | `ClientApp/src/api/web-api-client.ts` |
| `BRIEF-SEC-009` | MSAL silent-renewal iframe timeout bound | `ClientApp/src/authentication/authConfig.ts` |
| `BRIEF-SEC-011` | URL ID parameter validation before API calls | `ClientApp/src/routes/requestForQuote/index.tsx`, `ClientApp/src/routes/account/update/index.tsx` |

Do not edit generated bundles, vendor mirrors, `ClientApp/src/external/**`, `ClientApp/src/parent/**`, or source-map mirrors.

## File Structure

| File | Responsibility |
| --- | --- |
| `ClientApp/src/routes/common/openWindow.ts` | New single helper for opening internal routes and PDF/blob URLs with `noopener,noreferrer`, URL encoding, and `opener` nulling fallback. |
| `tests/unit/routes/common/openWindow.test.ts` | Unit tests proving the helper passes secure features, validates local paths, encodes PDF fragments, and clears `opener`. |
| `ClientApp/src/routes/common/routeParams.ts` | New route-param validators for positive integer IDs and RFQ application IDs. |
| `tests/unit/routes/common/routeParams.test.ts` | Unit tests for valid, missing, malformed, zero, negative, and encoded route IDs. |
| `ClientApp/src/routes/quotation/quoteDetails.tsx` | Replace ad-hoc blank-window navigation with `openInternalRouteInNewTab`. |
| `ClientApp/src/routes/measurementReport/reportDetails.tsx` | Same quote-request new-tab hardening for report detail page. |
| `ClientApp/src/routes/common/helperFunctions.ts` | Replace direct PDF `window.open` calls with helper calls. |
| `ClientApp/src/routes/requestForQuote/index.tsx` | Validate `:id` before API calls and wizard prop creation; redirect invalid IDs to `/not-found`. |
| `ClientApp/src/routes/account/update/index.tsx` | Validate numeric `:id` before `Number()` conversion; redirect invalid IDs to `/not-found`. |
| `ClientApp/src/components/Header/NavbarMessage.tsx` | Add explicit `rel='external noopener noreferrer'` on Qualtrics anchor. |
| `ClientApp/src/routes/requestForQuote/created/index.tsx` | Add explicit `noopener noreferrer` on Qualtrics link. |
| `ClientApp/src/routes/dashboard/index.tsx` | Remove stale Qualtrics target comment; rely on `StandardPathway` rel hardening. |
| `ClientApp/src/components/tiles/StandardPathway/index.tsx` | Normalize external `_blank` rel to exactly include `noopener noreferrer`. |
| `ClientApp/src/instrumentation/AppInsightsService.ts` | Remove runtime `process.env.NODE_ENV`; use `env.REACT_APP_ENVIRONMENT` for development warning. |
| `tests/unit/instrumentation/appInsightsService.test.ts` | Extend tests to cover development warning without `process.env.NODE_ENV`. |
| `ClientApp/src/api/web-api-client.ts` | Move `sessionStorage.getItem('targetOrganisation')` into `transformOptions`; tolerate malformed JSON. |
| `tests/unit/api/authorizedApiBase.test.ts` | Unit test proving `TargetOrganisationAbn` is read fresh on each request. |
| `ClientApp/src/authentication/authConfig.ts` | Set `system.loadFrameTimeout` to `6000`. |
| `tests/unit/authentication/authConfig.test.ts` | Unit test for MSAL timeout bounds. |
| `docs/change-record/OPEN-ITEMS-BACKLOG.md` | Mark six blockers closed with evidence after tests pass. |
| `docs/change-record/OPEN-ITEMS-BACKLOG-REPORT.html` | Update HTML report row statuses after markdown backlog is updated. |

---

### Task 1: Secure New-Tab Helper

**Files:**
- Create: `ClientApp/src/routes/common/openWindow.ts`
- Create: `tests/unit/routes/common/openWindow.test.ts`
- Modify: `ClientApp/src/routes/quotation/quoteDetails.tsx`
- Modify: `ClientApp/src/routes/measurementReport/reportDetails.tsx`
- Modify: `ClientApp/src/routes/common/helperFunctions.ts`

- [ ] **Step 1: Write failing tests for secure window opening**

Create `tests/unit/routes/common/openWindow.test.ts`:

```ts
import {
    openInternalRouteInNewTab,
    openPdfPageInSecureNewTab,
    openUrlInSecureNewTab,
} from '../../../../ClientApp/src/routes/common/openWindow';

describe('openWindow helpers', () => {
    const originalOpen = window.open;

    afterEach(() => {
        window.open = originalOpen;
        vi.restoreAllMocks();
    });

    it('opens internal routes with noopener,noreferrer and clears opener fallback', () => {
        const openedWindow = { opener: {} } as Window;
        const open = vi.fn().mockReturnValue(openedWindow);
        window.open = open as typeof window.open;

        openInternalRouteInNewTab('/request-for-quote/123/view-summary');

        expect(open).toHaveBeenCalledWith(
            '/request-for-quote/123/view-summary',
            '_blank',
            'noopener,noreferrer',
        );
        expect(openedWindow.opener).toBeNull();
    });

    it('does not open external or protocol-relative routes through internal route helper', () => {
        const open = vi.fn();
        window.open = open as typeof window.open;

        openInternalRouteInNewTab('https://example.test/request');
        openInternalRouteInNewTab('//example.test/request');
        openInternalRouteInNewTab('javascript:alert(1)');

        expect(open).not.toHaveBeenCalled();
    });

    it('encodes PDF page fragments before opening the URL', () => {
        const open = vi.fn().mockReturnValue(null);
        window.open = open as typeof window.open;

        openPdfPageInSecureNewTab('blob:https://portal.measurement.gov.au/pdf-id', '2&evil=1');

        expect(open).toHaveBeenCalledWith(
            'blob:https://portal.measurement.gov.au/pdf-id#page=2%26evil%3D1',
            '_blank',
            'noopener,noreferrer',
        );
    });

    it('opens blob URLs with secure features', () => {
        const open = vi.fn().mockReturnValue(null);
        window.open = open as typeof window.open;

        openUrlInSecureNewTab('blob:https://portal.measurement.gov.au/pdf-id');

        expect(open).toHaveBeenCalledWith(
            'blob:https://portal.measurement.gov.au/pdf-id',
            '_blank',
            'noopener,noreferrer',
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:unit -- tests/unit/routes/common/openWindow.test.ts --reporter=verbose
```

Expected: FAIL because `ClientApp/src/routes/common/openWindow.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `ClientApp/src/routes/common/openWindow.ts`:

```ts
const NEW_TAB_TARGET = '_blank';
const NO_OPENER_FEATURES = 'noopener,noreferrer';

const isSafeInternalRoute = (url: string): boolean => (
    url.startsWith('/')
    && !url.startsWith('//')
    && !/^[a-z][a-z\d+\-.]*:/i.test(url)
);

export const openUrlInSecureNewTab = (url: string): void => {
    const openedWindow = window.open(url, NEW_TAB_TARGET, NO_OPENER_FEATURES);
    if (openedWindow) {
        openedWindow.opener = null;
    }
};

export const openInternalRouteInNewTab = (route: string): void => {
    if (!isSafeInternalRoute(route)) {
        return;
    }
    openUrlInSecureNewTab(route);
};

export const openPdfPageInSecureNewTab = (fileUrl: string, pageNumber: string): void => {
    openUrlInSecureNewTab(`${fileUrl}#page=${encodeURIComponent(pageNumber)}`);
};
```

- [ ] **Step 4: Replace direct `window.open` call sites**

In `ClientApp/src/routes/quotation/quoteDetails.tsx`, add the import:

```ts
import { openInternalRouteInNewTab } from '../common/openWindow';
```

Replace `showQuoteRequest` with:

```ts
    const showQuoteRequest = () => {
        if (quotationData?.quoteRequestIdNum) {
            openInternalRouteInNewTab(`/request-for-quote/${encodeURIComponent(quotationData.quoteRequestIdNum)}/view-summary`);
        }
    };
```

In `ClientApp/src/routes/measurementReport/reportDetails.tsx`, add the import:

```ts
import { openInternalRouteInNewTab } from '../common/openWindow';
```

Replace `showQuoteRequest` with:

```ts
    const showQuoteRequest = () => {
        if (reportData?.quoteRequestIdNum) {
            openInternalRouteInNewTab(`/request-for-quote/${encodeURIComponent(reportData.quoteRequestIdNum)}/view-summary`);
        }
    };
```

In `ClientApp/src/routes/common/helperFunctions.ts`, add:

```ts
import { openPdfPageInSecureNewTab, openUrlInSecureNewTab } from './openWindow';
```

Replace:

```ts
export const openInNewTab = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
};

export const openPdfPageInNewTab = (fileUrl: string, pageNumber: string) => {
    const url = `${fileUrl}#page=${pageNumber}`;
    window.open(url, '_blank');
};
```

with:

```ts
export const openInNewTab = (fileUrl: string) => {
    openUrlInSecureNewTab(fileUrl);
};

export const openPdfPageInNewTab = (fileUrl: string, pageNumber: string) => {
    openPdfPageInSecureNewTab(fileUrl, pageNumber);
};
```

- [ ] **Step 5: Run focused and search verification**

Run:

```powershell
npm run test:unit -- tests/unit/routes/common/openWindow.test.ts --reporter=verbose
rg -n "window\.open\(" ClientApp/src -g "*.ts" -g "*.tsx"
```

Expected: test PASS; `rg` finds no first-party direct `window.open(` outside `ClientApp/src/routes/common/openWindow.ts` and ignored vendor/source mirrors.

- [ ] **Step 6: Commit**

```powershell
git add ClientApp/src/routes/common/openWindow.ts tests/unit/routes/common/openWindow.test.ts ClientApp/src/routes/quotation/quoteDetails.tsx ClientApp/src/routes/measurementReport/reportDetails.tsx ClientApp/src/routes/common/helperFunctions.ts
git commit -m "fix: harden new-tab window opening"
```

---

### Task 2: Qualtrics Link Rel Hardening

**Files:**
- Modify: `ClientApp/src/components/Header/NavbarMessage.tsx`
- Modify: `ClientApp/src/routes/requestForQuote/created/index.tsx`
- Modify: `ClientApp/src/components/tiles/StandardPathway/index.tsx`
- Modify: `ClientApp/src/routes/dashboard/index.tsx`
- Test: `tests/unit/components/buildRegressionSmoke.test.tsx` or create `tests/unit/components/standardPathway.test.tsx`

- [ ] **Step 1: Write failing tests for external rel behavior**

Create `tests/unit/components/standardPathway.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import StandardPathway from '../../../ClientApp/src/components/tiles/StandardPathway';

describe('StandardPathway external links', () => {
    it('uses explicit noopener noreferrer on new-tab external links', () => {
        render(
            <StandardPathway
                type='external'
                title='Give us your feedback'
                linkDescription=' '
                bodyText='Feedback survey'
                linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                target='_blank'
            />,
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
});
```

- [ ] **Step 2: Run test to verify baseline**

Run:

```powershell
npm run test:unit -- tests/unit/components/standardPathway.test.tsx --reporter=verbose
```

Expected: PASS if `StandardPathway` is already hardened; keep the test because it prevents regression. If it fails, implement Step 3.

- [ ] **Step 3: Normalize external link rel values**

In `ClientApp/src/components/tiles/StandardPathway/index.tsx`, keep `noopener` and `noreferrer` explicit:

```ts
    const rel = target === '_blank'
        ? 'noopener noreferrer nofollow'
        : undefined;
```

In `ClientApp/src/components/Header/NavbarMessage.tsx`, change:

```tsx
            rel='external'
            target='NMI-Feedback'
```

to:

```tsx
            rel='external noopener noreferrer'
            target='_blank'
```

In `ClientApp/src/routes/requestForQuote/created/index.tsx`, change:

```tsx
                                    rel='external'
                                    target='NMI-Feedback'
```

to:

```tsx
                                    rel='external noopener noreferrer'
                                    target='_blank'
```

In `ClientApp/src/routes/dashboard/index.tsx`, remove the stale target comment:

```tsx
                            target='_blank'
```

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run test:unit -- tests/unit/components/standardPathway.test.tsx --reporter=verbose
rg -n "industry\.au1\.qualtrics\.com|target='NMI-Feedback'|rel='external'" ClientApp/src -g "*.tsx"
```

Expected: test PASS; no `target='NMI-Feedback'`; any Qualtrics raw anchors have `rel` containing `noopener noreferrer`; `StandardPathway` covers card links.

- [ ] **Step 5: Commit**

```powershell
git add ClientApp/src/components/Header/NavbarMessage.tsx ClientApp/src/routes/requestForQuote/created/index.tsx ClientApp/src/components/tiles/StandardPathway/index.tsx ClientApp/src/routes/dashboard/index.tsx tests/unit/components/standardPathway.test.tsx
git commit -m "fix: add explicit noopener to survey links"
```

---

### Task 3: Runtime Environment Telemetry Guard

**Files:**
- Modify: `ClientApp/src/instrumentation/AppInsightsService.ts`
- Modify: `tests/unit/instrumentation/appInsightsService.test.ts`

- [ ] **Step 1: Add failing test proving warning uses runtime env**

Append to `tests/unit/instrumentation/appInsightsService.test.ts`:

```ts
    it('warns about disabled telemetry only in runtime development environment', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: vi.fn(),
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
                REACT_APP_ENVIRONMENT: 'development',
            },
        }));

        await import('@/instrumentation/AppInsightsService');

        expect(warn).toHaveBeenCalledWith(
            '[AppInsights] Telemetry is DISABLED: missing or dummy connection string.',
        );
    });
```

- [ ] **Step 2: Run focused test to verify current risk**

Run:

```powershell
npm run test:unit -- tests/unit/instrumentation/appInsightsService.test.ts --reporter=verbose
```

Expected: the new test may pass because Vitest defines `process.env.NODE_ENV`; the next search check must still fail:

```powershell
rg -n "process\.env\.NODE_ENV" ClientApp/src -g "*.ts" -g "*.tsx"
```

Expected: finds `ClientApp/src/instrumentation/AppInsightsService.ts`.

- [ ] **Step 3: Remove `process.env.NODE_ENV` from first-party runtime code**

In `ClientApp/src/instrumentation/AppInsightsService.ts`, replace:

```ts
        if (process.env.NODE_ENV === 'development') {
```

with:

```ts
        if (env.REACT_APP_ENVIRONMENT === 'development') {
```

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run test:unit -- tests/unit/instrumentation/appInsightsService.test.ts --reporter=verbose
rg -n "process\.env\.NODE_ENV" ClientApp/src -g "*.ts" -g "*.tsx"
```

Expected: test PASS; `rg` returns only ignored vendor/source mirrors if searched broadly, and no first-party `ClientApp/src` match outside excluded folders.

- [ ] **Step 5: Commit**

```powershell
git add ClientApp/src/instrumentation/AppInsightsService.ts tests/unit/instrumentation/appInsightsService.test.ts
git commit -m "fix: use runtime env for telemetry guard"
```

---

### Task 4: Fresh Target Organisation Header Per Request

**Files:**
- Modify: `ClientApp/src/api/web-api-client.ts`
- Create: `tests/unit/api/authorizedApiBase.test.ts`

- [ ] **Step 1: Write failing test for fresh sessionStorage read**

Create `tests/unit/api/authorizedApiBase.test.ts`:

```ts
import { AuthorizedApiBase } from '../../../ClientApp/src/api/web-api-client';

class TestClient extends AuthorizedApiBase {
    apply(options: RequestInit): Promise<RequestInit> {
        return this.transformOptions(options);
    }
}

describe('AuthorizedApiBase', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('reads TargetOrganisationAbn from sessionStorage for each request', async () => {
        const client = new TestClient();
        client.setAuthToken('token-value');

        sessionStorage.setItem('targetOrganisation', JSON.stringify({ targetOrganisationAbn: '11111111111' }));
        const first = await client.apply({ headers: {} });

        sessionStorage.setItem('targetOrganisation', JSON.stringify({ targetOrganisationAbn: '22222222222' }));
        const second = await client.apply({ headers: {} });

        expect(first.headers).toMatchObject({
            Authorization: 'Bearer token-value',
            TargetOrganisationAbn: '11111111111',
        });
        expect(second.headers).toMatchObject({
            Authorization: 'Bearer token-value',
            TargetOrganisationAbn: '22222222222',
        });
    });

    it('omits TargetOrganisationAbn when the session value is malformed', async () => {
        const client = new TestClient();
        sessionStorage.setItem('targetOrganisation', '{bad json');

        const result = await client.apply({ headers: {} });

        expect(result.headers).not.toMatchObject({ TargetOrganisationAbn: expect.any(String) });
    });
});
```

- [ ] **Step 2: Run test to verify stale-read failure**

Run:

```powershell
npm run test:unit -- tests/unit/api/authorizedApiBase.test.ts --reporter=verbose
```

Expected: first test FAILS because `targetOrganisation` is captured when the client is constructed.

- [ ] **Step 3: Move session read into `transformOptions`**

In `ClientApp/src/api/web-api-client.ts`, remove:

```ts
    targetOrganisation = sessionStorage.getItem('targetOrganisation');
```

Replace the existing `if (this.targetOrganisation) { ... }` block with:

```ts
        const targetOrganisation = sessionStorage.getItem('targetOrganisation');
        if (targetOrganisation) {
            try {
                const targetOrganisationJson = JSON.parse(targetOrganisation);
                if (targetOrganisationJson && targetOrganisationJson.targetOrganisationAbn) {
                    options.headers = {
                        ...options.headers,
                        TargetOrganisationAbn: `${targetOrganisationJson.targetOrganisationAbn}`,
                    };
                }
            } catch {
                // Ignore malformed session context; backend authorization remains authoritative.
            }
        }
```

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run test:unit -- tests/unit/api/authorizedApiBase.test.ts --reporter=verbose
npm run test:unit -- tests/unit/storage/sessionStorageCache.test.ts --reporter=verbose
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```powershell
git add ClientApp/src/api/web-api-client.ts tests/unit/api/authorizedApiBase.test.ts
git commit -m "fix: read target organisation per API request"
```

---

### Task 5: MSAL Silent Renewal Timeout Bound

**Files:**
- Modify: `ClientApp/src/authentication/authConfig.ts`
- Create: `tests/unit/authentication/authConfig.test.ts`

- [ ] **Step 1: Write failing timeout test**

Create `tests/unit/authentication/authConfig.test.ts`:

```ts
describe('MSAL auth configuration', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('uses bounded silent-renewal iframe timeouts', async () => {
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_B2C_CLIENTID: 'client-id',
                REACT_APP_B2C_AUTHORITY: 'https://login.example.test/authority',
                REACT_APP_B2C_KNOWN_AUTHORITIES: 'login.example.test',
                REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: '/',
                REACT_APP_B2C_READ_SCOPE: 'read',
                REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
                REACT_APP_B2C_REDIRECT_URL: '/',
            },
        }));

        const { configuration } = await import('@/authentication/authConfig');

        expect(configuration.system?.iframeHashTimeout).toBe(6000);
        expect(configuration.system?.loadFrameTimeout).toBe(6000);
    });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm run test:unit -- tests/unit/authentication/authConfig.test.ts --reporter=verbose
```

Expected: FAIL because `loadFrameTimeout` is `0`.

- [ ] **Step 3: Set `loadFrameTimeout` to 6000**

In `ClientApp/src/authentication/authConfig.ts`, change:

```ts
        loadFrameTimeout: 0,
```

to:

```ts
        loadFrameTimeout: 6000,
```

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run test:unit -- tests/unit/authentication/authConfig.test.ts --reporter=verbose
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add ClientApp/src/authentication/authConfig.ts tests/unit/authentication/authConfig.test.ts
git commit -m "fix: bound msal silent renewal timeout"
```

---

### Task 6: URL ID Parameter Validation

**Files:**
- Create: `ClientApp/src/routes/common/routeParams.ts`
- Create: `tests/unit/routes/common/routeParams.test.ts`
- Modify: `ClientApp/src/routes/requestForQuote/index.tsx`
- Modify: `ClientApp/src/routes/account/update/index.tsx`

- [ ] **Step 1: Write route-param tests**

Create `tests/unit/routes/common/routeParams.test.ts`:

```ts
import { getValidApplicationId, getValidPositiveIntegerId } from '../../../../ClientApp/src/routes/common/routeParams';

describe('route param validation', () => {
    it.each(['abc123', 'REQ-2026-0001', '550e8400-e29b-41d4-a716-446655440000', '12345'])(
        'accepts application id %s',
        (id) => {
            expect(getValidApplicationId(id)).toBe(id);
        },
    );

    it.each([undefined, '', ' ', '../admin', 'abc/123', 'abc?x=1', 'javascript:alert(1)', '%2Fadmin'])(
        'rejects unsafe application id %s',
        (id) => {
            expect(getValidApplicationId(id)).toBeNull();
        },
    );

    it.each([
        ['1', 1],
        ['42', 42],
        ['9007199254740991', 9007199254740991],
    ])('accepts positive integer id %s', (id, expected) => {
        expect(getValidPositiveIntegerId(id)).toBe(expected);
    });

    it.each([undefined, '', '0', '-1', '1.5', 'abc', '1e3', '01', '1/2'])(
        'rejects invalid positive integer id %s',
        (id) => {
            expect(getValidPositiveIntegerId(id)).toBeNull();
        },
    );
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm run test:unit -- tests/unit/routes/common/routeParams.test.ts --reporter=verbose
```

Expected: FAIL because `routeParams.ts` does not exist.

- [ ] **Step 3: Implement validators**

Create `ClientApp/src/routes/common/routeParams.ts`:

```ts
const APPLICATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export const getValidApplicationId = (id: string | undefined): string | null => {
    if (!id || !APPLICATION_ID_PATTERN.test(id)) {
        return null;
    }
    return id;
};

export const getValidPositiveIntegerId = (id: string | undefined): number | null => {
    if (!id || !POSITIVE_INTEGER_PATTERN.test(id)) {
        return null;
    }

    const parsed = Number(id);
    return Number.isSafeInteger(parsed) ? parsed : null;
};
```

- [ ] **Step 4: Apply RFQ route validation before API calls**

In `ClientApp/src/routes/requestForQuote/index.tsx`, add:

```ts
import { getValidApplicationId } from '../common/routeParams';
```

After `const { id } = useParams();`, add:

```ts
    const applicationId = getValidApplicationId(id);
```

Replace every API or wizard use of `id` in this component with `applicationId` after the null guard:

```ts
    if (!applicationId) {
        return <Navigate to='/not-found' replace />;
    }
```

The key changed calls must be:

```ts
                    const result = await client.getStepStatuses(applicationId);
```

```ts
        locationOnCompletion: `/request-for-quote-success/${applicationId}`,
```

```tsx
                    <WizardStep {...organisationAndContactProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
```

```tsx
                    <WizardStep {...instrumentAndRequestProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
```

```tsx
                    <WizardStep {...requestForQuoteSummaryProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
```

Also update the logger context:

```ts
                    AppLogger.error('Failed to load application steps', error as Error, { Id: applicationId });
```

- [ ] **Step 5: Apply account route validation before `Number()`**

In `ClientApp/src/routes/account/update/index.tsx`, add imports:

```ts
import { Navigate, useParams } from 'react-router';
import { getValidPositiveIntegerId } from '../../common/routeParams';
```

Replace:

```ts
    const accountId: number = id !== undefined ? Number(id) : 0;
```

with:

```ts
    const accountId = getValidPositiveIntegerId(id);
```

Before rendering `WizardForm`, add:

```tsx
    if (accountId === null) {
        return <Navigate to='/not-found' replace />;
    }
```

Keep the `updateAccountProps(..., accountId)` call unchanged after this guard.

- [ ] **Step 6: Run focused verification**

Run:

```powershell
npm run test:unit -- tests/unit/routes/common/routeParams.test.ts --reporter=verbose
npm run type-check
rg -n "Number\(id\)|getStepStatuses\(id!?|quoteRequestIdNum}/view-summary|quoteRequestIdNum\\)" ClientApp/src/routes ClientApp/src/account -g "*.tsx" -g "*.ts"
```

Expected: route param tests PASS; type-check PASS; no unguarded `Number(id)` or `getStepStatuses(id)` in the two scoped blocker routes. If `contact/create` or `contact/update` still show `Number(id)`, log a separate non-blocking hardening item unless migration scope expands to contact routes.

- [ ] **Step 7: Commit**

```powershell
git add ClientApp/src/routes/common/routeParams.ts tests/unit/routes/common/routeParams.test.ts ClientApp/src/routes/requestForQuote/index.tsx ClientApp/src/routes/account/update/index.tsx
git commit -m "fix: validate route ids before API calls"
```

---

### Task 7: Backlog Closure And Migration Gate Evidence

**Files:**
- Modify: `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- Modify: `docs/change-record/OPEN-ITEMS-BACKLOG-REPORT.html`
- Optional modify: `docs/change-record/MASTER-CHANGE-RECORD.md`

- [ ] **Step 1: Run full validation before documentation closure**

Run:

```powershell
npm run type-check
npm run lint
npm run test:unit
```

Expected: all PASS. If `npm run lint` reports pre-existing unrelated failures, capture the exact output and do not mark the blockers closed until the scoped changed files are lint-clean.

- [ ] **Step 2: Run blocker-specific searches**

Run:

```powershell
rg -n "window\.open\(" ClientApp/src -g "*.ts" -g "*.tsx"
rg -n "process\.env\.NODE_ENV" ClientApp/src -g "*.ts" -g "*.tsx"
rg -n "target='NMI-Feedback'|rel='external'" ClientApp/src -g "*.tsx"
rg -n "loadFrameTimeout: 0|targetOrganisation = sessionStorage|getStepStatuses\(id!?|Number\(id\)" ClientApp/src -g "*.ts" -g "*.tsx"
```

Expected:

- `window.open(` appears only in `ClientApp/src/routes/common/openWindow.ts`.
- No first-party `process.env.NODE_ENV`.
- No `target='NMI-Feedback'`; raw Qualtrics anchors include `noopener noreferrer`.
- No `loadFrameTimeout: 0`.
- No `targetOrganisation = sessionStorage`.
- No scoped `getStepStatuses(id)` or account `Number(id)` in the two blocker files.

- [ ] **Step 3: Update markdown backlog statuses**

In `docs/change-record/OPEN-ITEMS-BACKLOG.md`, change the six rows from `OPEN` to `CLOSED — verified YYYY-MM-DD` using the execution date. Use evidence phrasing like:

```md
| SEC-MOD-003 | `window.open()` without explicit `noopener` / URL encoding review | High | CLOSED — secure helper added; direct first-party `window.open()` call sites removed; URL fragments encoded; unit tests passing | Frontend Lead | Migration of quote, report, and PDF-opening routes | `ClientApp/src/routes/common/openWindow.ts`; `tests/unit/routes/common/openWindow.test.ts`; `npm run test:unit`; `rg "window\.open\(" ClientApp/src` |
```

Repeat for:

- `SEC-MOD-009`: cite `NavbarMessage.tsx`, `requestForQuote/created/index.tsx`, `StandardPathway`, `standardPathway.test.tsx`.
- `RUNTIME-ENV-001`: cite `AppInsightsService.ts`, `appInsightsService.test.ts`, `rg "process\.env\.NODE_ENV"`.
- `BRIEF-SEC-001`: cite `web-api-client.ts`, `authorizedApiBase.test.ts`.
- `BRIEF-SEC-009`: cite `authConfig.ts`, `authConfig.test.ts`.
- `BRIEF-SEC-011`: cite `routeParams.ts`, `routeParams.test.ts`, `requestForQuote/index.tsx`, `account/update/index.tsx`.

- [ ] **Step 4: Update HTML backlog report**

In `docs/change-record/OPEN-ITEMS-BACKLOG-REPORT.html`, update the same six item rows to show closed status text. Preserve the existing table structure and CSS classes. If the report uses a status badge class, use the closed/resolved badge class already present elsewhere in the file.

- [ ] **Step 5: Add Master Change Record entry**

Append a new dated entry to `docs/change-record/MASTER-CHANGE-RECORD.md`:

```md
### [Phase P1] — YYYY-MM-DD — Migration Blockers Remediated

**Change ID:** CRD-029
**Source:** `OPEN-ITEMS-BACKLOG.md` Priority 1 blockers; `analysis/MODERNIZATION_BRIEF.md` Phase 1
**Status:** COMPLETE — source-verified
**Security findings resolved:** `SEC-MOD-003`, `SEC-MOD-009`, `BRIEF-SEC-001`, `BRIEF-SEC-009`, `BRIEF-SEC-011`
**Technical debt resolved:** `RUNTIME-ENV-001`
**Tests added:** `openWindow.test.ts`, `routeParams.test.ts`, `authorizedApiBase.test.ts`, `authConfig.test.ts`, `standardPathway.test.ts`; `appInsightsService.test.ts` extended
**Files changed:** list the source files from this plan.

**Outcome:** The Priority 1 frontend blockers for migration are closed. Remaining migration entry criteria are backend/security sign-off items outside these six frontend code fixes.
```

- [ ] **Step 6: Final validation**

Run:

```powershell
npm run migration-check
```

Expected: PASS. This runs TypeScript, Vitest, and Storybook build according to `package.json`.

- [ ] **Step 7: Commit**

```powershell
git add docs/change-record/OPEN-ITEMS-BACKLOG.md docs/change-record/OPEN-ITEMS-BACKLOG-REPORT.html docs/change-record/MASTER-CHANGE-RECORD.md
git commit -m "docs: close migration blocker backlog items"
```

---

## Execution Order

1. Task 1 closes `SEC-MOD-003`.
2. Task 2 closes `SEC-MOD-009`.
3. Task 3 closes `RUNTIME-ENV-001`.
4. Task 4 closes `BRIEF-SEC-001`.
5. Task 5 closes `BRIEF-SEC-009`.
6. Task 6 closes `BRIEF-SEC-011`.
7. Task 7 updates governance evidence and confirms migration readiness.

Each task is independently testable and should be committed separately. If a task uncovers a broader related issue, create a new backlog item rather than expanding this Priority 1 closure scope.

## Self-Review

- **Spec coverage:** All six user-supplied blockers have a source task, focused tests, verification commands, and backlog closure step.
- **Placeholder scan:** No `TBD`, generic "add validation", or missing implementation steps remain.
- **Type consistency:** New helpers are imported from `routes/common`; test paths use the existing `@` alias where module mocks are needed and relative imports elsewhere, consistent with current unit tests.
- **Migration gate clarity:** Frontend blockers can close after Task 7. Backend IDOR verification remains a separate existing gate and is not claimed by this plan.
