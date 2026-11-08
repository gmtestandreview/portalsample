# Storybook + Vitest Browser Mode contract

Load when editing Storybook play-function tests, the Vitest addon, Chromium
Browser Mode, Test panel runtime integration, or Storybook Vitest coverage.

- `vitest.storybook.config.ts` uses
  `storybookTest({ configDir: path.join(dirname, '.storybook') })` from
  `@storybook/addon-vitest/vitest-plugin` and `storybookVitestRuntimePlugin`.
- `test.name: 'storybook'`, `watch: false`, `globals: true`,
  `setupFiles: ['./vitest.storybook.setup.ts']`, `testTimeout: 15000`,
  `maxWorkers: 1`.
- Browser mode: `enabled: true`, `headless: true`, `provider: playwright({})`
  imported from `@vitest/browser-playwright`,
  `instances: [{ browser: 'chromium' }]`. API server host `127.0.0.1`, port
  `47005`, configured on `test.api` (not `test.browser.api`).
- Vite optimization prebundles `msw-storybook-addon/preview`; `resolve.dedupe`
  includes React and React DOM. The supplied comments tie these to browser graph
  reload and duplicated React hooks; preserve unless a specific verified fix
  supersedes them.
- Storybook coverage: V8, `reports/coverage/storybook`, include
  `ClientApp/src/**/*.{ts,tsx}`; excluded `.d.ts`, generated API, storybook,
  external, parent, specified components and docs/tests/stories. Exact arrays
  live in `vitest.storybook.coverage.ts`.
- `vitest.storybook.runtime.ts` defines a `configureVitest` hook to keep
  `ClientApp/src/**/*.json` excluded when the Storybook Test panel overwrites
  coverage options. It also provides an `init` alias bound to
  `vitest.standalone()` for the addon compatibility call. The file comment cites
  Storybook `10.5.10`; `package.json` now pins `10.6.5`, so **do not conclude
  whether the bridge remains necessary without live dependency tests**.
- `vitest.storybook.setup.ts` uses `@testing-library/jest-dom/vitest`,
  `VITE_ENV_FIXTURES.storybook`, browser shims, and narrowly targeted expected
  ErrorBoundary error filtering with cleanup afterAll. Preserve the
  startsWith-based filter (including `Uncaught` normalization); broad
  console/error suppression would mask regressions.
- The `@storybook/addon-vitest` child uses `VITEST_STORYBOOK=true`, causing root
  `vitest.config.ts` to export the Storybook leaf directly. Do not remove this
  fast path without measuring addon startup and checking its 30-second startup
  behavior.
- This is **Vitest Browser Mode driven by Playwright**, not the **Playwright
  Test runner**. Storybook BDD/MCP scenarios instead run
  `playwright.storybook.config.ts` with a URL/server-mode resolver,
  `workers: 1`, nonparallel tests, and separate reports. A request to test
  Storybook UI is ambiguous until its requested artifact (play function vs BDD
  scenario) is inspected.

Run `npm run test:storybook` for relevant play-function changes;
`npm run test:storybook:coverage` only when coverage evidence is needed.
Test-panel behavior and the addon child require their own live integration
evidence; a green leaf run alone does not verify both.
