14 files changed+235-66

.storybook/msw-handlers.ts

```
svg
```

`import { http, HttpResponse } from 'msw';`

`import { http, HttpResponse } from 'msw';`

`import { CRMLookupTypes } from '../ClientApp/src/api/web-api-client';`

`import {`

`    artefactTypeResponses,`

`    lookupResponses,`

`    serviceResponses,`

`} from '../ClientApp/src/storybook/storybookFixtures';`

`export const mswHandlers = [`

`    http.get('/api/dashboard/*', () =>`

`        HttpResponse.json({`

`    http.get('/api/dashboard/*', () =>`

`        HttpResponse.json({`

`            items: [],`

`            currentPage: 1,`

`            totalPages: 0,`

`            totalCount: 0,`

`        })`

`    ),`

`];`

`        })`

`    ),`

`    http.get('/api/lookup/services', () => HttpResponse.json(serviceResponses)),`

`    http.get('/api/lookup', ({ request }) => {`

`        const lookupType = new URL(request.url).searchParams.get('LookupType');`

`        if (lookupType !== CRMLookupTypes.TCPortalMeasurementCategory) return;`

`        return HttpResponse.json(lookupResponses);`

`    }),`

`    http.get('/api/lookup', ({ request }) => {`

`        const lookupType = new URL(request.url).searchParams.get('LookupType');`

`        if (lookupType !== CRMLookupTypes.TCArtefactTypePortalCategory) return;`

`        return HttpResponse.json(artefactTypeResponses);`

`    }),`

`];`

ClientApp/src/analytics/GoogleAnalytics.tsx

```
    sendPageView: _sendPageView,
```

`}: GoogleAnalyticsProps) => {`

`    useEffect(() => {`

`        if (ReactGA.isInitialized === false) {`

`            const trackId = env.REACT_APP_GA_TRACKINGID;`

`        const trackId = env.REACT_APP_GA_TRACKINGID;`

`        if (trackId && ReactGA.isInitialized === false) {`

`            ReactGA.initialize([{`

`                trackingId: trackId,`

`                gaOptions: {`

ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx

```
    },
```

`    play: async ({ canvasElement }) => {`

`        const canvas = within(canvasElement);`

`        // Live counter starts at zero out of the budget.`

`        await expect(canvas.getByText(/0/)).toBeVisible();`

`        await expect(canvas.getByText(/500/)).toBeVisible();`

`        await userEvent.type(canvas.getByRole('textbox'), 'Hi');`

`        await expect(canvas.getByText(/9\s*\/\s*500/)).toBeVisible();`

`        // Live counter starts at zero out of the budget.`

`        await expect(canvas.getByText(/0/)).toBeVisible();`

`        await expect(canvas.getByText(/500/)).toBeVisible();`

`        const textbox = canvas.getByRole('textbox');`

`        await userEvent.click(textbox);`

`        await userEvent.type(textbox, 'Hi');`

`        await expect(canvas.getByText(/9\s*\/\s*500/)).toBeVisible();`

`    },`

`};`

ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx

```
svg
```

`svg`

`svg`

`import type { Meta, StoryObj } from '@storybook/react-vite';`

`import { http, HttpResponse } from 'msw';`

`import { within, expect, waitFor } from 'storybook/test';`

`import OrganisationAndContact from './organisationAndContact';`

`import InstrumentAndRequest from './instrumentAndRequest';`

`import { withPortalProviders } from '../../storybook/storybookHarness';`

`import { artefactTypeResponses, lookupResponses } from '../../storybook/storybookFixtures';`

`import { CRMLookupTypes } from '../../api/web-api-client';`

`const lookupHandlers = [`

`    http.get('/api/lookup', ({ request }) => {`

`        const lookupType = new URL(request.url).searchParams.get('LookupType');`

`        return HttpResponse.json(`

`            lookupType === CRMLookupTypes.TCArtefactTypePortalCategory`

`                ? artefactTypeResponses`

`                : lookupResponses,`

`        );`

`    }),`

`];`

`const meta = {`

`    title: 'Routes/RequestForQuote',`

`    component: OrganisationAndContact,`

`                    measurementReportAndCertificateRequired: 'MeasurementReportOnly',`

`                },`

`            },`

`        },`

`        msw: {`

`            handlers: lookupHandlers,`

`        },`

`    },`

`} satisfies Meta<typeof OrganisationAndContact>;`

ClientApp/src/storybook/storybookFixtures.ts

```
svg
```

`svg`

`svg`

`import { DashboardItemStatus, QuoteStatus } from '../routes/common/enums';`

`import type { DashboardItemDto, LookupResponse, RequestForQuoteDetails } from '../api/web-api-client';`

`import {`

`    ServiceType,`

`    type DashboardItemDto,`

`    type LookupResponse,`

`    type RequestForQuoteDetails,`

`    type ServiceDto,`

`} from '../api/web-api-client';`

`export const dashboardItems: DashboardItemDto[] = [`

`    {`

`    { id: 'no-instrument', label: 'No instrument/artefact type available', parentId: 'no-measurement' },`

`];`

`export const serviceResponses: ServiceDto[] = [`

`    {`

`        serviceType: ServiceType.TestingCalibration,`

`        title: 'Testing and calibration',`

`        description: 'Testing and calibration services for measurement instruments and artefacts.',`

`        icon: 'icon-test-tube',`

`        meta: 'Request a quote, review quotations and access measurement reports.',`

`    },`

`    {`

`        serviceType: ServiceType.PatternApproval,`

`        title: 'Pattern approval',`

`        description: 'Pattern approval services for trade measurement instruments.',`

`        icon: 'icon-certificate',`

`        meta: 'Create and manage pattern approval applications.',`

`    },`

`];`

`export const requestForQuoteDetailsFixture = {`

`    quoteRequestIdNum: 'RFQ-2024-000892',`

`    quotationIdNum: 'Q-2024-000456',`

tests/unit/analytics/googleAnalytics.test.tsx

```
svg
```

`svg`

`svg`

`import { render, screen } from '@testing-library/react';`

`import { afterEach, describe, expect, it, vi } from 'vitest';`

`import { env } from '../../../ClientApp/src/env';`

`const reactGaMock = vi.hoisted(() => ({`

`    event: vi.fn(),`

`        expect(reactGaMock.initialize).not.toHaveBeenCalled();`

`    });`

`    it('does not initialize ReactGA when no tracking ID is configured', async () => {`

`        const originalTrackingId = env.REACT_APP_GA_TRACKINGID;`

`        env.REACT_APP_GA_TRACKINGID = '';`

`        const { default: GoogleAnalytics } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');`

`        try {`

`            render(<GoogleAnalytics />);`

`            expect(reactGaMock.initialize).not.toHaveBeenCalled();`

`        } finally {`

`            env.REACT_APP_GA_TRACKINGID = originalTrackingId;`

`        }`

`    });`

`    it('tracks click events with the default dashboard category', async () => {`

`        const { trackGAEvent } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');`

tests/unit/config/coverageRemapPolicy.test.ts

```
svg
```

`svg`

`svg`

`svg`

`import { describe, expect, it } from "vitest";`

`import { describe, expect, it, vi } from "vitest";`

`import termsConfig from "../../../ClientApp/src/terms-config.json";`

`import { storybookCoverageConfig } from "../../../vitest.storybook.coverage";`

`import { storybookVitestRuntimePlugin } from "../../../vitest.storybook.runtime";`

`import unitConfig from "../../../vitest.unit.config";`

`/**`

` */`

`const coverage = unitConfig.test?.coverage;`

`const storybookCoverage = storybookCoverageConfig;`

`if (coverage === undefined) {`

`  throw new Error("vitest.unit.config.ts must declare unit coverage");`

`if (coverage?.provider !== "v8") {`

`  throw new Error("vitest.unit.config.ts must declare V8 unit coverage");`

`}`

`/** Categories the reviewed policy allows to leave the denominator. */`

`});`

`describe("remap inputs", () => {`

`  it("loads the terms configuration as data", () => {`

`    expect(termsConfig).toEqual({ TermsVersion: "1" });`

`  });`

`  it("carries no removed Vitest 3 coverage.all option", () => {`

``    // `all` was removed in Vitest 4; asserting it through a type escape claims``

`    // behaviour the runtime does not provide and reintroduces the JSON remap`

`    expect(coverage.provider).toBe("v8");`

`    expect(coverage.reportsDirectory).toBe("./reports/coverage/unit");`

`  });`

`  it("limits Storybook coverage remapping to executable application source", () => {`

`    expect(storybookCoverage.provider).toBe("v8");`

`    expect(storybookCoverage.include).toEqual(["ClientApp/src/**/*.{ts,tsx}"]);`

`    expect(storybookCoverage.exclude).toEqual(expect.arrayContaining([`

`      "ClientApp/src/api/web-api-client.ts",`

`      "ClientApp/src/external/**",`

`      "ClientApp/src/storybook/**",`

`      "ClientApp/src/**/*.stories.{ts,tsx}",`

`    ]));`

`  });`

`  it("adapts Storybook manager runs to supported Vitest and JSON coverage APIs", async () => {`

`    const standalone = vi.fn();`

`    const legacyInit = vi.fn();`

`    const vitest = {`

`      config: { coverage: { exclude: [] as string[] } },`

`      init: legacyInit,`

`      standalone,`

`    };`

`    storybookVitestRuntimePlugin.configureVitest({ vitest });`

`    await vitest.init();`

`    expect(standalone).toHaveBeenCalledOnce();`

`    expect(legacyInit).not.toHaveBeenCalled();`

`    expect(vitest.config.coverage.exclude).toContain("ClientApp/src/**/*.json");`

`  });`

`});`

tests/unit/config/vitestTopology.test.ts

```
svg
```

`svg`

`    expect(storybook.setupFiles).toEqual(["./vitest.storybook.setup.ts"]);`

`  });`

`  it("does not own unit coverage", () => {`

`    expect(storybook.coverage).toBeUndefined();`

`  it("owns only the Storybook executable-source coverage policy", () => {`

`    expect(storybook.coverage?.reportsDirectory).toBe(`

`      "./reports/coverage/storybook",`

`    );`

`    expect(storybook.coverage?.include).toEqual([`

`      "ClientApp/src/**/*.{ts,tsx}",`

`    ]);`

`  });`

`});`

tests/unit/coverage/coverageConfig.test.ts

```
svg
```

`svg`

`svg`

`import { describe, expect, it } from 'vitest';`

`import config from '../../../vitest.unit.config';`

`const resolveConfig = async () => {`

`    return config.test;`

`};`

`const coverageConfig = config.test?.coverage;`

`describe('unit coverage configuration', () => {`

`    it('keeps coverage config under test so Vitest applies it', async () => {`

`        const testConfig = await resolveConfig();`

`if (coverageConfig?.provider !== 'v8') {`

`    throw new Error('vitest.unit.config.ts must declare V8 unit coverage');`

`}`

`describe('unit coverage configuration', () => {`

`    it('keeps coverage config under test so Vitest applies it', () => {`

`        expect(testConfig?.coverage).toBeDefined();`

`        expect(testConfig?.coverage?.provider).toBe('v8');`

`        expect(coverageConfig).toBeDefined();`

`        expect(coverageConfig.provider).toBe('v8');`

``        // `json` emits coverage-final.json, which retains the statement,``

``        // function and branch maps. `json-summary` carries only per-file``

`        // totals, so Task A3's gap queue could rank work but not locate it.`

`        // Both are required; see scripts/coverage-gap-queue.mjs.`

``        // `lcov` is the only format SonarQube imports for TypeScript; dropping``

`        // it silently reports 0% coverage on SonarCloud, which reads as a real`

`        // regression rather than a missing file. See sonar-project.properties.`

`        expect(testConfig?.coverage?.reporter).toEqual([`

`        expect(coverageConfig.reporter).toEqual([`

`            'text',`

`            'html',`

`            'json-summary',`

`            'json',`

`            'lcov',`

`        ]);`

`        expect(testConfig?.coverage?.reportsDirectory).toBe('./reports/coverage/unit');`

`        expect(coverageConfig.reportsDirectory).toBe('./reports/coverage/unit');`

`    });`

`    it('still writes coverage evidence when the run is red', async () => {`

`        const testConfig = await resolveConfig();`

`    it('still writes coverage evidence when the run is red', () => {`

`        // Vitest defaults reportOnFailure to false, which writes no report at`

`        // all when any test fails - and it cleans the output directory first, so`

`        // a red run leaves nothing behind. The PR workflow uploads`

``        // reports/coverage/unit/** with `if: always()` and``

``        // `if-no-files-found: error`, so the upload would fail with "no files``

`        // found" and mask the real failure. A red vitest-unit is the expected`

`        // state until Child Plan B1 lands, so this must stay true.`

`        expect(testConfig?.coverage?.reportOnFailure).toBe(true);`

`        expect(coverageConfig.reportOnFailure).toBe(true);`

`    });`

`    it('measures editable handwritten source and excludes generated/vendor artifacts', async () => {`

`        const testConfig = await resolveConfig();`

`    it('measures editable handwritten source and excludes generated/vendor artifacts', () => {`

``        // Vitest 4 removed `coverage.all`; the explicit include below is what``

`        // brings uncovered files into the report. See`

`        // tests/unit/config/coverageRemapPolicy.test.ts for the remap policy.`

`        expect(testConfig?.coverage?.include).toEqual([`

`        expect(coverageConfig.include).toEqual([`

`            'ClientApp/src/**/*.{ts,tsx}',`

`            'webpack.config.js',`

`        ]);`

`        expect(testConfig?.coverage?.exclude).toEqual(expect.arrayContaining([`

`        expect(coverageConfig.exclude).toEqual(expect.arrayContaining([`

`            '**/*.d.ts',`

`            'ClientApp/src/api/web-api-client.ts',`

`            'ClientApp/src/external/**',`

`            'ClientApp/src/components/forms/HidableField/types.ts',`

`            'ClientApp/src/components/tiles/StandardPathway/types.ts',`

`        ]));`

`        expect(testConfig?.coverage?.exclude).not.toEqual(expect.arrayContaining([`

`        expect(coverageConfig.exclude).not.toEqual(expect.arrayContaining([`

`            'ClientApp/src/**/types.ts',`

`            'ClientApp/src/**/*Props.ts',`

`            'ClientApp/src/components/Inputs/NumberInput/types.ts',`

`            'ClientApp/src/routes/account/addBranch/addBranchProps.ts',`

`        ]));`

`    });`

`    it('fails the unit coverage gate below 100 percent', async () => {`

`        const testConfig = await resolveConfig();`

`        expect(testConfig?.coverage?.thresholds).toEqual({`

`    it('fails the unit coverage gate below 100 percent', () => {`

`        expect(coverageConfig.thresholds).toEqual({`

`            statements: 100,`

`            branches: 100,`

`            functions: 100,`

tests/unit/storybook/mswHandlers.test.ts

```
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
```

`import { setupServer } from 'msw/node';`

`import {`

`    artefactTypeResponses,`

`    lookupResponses,`

`    serviceResponses,`

`} from '../../../ClientApp/src/storybook/storybookFixtures';`

`import { CRMLookupTypes } from '../../../ClientApp/src/api/web-api-client';`

`import { mswHandlers } from '../../../.storybook/msw-handlers';`

`const server = setupServer(...mswHandlers);`

`const apiUrl = (path: string) => new URL(path, globalThis.location.origin);`

`beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));`

`afterEach(() => server.resetHandlers());`

`afterAll(() => server.close());`

`describe('Storybook MSW handlers', () => {`

`    it('returns the shared services fixture', async () => {`

`        const response = await fetch(apiUrl('/api/lookup/services'));`

`        expect(response.ok).toBe(true);`

`        await expect(response.json()).resolves.toEqual(serviceResponses);`

`    });`

`    it.each([`

`        [CRMLookupTypes.TCPortalMeasurementCategory, lookupResponses],`

`        [CRMLookupTypes.TCArtefactTypePortalCategory, artefactTypeResponses],`

`    ])('returns the deterministic %s lookup fixture', async (lookupType, expectedResponse) => {`

`        const url = apiUrl('/api/lookup');`

`        url.searchParams.set('LookupType', lookupType);`

`        const response = await fetch(url);`

`        expect(response.ok).toBe(true);`

`        await expect(response.json()).resolves.toEqual(expectedResponse);`

`    });`

`});`

vitest.storybook.config.ts

```
svg
```

`svg`

`svg`

`import { playwright } from '@vitest/browser-playwright';`

`import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';`

`import { defineConfig } from 'vitest/config';`

`import { storybookCoverageConfig } from './vitest.storybook.coverage';`

`import { storybookVitestRuntimePlugin } from './vitest.storybook.runtime';`

`const dirname = path.dirname(fileURLToPath(import.meta.url));`

` * executes their play() functions in Chromium through Vitest Browser Mode.`

` */`

`export default defineConfig({`

`    plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],`

`    plugins: [`

`        storybookTest({ configDir: path.join(dirname, '.storybook') }),`

`        storybookVitestRuntimePlugin,`

`    ],`

`    test: {`

`        name: 'storybook',`

`        globals: true,`

`        setupFiles: ['./vitest.storybook.setup.ts'],`

`        testTimeout: 15000,`

`        coverage: storybookCoverageConfig,`

`        // The addon keeps this project alive for MCP-triggered runs. A single`

`        // orchestrator prevents broad runs from exhausting the shared browser`

`        // and leaving a ready session whose orchestrator has disconnected.`

vitest.storybook.coverage.ts

```
import type { CoverageOptions } from 'vitest/node';
```

`/**`

` * Storybook coverage measures handwritten executable application source only.`

` * Keeping JSON assets outside this boundary prevents V8 from attempting to`

`` * remap Vite's `?import` JSON module as JavaScript while retaining TS/TSX data.``

` */`

`export const storybookCoverageConfig: CoverageOptions = {`

`    provider: 'v8',`

`    reportsDirectory: './reports/coverage/storybook',`

`    include: ['ClientApp/src/**/*.{ts,tsx}'],`

`    exclude: [`

`        '**/*.d.ts',`

`        'ClientApp/src/api/web-api-client.ts',`

`        'ClientApp/src/external/**',`

`        'ClientApp/src/parent/**',`

`        'ClientApp/src/storybook/**',`

`        'ClientApp/source-map-http-downloads/**',`

`        'ClientApp/src/**/*.test.{ts,tsx}',`

`        'ClientApp/src/**/*.spec.{ts,tsx}',`

`        'ClientApp/src/**/*.stories.{ts,tsx}',`

`        'ClientApp/src/**/*.docs.mdx',`

`    ],`

`};`

vitest.storybook.runtime.ts

```
import type { Vitest } from 'vitest/node';
```

`import type { Plugin } from 'vite';`

`type StorybookVitest = Pick<Vitest, 'init' | 'standalone'> & {`

`    config: {`

`        coverage: {`

`            exclude: string[];`

`        };`

`    };`

`};`

`type StorybookVitestPlugin = Plugin & {`

`    configureVitest: (context: { vitest: StorybookVitest }) => void;`

`};`

`/**`

` * Compatibility policy for Test-panel runs owned by @storybook/addon-vitest.`

` *`

`` * Storybook 10.5.10 calls Vitest's deprecated `init()` alias and replaces the``

` * project's coverage options when its coverage toggle is enabled. Route the`

` * dependency call to the supported API and keep JSON data out of V8 remapping.`

`` * Remove the init bridge after Storybook switches to `standalone()` upstream.``

` */`

`export const storybookVitestRuntimePlugin: StorybookVitestPlugin = {`

`    name: 'nmi:storybook-vitest-runtime-policy',`

`    configureVitest({ vitest }) {`

`        vitest.config.coverage.exclude.push('ClientApp/src/**/*.json');`

`        vitest.init = vitest.standalone.bind(vitest);`

`    },`

`};`

vitest.unit.config.ts

```
svg
```

`import path from 'node:path';`

`import type { ViteUserConfig } from 'vitest/config';`

`import type { CoverageOptions } from 'vitest/node';`

`import { defineConfig } from 'vitest/config';`

`type CoverageOptions = NonNullable<`

`    NonNullable<ViteUserConfig['test']>['coverage']`

`>;`

`/**`

`` * Vitest 4 removed `coverage.all`. The explicit `include` below already brings``