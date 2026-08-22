# 100 Percent Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make unit test coverage reach and enforce 100% for editable handwritten application source in `ClientApp/src`.

**Architecture:** First repair Vitest coverage configuration so the project measures the intended source set and fails below 100%. Then add focused tests by source family, using existing React Testing Library, Vitest, Formik, jsdom, and module mocks. Generated, vendor, source-map mirror, Storybook docs/stories, declaration files, and type-only files stay excluded because they are not editable runtime source.

**Tech Stack:** React 18, TypeScript, Vitest 4, V8 coverage, React Testing Library, Formik, Yup, jsdom, MSW-style mocks where already present.

---

## Current State

The latest coverage run was:

```powershell
npm run test:unit:coverage
```

Observed result:

```text
Test Files  38 passed (38)
Tests       327 passed (327)
Statements 28.57%
Branches   22.62%
Functions  22.48%
Lines      29.14%
```

Important finding: `vitest.unit.config.ts` currently declares `coverage` at the config root, not inside `test`. Vitest writes to the default `coverage/` directory instead of `reports/coverage/unit`, so the intended coverage include list and report directory are not being applied.

## Coverage Scope

Measure these files:

```text
ClientApp/src/**/*.{ts,tsx}
webpack.config.js
```

Exclude these files:

```text
ClientApp/src/api/web-api-client.ts
ClientApp/src/external/**
ClientApp/source-map-http-downloads/**
ClientApp/src/**/*.stories.{ts,tsx}
ClientApp/src/**/*.docs.mdx
ClientApp/src/**/*.d.ts
ClientApp/src/**/types.ts
ClientApp/src/**/types.tsx
ClientApp/src/**/index.scss
ClientApp/src/styles/**
ClientApp/src/assets/**
```

Rationale:

- `ClientApp/src/api/web-api-client.ts` is generated NSwag/OpenAPI output and AGENTS.md says not to edit it.
- `ClientApp/src/external/**`, `ClientApp/source-map-http-downloads/**`, and `ClientApp/webpack/**` are vendor/captured artifacts.
- Stories and MDX docs are covered by Storybook tests and docs drift tests, not unit coverage.
- Type declarations and type-only files do not contain runtime behavior to execute.

## File Structure

Modify:

- `vitest.unit.config.ts` - move coverage config under `test.coverage`, widen include scope to editable source, exclude generated/vendor/docs/story/type-only files, add 100% thresholds, and set `all: true`.
- `vitest.setup.ts` - add shared browser API mocks needed by broader component tests.
- `package.json` - add `test:unit:coverage:watch-gap` helper if useful for local iteration.

Create:

- `tests/unit/helpers/renderWithProviders.tsx` - shared render helper for router, account context, modal context, and Formik-heavy components.
- `tests/unit/helpers/moduleMocks.ts` - shared mock builders for MSAL, API clients, analytics, window navigation, and file/blob interactions.
- `tests/unit/coverage/coverageConfig.test.ts` - regression tests proving coverage configuration is scoped and enforced.
- `tests/unit/components/**/*.test.tsx` - component family tests for uncovered component branches.
- `tests/unit/routes/**/*.test.tsx` - route and wizard tests for uncovered route branches.
- `tests/unit/validationSchemas/**/*.test.ts` - validation branch tests for all Yup schema paths.
- `tests/unit/storage/**/*.test.ts` - storage branch tests.
- `tests/unit/authentication/**/*.test.tsx` - auth provider, guard, and config tests.
- `tests/unit/analytics/**/*.test.tsx` - Google Analytics tests.
- `tests/unit/instrumentation/**/*.test.ts` - logger and App Insights tests.
- `tests/unit/utils/**/*.test.ts` - utility function branch tests.

Do not modify:

- `ClientApp/src/api/web-api-client.ts`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`
- `ClientApp/webpack/**`

---

### Task 1: Repair Coverage Configuration

**Files:**

- Modify: `vitest.unit.config.ts`
- Test: `tests/unit/coverage/coverageConfig.test.ts`

- [ ] **Step 1: Write the failing config regression test**

Create `tests/unit/coverage/coverageConfig.test.ts`:

```ts
import config from '../../../vitest.unit.config';
import { describe, expect, it } from 'vitest';

const resolved = typeof config === 'function' ? config({ command: 'serve', mode: 'test' }) : config;
const testConfig = Array.isArray(resolved) ? resolved[0].test : resolved.test;

describe('unit coverage configuration', () => {
    it('keeps coverage config under test so Vitest applies it', () => {
        expect(testConfig?.coverage).toBeDefined();
        expect(testConfig?.coverage?.reportsDirectory).toBe('./reports/coverage/unit');
    });

    it('measures editable handwritten source and excludes generated/vendor artifacts', () => {
        expect(testConfig?.coverage?.all).toBe(true);
        expect(testConfig?.coverage?.include).toContain('ClientApp/src/**/*.{ts,tsx}');
        expect(testConfig?.coverage?.exclude).toContain('ClientApp/src/api/web-api-client.ts');
        expect(testConfig?.coverage?.exclude).toContain('ClientApp/src/external/**');
        expect(testConfig?.coverage?.exclude).toContain('ClientApp/source-map-http-downloads/**');
    });

    it('fails the unit coverage gate below 100 percent', () => {
        expect(testConfig?.coverage?.thresholds).toEqual({
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
        });
    });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```powershell
npm run test:unit -- tests/unit/coverage/coverageConfig.test.ts
```

Expected: FAIL because `testConfig.coverage` is undefined.

- [ ] **Step 3: Move and harden coverage config**

Replace `vitest.unit.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for running unit tests only (no Storybook stories).
 *
 * Usage:
 *   npm run test:unit          (single run)
 *   npm run test:unit:watch    (watch mode)
 *   npm run test:unit:coverage (with coverage)
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'ClientApp/src'),
        },
    },
    poolOptions: {
        forks: {
            execArgv: ['--max-old-space-size=8192'],
        },
    },
    test: {
        name: 'unit',
        environment: 'jsdom',
        pool: 'forks',
        maxWorkers: 1,
        minWorkers: 1,
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['tests/unit/**/*.test.{ts,tsx}'],
        css: false,
        coverage: {
            provider: 'v8',
            all: true,
            reporter: ['text', 'html', 'json-summary'],
            reportsDirectory: './reports/coverage/unit',
            include: [
                'ClientApp/src/**/*.{ts,tsx}',
                'webpack.config.js',
            ],
            exclude: [
                '**/*.d.ts',
                'ClientApp/src/api/web-api-client.ts',
                'ClientApp/src/external/**',
                'ClientApp/source-map-http-downloads/**',
                'ClientApp/src/**/*.stories.{ts,tsx}',
                'ClientApp/src/**/*.docs.mdx',
                'ClientApp/src/**/types.ts',
                'ClientApp/src/**/types.tsx',
                'ClientApp/src/styles/**',
                'ClientApp/src/assets/**',
            ],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
});
```

- [ ] **Step 4: Run the focused config test**

Run:

```powershell
npm run test:unit -- tests/unit/coverage/coverageConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run coverage to create the authoritative gap list**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL on thresholds. Confirm `reports/coverage/unit/coverage-summary.json` exists.

- [ ] **Step 6: Commit**

```powershell
git add vitest.unit.config.ts tests/unit/coverage/coverageConfig.test.ts
git commit -m "test: enforce unit coverage configuration"
```

---

### Task 2: Add Shared Test Harnesses

**Files:**

- Modify: `vitest.setup.ts`
- Create: `tests/unit/helpers/renderWithProviders.tsx`
- Create: `tests/unit/helpers/moduleMocks.ts`
- Test: `tests/unit/helpers/renderWithProviders.test.tsx`

- [ ] **Step 1: Write the failing helper tests**

Create `tests/unit/helpers/renderWithProviders.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link, useLocation } from 'react-router';
import { renderWithProviders } from './renderWithProviders';

const LocationProbe = () => {
    const location = useLocation();

    return (
        <>
            <span data-testid="pathname">{location.pathname}</span>
            <Link to="/next">Next</Link>
        </>
    );
};

describe('renderWithProviders', () => {
    it('renders components inside a memory router', () => {
        renderWithProviders(<LocationProbe />, { route: '/start' });

        expect(screen.getByTestId('pathname')).toHaveTextContent('/start');
        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/next');
    });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```powershell
npm run test:unit -- tests/unit/helpers/renderWithProviders.test.tsx
```

Expected: FAIL because `renderWithProviders` does not exist.

- [ ] **Step 3: Add shared render helper**

Create `tests/unit/helpers/renderWithProviders.tsx`:

```tsx
import { render, RenderOptions } from '@testing-library/react';
import { PropsWithChildren, ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

type RenderWithProvidersOptions = RenderOptions & {
    route?: string;
};

const Providers = ({ children, route = '/' }: PropsWithChildren<{ route?: string }>) => (
    <MemoryRouter initialEntries={[route]}>
        {children}
    </MemoryRouter>
);

export const renderWithProviders = (
    ui: ReactElement,
    { route = '/', ...options }: RenderWithProvidersOptions = {},
) => render(ui, {
    wrapper: ({ children }) => <Providers route={route}>{children}</Providers>,
    ...options,
});
```

- [ ] **Step 4: Add shared browser mocks**

Append to `vitest.setup.ts`:

```ts
if (!window.URL.createObjectURL) {
    Object.defineProperty(window.URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:unit-test'),
    });
}

if (!window.URL.revokeObjectURL) {
    Object.defineProperty(window.URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
    });
}

Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
});
```

Create `tests/unit/helpers/moduleMocks.ts`:

```ts
import { vi } from 'vitest';

export const mockOpen = () => {
    const open = vi.fn();
    Object.defineProperty(window, 'open', {
        writable: true,
        value: open,
    });
    return open;
};

export const mockLocationAssign = () => {
    const assign = vi.fn();
    const location = {
        ...window.location,
        assign,
    } as Location;

    Object.defineProperty(window, 'location', {
        configurable: true,
        value: location,
    });

    return assign;
};

export const flushPromises = () => new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
});
```

- [ ] **Step 5: Run helper tests**

Run:

```powershell
npm run test:unit -- tests/unit/helpers/renderWithProviders.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add vitest.setup.ts tests/unit/helpers/renderWithProviders.tsx tests/unit/helpers/moduleMocks.ts tests/unit/helpers/renderWithProviders.test.tsx
git commit -m "test: add shared unit test harness"
```

---

### Task 3: Cover Authentication and Analytics

**Files:**

- Modify or create tests under: `tests/unit/authentication/**/*.test.tsx`
- Create: `tests/unit/analytics/googleAnalytics.test.tsx`
- Cover source: `ClientApp/src/authentication/*.tsx`, `ClientApp/src/authentication/*.ts`, `ClientApp/src/analytics/GoogleAnalytics.tsx`

- [ ] **Step 1: Add analytics tests**

Create `tests/unit/analytics/googleAnalytics.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
const initialize = vi.fn();

vi.mock('react-ga4', () => ({
    default: {
        initialize,
        send,
    },
}));

describe('GoogleAnalytics', () => {
    afterEach(() => {
        vi.resetModules();
        initialize.mockClear();
        send.mockClear();
    });

    it('initializes GA and sends page views when tracking id is configured', async () => {
        const { GoogleAnalytics } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        render(<GoogleAnalytics />);

        expect(initialize).toHaveBeenCalledWith('test-ga-id');
        expect(send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/' });
    });

    it('does not initialize GA when tracking id is empty', async () => {
        Object.assign(window, { REACT_APP_GA_TRACKINGID: '' });
        const { GoogleAnalytics } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        render(<GoogleAnalytics />);

        expect(initialize).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
        Object.assign(window, { REACT_APP_GA_TRACKINGID: 'test-ga-id' });
    });
});
```

- [ ] **Step 2: Run analytics test and fix import or expectation mismatches**

Run:

```powershell
npm run test:unit -- tests/unit/analytics/googleAnalytics.test.tsx
```

Expected: PASS after aligning the assertions with `GoogleAnalytics.tsx`.

- [ ] **Step 3: Add auth guard tests**

Create or extend `tests/unit/authentication/AuthenticatedElement.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../helpers/renderWithProviders';

vi.mock('@azure/msal-react', () => ({
    useIsAuthenticated: vi.fn(),
    useMsal: () => ({
        instance: {
            loginRedirect: vi.fn(),
        },
    }),
}));

describe('AuthenticatedElement', () => {
    it('renders children when the user is authenticated', async () => {
        const msalReact = await import('@azure/msal-react');
        vi.mocked(msalReact.useIsAuthenticated).mockReturnValue(true);
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        renderWithProviders(
            <AuthenticatedElement>
                <span>Secure content</span>
            </AuthenticatedElement>,
        );

        expect(screen.getByText('Secure content')).toBeInTheDocument();
    });

    it('does not render children when the user is not authenticated', async () => {
        const msalReact = await import('@azure/msal-react');
        vi.mocked(msalReact.useIsAuthenticated).mockReturnValue(false);
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        renderWithProviders(
            <AuthenticatedElement>
                <span>Secure content</span>
            </AuthenticatedElement>,
        );

        expect(screen.queryByText('Secure content')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 4: Run auth focused tests**

Run:

```powershell
npm run test:unit -- tests/unit/authentication
```

Expected: PASS.

- [ ] **Step 5: Run coverage and inspect remaining auth/analytics gaps**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until every auth and analytics file reports 100%. Use the `Uncovered Line #s` rows for only `ClientApp/src/authentication` and `ClientApp/src/analytics` to add missing branch cases.

- [ ] **Step 6: Commit**

```powershell
git add tests/unit/authentication tests/unit/analytics
git commit -m "test: cover authentication and analytics"
```

---

### Task 4: Cover Storage, Utilities, and Instrumentation

**Files:**

- Modify or create tests under: `tests/unit/storage/**/*.test.ts`
- Create: `tests/unit/utils/index.test.ts`
- Create: `tests/unit/instrumentation/appLogger.test.ts`
- Cover source: `ClientApp/src/storage/**/*.ts`, `ClientApp/src/utils/index.ts`, `ClientApp/src/instrumentation/**/*.ts`

- [ ] **Step 1: Add utility branch tests**

Create `tests/unit/utils/index.test.ts` and import named utility functions from `ClientApp/src/utils/index.ts`. For each exported function, add one test for normal input, one for empty or undefined input if the function accepts it, and one for boundary formatting or matching behavior.

Use this structure:

```ts
import { describe, expect, it } from 'vitest';
import * as utils from '../../../ClientApp/src/utils';

describe('utils exports', () => {
    it('exports runtime utility functions', () => {
        expect(Object.keys(utils).sort()).toMatchSnapshot();
    });
});
```

Then run the test once to create the export inventory, replace the snapshot-style assertion with explicit `expect(typeof utils.exportName).toBe('function')` assertions for every exported function, and add behavior tests for each export.

- [ ] **Step 2: Run utility tests**

Run:

```powershell
npm run test:unit -- tests/unit/utils/index.test.ts
```

Expected: PASS.

- [ ] **Step 3: Add AppLogger tests**

Create `tests/unit/instrumentation/appLogger.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { AppLogger } from '../../../ClientApp/src/instrumentation/AppLogger';

describe('AppLogger', () => {
    it('tracks info messages through the configured telemetry client', () => {
        const trackTrace = vi.fn();
        const logger = new AppLogger({ trackTrace } as never);

        logger.info('Saved', { requestId: '123' });

        expect(trackTrace).toHaveBeenCalledWith({
            message: 'Saved',
            severityLevel: 1,
            properties: { requestId: '123' },
        });
    });

    it('tracks errors through the configured telemetry client', () => {
        const trackException = vi.fn();
        const logger = new AppLogger({ trackException } as never);
        const error = new Error('Failed');

        logger.error(error, { requestId: '123' });

        expect(trackException).toHaveBeenCalledWith({
            exception: error,
            properties: { requestId: '123' },
        });
    });
});
```

If constructor or method names differ, inspect `ClientApp/src/instrumentation/AppLogger.ts` and update only the test names and assertions to the actual public API.

- [ ] **Step 4: Run storage, utility, and instrumentation tests**

Run:

```powershell
npm run test:unit -- tests/unit/storage tests/unit/utils tests/unit/instrumentation
```

Expected: PASS.

- [ ] **Step 5: Run coverage and close remaining gaps for these folders**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until `ClientApp/src/storage`, `ClientApp/src/utils`, and `ClientApp/src/instrumentation` all report 100%.

- [ ] **Step 6: Commit**

```powershell
git add tests/unit/storage tests/unit/utils tests/unit/instrumentation
git commit -m "test: cover storage utilities and instrumentation"
```

---

### Task 5: Cover Validation Schemas

**Files:**

- Modify or create tests under: `tests/unit/validationSchemas/**/*.test.ts`
- Cover source: `ClientApp/src/validationSchemas/**/*.ts`, `ClientApp/src/routes/**/validation.ts`

- [ ] **Step 1: Add custom Yup extension branch tests**

Extend `tests/unit/validationSchemas/stringExtensions.test.ts` to cover each custom string method in `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`:

```ts
import * as Yup from 'yup';
import '../../../ClientApp/src/validationSchemas/yupExtensions';

describe('custom Yup string extensions complete branch coverage', () => {
    it.each([
        ['letters', Yup.string().allowedFormat(/^[A-Z]+$/, 'Only uppercase letters'), 'ABC', true],
        ['letters invalid', Yup.string().allowedFormat(/^[A-Z]+$/, 'Only uppercase letters'), 'abc', false],
        ['fixed digits valid', Yup.string().fixedDigits(4), '1234', true],
        ['fixed digits invalid', Yup.string().fixedDigits(4), '123', false],
        ['phone valid', Yup.string().phone(), '02 1234 5678', true],
        ['phone invalid', Yup.string().phone(), 'not a phone', false],
        ['postcode valid', Yup.string().postcode(), '2600', true],
        ['postcode invalid', Yup.string().postcode(), 'ABCDE', false],
    ])('%s', async (_name, schema, value, valid) => {
        await expect(schema.isValid(value)).resolves.toBe(valid);
    });
});
```

Add cases for every extension exported by the module. Use the exact method names from `stringExtensions.ts`.

- [ ] **Step 2: Add route validation tests**

Create tests beside existing validation tests for:

```text
tests/unit/routes/account/validation.test.ts
tests/unit/routes/contact/validation.test.ts
tests/unit/routes/requestForQuote/validation.test.ts
tests/unit/routes/acceptQuote/validation.test.ts
```

Each file must import the side-effect module before importing schemas:

```ts
import '../../../ClientApp/src/validationSchemas/yupExtensions';
```

Each schema needs:

- one fully valid object
- one object missing every required field
- one object with invalid formats
- one object at max length boundaries
- one object over max length boundaries

- [ ] **Step 3: Run validation tests**

Run:

```powershell
npm run test:unit -- tests/unit/validationSchemas tests/unit/routes/account tests/unit/routes/contact tests/unit/routes/requestForQuote tests/unit/routes/acceptQuote
```

Expected: PASS.

- [ ] **Step 4: Run coverage and close remaining validation gaps**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until every validation file reports 100%.

- [ ] **Step 5: Commit**

```powershell
git add tests/unit/validationSchemas tests/unit/routes/account tests/unit/routes/contact tests/unit/routes/requestForQuote tests/unit/routes/acceptQuote
git commit -m "test: cover validation schemas"
```

---

### Task 6: Cover Reusable Components

**Files:**

- Modify or create tests under: `tests/unit/components/**/*.test.tsx`
- Cover source: `ClientApp/src/components/**/*.tsx`

- [ ] **Step 1: Add tests for stateless display components**

Create or extend tests for these component families:

```text
Actions
Alert
Accordion
BlockUISpinner
BodyText
Breadcrumb
Buttons
Footer
Header
HeaderIntroText
Icons
InTextLink
Layout
PaginationHeader
Pill
Welcome
get-started
```

For each component, test:

- default render
- optional props
- click handler props
- conditional content branches
- accessibility role or accessible name

Use this pattern:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../helpers/renderWithProviders';
import Component from '../../../ClientApp/src/components/ComponentName';

describe('ComponentName', () => {
    it('renders default content', () => {
        renderWithProviders(<Component />);

        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('calls the click handler', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        renderWithProviders(<Component onClick={onClick} />);
        await user.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
```

Replace `ComponentName`, imports, roles, and props with the actual component API in each file.

- [ ] **Step 2: Add tests for form components**

Cover these folders:

```text
ClientApp/src/components/forms/**
ClientApp/src/components/Inputs/**
```

Every input component test needs:

- label association
- value rendering
- change event
- blur/touched error rendering
- disabled/read-only rendering
- invalid state rendering

Use Formik wrapper helpers from `tests/unit/helpers/formik.tsx` where possible.

- [ ] **Step 3: Add tests for interactive components**

Cover these folders:

```text
AddressLookup
AutoSuggest
ModalSearchSelectorModal
Pagination
RequestList
RouteLeavingGuard
SearchFilter
SummaryDisplay
Utilities
modals
```

Every interactive component test needs:

- empty state
- loaded state
- loading state where present
- error state where present
- keyboard interaction where the component is focusable
- click or submit interaction

- [ ] **Step 4: Run component tests by folder**

Run:

```powershell
npm run test:unit -- tests/unit/components
```

Expected: PASS.

- [ ] **Step 5: Run coverage and close remaining component gaps**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until every `ClientApp/src/components` row reports 100%.

- [ ] **Step 6: Commit**

```powershell
git add tests/unit/components
git commit -m "test: cover reusable components"
```

---

### Task 7: Cover Routes and Workflow Pages

**Files:**

- Modify or create tests under: `tests/unit/routes/**/*.test.tsx`
- Cover source: `ClientApp/src/routes/**/*.tsx`, excluding stories and docs

- [ ] **Step 1: Add route smoke tests for static routes**

Cover:

```text
help-guide
services-we-offer
sign-in
sign-out
sign-out-helper
account/created
requestForQuote/created
```

Each test needs:

- render success
- expected heading
- primary link or button
- branch for missing route params if the route reads params

- [ ] **Step 2: Add dashboard and list route tests**

Cover:

```text
dashboard
measurementReport
quotation
requestForQuote
```

Each list route test needs:

- loading state
- empty state
- populated state
- API error state
- pagination branch
- filter/search branch where present

Mock API calls at the module boundary used by the route.

- [ ] **Step 3: Add multi-step workflow route tests**

Cover:

```text
account/addBranch
account/create
account/update
contact/create
contact/update
requestForQuote/create
requestForQuote/copy
acceptQuote/create
```

Each workflow route test needs:

- first step render
- valid next-step navigation
- invalid submit shows error summary
- save and exit branch
- successful final submit branch
- API error branch

- [ ] **Step 4: Run route tests**

Run:

```powershell
npm run test:unit -- tests/unit/routes
```

Expected: PASS.

- [ ] **Step 5: Run coverage and close remaining route gaps**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until every `ClientApp/src/routes` row reports 100%.

- [ ] **Step 6: Commit**

```powershell
git add tests/unit/routes
git commit -m "test: cover routes and workflows"
```

---

### Task 8: Cover App Bootstrap and Webpack Runtime Configuration

**Files:**

- Modify or create: `tests/unit/app.test.tsx`
- Modify: `tests/unit/config/webpackConfig.test.ts`
- Cover source: `ClientApp/src/App.tsx`, `ClientApp/src/env.ts`, `webpack.config.js`

- [ ] **Step 1: Add app router tests**

Create or extend `tests/unit/app.test.tsx`:

```tsx
import { RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';

vi.mock('@azure/msal-react', () => ({
    useIsAuthenticated: () => true,
    useMsal: () => ({
        instance: {
            loginRedirect: vi.fn(),
            logoutRedirect: vi.fn(),
        },
    }),
}));

describe('App router', () => {
    it('creates a browser router with public routes', async () => {
        const { router } = await import('../../ClientApp/src/App');

        render(<RouterProvider router={router} />);

        expect(screen.getByText(/National Measurement Institute/i)).toBeInTheDocument();
    });
});
```

Align the exported router name with the actual export from `ClientApp/src/App.tsx`.

- [ ] **Step 2: Add env branch tests**

Create or extend `tests/unit/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('env', () => {
    it('reads runtime values from window', async () => {
        const { env } = await import('../../ClientApp/src/env');

        expect(env.REACT_APP_B2C_CLIENTID).toBe('test-client-id');
        expect(env.REACT_APP_GA_TRACKINGID).toBe('test-ga-id');
    });
});
```

Add one assertion for every `env` property exported from `ClientApp/src/env.ts`.

- [ ] **Step 3: Extend webpack config tests**

Extend `tests/unit/config/webpackConfig.test.ts` to assert:

- development mode settings
- production mode settings
- entry value
- output filename pattern
- TypeScript loader rule
- SCSS loader rule
- asset loader rule
- HTML plugin presence
- CSP and Trusted Types related settings if present

- [ ] **Step 4: Run app/config tests**

Run:

```powershell
npm run test:unit -- tests/unit/app.test.tsx tests/unit/env.test.ts tests/unit/config/webpackConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run coverage and close remaining app/config gaps**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL until `ClientApp/src/App.tsx`, `ClientApp/src/env.ts`, and `webpack.config.js` all report 100%.

- [ ] **Step 6: Commit**

```powershell
git add tests/unit/app.test.tsx tests/unit/env.test.ts tests/unit/config/webpackConfig.test.ts
git commit -m "test: cover app and build configuration"
```

---

### Task 9: Final 100% Coverage Closure

**Files:**

- Modify: any remaining `tests/unit/**/*.test.{ts,tsx}` needed by the coverage report
- Do not modify generated/vendor/captured files

- [ ] **Step 1: Generate the final coverage gap report**

Run:

```powershell
npm run test:unit:coverage
```

Expected: FAIL if any measured file is below 100%.

- [ ] **Step 2: Open the machine-readable summary**

Run:

```powershell
Get-Content reports\coverage\unit\coverage-summary.json
```

Expected: JSON containing `total` and per-file coverage data.

- [ ] **Step 3: Close files one at a time**

For each file below 100%, add the smallest behavior test that executes the listed uncovered lines or branch. After each file:

```powershell
npm run test:unit:coverage
```

Expected: the target file no longer appears below 100%.

- [ ] **Step 4: Verify all gates**

Run:

```powershell
npm run type-check
npm run lint
npm run test:unit:coverage
```

Expected:

```text
npm run type-check: exit 0
npm run lint: exit 0
npm run test:unit:coverage: exit 0 with 100% statements, branches, functions, and lines
```

- [ ] **Step 5: Commit**

```powershell
git add tests vitest.unit.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "test: reach 100 percent unit coverage"
```

---

## Self-Review

Spec coverage:

- The plan directly targets 100% test coverage by making Vitest enforce 100% thresholds.
- The plan fixes the current misconfiguration where coverage settings are not applied.
- The plan respects AGENTS.md edit boundaries by excluding generated, vendor, and source-map capture files.
- The plan covers app source by family: auth, analytics, instrumentation, storage, utilities, validation, components, routes, app bootstrap, and build config.

Placeholder scan:

- No step uses `TBD`, `TODO`, `implement later`, or an undefined future task.
- Some tasks require inspecting actual component APIs before writing assertions. The plan constrains those steps to exact folders, exact test categories, exact commands, and exact expected results.

Type consistency:

- Test helpers use React 18, React Router v7 package imports already present in `package.json`, Vitest globals, and React Testing Library.
- Coverage config uses Vitest 4 `test.coverage` placement and V8 coverage thresholds.
