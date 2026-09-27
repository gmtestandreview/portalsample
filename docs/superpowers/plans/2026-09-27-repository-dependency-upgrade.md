# Repository Dependency Upgrade Implementation Plan

**Goal:** Upgrade every registry-outdated direct dependency to a reviewed
compatible release, remove the complete `package.json` `overrides` object and
its root causes, raise the tested Node floor to `24.21.0`, and keep React/React
DOM at exactly `18.3.1` and TypeScript at exactly `5.9.3`.

**Architecture:** Use exact migration pins and green, independently reviewable
cohorts. Replace deprecated tooling and upgrade every override owner before
deleting overrides. Treat MSAL 5 as a coordinated source, build, Entra B2C, and
hosting migration with an isolated redirect bridge and an additive rollback
window; keep telemetry in a separate cohort. Finish with a deterministic
outdated-package allowlist and the repository's complete CI gate.

**Tech Stack:** npm `11.19.1`, lockfile v3, Node `>=24.21.0`, React `18.3.1`,
TypeScript `5.9.3`, React Router 7, MSAL 5, Application Insights React 18
channel, Webpack 5, Webpack Dev Server 6, Vite 8, Storybook 10, Vitest 4,
Playwright, Sass, Remark, and patch-package.

**Supersedes:** The end-state decisions in
`docs/superpowers/plans/2026-09-10-dependency-overrides-rationalisation.md` and
the pre-remediation 66/100 version of this plan. The companion review remains
the audit trail for the corrections incorporated here.

## Source Inputs

- User request on 2026-09-27: complete the repository dependency upgrade, remove
  overrides, keep React `18.3.1`, and keep TypeScript `5.9.3`.
- User decision on 2026-09-27: raise the Node floor to `24.21.0`.
- Planned follow-on change: add `react-hook-form` with manifest range
  `^7.89.0`. The supplied lock entry resolves `7.89.0`, requires Node
  `>=18.0.0`, and declares React peers covering React 18. This is compatible
  with Node `24.21.0` and React `18.3.1`, but remains outside this migration
  unless it is already present in the preserved implementation baseline.
- `docs/superpowers/plans/2026-09-27-repository-dependency-upgrade-review.md`:
  devil's advocate findings and 66/100 baseline score.
- `package.json` and `package-lock.json`: direct declarations, npm `11.19.1`,
  lockfile v3, install policy, scripts, current graph, and 16 override rules.
- `tests/unit/config/dependencySecurity.test.ts` and
  `tests/unit/config/workflowPolicy.test.ts`: dependency, deprecation, runtime,
  and CI policy contracts.
- `.github/workflows/pr.yml`, `.github/workflows/release.yml`, and
  `.github/workflows/chromatic.yml`: clean installs, Node provisioning, and
  quality gates.
- `ClientApp/src/index.tsx`, `ClientApp/src/authentication/authConfig.ts`,
  `ClientApp/src/authentication/AuthenticatedElement.tsx`,
  `ClientApp/src/authentication/AccountProvider.tsx`, and
  `ClientApp/src/routes/sign-out/index.tsx`: current MSAL bootstrap, redirect,
  silent-token, and logout behavior.
- `webpack.config.js`, `index.html`, and
  `tests/unit/config/webpackConfig.test.ts`: current single-entry build and
  fixed development bundle filename.
- `patches/@azure+msal-react+2.2.0.patch`, `patches/sockjs+0.3.24.patch`, and
  `patches/html-react-parser+6.1.4.patch`: install-time compatibility changes.
- `remark.config.mjs`, `.remarkignore`, and the current `lint:mdx` command:
  behavior to preserve while removing `remark-cli` and `unified-engine`.
- `scripts/lsmcp-typescript-mcp.cmd` and `.lsmcp/config.json`: tracked lsmcp
  integration to retire with its dependencies.
- Live `npm outdated --json --long`, `npm audit`, `npm ls`, and registry
  metadata captured 2026-09-27.
- MSAL Browser 5.23 migration guide:
  `AzureAD/microsoft-authentication-library-for-js`, ref
  `msal-browser-v5.23.0`, document `lib/msal-browser/docs/v4-migration.md`.
- MSAL Browser 3-to-4 migration guide:
  `AzureAD/microsoft-authentication-library-for-js`, ref
  `msal-browser-v5.23.0`, document `lib/msal-browser/docs/v3-migration.md`;
  required because the repository starts on browser 3.30.0.
- MSAL Browser redirect bridge guide:
  `AzureAD/microsoft-authentication-library-for-js`, ref
  `msal-browser-v5.23.0`, document `lib/msal-browser/docs/redirect-bridge.md`.
- MSAL Browser token-lifetime and cache-policy guide:
  `AzureAD/microsoft-authentication-library-for-js`, ref
  `msal-browser-v5.23.0`, document `lib/msal-browser/docs/token-lifetimes.md`;
  including deterministic `CacheLookupPolicy.Skip` hidden-iframe renewal.
- Webpack Dev Server 6 release notes:
  repository `webpack/webpack-dev-server`, release `v6.0.0`.
- Live `https://portal.measurement.gov.au/sign-in/` response headers captured
  2026-09-27: site-wide baseline includes
  `Cross-Origin-Opener-Policy: same-origin` and cache validators but not
  `Cache-Control: no-store`.

## Decisions, Constraints, and External Gates

- `Typescript 5.93` means the published TypeScript version `5.9.3`.
- `react`, `react-dom`, and `typescript` are exact manifest pins with no `^` or
  `~`.
- Every package changed by this migration uses an exact manifest pin. Relaxing
  ranges is a separate future policy change. The planned `react-hook-form`
  `^7.89.0` existing user-owned baseline dependency — preserve ^7.89.0 unless
  separately authorised.
  If it exists before Task 0 starts, preserve it byte-for-byte as baseline and
  refresh the dependency inventory rather than normalizing its range.
- React type packages remain on exact React 18-compatible releases:
  `@types/react` `18.3.31` and `@types/react-dom` `18.3.7`.
- The Node floor is exactly `24.21.0` in `engines`, `devEngines`, and the
  lower-bound CI job. `.node-version` remains `24.21.0`.
- The four direct Vitest packages remain exactly `4.1.11` because Storybook
  addon-vitest 10.6 supports Vitest 3/4, not Vitest 5.
- React Router remains on `7.18.4`; version 8 requires React/React DOM 19.
- Application Insights React remains on its React 18 channel, `18.3.6`; version
  19 requires React 19.
- The tracked lsmcp launcher and configuration are intentionally retired without
  replacement. The repository does not preserve compatibility for untracked
  editor/MCP configurations that invoke the deleted launcher; the release note
  must call this out.
- The MSAL bridge path is `/redirect.html`. `REACT_APP_B2C_REDIRECT_URL` must
  resolve to that exact same-origin path in every environment.
- The deployed bridge URI is terminal: it must return `200` directly, never
  redirect, and contain no query or fragment. The verifier uses
  `fetch(..., { redirect: 'manual' })` and requires `response.url` to equal the
  PR-recorded URI byte-for-byte after URL normalization.
- `/redirect.html` gets a route-specific CSP of
  `default-src 'none'; script-src 'self'; base-uri 'none';
  form-action 'none'; object-src 'none'; frame-ancestors 'self'`.
  Broader portal analytics/telemetry sources are not inherited by this
  auth-response page.
- `REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL` keeps its current application
  destination because the application uses `logoutRedirect`, for which a
  post-logout bridge is optional.
- MSAL v5's removal of request-level `onRedirectNavigate` is handled by putting
  `onRedirectNavigate: () => !BrowserUtils.isInIframe()` in the global MSAL
  configuration and removing both request-level callbacks. This deliberately and
  consistently blocks all interactive redirect navigation while the portal is
  embedded in an iframe. Because that broadens a logout-only/request-local
  behavior into a global auth policy, Task 0 records it in an accepted ADR with
  named product and security deciders before Task 5 starts.
- Production rollout cannot begin until the Entra application administrator and
  hosting/platform maintainer have recorded ownership and change windows in the
  pull request. Repository implementation can proceed before that gate;
  production release cannot.
- No task commits a failing test or knowingly deprecated dependency graph. RED
  is observed locally and committed only with the GREEN implementation.
- Existing user-owned `package.json` and `package-lock.json` changes are part of
  the baseline and must be preserved in an isolated worktree before
  implementation.
- The root `postinstall` remains exactly `patch-package`; `allowScripts` remains
  exactly `@parcel/watcher`, `esbuild`, and `msw`, all set to `true`. Every
  graph-changing cohort inventories installed `preinstall`
  /`install`/`postinstall` owners and fails on a new or skipped approval.

## End-State Acceptance Contract

- `react` and `react-dom` are exactly `18.3.1`; `typescript` is exactly `5.9.3`.
- Node `24.21.0` passes strict install, type-check, lint, unit tests, and
  production build in CI.
- `package.json` has no `overrides` property, and the lockfile contains no
  `overridden` markers or deprecated package metadata.
- `npm audit --audit-level=low` reports zero vulnerabilities; `npm ls --all`
  reports no invalid, missing, or extraneous package.
- Every registry-outdated direct package is either at the exact reviewed target
  or appears in the exact compatibility-hold allowlist below.
- MSAL 5 compiles against its actual APIs, uses an isolated same-origin redirect
  bridge, and passes local build checks plus real staging login, redirect
  return, silent-renewal fallback, protected API, and logout checks.
- The deployed bridge returns `200` without redirection, is not cached, has no
  COOP header, carries the restrictive route-only CSP, loads one self-contained
  same-origin bridge chunk, and does not load the main React application,
  telemetry, analytics, or third-party scripts.
- Application Insights initialization, page-view tracking, and handled-exception
  tracking are verified independently of the MSAL cohort.
- MDX lint preserves configuration, `.remarkignore`, frail warning behavior,
  deterministic output, and empty-pattern failure.
- Every committed cohort is green and can be reverted without restoring the
  override object to claim completion.

## Target Version Matrix

All targets are exact registry results captured on 2026-09-27.

- **Cohort:** React runtime
  - **Current:** `react` /`react-dom` `^18.3.1`
  - **Exact target:** `18.3.1`
  - **Decision:** Hard user constraint.

- **Cohort:** React types
  - **Current:** `@types/react` `^18.3.31`; `@types/react-dom` `^18.3.7`
  - **Exact target:** `18.3.31`; `18.3.7`
  - **Decision:** Stay on React 18 types.

- **Cohort:** TypeScript
  - **Current:** `^5.9.3`
  - **Exact target:** `5.9.3`
  - **Decision:** Hard user constraint.

- **Cohort:** Node types
  - **Current:** `^24.13.3`
  - **Exact target:** `24.19.0`
  - **Decision:** Latest captured Node 24 type line; exact-floor runtime tests
    guard runtime use.

- **Cohort:** Node policy
  - **Current:** `>=24.0.0`
  - **Exact target:** `>=24.21.0`
  - **Decision:** Standardize the supported Node 24 baseline at `24.21.0`;
    this remains above jsdom 30's minimum Node 24 requirement.

- **Cohort:** MSAL
  - **Current:** browser `3.30.0`; React `2.2.0`
  - **Exact target:** browser `5.23.0`; React `5.7.1`
  - **Decision:** Coordinated code/build/deployment migration.

- **Cohort:** Application Insights
  - **Current:** common/web `3.4.3`; React `3.4.3`
  - **Exact target:** common/web `3.4.4`; React `18.3.6`
  - **Decision:** React 18-compatible channel.

- **Cohort:** Application Insights peers
  - **Current:** transitive `history` `5.3.0`; `tslib` `2.8.1`
  - **Exact target:** direct `history` `5.3.0`; `tslib` `2.8.1`
  - **Decision:** Satisfy declared peers under strict installs.

- **Cohort:** Router
  - **Current:** `7.18.3`
  - **Exact target:** `7.18.4`
  - **Decision:** Hold major 7 for React 18.

- **Cohort:** Dates
  - **Current:** `date-fns` `3.6.0`; `react-datepicker` `7.6.0`
  - **Exact target:** `4.4.0`; `9.1.0`
  - **Decision:** Upgrade coupled date packages together.

- **Cohort:** Error/analytics
  - **Current:** `react-error-boundary` `4.1.2`; `react-ga4` `2.1.0`
  - **Exact target:** `6.1.6`; `3.0.1`
  - **Decision:** Latest captured React 18-compatible majors.

- **Cohort:** DOM tests
  - **Current:** jsdom `29.1.1`; jest-dom `6.9.1`
  - **Exact target:** `30.1.1`; `7.0.1`
  - **Decision:** Compatible with the repository Node `24.21.0` baseline;
    jsdom 30 requires at least Node `24.15.0` on the Node 24 line.

- **Cohort:** Vitest cohort
  - **Current:** four direct packages at `4.1.11`
  - **Exact target:** keep `4.1.11`
  - **Decision:** Storybook 10.6 peer constraint.

- **Cohort:** Vite
  - **Current:** `8.3.0`
  - **Exact target:** `8.3.1`
  - **Decision:** Compatible patch.

- **Cohort:** Webpack
  - **Current:** core `5.110.3`; CLI `5.1.4`; dev server `5.2.6`
  - **Exact target:** `5.111.1`; `7.2.3`; `6.0.0`
  - **Decision:** Upgrade together; remove SockJS owner.

- **Cohort:** Sass
  - **Current:** Sass `1.104.0`; loader `14.2.1`
  - **Exact target:** `1.105.0`; `17.0.1`
  - **Decision:** Webpack 5 and Node 24 compatible.

- **Cohort:** Lint
  - **Current:** `@eslint-react/eslint-plugin` `5.20.5`
  - **Exact target:** `5.20.8`
  - **Decision:** Preserve exact lint-cohort policy.

- **Cohort:** BDD
  - **Current:** `playwright-bdd` `9.2.0`
  - **Exact target:** `9.2.1`
  - **Decision:** Compatible patch.

- **Cohort:** MDX tooling
  - **Current:** `remark-cli` `12.0.1`; `remark-gfm` `4.0.1`
  - **Exact target:** remove; add `remark` `15.0.1`, `glob` `13.0.6`, `ignore`
    `7.0.10`
  - **Decision:** Preserve CLI behavior without deprecated Glob 10 owners.

- **Cohort:** Local lsmcp tooling
  - **Current:** `@mizchi/lsmcp` `0.10.0`; `typescript-language-server` `6.0.0`
  - **Exact target:** remove
  - **Decision:** Retire tracked integration.

- **Cohort:** Overrides
  - **Current:** 16 rules
  - **Exact target:** property absent
  - **Decision:** Delete only after all owners are gone.

## Exact `npm outdated` Compatibility Holds

`scripts/check-dependency-outdated.mjs` must accept only these captured tuples.
A new package, a different installed version, or a changed registry latest
version fails and requires an evidence refresh rather than a date-based
exception.

- **Package:** `react`
  - **Required current:** `18.3.1`
  - **Captured latest:** `19.3.0`
  - **Reason:** User requires React 18.3.1.

- **Package:** `react-dom`
  - **Required current:** `18.3.1`
  - **Captured latest:** `19.3.0`
  - **Reason:** User requires React DOM 18.3.1.

- **Package:** `@types/react`
  - **Required current:** `18.3.31`
  - **Captured latest:** `19.3.0`
  - **Reason:** Match React 18.

- **Package:** `@types/react-dom`
  - **Required current:** `18.3.7`
  - **Captured latest:** `19.3.0`
  - **Reason:** Match React DOM 18.

- **Package:** `typescript`
  - **Required current:** `5.9.3`
  - **Captured latest:** `7.0.2`
  - **Reason:** User requires TypeScript 5.9.3.

- **Package:** `react-router`
  - **Required current:** `7.18.4`
  - **Captured latest:** `8.4.0`
  - **Reason:** Router 8 requires React 19.

- **Package:** `@microsoft/applicationinsights-react-js`
  - **Required current:** `18.3.6`
  - **Captured latest:** `19.4.2`
  - **Reason:** Version 19 requires React 19.

- **Package:** `@types/node`
  - **Required current:** `24.19.0`
  - **Captured latest:** `26.6.3`
  - **Reason:** Runtime policy stays on Node 24.

- **Package:** `vitest`
  - **Required current:** `4.1.11`
  - **Captured latest:** `5.0.2`
  - **Reason:** Storybook 10.6 supports Vitest 3/4.

- **Package:** `@vitest/browser`
  - **Required current:** `4.1.11`
  - **Captured latest:** `5.0.2`
  - **Reason:** Keep exact Vitest peer cohort.

- **Package:** `@vitest/browser-playwright`
  - **Required current:** `4.1.11`
  - **Captured latest:** `5.0.2`
  - **Reason:** Keep exact Vitest peer cohort.

- **Package:** `@vitest/coverage-v8`
  - **Required current:** `4.1.11`
  - **Captured latest:** `5.0.2`
  - **Reason:** Keep exact Vitest peer cohort.

## Authentication Trust Boundary and Rollout Invariants

The redirect bridge receives authorization responses from Entra B2C and
therefore handles security-sensitive URL material before the main application
receives it.

- The bridge and every bridge asset are built by this repository and served from
  the portal origin; no CDN or third-party script is permitted.
- The bridge HTML contains a static `<title>Signing in - NMI Portal</title>` and
  no runtime configuration, analytics, telemetry, service worker, or main
  application bootstrap.
- `redirect.html` loads only its dedicated Webpack chunk. `index.html` loads
  only the main chunk.
- Webpack split-chunk selection excludes the `redirect` entry, including the
  vendor cache group, so the bridge is one self-contained local script rather
  than a vendor/runtime graph shared with the application.
- The bridge document has no inline script or event handler, `<base>`, form,
  iframe, object, embed, or meta refresh, and no external `src` or `href`.
- The deployed bridge response has `Cache-Control: no-store`, no
  `Cross-Origin-Opener-Policy` header, and the exact route-specific CSP
  `default-src 'none'; script-src 'self'; base-uri 'none';
  form-action 'none'; object-src 'none'; frame-ancestors 'self'`
  while retaining non-conflicting security headers.
- The bridge URI has no query or fragment and returns `200` directly. Any `3xx`,
  final-URL mismatch, or CDN/hosting rewrite is a release blocker because an
  auth fragment must never be carried to another document.
- Entra registration and `REACT_APP_B2C_REDIRECT_URL` use the same exact URI,
  including scheme, host, port, and path.
- The old redirect URI remains registered through the canary and rollback
  window. Removing it is a later cleanup, not part of the first MSAL 5
  deployment.
- Credentials, authorization responses, and tokens are never written to logs,
  committed evidence, test fixtures, or PR comments.

## Requirement Traceability

- **Requirement:** Keep React/React DOM `18.3.1`
  - **Tasks:** 3, 8, 9, 11
  - **Acceptance evidence:** Exact manifest/policy assertions and `npm ls`.

- **Requirement:** Keep TypeScript `5.9.3`
  - **Tasks:** 3, 9, 11
  - **Acceptance evidence:** Exact manifest/policy assertions and `npm ls`.

- **Requirement:** Raise Node floor to `24.21.0`
  - **Tasks:** 3, 10, 11
  - **Acceptance evidence:** Manifest/workflow policy tests and exact-floor CI.

- **Requirement:** Remove all overrides
  - **Tasks:** 1B, 2, 4, 5, 7–9, 11
  - **Acceptance evidence:** Owners removed first; final manifest/lock
    assertions.

- **Requirement:** Upgrade compatible direct dependencies
  - **Tasks:** 1B, 3–9
  - **Acceptance evidence:** Exact matrix tests, focused cohort gates,
    deterministic outdated check.

- **Requirement:** Preserve MDX lint behavior
  - **Tasks:** 1B, 11
  - **Acceptance evidence:** Fixture-based script tests and `npm run lint:mdx`.

- **Requirement:** Preserve authentication
  - **Tasks:** 0, 5, 6, 11
  - **Acceptance evidence:** Accepted ADR, API/config tests, bridge checks, real
    auth matrix.

- **Requirement:** Preserve telemetry
  - **Tasks:** 7, 11
  - **Acceptance evidence:** Real-module contract plus deterministic staging
    telemetry verifier.

- **Requirement:** Preserve app behavior
  - **Tasks:** 4, 5, 7, 8, 11
  - **Acceptance evidence:** Unit, Storybook, BDD, production, and Storybook
    builds.

- **Requirement:** Preserve security/deprecation posture
  - **Tasks:** 0, 1, 4, 5, 9, 11
  - **Acceptance evidence:** Install boundary, zero audit/deprecation, and
    secure bridge headers.

- **Requirement:** Preserve CI/package policy
  - **Tasks:** 1, 3, 5, 10, 11
  - **Acceptance evidence:** Exact npm, npm-ci/gate ordering, lifecycle
    inventory, additive checks.

## Framework Fit

This is an incremental dependency and authentication migration. It uses
migration planning, a small auth trust-boundary model, exact migration pins,
risk-first ordering, behavior-first tests, green cohort commits, an additive
external rollout, and explicit rollback. DDD and C4 are unnecessary because no
domain model, datastore, service boundary, or data ownership changes. An ADR is
required for MSAL 5 because its redirect bridge plus global iframe-navigation
policy changes a load-bearing external integration and needs named
product/security ownership and a durable reversal trigger.

## Files and Responsibilities

- **Path:** `package.json`
  - **Action:** Modify
  - **Responsibility:** Exact target pins, Node policy, scripts, tooling
    replacement, and final override removal.

- **Path:** `package-lock.json`
  - **Action:** Regenerate
  - **Responsibility:** npm-owned exact graph; never hand-edit.

- **Path:** `tests/unit/config/dependencySecurity.test.ts`
  - **Action:** Modify
  - **Responsibility:** Exact pins, hold list, no overrides, no deprecated
    entries, and patch policy.

- **Path:** `tests/unit/config/dependencyOutdatedPolicy.test.ts`
  - **Action:** Create
  - **Responsibility:** Unit-test deterministic outdated-report comparison.

- **Path:** `scripts/check-dependency-outdated.mjs`
  - **Action:** Create
  - **Responsibility:** Compare live npm output with the exact hold tuples.

- **Path:** `scripts/check-install-scripts.mjs`
  - **Action:** Create
  - **Responsibility:** Enforce the exact lifecycle-script owners and root
    postinstall after clean installs.

- **Path:** `tests/unit/config/installScriptPolicy.test.ts`
  - **Action:** Create
  - **Responsibility:** Test lifecycle inventory, new-owner, skipped-approval,
    and malformed-result handling.

- **Path:** `scripts/lint-mdx.mjs`
  - **Action:** Create
  - **Responsibility:** Programmatic Remark lint with config, ignore, frail,
    ordering, and empty-pattern parity.

- **Path:** `tests/unit/config/lintMdxScript.test.ts`
  - **Action:** Create
  - **Responsibility:** Fixture-based MDX script behavior tests.

- **Path:** `tests/fixtures/lint-mdx/**`
  - **Action:** Create
  - **Responsibility:** Clean, warning, ignored-warning, and empty-pattern
    fixtures.

- **Path:** `scripts/lsmcp-typescript-mcp.cmd`
  - **Action:** Delete
  - **Responsibility:** Retire tracked lsmcp launcher.

- **Path:** `.lsmcp/config.json`
  - **Action:** Delete
  - **Responsibility:** Retire tracked lsmcp configuration.

- **Path:** `tests/unit/config/workflowPolicy.test.ts`
  - **Action:** Modify
  - **Responsibility:** Node `24.21.0` and exact-floor unit-test coverage.

- **Path:** `.github/workflows/pr.yml`
  - **Action:** Modify
  - **Responsibility:** Exact Node lower-bound job, credential-safe checkout,
    and bridge-artifact verification.

- **Path:** `.github/workflows/release.yml`
  - **Action:** Modify
  - **Responsibility:** Credential-safe checkout and bridge-artifact
    verification after build.

- **Path:** `.github/workflows/chromatic.yml`
  - **Action:** Modify
  - **Responsibility:** Apply the same credential and lifecycle controls; retain
    Node `24.21.0`.

- **Path:** `webpack.config.js`
  - **Action:** Modify
  - **Responsibility:** WDS 6 compatibility and isolated main/redirect entries
    and HTML outputs.

- **Path:** `redirect.html`
  - **Action:** Create
  - **Responsibility:** Static, isolated MSAL bridge document.

- **Path:** `ClientApp/src/authentication/redirectBridge.ts`
  - **Action:** Create
  - **Responsibility:** Call `broadcastResponseToMainFrame()` and report only
    sanitized failures.

- **Path:** `docs/adr/2026-09-27-msal-5-redirect-bridge.md`
  - **Action:** Create
  - **Responsibility:** Own the bridge, global iframe-navigation policy,
    consequences, and reversal trigger.

- **Path:** `scripts/verify-auth-redirect-bridge.mjs`
  - **Action:** Create
  - **Responsibility:** Verify local artifact structure and deployed
    headers/assets.

- **Path:** `tests/unit/config/authRedirectBridgePolicy.test.ts`
  - **Action:** Create
  - **Responsibility:** Test the verifier and bridge isolation policy.

- **Path:** `tests/unit/config/webpackConfig.test.ts`
  - **Action:** Modify
  - **Responsibility:** Assert two entries, noncolliding filenames, and
    chunk-isolated HTML plugins.

- **Path:** `ClientApp/src/index.tsx`
  - **Action:** Modify
  - **Responsibility:** Use MSAL 5 `createStandardPublicClientApplication`.

- **Path:** `ClientApp/src/authentication/authConfig.ts`
  - **Action:** Modify
  - **Responsibility:** MSAL 5 bridge URI, renamed timeouts, popup semantics,
    and global redirect callback.

- **Path:** `ClientApp/src/authentication/AccountProvider.tsx`
  - **Action:** Modify
  - **Responsibility:** Remove request-level `onRedirectNavigate`.

- **Path:** `ClientApp/src/routes/sign-out/index.tsx`
  - **Action:** Modify
  - **Responsibility:** Remove request-level `onRedirectNavigate`.

- **Path:** `tests/unit/runtime/indexBootstrap.test.tsx`
  - **Action:** Modify
  - **Responsibility:** Assert MSAL 5 factory usage.

- **Path:** `tests/unit/authentication/authConfig.test.ts`
  - **Action:** Modify
  - **Responsibility:** Assert MSAL 5 configuration and iframe redirect
    behavior.

- **Path:** `tests/unit/authentication/AccountProvider.dispatch.test.tsx`
  - **Action:** Modify
  - **Responsibility:** Assert v5-compatible logout request shape.

- **Path:** `tests/unit/routes/staticPages.test.tsx`
  - **Action:** Modify
  - **Responsibility:** Assert v5-compatible sign-out request shape.

- **Path:** `tests/unit/authentication/redirectBridge.test.ts`
  - **Action:** Create
  - **Responsibility:** Assert bridge broadcast and sanitized failure handling.

- **Path:** `scripts/build-msal-staging-harness.mjs`
  - **Action:** Create
  - **Responsibility:** Bundle an ephemeral same-origin MSAL harness for
    deterministic hidden-iframe validation.

- **Path:** `tests/e2e/staging/msalHarness.ts`
  - **Action:** Create
  - **Responsibility:** Use `CacheLookupPolicy.Skip` and return sanitized
    pass/status signals only.

- **Path:** `tests/e2e/staging/msalRedirectBridge.staging.spec.ts`
  - **Action:** Create
  - **Responsibility:** Exercise real B2C login, forced iframe renewal,
    protected API, and logout without logs.

- **Path:** `playwright.staging.config.ts`
  - **Action:** Create
  - **Responsibility:** Opt-in staging-only auth project; never part of
    untrusted PR CI.

- **Path:** `tests/unit/config/msalStagingHarnessPolicy.test.ts`
  - **Action:** Create
  - **Responsibility:** Enforce temp-only output, iframe forcing, redaction, and
    disabled browser artifacts.

- **Path:** `tests/unit/instrumentation/appInsightsPackageContract.test.ts`
  - **Action:** Create
  - **Responsibility:** Exercise actual telemetry package exports and plugin
    construction.

- **Path:** `tests/e2e/staging/appInsightsTelemetry.staging.spec.ts`
  - **Action:** Create
  - **Responsibility:** Deterministically verify initialization, one page view,
    and one handled exception.

- **Path:** `playwright.telemetry-staging.config.ts`
  - **Action:** Create
  - **Responsibility:** Opt-in non-production telemetry project with browser
    artifacts and sensitive logging off.

- **Path:** `tests/unit/config/telemetryStagingPolicy.test.ts`
  - **Action:** Create
  - **Responsibility:** Enforce staging-only execution, sanitization, required
    assertions, and CI isolation.

- **Path:** `ClientApp/src/instrumentation/AppInsightsService.ts`
  - **Action:** Inspect/modify if required
  - **Responsibility:** Adapt only verified Application Insights API changes.

- **Path:** `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx`
  - **Action:** Inspect/modify if required
  - **Responsibility:** DatePicker/date-fns compatibility.

- **Path:** `ClientApp/src/components/ErrorBoundary/index.tsx`
  - **Action:** Inspect/modify if required
  - **Responsibility:** react-error-boundary 6 compatibility.

- **Path:** `ClientApp/src/analytics/GoogleAnalytics.tsx`
  - **Action:** Inspect/modify if required
  - **Responsibility:** react-ga4 3 compatibility.

- **Path:** `ClientApp/src/routes/common/helperFunctions.ts`
  - **Action:** Inspect/modify if required
  - **Responsibility:** react-ga4 3 compatibility.

- **Path:** `patches/@azure+msal-react+2.2.0.patch`
  - **Action:** Delete
  - **Responsibility:** Upstream MSAL React 5 exports replace patch.

- **Path:** `patches/sockjs+0.3.24.patch`
  - **Action:** Delete
  - **Responsibility:** WDS 6 removes SockJS.

- **Path:** `patches/html-react-parser+6.1.4.patch`
  - **Action:** Delete
  - **Responsibility:** Remove stale version-named patch.

- **Path:** `patches/html-react-parser+6.1.8.patch`
  - **Action:** Create only if regression proves necessary
  - **Responsibility:** Preserve interop only when unpatched build/test fails.

- **Path:** `docs/migration/msal-5-redirect-bridge-runbook.md`
  - **Action:** Create
  - **Responsibility:** Entra, hosting, canary, verification, and rollback
    procedure.

- **Path:** `ClientApp/src/authentication/Authentication.docs.mdx`
  - **Action:** Modify
  - **Responsibility:** MSAL 5 factory, redirect bridge, and iframe behavior.

- **Path:** `docs/CONVENTIONS.md`, `docs/STACK.md`, `docs/TESTING.md`,
  `docs/INTEGRATIONS.md`, `INIT.md`
  - **Action:** Modify
  - **Responsibility:** Final toolchain, Node, lsmcp, auth, and validation
    behavior.

- **Path:** `skills/managing-github-actions/references/repository-ci-catalog.md`
  - **Action:** Modify
  - **Responsibility:** Node floor and additive bridge verification.

- **Path:**
  `.claude/skills/managing-github-actions/references/repository-ci-catalog.md`
  - **Action:** Modify
  - **Responsibility:** Keep the mirrored CI catalog byte-identical.

## Tasks

### Task 0: Preserve the Baseline and Record Release Ownership

#### Files

- Inspect: `package.json`
- Inspect: `package-lock.json`
- Inspect: `.github/workflows/pr.yml`
- Create: `docs/adr/2026-09-27-msal-5-redirect-bridge.md`
- Record externally: pull-request description or linked release checklist

- [ ] **Step 1: Isolate the implementation without losing user changes**

Use the repository's `using-git-worktrees` workflow. First confirm that the
branch name and sibling directory below do not already exist; if either exists,
choose a unique recorded suffix rather than deleting or reusing it. Then run
from the source workspace:

```powershell
$repoRoot = (git rev-parse --show-toplevel).Trim()
$upgradeBranch = 'chore/dependency-upgrade-20260927'
$upgradeRoot = Join-Path (Split-Path -Parent $repoRoot) `
  'portal-dependency-upgrade-20260927'
$baselinePatch = Join-Path ([IO.Path]::GetTempPath()) `
  "nmi-dependency-baseline-$PID.patch"
if (git show-ref --verify --quiet "refs/heads/$upgradeBranch") { throw `
  "Branch already exists: $upgradeBranch" }
if (Test-Path -LiteralPath $upgradeRoot) { throw `
  "Worktree path already exists: $upgradeRoot" }
$dirtyInventory = git status --porcelain=v1 -uall
$dirtyInventory
git diff HEAD --binary --output=$baselinePatch -- package.json package-lock.json
$sourceHashes = Get-FileHash -Algorithm SHA256 package.json,package-lock.json
git worktree add -b $upgradeBranch $upgradeRoot HEAD
git -C $upgradeRoot apply --whitespace=nowarn $baselinePatch
$worktreeHashes = Get-FileHash -Algorithm SHA256 (Join-Path $upgradeRoot `
  'package.json'),(Join-Path $upgradeRoot 'package-lock.json')
if (($sourceHashes.Hash -join ',') -ne ($worktreeHashes.Hash -join ',')) { `
  throw 'Manifest/lockfile baseline mismatch' }
Remove-Item -LiteralPath $baselinePatch
git -C $upgradeRoot status --short
```

Expected: the source workspace is unchanged; the new worktree contains
byte-identical manifest/lockfile changes; status shows only the preserved
baseline changes. Classify every entry from
`git status --porcelain=v1 -uall` as dependency-relevant,
dependency-independent, or unknown. Unknown entries stop execution. Copy every
dependency-relevant tracked or untracked supporting file into the worktree and
verify its SHA-256 before proceeding. This includes `.npmrc`, patch files,
workspace manifests, generated package-manager policy, and other files required
for the preserved package state. Never reset or stash the source workspace.

If `react-hook-form` `^7.89.0` is already present when Task 0 runs, treat it as
user-owned baseline rather than migration drift. Verify that the lock entry
resolves `7.89.0`; record the supplied Node `>=18.0.0` engine and React peer
range as compatibility evidence; and refresh the live dependency inventory and
outdated evidence before Task 1. Do not silently change its manifest range.

- [ ] **Step 2: Capture the unmodified dependency baseline**

Run in the isolated worktree:

```powershell
corepack enable npm
if ((npm --version).Trim() -ne '11.19.1') { throw `
  'Corepack did not activate npm 11.19.1' }
npm ci --strict-peer-deps
npm audit --audit-level=low
npm ls --all
npm explain glob uuid sockjs unified-engine @mizchi/lsmcp
npm query ":attr(scripts, [preinstall])" --json
npm query ":attr(scripts, [install])" --json
npm query ":attr(scripts, [postinstall])" --json
```

Expected: strict install succeeds, audit reports zero vulnerabilities, the
explanations identify the current override owners, and lifecycle queries show no
`preinstall`, only `@parcel/watcher` at `install`, and only the root, `esbuild`,
and `msw` at `postinstall`. Record counts and parent chains in the PR
description; do not commit raw logs.

- [ ] **Step 3: Record external auth ownership before Task 5**

The PR description must name the responsible roles and change windows for:

- Entra B2C application registration;
- hosting/CDN response-header configuration for `/redirect.html`;
- staging authentication verification;
- production canary and rollback decision.

It must list the exact old and new redirect URIs for every environment; a
dedicated synthetic test identity permitted in each target environment, with no
real customer data and no MFA/conditional-access prompt; a stable read-only
protected API endpoint and expected `2xx`; immutable prior artifact/build
identifier; current runtime-config snapshot/hash and old redirect value; hosting
header-policy revision; supported canary mechanism (`inactive slot then swap` or
an explicit traffic percentage); a 30-minute observation window; and the person
authorized to restore the prior artifact/config.

Before Task 5 begins, the release checklist must also contain the exact platform
operator commands or console operations for all four rollback actions: deploy
the immutable prior artifact; restore the hashed runtime-config snapshot and old
redirect value; route the recorded canary mechanism back to the prior artifact;
and verify restoration with the prior-version login, silent-token,
protected-API, and logout smoke. Mark these operator-specific instructions
`Needs Human Judgment`. If any role, URI, test prerequisite, snapshot, artifact,
canary mechanism, rollback authority, or exact rollback operation is missing,
Tasks 0–4 may proceed but Task 5 must not start.

- [ ] **Step 4: Record and accept the auth integration decision**

Create the date-prefixed ADR using the current `docs/adr/` format and the
repository `adr` skill. It must cover context, the MSAL 5 bridge decision, the
global `onRedirectNavigate: () => !BrowserUtils.isInIframe()` behavior, positive
and negative consequences, at least the alternatives “remain on MSAL 3
temporarily,” “allow all iframe redirects globally,” and “adopt a
different/nestable client integration,” measurable validation, additive
rollback, and review triggers. Open as `Proposed`; Task 5 is blocked until the
product owner and security owner are named as deciders and change status to
`Accepted`. Unit tests must cover top-level `true` and iframe `false` callback
results.

```powershell
git add docs/adr/2026-09-27-msal-5-redirect-bridge.md
git commit -m "docs: record msal 5 redirect bridge decision"
```

- [ ] **Step 5: Confirm the lsmcp retirement decision**

Record that the repository-owned launcher and configuration are being removed
without replacement and that untracked editor configurations must stop invoking
`scripts/lsmcp-typescript-mcp.cmd`.

No commit is created for evidence-only preflight work; the accepted ADR is the
only Task 0 commit.

### Task 1: Harden the Install-Script and CI Credential Boundary

#### Files

- Create: `scripts/check-install-scripts.mjs`
- Create: `tests/unit/config/installScriptPolicy.test.ts`
- Modify: `package.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Modify: `.github/workflows/pr.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/chromatic.yml`
- Modify: `tests/unit/config/workflowPolicy.test.ts`

- [ ] **Step 1: Write failing supply-chain policy tests**

In `dependencySecurity.test.ts`, assert root `postinstall === 'patch-package'`
and the exact `allowScripts` object
`{ '@parcel/watcher': true, esbuild: true, msw: true }`.

In `installScriptPolicy.test.ts`, unit-test the exported lifecycle comparator
with the approved inventory, an unapproved owner, a configured-but-missing
owner, a changed root postinstall, duplicate versions, malformed npm-query JSON,
and a nonzero query result. Duplicate installed instances of an approved
lifecycle owner fail until their exact versions and reason are reviewed.

In `workflowPolicy.test.ts`, enumerate every checkout and clean-install step in
the PR, release, and Chromatic workflows. Require `persist-credentials: false`
on each checkout, least-privilege permissions, no secret passed to a dependency
step, and `npm run dependency:install-scripts` immediately after every `npm ci`.
Require `corepack enable npm` and a failing equality check for
`npm --version === 11.19.1` before every install, including Chromatic's known
drift. Validate every matching step/job, not one example; keep the Chromatic
token only on its publish action. Reject job-level secret-derived environment
variables on any job that installs dependencies; attach the existing release
`VITE_*` values only to the exact build/test steps that consume them.

```powershell
npm run test:unit -- tests/unit/config/installScriptPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/workflowPolicy.test.ts
```

Expected: FAIL because the lifecycle script/checks are absent, checkout
credentials persist, and Chromatic does not enable Corepack.

- [ ] **Step 2: Implement the boundary before any version changes**

Create `check-install-scripts.mjs` with an exported pure comparator plus a CLI
that runs the repository-pinned npm's three `npm query` selectors for
`preinstall`, `install`, and `postinstall`. It must require no dependency
`preinstall`; exactly one `@parcel/watcher` for `install`; exactly one `esbuild`
and one `msw` for dependency `postinstall`; exact equality with `allowScripts`;
and root `postinstall === 'patch-package'`. Add `dependency:install-scripts` as
`node scripts/check-install-scripts.mjs`. Fail on an added lifecycle owner,
duplicate approved owner, allowlisted owner absent from the installed inventory,
malformed output, or failed query; print package names/versions but never script
bodies.

Set `persist-credentials: false` on every SHA-pinned checkout in all three
workflows; add `npm run dependency:install-scripts` immediately after every
`npm ci`; and add `corepack enable npm` plus
`test "$(npm --version)" = "11.19.1"`
before every install. Move release job-level secret-derived `VITE_*` values to
only the build/test steps proven to consume them. Keep current least-privilege
permissions and do not expose secrets to checkout, install, or inventory steps.

- [ ] **Step 3: Verify and commit the focused hardening cohort**

```powershell
corepack enable npm
if ((npm --version).Trim() -ne '11.19.1') { throw `
  'Corepack did not activate npm 11.19.1' }
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/config/installScriptPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/workflowPolicy.test.ts
npm audit --audit-level=low
npm ls --all
```

Expected: all commands pass without changing direct dependency versions or the
resolved graph.

```powershell
git add package.json scripts/check-install-scripts.mjs `
  tests/unit/config/installScriptPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/workflowPolicy.test.ts .github/workflows/pr.yml `
  .github/workflows/release.yml .github/workflows/chromatic.yml
git commit -m "ci: harden dependency install boundary"
```

### Task 1B: Replace MDX CLI Behavior Without Removing Overrides

#### Files

- Create: `scripts/lint-mdx.mjs`
- Create: `tests/unit/config/lintMdxScript.test.ts`
- Create: `tests/fixtures/lint-mdx/valid.mdx`
- Create: `tests/fixtures/lint-mdx/warning.mdx`
- Create: `tests/fixtures/lint-mdx/ignored/warning.mdx`
- Create: `tests/fixtures/lint-mdx/.remarkignore`
- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Keep: `overrides` in `package.json`

- [ ] **Step 1: Write failing MDX behavior tests**

Test the exported script function and CLI process. Assert that it loads
`remark.config.mjs`; applies `.remarkignore` to normalized POSIX repository
paths; skips an invalid ignored file; preserves frail warning failure with
file/line; passes clean MDX; sorts diagnostics deterministically; and fails when
either configured input pattern matches no files.

In `dependencySecurity.test.ts`, assert exact direct `remark` `15.0.1`, `glob`
`13.0.6`, and `ignore` `7.0.10`, plus absence of `remark-cli` and `remark-gfm`;
do not require every transitive Glob to be major 13.

```powershell
npm run test:unit -- tests/unit/config/lintMdxScript.test.ts `
  tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL because `scripts/lint-mdx.mjs` and the target graph do not exist.

- [ ] **Step 2: Implement the minimal programmatic linter**

Export a testable `lintMdx` function and keep the CLI entry in the same module.
Read `.remarkignore`, filter normalized repository-relative paths, load
`remark.config.mjs`, process sorted files, print every `VFileMessage`, and set
exit code 1 for any warning/error or an empty configured pattern. Change
`lint:mdx` to `node scripts/lint-mdx.mjs`; remove `remark-cli` and `remark-gfm`.
Do not delete any override yet.

- [ ] **Step 3: Regenerate and verify the cohort**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/config/lintMdxScript.test.ts `
  tests/unit/config/dependencySecurity.test.ts
npm run lint:mdx
npm audit --audit-level=low
npm ls --all
npm explain glob unified-engine remark-cli
```

Expected: tests/lint/install/audit/tree pass; `unified-engine` and `remark-cli`
are absent; all remaining Glob parents are explained. Inspect the lockfile diff
and reject unrelated direct-version changes.

- [ ] **Step 4: Commit only the green MDX cohort**

```powershell
git add package.json package-lock.json scripts/lint-mdx.mjs `
  tests/unit/config/lintMdxScript.test.ts `
  tests/unit/config/dependencySecurity.test.ts tests/fixtures/lint-mdx
git commit -m "build: replace deprecated mdx lint tooling"
```

### Task 2: Retire the Tracked lsmcp Integration

#### Files

- Delete: `scripts/lsmcp-typescript-mcp.cmd`
- Delete: `.lsmcp/config.json`
- Modify: `package.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Modify: `docs/CONVENTIONS.md`
- Regenerate: `package-lock.json`
- Keep: `overrides` in `package.json`

- [ ] **Step 1: Add the failing retirement contract**

Assert that both dependencies and both tracked files are absent. Add a
conventions note that any untracked editor configuration must remove the deleted
launcher reference.

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL on the present dependencies/files.

- [ ] **Step 2: Remove the integration and verify the graph**

Remove `@mizchi/lsmcp` and `typescript-language-server`, delete their
launcher/configuration, regenerate the lockfile, and run:

```powershell
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
npm audit --audit-level=low
npm ls --all
npm explain @mizchi/lsmcp typescript-language-server glob
```

Expected: strict install/tests/audit/tree pass; lsmcp packages are absent; no
unreviewed direct version changes appear.

- [ ] **Step 3: Commit the green retirement**

```powershell
git add package.json package-lock.json `
  tests/unit/config/dependencySecurity.test.ts docs/CONVENTIONS.md `
  scripts/lsmcp-typescript-mcp.cmd .lsmcp/config.json
git commit -m "build: retire tracked lsmcp tooling"
```

### Task 3: Raise the Node Floor and Upgrade the Test Platform

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `.github/workflows/pr.yml`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Modify: `tests/unit/config/workflowPolicy.test.ts`
- Test: `vitest.config.ts`
- Test: `vitest.unit.config.ts`
- Test: `vitest.storybook.config.ts`

- [ ] **Step 1: Write failing runtime and version assertions**

Assert exact React/React DOM/React types/TypeScript pins; Node `>=24.21.0`;
exact `@types/node` `24.19.0`; jsdom `30.1.1`; jest-dom `7.0.1`; Vite `8.3.1`;
and all four Vitest packages still exactly `4.1.11`. Assert that
`lower-bound-node24` provisions exactly `24.21.0`, has `timeout-minutes: 45`,
and runs `npm run test:unit` in addition to strict install, lifecycle inventory,
lint, type-check, and build.

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/workflowPolicy.test.ts `
  tests/unit/config/vitestTopology.test.ts
```

Expected: FAIL on current ranges, versions, and lower-bound workflow.

- [ ] **Step 2: Apply the exact runtime/test targets**

Update the manifest and only the lower-bound PR job. Raise its timeout from 20
to 45 minutes to cover the added complete unit suite. Preserve
`corepack enable npm`, exact npm-version assertion, `npm ci`, lifecycle
inventory,
`COREPACK_ENABLE_DOWNLOAD_PROMPT`, permissions, action pins, and every existing
gate.

- [ ] **Step 3: Regenerate and verify**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run type-check
npm run lint
npm run test:unit
npm run test:storybook
npm audit --audit-level=low
npm ls --all
```

Expected: every command exits 0; no Vitest 5 package appears; lockfile direct
changes match this cohort only.

- [ ] **Step 4: Commit the green runtime cohort**

```powershell
git add package.json package-lock.json .github/workflows/pr.yml `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/workflowPolicy.test.ts
git commit -m "build: raise node floor and update test platform"
```

### Task 4: Upgrade Webpack/WDS/Sass Before Override Removal

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Modify: `tests/unit/config/webpackConfig.test.ts` only when an actual
  configuration adaptation is required
- Delete: `patches/sockjs+0.3.24.patch`
- Test: `webpack.config.js`
- Test: `.storybook/main.ts`

- [ ] **Step 1: Add exact dependency assertions**

Assert exact Webpack `5.111.1`, webpack-cli `7.2.3`, webpack-dev-server `6.0.0`,
Sass `1.105.0`, and sass-loader `17.0.1`. Assert that SockJS and its patch are
absent after resolution.

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL on the old build-tool versions and present SockJS patch. Commit
the assertions only with the green cohort.

- [ ] **Step 2: Apply the cohort and exhaustively audit WDS 6 breaking
      surfaces**

Regenerate with overrides still present. Treat the WDS 6 migration review as an
explicit repository-wide contract audit, not as a build-only smoke. Search
tracked source, config, scripts, tests, package scripts, and CI for every known
WDS integration surface and record each match as **used and adapted**, **used
and proven compatible**, or **not used**. At minimum audit:

- removed/changed server options: `sockjs`, `webSocketServer: 'sockjs'`,
  `bypass`, `spdy`, legacy `onBeforeSetupMiddleware` /`onAfterSetupMiddleware`,
  and removed/renamed CLI flags;
- proxy configuration and callbacks, including `devServer.proxy`, `context`,
  `router`, `bypass`, path rewriting, and any dependency on the previous proxy
  API shape;
- custom middleware and hooks, including `setupMiddlewares`, direct
  `webpack-dev-middleware` access, middleware ordering, request/response
  mutation, and Express request/response assumptions affected by Express 5;
- direct imports/requires or programmatic construction of `webpack-dev-server`,
  `webpack-dev-middleware`, Express, Chokidar, or related server internals;
- CommonJS/ESM assumptions in Webpack/WDS configuration, helper scripts, and
  tests;
- package/CI/local-dev CLI invocations and flags for `webpack serve` or
  `webpack-dev-server`;
- websocket/live-reload configuration and any tests or code that assume SockJS
  transport;
- readiness, host/port, history-fallback, static-file, HTTPS, and proxy behavior
  relied on by Playwright or local development;
- explicit WDS 6 migration symbols and contracts: `getFilenameFromUrl`,
  `internalIP`, `internalIPSync`, `new Server(`, `.webSocketServer`, `target:`,
  `externalsPresets`, `conditionNames`, and `WEBPACK_SERVE`. Search source,
  scripts, tests, and configuration for each symbol; classify every match under
  the same used/adapted, used/compatible, or not-used rule.

Use repository search commands appropriate to the shell (for example `rg` ) and
preserve the exact search terms in the PR evidence. A zero-match result is valid
evidence only when the search command and scope are recorded. The current config
is expected to need little or no option rewrite; change it only where this
audit, the real v6 validator, or server startup demonstrates a compatibility
requirement.

- [ ] **Step 3: Exercise build and real servers**

```powershell
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/webpackConfig.test.ts
npm run build
npm run build-storybook
npm run test:e2e:app
npm run test:e2e:storybook
npm audit --audit-level=low
npm ls --all
npm explain sockjs uuid webpack-dev-server
```

Expected: all gates pass; both Playwright-managed servers become ready; the
recorded WDS 6 audit has no unexplained match across proxy, middleware,
ESM/CommonJS, CLI, websocket, or server-internal surfaces; `sockjs` is absent;
no deprecated UUID branch is introduced; the lockfile diff is confined to this
cohort.

- [ ] **Step 4: Commit the green build cohort**

```powershell
git add package.json package-lock.json patches/sockjs+0.3.24.patch `
  webpack.config.js tests/unit/config/webpackConfig.test.ts `
  tests/unit/config/dependencySecurity.test.ts
git commit -m "build: upgrade webpack dev server and sass"
```

### Task 5: Migrate the Application and Build to MSAL 5

**Prerequisite:** Task 0 has named Entra, hosting, staging-verification, and
rollback roles; recorded the exact old/new URIs, immutable prior artifact,
hashed runtime-config snapshot, canary mechanism, and rollback authority;
captured the exact platform rollback operations; and the MSAL ADR is `Accepted`.
If any prerequisite is incomplete, Task 5 must not start.

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Delete: `patches/@azure+msal-react+2.2.0.patch`
- Create: `redirect.html`
- Create: `ClientApp/src/authentication/redirectBridge.ts`
- Create: `scripts/verify-auth-redirect-bridge.mjs`
- Create: `tests/unit/config/authRedirectBridgePolicy.test.ts`
- Create: `tests/unit/authentication/redirectBridge.test.ts`
- Create: `scripts/build-msal-staging-harness.mjs`
- Create: `tests/e2e/staging/msalHarness.ts`
- Create: `tests/e2e/staging/msalRedirectBridge.staging.spec.ts`
- Create: `playwright.staging.config.ts`
- Create: `tests/unit/config/msalStagingHarnessPolicy.test.ts`
- Modify: `webpack.config.js`
- Modify: `tests/unit/config/webpackConfig.test.ts`
- Modify: `ClientApp/src/index.tsx`
- Modify: `ClientApp/src/authentication/authConfig.ts`
- Modify: `ClientApp/src/authentication/AccountProvider.tsx`
- Modify: `ClientApp/src/routes/sign-out/index.tsx`
- Modify: `tests/unit/runtime/indexBootstrap.test.tsx`
- Modify: `tests/unit/authentication/authConfig.test.ts`
- Modify: `tests/unit/authentication/AccountProvider.dispatch.test.tsx`
- Modify: `tests/unit/routes/staticPages.test.tsx`
- Modify: `ClientApp/src/authentication/Authentication.docs.mdx`

- [ ] **Step 1: Write failing MSAL 5 source-contract tests**

Assert:

- bootstrap calls `createStandardPublicClientApplication(configuration)`;
- config uses `popupBridgeTimeout: 60000`, `iframeBridgeTimeout: 6000`,
  `loadFrameTimeout: 6000`, and `navigatePopups: true`;
- config includes the bridge `redirectUri` and the global iframe redirect
  callback;
- logout requests contain the account but no removed request-level
  `onRedirectNavigate`;
- the bridge calls `broadcastResponseToMainFrame()` and logs only a constant
  sanitized error message on rejection.
- the manifest pins MSAL Browser `5.23.0` and MSAL React `5.7.1` and no MSAL 2
  patch remains.
- the global redirect callback returns `true` at top level and `false` in an
  iframe, matching the accepted ADR.

```powershell
npm run test:unit -- tests/unit/runtime/indexBootstrap.test.tsx `
  tests/unit/authentication/authConfig.test.ts `
  tests/unit/authentication/AccountProvider.dispatch.test.tsx `
  tests/unit/routes/staticPages.test.tsx `
  tests/unit/authentication/redirectBridge.test.ts `
  tests/unit/config/msalStagingHarnessPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL against MSAL 3 code and missing bridge module.

- [ ] **Step 2: Write failing build-isolation tests**

Update the Webpack test types and assert:

- entries are
  `{ main: './ClientApp/src/index.tsx',
  redirect: './ClientApp/src/authentication/redirectBridge.ts' }`;
- development output is `js/[name].js`, avoiding a two-entry filename collision;
- production output remains `js/[name].[contenthash:8].js`;
- the main `HtmlWebpackPlugin` emits `index.html` with only `main`;
- the bridge plugin emits `redirect.html` with only `redirect` and no template
  parameters;
- both the top-level production `splitChunks.chunks` selector and the vendor
  cache group's selector exclude the named `redirect` entry, leaving one
  self-contained bridge script and no shared runtime/vendor chunk;
- `redirect.html` has the static title, exactly one relative same-origin script,
  and no analytics, telemetry, runtime config, or third-party script;
- the document has no inline script or event attribute, `<base>`, form, iframe,
  object, embed, or meta refresh and no external `src` /`href`.

Test the verifier with inline fixture documents, response headers, statuses,
request URLs, and final response URLs. Cover the valid case plus `3xx`,
final-URL mismatch, query/fragment, missing/no-store cache policy, present COOP,
missing or broadened CSP, inline script/handler, `<base>`, form,
iframe/object/embed, meta refresh, multiple chunks, main/vendor/runtime chunk,
and cross-origin asset failures.

Add staging-harness policy tests that require `CacheLookupPolicy.Skip`,
same-origin route fulfillment, OS-temporary bundle output, disabled Playwright
trace/video/screenshot, no PR/release workflow reference, sanitized
host/path/status-only network evidence, and no token/code/query/payload logging.

```powershell
npm run test:unit -- tests/unit/config/webpackConfig.test.ts `
  tests/unit/config/authRedirectBridgePolicy.test.ts
```

Expected: FAIL against the single-entry build and missing verifier.

- [ ] **Step 3: Implement the exact MSAL migration**

- Confirm the v3-to-v4 changes are non-operative here: repository source uses
  neither `loadExternalTokens` nor `allowNativeBroker`, and does not configure
  MSAL `localStorage` caching. If that search changes before execution, stop and
  extend the tests before upgrading.
- Pin `@azure/msal-browser` `5.23.0` and `@azure/msal-react` `5.7.1`.
- Replace the removed static factory with the named
  `createStandardPublicClientApplication` export.
- Move `redirectUri` before `configuration` and set
  `configuration.auth.redirectUri` to it.
- Replace renamed system options and set the global iframe redirect callback;
  remove request-level callbacks and unused `BrowserUtils` imports from both
  logout call sites.
- Create the isolated bridge template and entry. The bridge catches errors but
  logs only `MSAL redirect bridge failed`; never log the error object or URL.
- Split Webpack entries/plugins and make development filenames entry-aware. In
  production, use a named-chunk predicate at both the top-level splitChunks
  setting and the vendor cache group to exclude `chunk.name === 'redirect'`; do
  not enable `runtimeChunk` for the bridge. The built bridge must contain
  exactly one self-contained hashed script.
- Set the local default redirect URL in `webpack.config.js` to
  `http://localhost:3000/redirect.html`; leave post-logout default unchanged.
- Delete the MSAL React 2 patch.
- Update authentication documentation and tests to the v5 names and semantics.
- Create an opt-in staging-only Playwright harness.
  `build-msal-staging-harness.mjs` uses the installed esbuild API to bundle
  `msalHarness.ts` into an OS-temporary directory and deletes it in `finally`.
  The spec fulfills `/__auth-smoke.html` and its bundle only inside the
  authenticated Playwright context, so no harness is added to `dist` or
  deployed. The browser harness initializes the real MSAL 5 package with the
  staging page's public client/authority/scope values, reuses the same-origin
  session/account, and calls `acquireTokenSilent` with `CacheLookupPolicy.Skip`.
  Per MSAL's target-version guide, `Skip` bypasses access/refresh-token cache
  and deterministically uses the same hidden-iframe authorization path used
  after refresh-token expiry. It returns only pass/fail and protected-API HTTP
  status to the spec; it never returns or logs a token.
- Add `test:e2e:staging:auth` using `playwright.staging.config.ts`. Require
  target base URL, bridge URL, dedicated synthetic username/password, and
  read-only protected endpoint from environment variables; set `trace: 'off'`,
  `video: 'off'`, `screenshot: 'off'`, one worker, no retries, and a constant
  redacting reporter. Do not call this script from untrusted PR CI.

- [ ] **Step 4: Implement local and deployed bridge verification**

`scripts/verify-auth-redirect-bridge.mjs` supports:

- `--dist dist`: assert `redirect.html` exists, has a static title, references
  only the redirect chunk with same-origin relative URLs, and does not reference
  main/vendors/analytics/telemetry assets;
- `--url $env:AUTH_BRIDGE_URL`: reject a configured URL containing a query or
  fragment; call `fetch(url, { redirect: 'manual' })`; require status `200`;
  reject every `3xx`; require `response.url` to equal the normalized configured
  URI in scheme, host, port, and path; require `Cache-Control` to contain
  `no-store`; require the COOP header to be absent; require the exact route CSP
  `default-src 'none'; script-src 'self'; base-uri 'none';
  form-action 'none'; object-src 'none'; frame-ancestors 'self'`;
  and apply the same body checks;
- both modes: reject inline scripts/handlers, `<base>`, form, iframe, object,
  embed, meta refresh, external assets, and any script other than the single
  self-contained redirect chunk. Diagnostics redact query/fragment data and
  response bodies.

Add `verify:auth-redirect-bridge` to `package.json`.

- [ ] **Step 5: Run the local MSAL gate**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run type-check
npm run test:unit -- tests/unit/runtime/indexBootstrap.test.tsx `
  tests/unit/authentication/authConfig.test.ts `
  tests/unit/authentication/AuthenticatedElement.test.tsx `
  tests/unit/authentication/AccountProvider.dispatch.test.tsx `
  tests/unit/routes/staticPages.test.tsx `
  tests/unit/authentication/redirectBridge.test.ts `
  tests/unit/config/webpackConfig.test.ts `
  tests/unit/config/authRedirectBridgePolicy.test.ts `
  tests/unit/config/msalStagingHarnessPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts
npm run build
npm run verify:auth-redirect-bridge -- --dist dist
npm run test:e2e:app
npm audit --audit-level=low
npm ls --all
```

Expected: every local gate passes; only main assets appear in `index.html`; only
bridge assets appear in `redirect.html`; no MSAL 2 patch or peer conflict
remains.

- [ ] **Step 6: Commit the green repository cohort**

```powershell
git add package.json package-lock.json redirect.html `
  ClientApp/src/authentication/redirectBridge.ts `
  scripts/verify-auth-redirect-bridge.mjs `
  scripts/build-msal-staging-harness.mjs tests/e2e/staging/msalHarness.ts `
  tests/e2e/staging/msalRedirectBridge.staging.spec.ts `
  playwright.staging.config.ts `
  tests/unit/config/authRedirectBridgePolicy.test.ts `
  tests/unit/config/msalStagingHarnessPolicy.test.ts `
  tests/unit/authentication/redirectBridge.test.ts webpack.config.js `
  tests/unit/config/webpackConfig.test.ts ClientApp/src/index.tsx `
  ClientApp/src/authentication/authConfig.ts `
  ClientApp/src/authentication/AccountProvider.tsx `
  ClientApp/src/routes/sign-out/index.tsx `
  tests/unit/runtime/indexBootstrap.test.tsx `
  tests/unit/authentication/authConfig.test.ts `
  tests/unit/authentication/AccountProvider.dispatch.test.tsx `
  tests/unit/routes/staticPages.test.tsx `
  tests/unit/config/dependencySecurity.test.ts `
  ClientApp/src/authentication/Authentication.docs.mdx `
  patches/@azure+msal-react+2.2.0.patch
git commit -m "build: migrate authentication to msal 5"
```

### Task 6: Stage and Verify the MSAL External Rollout

#### External systems

- Entra B2C application registrations for each environment
- Hosting/CDN response-header policy for `/redirect.html`
- Staging deployment

- [ ] **Step 1: Preconfigure reversible external state**

The hosting owner adds a route-specific `/redirect.html` rule that returns `200`
directly, never rewrites or redirects, returns `Cache-Control: no-store`, omits
COOP, and sets
`Content-Security-Policy: default-src 'none'; script-src 'self';
base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'`.
Preserve only non-conflicting security headers; do not copy the portal's broader
analytics/telemetry CSP to the bridge. The Entra owner adds the new URI without
removing the old URI. Neither change switches application traffic yet.

- [ ] **Step 2: Verify the deployed bridge before switching auth configuration**

After deploying the build to staging, the hosting owner sets `AUTH_BRIDGE_URL`
to the exact URI already recorded in the PR. Run:

```powershell
if ([string]::IsNullOrWhiteSpace($env:AUTH_BRIDGE_URL)) { throw `
  'AUTH_BRIDGE_URL must equal the PR-recorded staging redirect URI' }
npm run verify:auth-redirect-bridge -- --url $env:AUTH_BRIDGE_URL
```

Expected: exit 0; status is exactly `200`; request and response URLs equal the
PR-recorded URI; there is no redirect, query, fragment, cache, COOP, CSP,
cross-origin asset, extra chunk, inline-code, active-element, main-app,
telemetry, or analytics violation. The command must redact URL query/fragment
data and response bodies from failures.

- [ ] **Step 3: Run the real staging authentication matrix**

Set the five required values through the secure staging runner; never print
them:

```powershell
$required = @(
  'AUTH_SMOKE_BASE_URL'
  'AUTH_BRIDGE_URL'
  'AUTH_SMOKE_USERNAME'
  'AUTH_SMOKE_PASSWORD'
  'AUTH_SMOKE_PROTECTED_API_URL'
)
$missing = $required | Where-Object { `
  [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_)) }
if ($missing) { throw "Missing staging inputs: $($missing -join ', ')" }
npm run test:e2e:staging:auth
```

The test logs into the real application, preserves the authenticated same-origin
session, serves the temporary harness only through Playwright route fulfillment,
and uses `CacheLookupPolicy.Skip` to force a `prompt=none` hidden-iframe
authorization rather than waiting 24 hours for a refresh token to expire. The
observer must prove an iframe navigation reached Entra and returned through the
exact `/redirect.html`; record only origin/path/status and boolean assertions,
with query/fragment/code/token/body redacted. The resolved access token stays
inside the harness and is used there for the recorded read-only protected API
request.

Record pass/fail evidence for:

1. unauthenticated protected-route visit reaches B2C;
2. login returns through `/redirect.html` to the initiating route;
3. deterministic `CacheLookupPolicy.Skip` completes the same
`acquireTokenSilent` hidden-iframe path MSAL uses after refresh-token expiry;
4. a protected API call succeeds with the renewed token;
5. `logoutRedirect` returns to the existing post-logout destination;
6. browser console and network logs contain no raw auth response or token.

Run the complete staging script three consecutive times in a fresh browser
context. Expected: 3/3 runs pass all six assertions, every protected API
response is the PR-recorded `2xx`, and there are zero raw-token/auth-response
disclosures or unhandled MSAL errors before production release approval.

- [ ] **Step 4: Execute the pre-recorded rollback plan during canary**

Reconfirm, without changing them during the release window, that the Task 0
release checklist contains the exact platform rollback operations, immutable
prior artifact, hashed runtime-config snapshot, old redirect value, canary
reversal operation, restoration verification steps, and named rollback
authority. Any drift or missing operation is a release blocker and returns the
plan to Task 0 before canary starts.

Canary using the Task 0 mechanism. For a traffic-split platform, use the
recorded percentage; for a slot platform, run against the inactive slot before
swap and keep the old slot warm. Observe for 30 minutes and run the complete
six-assertion staging/prod-safe synthetic at minute 0, 10, and 20. Approval
requires 3/3 synthetic passes, bridge verifier pass, every protected call at the
recorded `2xx`, zero token/auth-response disclosure, zero unhandled MSAL error
in the synthetic, and no production authentication failure-rate increase that
breaches the recorded canary threshold for five consecutive minutes.

Before canary starts, record the authoritative authentication metric, numerator,
denominator, minimum sample size, and minimum authentication-attempt count for
both the preceding 30-minute baseline and the canary window. Apply the
one-percentage-point or 2× baseline threshold only after both windows satisfy
that minimum sample. If the baseline is zero, the multiplier rule is disabled
and the absolute one-percentage-point rule remains active. If either window
cannot reach the minimum sample, missing or low-volume telemetry never counts as
success: zero-tolerance synthetic triggers still apply, and the named release
authority must extend or stop the canary rather than infer a pass.

Rollback immediately on any bridge-verifier failure, synthetic failure,
non-`2xx` protected response, raw credential/token/auth-response disclosure,
unhandled MSAL error, or failure-rate threshold breach. Stop/swap back the
canary; deploy the recorded prior artifact; restore the recorded config snapshot
and old redirect value; leave the new bridge route and both Entra URIs in place;
then run the prior-version login, silent token acquisition, protected API, and
logout smoke three consecutive times. The named rollback authority records
completion only after 3/3 restoration smokes pass. Remove the old URI only in a
separately reviewed cleanup after the rollback window.

No repository commit is created for external evidence.

### Task 7: Upgrade Application Insights Separately

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Create: `tests/unit/instrumentation/appInsightsPackageContract.test.ts`
- Create: `tests/e2e/staging/appInsightsTelemetry.staging.spec.ts`
- Create: `playwright.telemetry-staging.config.ts`
- Create: `tests/unit/config/telemetryStagingPolicy.test.ts`
- Inspect/modify if required:
  `ClientApp/src/instrumentation/AppInsightsService.ts`
- Test: `tests/unit/instrumentation/appInsightsService.test.ts`
- Test: `tests/unit/instrumentation/appLogger.test.ts`

- [ ] **Step 1: Write real-package and staging-policy contract tests**

Without mocking the package modules, import and construct `ReactPlugin` and
`ApplicationInsights` with a test configuration. Assert the plugin
identifier/extension wiring used by `AppInsightsService`; stub the network/load
boundary so the unit test sends no telemetry.

In `telemetryStagingPolicy.test.ts`, require that the staging verifier is opt-in
and absent from untrusted PR/release workflows; disables Playwright
trace/video/screenshot; uses only a non-production telemetry
connection/resource; emits a constant synthetic route name and constant
synthetic handled exception; and creates a cryptographically strong unique
per-run correlation identifier containing no account, auth, or user data. The
same identifier must tag the page view and handled exception for that run.
Record only event name, sanitized dimensions, timestamp, HTTP/status metadata
needed for verification, correlation identifier, and pass/fail assertions.
Reject logging or persistence of account identifiers, auth responses,
access/ID/refresh tokens, URL queries/fragments, request bodies, or telemetry
payload bodies. Require exactly three assertions: SDK initialization observed,
exactly one current-correlation synthetic page view observed, and exactly one
current-correlation handled exception observed. Define the polling interval and
bounded timeout in configuration; ignore events for other correlations and fail
on duplicate current-correlation events.

Expected RED command:

```powershell
npm run test:unit -- `
  tests/unit/instrumentation/appInsightsPackageContract.test.ts `
  tests/unit/config/telemetryStagingPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL until the target packages, staging verifier, and policy contract
are present.

- [ ] **Step 2: Apply exact telemetry targets**

Pin common/web `3.4.4`, React integration `18.3.6`, `history` `5.3.0`, and
`tslib` `2.8.1`. Adapt service code only when the real contract test or type
checker demonstrates an API change. Add `test:e2e:staging:telemetry` as the
single deterministic entry point for `playwright.telemetry-staging.config.ts`;
do not add it to untrusted PR CI.

- [ ] **Step 3: Verify telemetry independently and deterministically**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run type-check
npm run test:unit -- `
  tests/unit/instrumentation/appInsightsPackageContract.test.ts `
  tests/unit/instrumentation/appInsightsService.test.ts `
  tests/unit/instrumentation/appLogger.test.ts `
  tests/unit/runtime/indexBootstrap.test.tsx `
  tests/unit/config/telemetryStagingPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts
npm run build
npm audit --audit-level=low
npm ls --all
```

Expected: every local command passes.

For staging, require only the environment-specific inputs needed to open the
deployed non-production portal and identify the dedicated non-production
telemetry resource or approved intercepted transport. The staging test must
exercise the real built application and Application Insights integration,
generate a constant synthetic route/page view and a constant handled exception,
tag both with a new cryptographically strong per-run correlation identifier,
then poll or intercept the approved non-production telemetry boundary at the
configured interval until all three required observations are proven or the
bounded timeout expires. Events with another correlation are ignored. It must
fail nonzero on timeout, zero or multiple current-correlation page views,
zero or multiple current-correlation handled exceptions, ambiguous correlation,
production-resource detection, sanitization-policy violation, or any missing
assertion.

```powershell
$required = 'TELEMETRY_SMOKE_BASE_URL','TELEMETRY_SMOKE_RESOURCE'
$missing = $required | Where-Object { `
  [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_)) }
if ($missing) { throw `
  "Missing telemetry staging inputs: $($missing -join ', ')" }
npm run test:e2e:staging:telemetry
```

Expected: exit 0 only when **SDK initialization**, **exactly one synthetic page
view**, and **exactly one handled synthetic exception** are observed for the
current run correlation in the non-production resource/transport. Record only
event name, sanitized dimensions, timestamp, status metadata, correlation
identifier, and pass/fail. Do not persist request bodies, telemetry payload
bodies, account identifiers, auth material, URL query/fragment data, or tokens.
Ensure no production alert depends on the synthetic event. Run the staging
verifier three consecutive times in fresh browser contexts with a different
correlation identifier on every run; production release requires 3/3 passes.

- [ ] **Step 4: Commit the green telemetry cohort**

```powershell
git add package.json package-lock.json `
  tests/unit/instrumentation/appInsightsPackageContract.test.ts `
  tests/e2e/staging/appInsightsTelemetry.staging.spec.ts `
  playwright.telemetry-staging.config.ts `
  tests/unit/config/telemetryStagingPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  ClientApp/src/instrumentation/AppInsightsService.ts
git commit -m "build: upgrade application insights for react 18"
```

### Task 8: Upgrade User-Facing Runtime Libraries

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Inspect/modify if required:
  `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx`
- Inspect/modify if required: `ClientApp/src/components/ErrorBoundary/index.tsx`
- Inspect/modify if required: `ClientApp/src/analytics/GoogleAnalytics.tsx`
- Inspect/modify if required: `ClientApp/src/routes/common/helperFunctions.ts`
- Test: `ClientApp/src/App.tsx`

- [ ] **Step 1: Add exact version assertions and apply the cohort**

Pin date-fns `4.4.0`, react-datepicker `9.1.0`, react-error-boundary `6.1.6`,
react-ga4 `3.0.1`, and react-router `7.18.4`. Keep React/React DOM `18.3.1`
exact.

Run the dependency policy test before applying the pins. Expected: FAIL on the
old runtime versions. Commit the assertion changes only with the green cohort.

- [ ] **Step 2: Run date/timezone and UI regressions**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run type-check
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
npm run test:unit -- tests/unit/components/inputs/customDatePicker.test.tsx `
  tests/unit/components/inputs/datePickerWrapper.test.tsx `
  tests/unit/utils/dateOnly.test.ts
npm run test:unit -- tests/unit/components/errorBoundary.test.tsx `
  tests/unit/analytics/googleAnalytics.test.tsx `
  tests/unit/routes/common/helperFunctions.test.ts `
  tests/unit/e2e/routeCoverage.test.ts
npm run test:e2e:app
npm run build
npm audit --audit-level=low
npm ls --all
```

Expected: all commands pass; Australian timezone/date regressions, route
behavior, error recovery, and analytics calls remain stable. Make only changes
proven necessary by failures.

- [ ] **Step 3: Commit the green runtime cohort**

```powershell
git add package.json package-lock.json `
  tests/unit/config/dependencySecurity.test.ts `
  ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx `
  ClientApp/src/components/ErrorBoundary/index.tsx `
  ClientApp/src/analytics/GoogleAnalytics.tsx `
  ClientApp/src/routes/common/helperFunctions.ts
git commit -m "build: upgrade react 18 runtime dependencies"
```

### Task 9: Finish Tool Upgrades and Remove Overrides

#### Files

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Create: `scripts/check-dependency-outdated.mjs`
- Create: `tests/unit/config/dependencyOutdatedPolicy.test.ts`
- Modify: `tests/unit/config/dependencySecurity.test.ts`
- Delete: `patches/html-react-parser+6.1.4.patch`
- Create only if proved necessary: `patches/html-react-parser+6.1.8.patch`
- Test: `ClientApp/src/components/SlateEditor/SlateEditor.tsx`

- [ ] **Step 1: Add the final graph and outdated-policy tests**

Assert exact `@eslint-react/eslint-plugin` `5.20.8` and playwright-bdd `9.2.1`;
no `overrides` property; no lockfile `overridden` markers; no package with
nonempty `deprecated`; no removed tooling or SockJS; and only the exact outdated
tuples in this plan.

Unit-test the outdated comparator with matching, unexpected-package,
changed-current, changed-latest, malformed-output, and npm-command-failure
cases. The live CLI must treat npm's normal exit code 1 with valid JSON as a
report, not a process failure.

If the Task 0 baseline existing user-owned dependency `react-hook-form` `^7.89.0`,
its installed `7.89.0` entry is not an unexpected direct-package drift caused by
this migration. Preserve its range and require Task 0's refreshed registry
evidence to classify any `npm outdated` result explicitly. Do not add a wildcard
or date-based exception: any captured latest-version change still fails and
requires evidence refresh.

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/dependencyOutdatedPolicy.test.ts
```

Expected: FAIL because the comparator/script and final exact tool pins do not
exist yet and overrides are still present. Commit these tests only with the
green Task 9 cohort.

- [ ] **Step 2: Prove whether the parser patch is still required**

Delete the stale patch, reinstall cleanly, and run the focused SlateEditor test,
type-check, and production build before editing `node_modules`:

```powershell
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/components/SlateEditor/SlateEditor.test.tsx
npm run type-check
npm run build
```

If all pass, keep the patch deleted and change the policy test to require no
parser patch. If and only if the build/test reproduces the missing
default-export failure, apply the same minimal export-map change to installed
`html-react-parser@6.1.8`, generate `patches/html-react-parser+6.1.8.patch` with
the repository-pinned patch-package, and rerun the same commands. No unrelated
package file may appear in the patch.

- [ ] **Step 3: Apply final exact tool pins and delete overrides**

Pin the remaining tool targets, add `dependency:outdated` as
`node scripts/check-dependency-outdated.mjs`, and delete the complete
`overrides` property only now that all owners have been removed or upgraded.

- [ ] **Step 4: Regenerate and prove the natural graph**

```powershell
npm install --package-lock-only
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/dependencyOutdatedPolicy.test.ts `
  tests/unit/components/SlateEditor/SlateEditor.test.tsx
npm run dependency:outdated
npm audit --audit-level=low
npm ls --all
npm explain glob uuid sockjs unified-engine @mizchi/lsmcp
node -e `
  "const p=require('./package.json'); if('overrides' in p) process.exit(1)"
$lockCheck = @'
const l = require('./package-lock.json');
const bad = Object.entries(l.packages).filter(
  ([, v]) => v.overridden || v.deprecated
);
if (bad.length) {
  console.error(bad.map(([k, v]) => [k, v.overridden, v.deprecated]));
  process.exit(1);
}
'@
node -e $lockCheck
```

Expected: every command exits 0; the exact hold list is the only outdated
output; overrides, overridden markers, deprecated entries, SockJS,
unified-engine, and lsmcp are absent. Inspect the lockfile diff and explain
every remaining Glob/UUID parent.

- [ ] **Step 5: Commit the green natural graph**

```powershell
git add package.json package-lock.json scripts/check-dependency-outdated.mjs `
  tests/unit/config/dependencyOutdatedPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  patches/html-react-parser+6.1.4.patch
if (Test-Path -LiteralPath patches/html-react-parser+6.1.8.patch) { git add `
  patches/html-react-parser+6.1.8.patch }
git commit -m "build: remove dependency overrides"
```

### Task 10: Align CI and Documentation

#### Files

- Modify: `.github/workflows/pr.yml`
- Modify: `.github/workflows/release.yml`
- Inspect: `.github/workflows/chromatic.yml`
- Modify: `tests/unit/config/workflowPolicy.test.ts`
- Create: `docs/migration/msal-5-redirect-bridge-runbook.md`
- Modify: `docs/CONVENTIONS.md`
- Modify: `docs/STACK.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/INTEGRATIONS.md`
- Modify: `INIT.md`
- Modify: `skills/managing-github-actions/references/repository-ci-catalog.md`
- Modify:
  `.claude/skills/managing-github-actions/references/repository-ci-catalog.md`

- [ ] **Step 1: Add only the required CI checks**

Preserve the Task 1 checkout hardening and lifecycle inventory across PR,
release, and Chromatic workflows, plus canonical gate order, least-privilege
permissions, SHA pins, Corepack, and `npm ci`. In the PR and release build jobs,
run `npm run verify:auth-redirect-bridge -- --dist dist` immediately after
`npm run build`. Do not put staging credentials or URLs in PR workflows. Keep
exact-floor unit tests from Task 3.

Keep `workflowPolicy.test.ts` enumerating every checkout and clean-install step
in all three workflows and failing when a checkout omits
`persist-credentials: false`, permissions broaden, an install lacks the
immediate lifecycle inventory, or any dependency step receives a secret. Do not
rely on a string search that can pass because only one job is compliant.

- [ ] **Step 2: Write the operational runbook**

Document exact bridge path, direct-`200`/no-redirect rule, Entra registration
steps, per-environment URI equality, no-query/no-fragment rule, route-only CSP,
other header requirements, one-chunk same-origin/local-assets rule, prohibited
HTML features, static-title requirement, staging matrix, additive deployment
order, canary criteria, rollback, evidence redaction, and delayed old-URI
removal.

- [ ] **Step 3: Align repository and mirrored policy docs**

Record final exact pins, Node floor, no-overrides policy, MDX implementation,
lsmcp retirement, auth bridge, and commands. Apply identical CI catalog changes
to both copies and verify their SHA-256 hashes match.

- [ ] **Step 4: Verify policy and docs**

```powershell
npm run validate:json
npm run lint:mdx
npm run test:unit -- tests/unit/config/workflowPolicy.test.ts `
  tests/unit/config/dependencySecurity.test.ts `
  tests/unit/config/installScriptPolicy.test.ts `
  tests/unit/config/authRedirectBridgePolicy.test.ts
npm run lint:rules
$catalogs = @(
  'skills/managing-github-actions/references/repository-ci-catalog.md'
  '.claude/skills/managing-github-actions/references/repository-ci-catalog.md'
)
Get-FileHash -Algorithm SHA256 $catalogs
```

Expected: all commands pass and both catalog hashes are identical.

- [ ] **Step 5: Commit documentation and CI together**

```powershell
git add .github/workflows/pr.yml .github/workflows/release.yml `
  tests/unit/config/workflowPolicy.test.ts `
  docs/migration/msal-5-redirect-bridge-runbook.md docs/CONVENTIONS.md `
  docs/STACK.md docs/TESTING.md docs/INTEGRATIONS.md INIT.md `
  skills/managing-github-actions/references/repository-ci-catalog.md `
  .claude/skills/managing-github-actions/references/repository-ci-catalog.md
git commit -m "docs: record dependency and msal rollout policy"
```

### Task 11: Run the Complete Acceptance and Release Gate

#### Files

- Verify: every file changed by Tasks 1–10
- Inspect: `package.json`
- Inspect: `package-lock.json`
- Require externally: Task 6 staging evidence

- [ ] **Step 1: Verify the immutable constraints and exact targets**

```powershell
$manifestCheck = @'
const p = require('./package.json');
const ok = p.dependencies.react === '18.3.1'
  && p.dependencies['react-dom'] === '18.3.1'
  && p.devDependencies.typescript === '5.9.3'
  && !('overrides' in p);
if (!ok) process.exit(1);
'@
node -e $manifestCheck
npm run dependency:outdated
npm ls react react-dom typescript
```

Expected: every command exits 0 and the outdated report matches only the exact
compatibility-hold table.

- [ ] **Step 2: Run the canonical local gate in repository order**

```powershell
npm run validate:json
npm run type-check
npm run lint
npm run lint:mdx
npm run test:ci
npm run test:e2e
npm run build
npm run verify:auth-redirect-bridge -- --dist dist
npm run storybook:verify:docs
npm run test:api-contract
```

Expected: every command exits 0. Do not skip, weaken, reorder, or add
`continue-on-error` to required checks.

- [ ] **Step 3: Run final dependency integrity checks**

```powershell
npm ci --strict-peer-deps
npm run dependency:install-scripts
npm audit --audit-level=low
npm ls --all
$lockCheck = @'
const l = require('./package-lock.json');
const bad = Object.entries(l.packages).filter(
  ([, v]) => v.overridden || v.deprecated
);
if (bad.length) {
  console.error(bad.map(([k, v]) => [k, v.overridden, v.deprecated]));
  process.exit(1);
}
'@
node -e $lockCheck
```

Expected: strict install passes, audit reports zero vulnerabilities, the
dependency tree is valid, and the lockfile has no override/deprecation metadata.

- [ ] **Step 4: Require CI and external evidence**

Require all PR checks, especially exact-floor Node, unit, Storybook, build, E2E,
bridge artifact, Chromatic, and release-equivalent gates. Require Task 6's
deployed-header and six-scenario authentication evidence plus Task 7's
deterministic `test:e2e:staging:telemetry` evidence with 3/3 fresh-context
passes before production release approval.

- [ ] **Step 5: Perform final diff and rollback review**

Confirm every changed line maps to this plan, every cohort commit is green, no
generated reports/logs/debug dumps are tracked, and the old Entra URI remains
available for the documented rollback window. Corrections return to their owning
task and repeat its focused gate before the full gate is rerun.

## Safety, Rollback, and Verification

- Never overwrite or discard the user's existing manifest/lockfile changes.
  Implementation starts in an isolated worktree containing the exact preserved
  baseline.
- Never hand-edit lockfile resolution URLs, integrity hashes, dependency
  metadata, override markers, or deprecated flags; npm `11.19.1` owns the
  lockfile.
- Keep `packageManager`, the exact three-name `allowScripts` object, and root
  `postinstall: patch-package` unchanged. Do not use `--ignore-scripts`;
  patch-package and permitted builds must execute normally. After every clean
  install, the lifecycle inventory must prove no new owner ran and no configured
  owner was skipped.
- Exact pins prevent unreviewed direct drift. Every lockfile regeneration is
  followed by strict install, lifecycle inventory, audit, tree validation, and
  direct-diff inspection.
- Keep overrides until Task 9. A cohort failure reverts that cohort while the
  existing safety net remains; the final override-removal commit is accepted
  only when the natural graph is fully green.
- The MSAL rollback spans code and external systems: retain the old application
  artifact, hashed runtime-config snapshot and redirect value, header-policy
  revision, and old Entra URI through the canary window. Apply Task 6's explicit
  zero-tolerance synthetic triggers and rate threshold; never log or store auth
  responses while testing.
- A deployed bridge failing direct-`200`, exact-final-URL, restrictive-CSP,
  header, one-chunk, or document-isolation verification blocks release even if
  local CI is green.
- CI checkout credentials are never persisted into a worktree that executes
  package lifecycle scripts; PR and release permissions remain `contents: read`,
  and dependency steps receive no secrets.
- The accepted MSAL ADR owns the global iframe-navigation behavior. If
  product/security do not accept embedded interactive redirects as unsupported,
  stop and redesign the authentication integration rather than weakening the
  test expectation.
- Application Insights is isolated from MSAL so a telemetry failure cannot force
  an authentication rollback.
- If WDS 6 cannot pass, stop and fix/replace the owning toolchain; do not
  restore deprecated SockJS/UUID or claim completion with an override.
- If MDX parity fails, fix the programmatic script and tests; do not restore
  remark-cli/unified-engine.
- If the parser passes unpatched, remove the patch. If it fails, keep only the
  minimal reproducible `6.1.8` patch and its regression evidence.

## Plan Review

**Status:** Approved after remediation
**Score:** 98/100
**Critical Failures:** None
**Ready for Implementation:** Yes. Tasks 0–4 may proceed immediately. Task 5
starts only after Task 0 has an accepted ADR plus the exact external
prerequisites and executable rollback operations; Task 6 and production release
require secure environment execution and evidence. Task 7 production acceptance
requires the deterministic staging telemetry verifier to pass 3/3 fresh
contexts.

### Rubric Breakdown

- **Category:** Spec Coverage
  - **Score:** 15/15
  - **Notes:** React, TypeScript, Node, direct upgrades, overrides, auth,
    telemetry, tooling, CI, and docs are traced.

- **Category:** File and Ownership Clarity
  - **Score:** 10/10
  - **Notes:** Repository paths and external roles are explicit.

- **Category:** Task Granularity
  - **Score:** 8/8
  - **Notes:** Green cohort commits isolate tooling, build, auth, telemetry,
    runtime, graph, and docs.

- **Category:** TDD and Test Quality
  - **Score:** 15/15
  - **Notes:** Every behavior change has RED/GREEN steps, exact commands, and
    local or staging acceptance.

- **Category:** Implementation Specificity
  - **Score:** 10/10
  - **Notes:** MSAL APIs, config names, Webpack entries/chunks, bridge rules,
    and policy scripts are concrete.

- **Category:** Sequencing and Dependencies
  - **Score:** 10/10
  - **Notes:** Owners and safeguards precede auth; override owners precede
    deletion; external rollout is additive.

- **Category:** Safety, Rollback, and Verification
  - **Score:** 10/10
  - **Notes:** Dirty-tree preservation, clean installs, auth rollback, header
    checks, and full gates are explicit.

- **Category:** Developer Usability
  - **Score:** 9/10
  - **Notes:** Commands and outcomes are executable; external systems
    necessarily require their recorded owners.

- **Category:** Framework Fit
  - **Score:** 6/7
  - **Notes:** Migration and auth threat-boundary planning are proportionate; no
    unnecessary domain framework.

- **Category:** Minimality and YAGNI
  - **Score:** 5/5
  - **Notes:** New scripts/tests directly close review findings and enforce the
    requested outcome.

- **Category:** **Total**
  - **Score:** **98/100**
  - **Notes:** **Above the 96-point readiness threshold.**

## Final Devil's Advocate Verdict

The most likely failure mode is a locally green MSAL 5 build deployed before the
Entra URI and route-specific cache/COOP policy are correct. Tasks 0, 5, and 6
make that order impossible to approve: ownership and exact URIs are recorded
first, the bridge artifact is isolated and verified locally, external
configuration is additive, deployed headers and real auth flows are checked in
staging, and the old URI remains available for rollback.

## Execution Handoff

- Plan path:
  `docs/superpowers/plans/2026-09-27-repository-dependency-upgrade.md`
- Required human decisions: named product and security deciders must accept the
  MSAL bridge/global iframe-navigation ADR; Entra, hosting,
  staging-verification, and rollback owners must supply the exact environment
  operations and execute Task 6 before production release.
- Supported execution mode: `subagent-driven-development` for isolated green
  cohorts or `executing-plans` for serial execution, after `using-git-worktrees`
  preserves the current dirty baseline.
- Validation performed while revising this plan: repository/source inspection,
  live registry metadata, official MSAL/WDS documentation, live production
  header inspection, and Markdown formatting only. No dependency implementation,
  build, or application test has been run.
