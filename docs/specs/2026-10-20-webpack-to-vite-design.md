# Webpack-to-Vite Migration Design

## Purpose

Move the production browser build from Webpack-specific loaders and plugins to
the Vite 8 pipeline while preserving observable application behavior. This
document records the completed target state, verification evidence, and the
remaining operational decisions after the staged transition.

## Decision

Use a compatibility-first staged migration. Both the Vite parity stage and the
final removal of the legacy Webpack path are now implemented and verified:

1. Make Vite the canonical development and production build path.
2. Preserve the application-facing `env` object while changing its browser build
   contract to Vite's `VITE_*` variables and `import.meta.env` access.
3. Replace Webpack CSS, Sass, TypeScript transpilation, CSS extraction, and
   asset rules with Vite built-ins.
4. Keep only the custom Vite plugins required for HTML environment substitution
   and MSAL redirect headers.
5. Prove generated artifacts and running-server behavior before removing the
   Webpack fallback and its dependencies; that final removal is now complete.

Items 1–5 are implemented and have passed the post-contraction migration checks.
The canonical `npm run dev` entrypoint, a local Playwright FCP baseline, and the
explicit production environment contract are in place.

## Current implementation status

| Contract                             | Status             | Evidence                                                                                                             |
| ------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Vite canonical build                 | PASS               | `VITE_ENVIRONMENT=production npm run build` succeeds and emits the two HTML entries.                                 |
| Developer server entrypoint          | PASS               | `npm run dev` starts Vite 8.3.4; `npm start` remains an alias.                                                       |
| Browser environment namespace        | PASS               | Browser consumers use `import.meta.env.VITE_*`; source-policy tests and searches pass.                               |
| Environment escaping and build guard | PASS               | Configuration tests cover HTML attribute escaping and required `VITE_ENVIRONMENT` for all build modes.               |
| ESLint coverage                      | PASS               | `vite.config.mts` is included by the flat config; `npx eslint vite.config.mts` and `npm run lint` pass.              |
| Full unit suite                      | PASS               | Fresh post-handoff single-worker run: 249 files and 2,821 tests passed in 525.09 seconds.                            |
| Storybook suite                      | PASS               | Fresh post-handoff single-worker run: 149 files and 344 tests passed in 72.96 seconds.                               |
| Artifact and runtime parity          | PASS               | `VITE_ENVIRONMENT=production npm run build`, build verifier, and runtime verifier pass; 113 JS, 5 CSS, 110 maps.     |
| Dependency pre-bundling              | PASS               | Vite 8.3.4 auto-discovers both HTML entries; forced scan completed in 2,227.88 ms without app-level `include`.       |
| Browser FCP baseline                 | PASS (local smoke) | Three fresh Chromium runs: 400, 408, and 388 ms FCP, HTTP 200, zero console errors or warnings.                      |
| Migration anti-pattern audit         | PASS               | No app `require()`, `module.exports`, JSX-bearing `.js`, module-scope `this`, Node built-in imports, or broad shims. |
| Legacy Webpack path                  | REMOVED            | `webpack.config.mjs`, its characterization test, direct Webpack packages, and the unused locale plugin were removed. |
| Final contraction                    | PASS               | Fresh lint, type-check, build, runtime, unit, Storybook, dependency, and browser checks passed.                      |
| Moderate audit findings              | PASS               | Removed unused `@codacy/codacy-cloud-cli`; `npm audit --audit-level=moderate` reports zero vulnerabilities.          |
| CI/release environment contract      | PASS (static)      | PR jobs use `VITE_ENVIRONMENT=local`; release uses `VITE_ENVIRONMENT=production`; hosted execution remains pending.  |
| Indirect Storybook dependency        | RETAIN             | `webpack-virtual-modules` is only in the Storybook addon-docs dependency chain, not the application build.           |
| Review commit and PR                 | OPEN               | Commit `e38fe71d`; [PR #92](https://github.com/gmtestandreview/portalsample/pull/92) is open against `main`.         |

## Environment variable policy

All browser-exposed configuration variables now use Vite's `VITE_` prefix. The
approved legacy-to-Vite mapping is:

| Legacy name                                | Vite name                               |
| ------------------------------------------ | --------------------------------------- |
| `REACT_APP_B2C_CLIENTID`                   | `VITE_B2C_CLIENTID`                     |
| `REACT_APP_B2C_AUTHORITY`                  | `VITE_B2C_AUTHORITY`                    |
| `REACT_APP_B2C_KNOWN_AUTHORITIES`          | `VITE_B2C_KNOWN_AUTHORITIES`            |
| `REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL`   | `VITE_B2C_POST_LOGOUT_REDIRECT_URL`     |
| `REACT_APP_B2C_READ_SCOPE`                 | `VITE_B2C_READ_SCOPE`                   |
| `REACT_APP_B2C_USER_IMPERSONATION_SCOPE`   | `VITE_B2C_USER_IMPERSONATION_SCOPE`     |
| `REACT_APP_B2C_REDIRECT_URL`               | `VITE_B2C_REDIRECT_URL`                 |
| `EXTERNAL_REDIRECT_URL`                    | `VITE_EXTERNAL_REDIRECT_URL`            |
| `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` | `VITE_APPINSIGHTS_INSTRUMENTATIONKEY`   |
| `REACT_APP_APPINSIGHTS_CONN_STRING`        | `VITE_APPINSIGHTS_CONN_STRING`          |
| `REACT_APP_GA_TRACKINGID`                  | `VITE_GA_TRACKINGID`                    |
| `REACT_APP_ENVIRONMENT`                    | `VITE_ENVIRONMENT`                      |
| `process.env.NODE_ENV`                     | `import.meta.env.MODE` / `DEV` / `PROD` |

Browser application code will read these values through `import.meta.env.VITE_*`
and use `import.meta.env.DEV`, `import.meta.env.PROD`, or `import.meta.env.MODE`
for build mode. Node-only tooling and tests may retain `process.env` when that
is their explicit runtime contract; Vite configuration will use `loadEnv` rather
than exposing arbitrary `process.env` values. Vendored `ClientApp/src/parent/**`
code is excluded from this application rename.

No global `process.env` shim will be introduced, and no secret will receive a
`VITE_` prefix because Vite exposes prefixed values to browser bundles.

## Preserved contracts

- Root `index.html` remains the main HTML entry.
- `redirect.html` remains a separate HTML entry for the MSAL redirect bridge.
- The application-facing `env` object remains available to existing consumers
  while its values are sourced from `import.meta.env`.
- Redirect responses receive `Cache-Control: no-store`, the existing CSP, and
  removal of `Cross-Origin-Opener-Policy`.
- Sass continues to use Dart Sass, `node_modules` load paths, and the existing
  deprecation-suppression policy.
- Type checking remains an explicit `tsc --noEmit` gate.
- Production JavaScript remains under `js/`; CSS under `css/`; fonts under
  `fonts/`; SVGs under `images/`.
- Local development uses `npm run dev`; `npm start` remains an equivalent alias
  for compatibility.

## Explicit migration decision

`VITE_ENVIRONMENT` is a required build-time signal in `ClientApp/src/env.ts`.
The Vite serve path provides a development default of `development`; every Vite
build command must provide its intended value explicitly, including custom build
modes.

## Development performance baseline

Vite 8.3.4's application configuration leaves dependency discovery enabled by
default and does not set `optimizeDeps.entries` or an application-level
`optimizeDeps.include`. A forced cold optimizer run discovered both HTML entries
and completed dependency scanning in 2,227.88 ms. The optimizer pre-bundled the
application's imported dependencies, including React, MSAL, Application
Insights, Formik, React Bootstrap, date-fns, and Lodash.

This evidence does not justify manually listing heavy dependencies in
`optimizeDeps.include`; explicit inclusions should be added only if a future
dependency is missed by automatic discovery or a measured development startup
regression identifies a concrete candidate.

The prior local browser baseline is three fresh Playwright Chromium contexts
with HTTP 200 responses, no page errors, and FCP values of 296 ms, 268 ms, and
256 ms. A fresh post-handoff sample recorded 400 ms, 408 ms, and 388 ms with
zero console errors or warnings. The latter sample has a 400 ms median and
398.67 ms mean. The difference is an observation across different cold-start
states, not a statistically controlled regression or a production performance
budget.

The post-handoff smoke runs served the app through `npm run dev`, returned HTTP
200, recorded 400, 408, and 388 ms FCP, and reported zero console errors or
warnings. Because these runs use a local environment and different cold-start
states from the prior baseline, they are evidence of runtime health, not proof
of a performance regression or improvement.

## Out of scope

- Application-level refactors unrelated to the build pipeline.
- Changes to generated API code, vendor mirrors, or captured source-map files.
- Deployment-server security headers outside the Vite development server.

## Rollback

The Webpack configuration and characterization test are intentionally no longer
part of the active tree. A targeted temporary copy of the pre-contraction
manifest/configuration files was captured during execution for recovery. A
normal review commit or pull request should be created before further cleanup;
if a post-contraction contract fails later, restore from that checkpoint or the
review commit and investigate the failed contract without weakening its
assertion.

## Post-contraction verification record

The final contraction removed `webpack.config.mjs`,
`tests/unit/config/webpackConfig.test.ts`, the direct Webpack packages, and the
unused `@react-aria/optimize-locales-plugin`. The stale optional Webpack input
was also removed from `scripts/storybook-closure.mjs`.

The dependency-security test now allows a transitive package to be absent after
contraction, but still enforces its minimum version for every installed copy.
This keeps the security floor meaningful without requiring removed packages to
remain in the graph. The five moderate audit findings were traced to the unused
direct development dependency `@codacy/codacy-cloud-cli`; removing it removed
the vulnerable `got` chain without applying npm's breaking `--force` downgrade.

```text
VITE_ENVIRONMENT=production npm run build
```

Evidence: `npm run lint`, `npm run type-check`,
`npm audit --audit-level=moderate`, the Vite build/artifact/runtime verifiers,
`npm run test:unit -- --maxWorkers=1 --reporter=dot`, and
`npm run test:storybook -- --maxWorkers=1 --reporter=dot` passed. The dependency
search found no direct Webpack package or root Webpack build config. The only
remaining Webpack-named package is the indirect `webpack-virtual-modules` helper
under `@storybook/addon-docs` → `unplugin`; it is retained because it belongs to
Storybook's toolchain and is not part of the application build.

## Next steps

1. Observe the hosted PR workflow and normal deployment process to confirm the
   statically corrected `VITE_ENVIRONMENT` values are received by CI.
2. Repeat FCP on CI hardware only if a formal performance budget or regression
   threshold is introduced; the three-run local sample is sufficient for this
   handoff's runtime smoke evidence.
3. Revisit `webpack-virtual-modules` only on a Storybook dependency upgrade or a
   relevant security advisory; no separate migration review is currently
   required.
4. Monitor hosted CI on
   [PR #92](https://github.com/gmtestandreview/portalsample/pull/92), complete
   review/merge, and run deployment smoke checks after merge.
