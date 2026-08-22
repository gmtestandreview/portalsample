# Playwright-BDD v9 Migration

**Date:** 2026-06-10
**Purpose:** Remove the vulnerable older Playwright-BDD/Cucumber dependency path by upgrading Playwright-BDD from v8.5.1 to v9.x.

## Dependency Result

- `playwright-bdd`: `8.5.1` -> `9.0.0`
- `@playwright/test`: unchanged at `1.60.0`, satisfying Playwright-BDD v9 peer dependency `>=1.44`
- Node floor: `package.json` remains `>=20.0.0`
- Local validation Node: `v24.16.0`
- CI Node: GitHub Actions uses Node `22`

## Cucumber Dependency Result

Post-upgrade dependency tree:

```text
nmi-portal@0.1.0
`-- playwright-bdd@9.0.0
  +-- @cucumber/cucumber-expressions@19.0.0
  +-- @cucumber/gherkin@39.1.0
  +-- @cucumber/messages@32.3.1
  `-- @cucumber/tag-expressions@9.1.0
```

## Removed/Deprecated API Audit

- `enrichReporterData`: not present in active `playwright.config.ts`
- `junit-modern`: not present in active `playwright.config.ts`
- `cucumberReporter(...)`: not configured in this snapshot
- Cucumber JUnit `nameFormat`: not applicable because this snapshot uses Playwright HTML/list reporters
- Cucumber JSON `skipAttachments`: not applicable because no Cucumber JSON reporter is configured

## Script And CI Alignment

- `test:e2e`, `test:e2e:ui`, and `test:e2e:debug` now run `bddgen` before Playwright to avoid stale generated specs.
- `test:bdd` and `test:bdd:ui` remain equivalent BDD aliases.
- `.github/workflows/pr.yml` calls `npm run test:e2e`, so CI regenerates BDD specs before executing Playwright.

## Generated Output

- `npx bddgen` passes under Playwright-BDD v9.
- No step definition arity changes were required.
- `.features-gen` contains `25` generated spec files for `25` feature files.
- Playwright discovery reports `145` tests in `25` files.

## Validation

```text
node --version
v24.16.0

npm run type-check
PASS

npm run lint
PASS: 0 errors, 131 existing warnings

npm run test:unit
PASS: 38 files, 326 tests

npx bddgen
PASS

npx playwright test --list
PASS: 145 tests in 25 files

npm run test:e2e
PASS: 145 tests

npm audit --audit-level=high
PASS: high-severity gate exits 0
```

## Remaining Audit Notes

`npm audit --audit-level=high` exits successfully after the Playwright-BDD v9 upgrade. It still reports `5` moderate advisories unrelated to Playwright-BDD v9:

- `react-router` / `react-router-dom`: same-origin protocol-relative redirect advisory
- `uuid <11.1.1` via `sockjs` / `webpack-dev-server`

The old Cucumber dependency path was upgraded from:

- `@cucumber/messages@27.x`
- `@cucumber/gherkin@32.x`
- `@cucumber/cucumber-expressions@18.x`
- `@cucumber/tag-expressions@6.x`

to the v9-compatible tree listed above.

## Notes

- Existing Playwright HTML/list reports remain unchanged.
- No generated/vendor/captured application files were edited.
- This source-map snapshot is not a Git repository, so commit and `git diff` verification steps from the implementation plan were skipped.
