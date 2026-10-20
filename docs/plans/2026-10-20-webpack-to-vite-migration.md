# Webpack-to-Vite Migration Plan

## Objective

Migrate the former Webpack build behavior to `vite.config.mts`, rename browser
environment variables to Vite's `VITE_*` contract, remove the legacy Webpack
build path, and record the evidence and follow-up work needed for handoff.

## Current status (2026-10-20)

The Vite migration, parity checks, and final Webpack contraction are implemented
and verified. Vite is now the canonical development and production build path.
Production builds require an explicit non-secret `VITE_ENVIRONMENT` value.

| Area                                         | Current status       | Evidence                                                                                                                         |
| -------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Vite configuration and environment migration | PASS                 | `vite.config.mts`, `ClientApp/src/env.ts`, browser consumers, and Vite fixtures use the `VITE_*` contract.                       |
| Environment/source policy                    | PASS                 | `tests/unit/config/env.test.ts` passes and application-source searches find no forbidden browser references.                     |
| ESLint coverage                              | PASS                 | `npx eslint vite.config.mts` and `npm run lint` pass; the flat config matches `mts` files.                                       |
| Type safety                                  | PASS                 | `npm run type-check` passes.                                                                                                     |
| Unit suite                                   | PASS                 | Fresh post-handoff run with one worker: 249 files and 2,821 tests passed in 525.09 seconds.                                      |
| Storybook suite                              | PASS                 | Fresh post-handoff run with one worker: 149 files and 344 tests passed in 72.96 seconds.                                         |
| Vite production artifacts                    | PASS                 | `VITE_ENVIRONMENT=production npm run build` and `node scripts/verify-vite-build.mjs` pass; artifacts include JS, CSS, and maps.  |
| Running-server headers                       | PASS                 | `node scripts/verify-vite-runtime.mjs` passes redirect CSP/no-store and index isolation checks.                                  |
| Developer server and browser FCP             | PASS (runtime smoke) | Three fresh Playwright runs recorded 400, 408, and 388 ms FCP; all loaded with HTTP 200 and zero console errors or warnings.     |
| Dependency pre-bundling                      | PASS                 | Vite 8.3.4 automatically scans both HTML entries; forced dependency scan completed in 2,227.88 ms. No app `include` is needed.   |
| Migration anti-pattern audit                 | PASS                 | No app `require()`, module exports, JSX-bearing `.js`, module-scope `this`, Node built-in imports, or global shims found.        |
| Legacy comparison                            | PASS                 | Isolated Webpack build emitted both HTML entries, identity assets, CSS, JS, and source maps.                                     |
| Webpack contraction                          | PASS                 | Root config and characterization test removed; direct Webpack packages and unused locale plugin removed; no installed `webpack`. |
| Audit findings                               | PASS                 | Removed unused direct `@codacy/codacy-cloud-cli`; `npm audit --audit-level=moderate` now reports 0 vulnerabilities.              |
| CI/deployment environment                    | PASS (static)        | PR jobs use `VITE_ENVIRONMENT=local`; release uses `VITE_ENVIRONMENT=production`; hosted workflow execution remains pending.     |
| Indirect Storybook helper                    | REVIEWED — RETAIN    | `webpack-virtual-modules` is only `@storybook/addon-docs` → `unplugin` → helper; no direct application use was found.            |
| Review commit and PR                         | OPEN                 | Commit `e38fe71d`; PR [#92](https://github.com/gmtestandreview/portalsample/pull/92) is open against `main`.                     |

## Evidence baseline and current implementation

- Before contraction, the Webpack path provided two HTML entries, custom Sass
  rules, custom asset output paths, runtime HTML variables, redirect middleware,
  source-map modes, and production vendor splitting.
- Vite now has React, environment-template, redirect-CSP, Sass,
  public-directory, multi-page, source-map, and Rolldown configuration
  (`vite.config.mts`).
- Vite configuration tests, source-policy tests, build-artifact verification,
  and running-server verification now cover the migration
  (`tests/unit/config/viteConfig.test.ts`, `tests/unit/config/env.test.ts`,
  `scripts/verify-vite-build.mjs`, `scripts/verify-vite-runtime.mjs`).
- The former Webpack characterization test was removed with the legacy config;
  Vite configuration, artifact, runtime, and source-policy tests are now the
  active build contract.
- The browser application now reads `import.meta.env.VITE_*`; Node-only
  `process.env` usage in tests/tooling and vendored `ClientApp/src/parent/**`
  code remains explicitly outside the migration boundary.
- The flat ESLint configuration now includes `mts` files, and
  `tests/unit/config/eslintPolicy.test.ts` guards that `vite.config.mts`
  receives a non-empty rule set.
- `package.json` now exposes `npm run dev` as the canonical local Vite server
  command; `npm start` remains available as an alias.
- Vite 8.3.4's automatic dependency optimizer scans `index.html` and
  `redirect.html` without an application-level `optimizeDeps.include`; no
  measured missing dependency requires a manual inclusion.
- Playwright browser measurements record a prior local baseline of 256–296 ms
  and a fresh post-handoff sample of 400, 408, and 388 ms across three Chromium
  contexts. All samples loaded with HTTP 200 responses and no console errors or
  warnings. The difference is an observation across different cold-start states,
  not a statistically controlled regression or production performance budget.
- Browser-source audits found no CommonJS `require()` or `module.exports`, JSX
  in `.js` files, module-scope `this`, Node built-in imports, global
  `process.env` usage, or broad Node/global shims.
- The dependency-security test now treats an absent transitive package as safe
  after dependency contraction, while retaining version-floor assertions for
  every installed copy. This keeps direct dependency existence checks strict.
- `webpack-virtual-modules` remains only as an indirect dependency of
  `@storybook/addon-docs` through `unplugin`; it is not a direct application
  build dependency and removing the Storybook addon would be unrelated scope. It
  is retained and should be revisited only during a Storybook dependency upgrade
  or if a security advisory directly affects that chain.
- The former five moderate audit findings were traced to the unused direct
  development dependency `@codacy/codacy-cloud-cli` and its `got` chain. The
  package was removed rather than applying npm's breaking `--force` downgrade;
  the resulting lockfile passes the moderate audit gate with zero findings.
- The PR and release workflows now supply the required `VITE_ENVIRONMENT` name;
  the release workflow is the repository's deployment/build context. Local
  static inspection confirms the wiring, while GitHub-hosted execution remains
  an external check.

## Requirement-to-test matrix

| Requirement                             | Test or command                                                                              | Pass condition                                                                                                                                | Status          |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Runtime environment injection           | `tests/unit/config/viteConfig.test.ts`; generated `dist/index.html` inspection               | Every declared placeholder is replaced, values are escaped, and `VITE_ENVIRONMENT` is available through `import.meta.env`.                    | PASS            |
| Environment namespace migration         | `rg`, `tests/unit/config/env.test.ts`, `npm run type-check`, and production build inspection | Browser application code contains no legacy `REACT_APP_*` contract or custom `process.env.*` access; every exposed key is `VITE_*`.           | PASS            |
| Two HTML entries                        | Vite config test and build-artifact verifier                                                 | `dist/index.html` and `dist/redirect.html` both exist and reference their intended entry behavior.                                            | PASS            |
| Redirect security headers               | Running Vite server verifier                                                                 | `/redirect.html` returns the existing CSP and `no-store`; non-redirect pages do not receive those headers.                                    | PASS            |
| Sass behavior                           | Vite config test and production build                                                        | Build succeeds with the configured Sass load path and deprecation policy.                                                                     | PASS            |
| Asset behavior                          | Build-artifact verifier                                                                      | Compiled CSS, fonts, SVGs, favicon, and NMI tile are present in the agreed directories.                                                       | PASS            |
| Resolver exclusions                     | Vite config test and source search                                                           | Webpack’s three false aliases are blocked by a Vite resolver plugin, while the TypeScript exclusion policy remains unchanged.                 | PASS            |
| Type safety                             | `npm run type-check`                                                                         | TypeScript exits successfully without weakening the existing script.                                                                          | PASS            |
| Source maps                             | Build-artifact verifier                                                                      | Application JavaScript source maps are emitted; only documented Vite runtime helper files may be mapless.                                     | PASS            |
| Code splitting                          | Vite config test and artifact verifier                                                       | Intended groups exist and redirect output does not receive application vendor chunks.                                                         | PASS            |
| Development entrypoint and FCP baseline | `npm run dev`; Playwright Chromium measurement                                               | Vite starts through the documented command; local FCP is recorded with no page errors.                                                        | PASS (baseline) |
| Dependency pre-bundling                 | Forced Vite dev run with `DEBUG=vite:deps,vite:time`                                         | HTML entries are discovered and dependencies are pre-bundled; no app-level `optimizeDeps.include` is required by current evidence.            | PASS            |
| Webpack removal readiness               | `rg`, `npm ls`, and package manifest inspection                                              | No direct Webpack package, root Webpack config, or Vite build/test dependency remains; the documented Storybook transitive helper is allowed. | PASS            |

## Ordered execution and current next steps

### 1. Inventory and add failing environment/parity tests — completed

Update `tests/unit/config/viteConfig.test.ts` to cover:

- `base: '/'` and explicit output cleanup.
  - `VITE_ENVIRONMENT` substitution and the development default.
- The complete legacy-to-`VITE_*` mapping in
  `docs/specs/2026-10-20-webpack-to-vite-design.md`.
- `import.meta.env.VITE_*` access in `ClientApp/src/env.ts` and the preserved
  application-facing `env` object.
- A source-policy test that rejects browser `process.env.*` and legacy
  `REACT_APP_*` references while allowing Node-only and vendored exceptions.
- CSS, font, and SVG output routing.
- The redirect entry's output contract.

The build-artifact verifier at `scripts/verify-vite-build.mjs` and the
running-server verifier at `scripts/verify-vite-runtime.mjs` are now present.
Their successful production-build and running-server results are recorded in the
current-status section above.

### 2. Implement Vite parity and environment migration — completed

Modify `vite.config.mts` and `index.html` to:

- Add the environment key and safe template substitution.
- Rename browser variables using the approved mapping, update
  `ClientApp/src/env.ts`, its global type declarations, consumers, tests,
  deployment examples, and Vite configuration inputs.
- Replace application `process.env.VARIABLE` reads with
  `import.meta.env.VITE_VARIABLE`; use `import.meta.env.DEV/PROD/MODE` for mode
  checks and `loadEnv` for Node-side Vite configuration.
- Remove the HTML `globalThis.REACT_APP_*` bridge once all browser consumers
  read `import.meta.env`; do not add a global `process.env` shim.
- Make `base`, `outDir`, and cleanup behavior explicit.
- Route CSS, fonts, SVGs, and fallback assets to the agreed output directories.
- Preserve the existing HTML and redirect plugins.
- Keep `npm run type-check` as the type-checking authority.

### 3. Verify the Vite path — completed

The verification sequence has been executed. The current evidence includes:

```text
npm run dev -- --host 127.0.0.1 --port 4174 --clearScreen false
npx playwright --version
Playwright Chromium FCP measurement: prior baseline 256 ms, 268 ms, 296 ms;
fresh handoff sample 400 ms, 408 ms, 388 ms; no page errors or warnings
npm run test:unit -- tests/unit/config/viteConfig.test.ts tests/unit/config/env.test.ts --maxWorkers=1 --reporter=dot
rg -n "process\\.env\\.|REACT_APP_|EXTERNAL_REDIRECT_URL" ClientApp/src --glob '!parent/**'
npx eslint vite.config.mts
npm run lint
npm run type-check
VITE_ENVIRONMENT=production npm run build
node scripts/verify-vite-build.mjs
node scripts/verify-vite-runtime.mjs
```

The generated HTML, asset paths, source maps, response headers, environment
escaping, source-policy results, dev-server startup, and browser FCP baseline
were inspected by the dedicated verifiers. Fresh post-contraction unit and
Storybook results are recorded in the current-status section below.

### 4. Compare before contraction — completed

The legacy configuration was built into an isolated `dist-webpack-compare`
directory while the Webpack dependencies were still available. Both builds
emitted the two HTML entries, identity assets, CSS, JavaScript, and source maps.
The generated comparison directory was removed after verification.

Intentional differences are recorded: Webpack emits fewer, larger vendor groups
and minifies HTML more aggressively; Vite emits more focused hashed chunks and
preserves readable HTML structure. These differences did not affect the required
entry, asset, environment, or source-map contracts.

### 5. Contract the legacy path — completed

The final contraction was executed after capturing a targeted rollback copy of
the modified manifest/configuration files. The following changes are now present
and verified:

- The listed Webpack-only development packages were removed with npm, updating
  `package.json` and `package-lock.json` together.
- `webpack.config.mjs` and `tests/unit/config/webpackConfig.test.ts` were
  removed; their active coverage is replaced by Vite configuration and artifact
  tests.
- The unused `@react-aria/optimize-locales-plugin` was removed.
- The stale optional Webpack input was removed from
  `scripts/storybook-closure.mjs`.
- The dependency-security characterization now permits removed transitive
  packages to be absent while enforcing floors for every installed copy.
- Repository and lockfile searches found no direct Webpack build dependency or
  root Webpack configuration.

The post-contraction checks passed. The targeted rollback copy remains outside
the repository at
`C:\Users\gregm\AppData\Local\Temp\nmi-webpack-contraction-e63bbe1238854eacb19cae538e1a8113`.

### 6. Final post-contraction verification — completed

The following was run after the contraction. The full Vitest suites used
`--maxWorkers=1` because the default parallel invocation remained silent in this
machine; the single-worker run produced live progress and completed cleanly:

```text
npm run lint
npm run type-check
npm run test:unit -- --maxWorkers=1 --reporter=dot
npm run test:storybook -- --maxWorkers=1 --reporter=dot
VITE_ENVIRONMENT=production npm run build
node scripts/verify-vite-build.mjs
node scripts/verify-vite-runtime.mjs
npm run dev -- --host 127.0.0.1 --port 4174 --clearScreen false
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4174/
npm ls webpack webpack-cli webpack-dev-server copy-webpack-plugin css-loader fork-ts-checker-webpack-plugin html-webpack-plugin mini-css-extract-plugin sass-loader style-loader ts-loader --depth=0
```

Observed result: lint, type-check, build/artifact/runtime verification, the
single-worker full unit and Storybook suites, and the live Playwright smoke
checks all passed. The fresh FCP sample was 400, 408, and 388 ms (median 400 ms,
mean 398.67 ms); these local observations are not a production budget or a
controlled regression study. `npm audit --audit-level=moderate` reported zero
vulnerabilities after removal of the unused Codacy CLI. The dependency search
found no direct Webpack package or root build config; `webpack-virtual-modules`
remains only through Storybook's documented addon dependency chain and is
retained by decision.

## Files

### Create

- `docs/specs/2026-10-20-webpack-to-vite-design.md`
- `docs/plans/2026-10-20-webpack-to-vite-migration.md`
- `scripts/verify-vite-build.mjs`
- `scripts/verify-vite-runtime.mjs`

### Modify

- `vite.config.mts`
- `index.html`
- `ClientApp/src/env.ts` and all browser consumers/tests of the environment
  contract.
- `tests/unit/config/viteConfig.test.ts`
- `tests/unit/config/env.test.ts`
- `tests/unit/config/eslintPolicy.test.ts`
- `eslint.config.mjs`
- `package.json` — includes the `dev` script and no direct Webpack build
  packages.
- `package-lock.json` — regenerated after the dependency contraction.
- `scripts/storybook-closure.mjs` — no longer lists the removed root Webpack
  config as an optional input.
- `tests/unit/config/dependencySecurity.test.ts` — absent transitive packages
  are allowed while installed copies remain subject to version floors.

### Removed during final contraction

- `webpack.config.mjs`
- `tests/unit/config/webpackConfig.test.ts`

## Next steps

1. Run the GitHub PR workflow and confirm the hosted build receives
   `VITE_ENVIRONMENT=local`; run the release workflow only through the normal
   deployment process and confirm its production value.
2. Treat the three-run FCP sample as the current local handoff evidence. Repeat
   it on CI hardware only if a formal performance budget or regression threshold
   is introduced.
3. Keep `webpack-virtual-modules` under observation as an indirect Storybook
   dependency; no separate migration review is required unless the dependency
   chain changes or receives a relevant advisory.
4. Monitor hosted CI on
   [PR #92](https://github.com/gmtestandreview/portalsample/pull/92), complete
   the review/merge path, and run deployment smoke checks after merge.

## Completion criteria

The migration is verified for the Vite configuration, browser environment
contract, generated artifacts, running-server headers, migration anti-pattern
audits, developer startup, fresh unit and Storybook suites, and a post-
contraction browser smoke check. The build contract still requires deployment or
CI to provide an explicit `VITE_ENVIRONMENT` value. The audit findings are
remediated, the CI/release wiring is updated, the FCP sample is expanded to
three fresh runs, and the indirect Storybook helper is dispositioned as
retained. Remaining follow-up is operational: observe hosted CI/deployment and
complete the review/merge path.
