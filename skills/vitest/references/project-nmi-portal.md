# nmi-portal Vitest governance (repository-specific snapshot)

**Load only when** the current request is about the supplied `nmi-portal`
repository or matching verified configuration/scripts. These observations were
extracted from user-supplied source files on 2026-11-05; they are **not** global
Vitest recommendations. If the live repository differs, re-inspect it and treat
this snapshot as historical context. No complete repository or lockfile was
supplied.

## Ownership and suite selection

| Concern | Owner / configuration | Contract from supplied files |
| --- | --- | --- |
| Unit tests | `vitest.unit.config.ts`; `tests/unit/**/*.test.{ts,tsx}` | Vitest, `jsdom`, `pool: 'forks'`, `maxWorkers: 2`, 30,000 ms test timeout, `vitest.setup.ts`, globals on, CSS off |
| Storybook play-function tests | `vitest.storybook.config.ts` | `@storybook/addon-vitest/vitest-plugin` in **Vitest Browser Mode**; Chromium via `playwright({})` from `@vitest/browser-playwright`, single worker, 15,000 ms timeout, `vitest.storybook.setup.ts`, headless |
| Application BDD/E2E | `playwright.config.ts`, `tests/e2e/features/**` | Standalone `@playwright/test` + `playwright-bdd`, `app-bdd` project, one worker, app dev server; **not** Vitest |
| Storybook BDD/E2E | `playwright.storybook.config.ts`, `tests/e2e/features/storybook/**/*.feature` | Standalone `@playwright/test` + `playwright-bdd`, `storybook-bdd`, one worker, independent target resolution; **not** Vitest play-function tests |
| API-contract tests | `playwright.api.config.ts`, `tests/api-contract` | Standalone `@playwright/test`, `api-contract`; invocation is via a separate wrapper script |
| Quality regression | `quality/vitest.regression.config.ts` (path in package script, not supplied) | Vitest runner indicated by script; **details unavailable**, inspect file before proposing changes |

A Playwright **provider inside Vitest Browser Mode** does not make the test a
standalone Playwright E2E suite. Do not convert Storybook play-function tests
to BDD or vice versa merely because both use Chromium.

### Entrypoint and runtime constraints

- `vitest.config.ts` ordinarily lists two Vitest projects:
  `./vitest.unit.config.ts`, `./vitest.storybook.config.ts`.
- `VITEST_STORYBOOK === 'true'` selects the **Storybook leaf config directly**
  for the `@storybook/addon-vitest` child. The supplied comment reports
  ~48.8–55.7 seconds startup via the project indirection versus ~2.0–2.2 seconds
  directly, exceeding the addon's 30-second child startup limit. These are
  **source-comment historical measurements**, not benchmarks rerun here.
  Preserve this branch unless a measured replacement is authorized.
- The root config and both leaf configs set `watch: false`; `*:watch` scripts
  explicitly opt in. Persistent watch + coverage + Browser Mode is reported in
  the config comments to grow the Node heap; never turn watch on by default.
- `vitest.storybook.config.ts` has API `127.0.0.1:47005` (documented as below
  a Windows dynamic-port range), `optimizeDeps.include:
  ['msw-storybook-addon/preview']`, and React / React DOM deduplication.
  Preserve these local workarounds unless evidence justifies changing them.
- `vitest.storybook.runtime.ts` appends the JSON exclusion
  `ClientApp/src/**/*.json` to coverage and bridges `vitest.init` to bound
  `vitest.standalone` for this integration. Treat as **project-specific
  compatibility code**, not a general Vitest 5 API recipe.
- Unit setup assigns `VITE_ENV_FIXTURES.vitest`, uses jest-dom matchers and
  browser/DOM shims (including `matchMedia`, `scrollIntoView`, canvas context,
  `URL.createObjectURL`, and scrolling). Storybook setup uses its **separate**
  fixture set and `afterAll` cleanup; do not assume setups are interchangeable.
  The shared `runtime-env-fixtures` implementation was not supplied.
- The unit config deliberately customizes the snapshot format. Do not change it
  as collateral when editing unrelated unit settings.

## Coverage: do not generalize or weaken

**Unit** (`vitest.unit.config.ts`):

- V8; `reportsDirectory: ./reports/coverage/unit`.
- Explicit `include: ['ClientApp/src/**/*.{ts,tsx}', 'vite.config.mts']`
  includes eligible uncovered source. Never add removed `coverage.all`.
- Thresholds: **statements, branches, functions, and lines all 100%**.
- `reporter: ['text', 'html', 'json-summary', 'json', 'lcov']`. JSON supplies
  detailed statement/function/branch maps; `json-summary` supplies totals;
  LCOV is required by the documented SonarQube integration.
- `reportOnFailure: true` retains artifacts on failing unit tests. The source
  comment refers to an earlier **T1 exemption until Child Plan B1**, but its
  present approval/status is not evidenced here. Do **not** treat that comment
  as current permission to accept failures.
- Preserve the entire `exclude` list verbatim unless the task explicitly
  authorizes changing the coverage contract. It excludes, among other entries,
  `**/*.d.ts`, generated web API client, external/parent directories,
  Storybook/testing support, listed component areas, test/spec/story/docs
  files, and targeted type-only modules. Consult the **actual source** for
  the full glob list; this summary is intentionally not a substitute.

**Storybook** (`vitest.storybook.coverage.ts` plus runtime plugin):

- V8; output `./reports/coverage/storybook`; scope
  `ClientApp/src/**/*.{ts,tsx}` with its own exclusion list.
- Runtime plugin adds `ClientApp/src/**/*.json` exclusion to prevent remapping
  JSON imports as JavaScript. Do not remove or replace it with a generic
  all-files sweep.
- The supplied Storybook coverage object **does not define 100% thresholds**.
  Never copy unit thresholds, unit reportOnFailure, unit reporters, or unit
  exclusions to Storybook without an explicit, evidenced policy change.

## Script contracts (literal scripts from supplied package.json)

| Intent | Existing command |
| --- | --- |
| Unit once | `npm run test:unit` |
| Unit coverage | `npm run test:unit:coverage` |
| Unit watch | `npm run test:unit:watch` |
| Storybook play tests once | `npm run test:storybook` |
| Storybook coverage | `npm run test:storybook:coverage` |
| Storybook watch | `npm run test:storybook:watch` |
| Both Vitest leaves | `npm run test:all` — unit **then** Storybook (sequential `&&`) |
| Vitest quality regression | `npm run test:quality:regression` |
| CI scripts | `npm run test:ci` — type-check, unit coverage/JUnit, Storybook JUnit, quality JUnit in declared order |
| App BDD | `npm run test:e2e:app` (BDD generation then Playwright) |
| Storybook BDD | `npm run test:e2e:storybook` (BDD generation then Playwright) |
| API contract | `npm run test:api-contract` (wrapper script not supplied) |
| Browser E2E aggregate | `npm run test:e2e:browser` |
| All E2E aggregate | `npm run test:e2e` — browser E2E then Storybook *Vitest* coverage |

Vitest script implementations use
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs`
with `run --configLoader runner --config <leaf-config>`, except explicit
watch scripts. Preserve the 8192 MB heap and config-loader choice; do not
replace these with universal `npx vitest` examples. The project declares
Node `>=24.21.0`, Vitest and `@vitest/*` relevant direct packages `5.0.5`,
Storybook packages `10.6.5`, Playwright `1.64.1`, and Vite `^8.3.5` in the
provided manifest. A manifest is not proof of installed/resolved versions.

## Narrowest feasible validation by changed owner

1. Unit-test change: existing unit script with an actual known test filter/path
   if possible, then `npm run test:unit`. If coverage policy or source changed,
   run `npm run test:unit:coverage` and examine both report metrics and included
   file set, not only the test exit code.
2. Storybook play-function change: `npm run test:storybook`; if coverage is
   implicated, `npm run test:storybook:coverage` and check scope/exclusions.
3. Config / runner integration change: confirm the
   `VITEST_STORYBOOK` branch and both leaf scripts; verify child startup
   behavior with representative project tooling if available. Do not infer
   startup performance from comments.
4. Playwright-only BDD/API-contract changes: hand off to their **own scripts**;
   the Vitest skill should not direct the test itself.
5. Cross-suite or CI policy changes: inspect missing quality config and
   workflow files before claiming full `test:ci` acceptance. Use broader
   scripts only after the narrowest relevant checks.

State exactly which commands ran, result/exit code, coverage artifacts or
metrics inspected, and which checks are **not run / Needs Human Review**.

## Evidence not supplied

The full repository, actual tests, installed `node_modules`, lockfile,
`.storybook/storybook-test-target`, `runtime-env-fixtures`,
`quality/vitest.regression.config.ts`, API contract wrapper implementation,
and CI workflow were not provided with this skill revision. Do not infer
their implementation, contents, deployment status, or test results.
