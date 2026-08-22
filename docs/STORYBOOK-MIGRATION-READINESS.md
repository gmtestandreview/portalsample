# Storybook Migration Readiness

## Purpose

This document records the Storybook baseline that should exist before the portal
migration starts. The corresponding Storybook pages live under the `Migration`
section and are backed by a regression test so the inventory stays aligned with
the real source tree.

## Scope

The Storybook baseline covers:

- routes
- reusable components
- authentication structure
- validation schemas and Yup extensions
- assets and media

## Storybook Pages

| Storybook page | File |
| --- | --- |
| `Migration/Overview` | `ClientApp/src/storybook/MigrationReadiness.docs.mdx` |
| `Migration/Coverage Matrix` | `ClientApp/src/storybook/CoverageMatrix.docs.mdx` |
| `Migration/Routes` | `ClientApp/src/routes/RouteInventory.docs.mdx` |
| `Migration/Components` | `ClientApp/src/components/ComponentInventory.docs.mdx` |
| `Migration/Authentication` | `ClientApp/src/authentication/Authentication.docs.mdx` |
| `Migration/Validation` | `ClientApp/src/validationSchemas/ValidationSchemas.docs.mdx` |
| `Migration/Assets and Media` | `ClientApp/src/assets/AssetsAndMedia.docs.mdx` |

## Validation

Run these checks after changing Storybook migration inventory content:

```bash
npm run type-check
npm run test:unit -- tests/unit/storybook/coverageDrift.test.ts tests/unit/e2e/routeCoverage.test.ts
npm run test:storybook
npm run build-storybook
```

For Storybook BDD coverage updates, also run:

```bash
npx bddgen -c playwright.storybook.config.ts
npm run test:e2e:storybook
```

## Current Implementation Status

- Shared Storybook harnessing now exists for router, auth/MSAL, account context, modal context, and Formik-backed route steps.
- Shared UI coverage now includes both the high-priority migration families and the optional breadth pass, including `Header`, `Footer`, `Layout`, `Inputs`, `SearchFilter`, `Pagination`, `PaginationHeader`, `Pill`, `SteppedNavigation`, `SummaryDisplay`, `tiles`, `Welcome`, `Actions`, `BlockUISpinner`, visible `Utilities`, `Buttons`, and `Icons`.
- Major route families now have route stories for dashboard, home/get-started, help, auth entry/exit, account, contact, request-for-quote, accept-quote, quotation, measurement-report, success, and error flows.
- Pattern/type approval has isolated stories for the dashboard shell, pre-application, four wizard steps, instrument information panel, and the application details/documents/messages management tabs.
- The narrowed Storybook-complete goal from the coverage matrix is now satisfied, and the remaining work is polish depth rather than missing family-level breadth.
- Current inventory: 41 registered paths, 31 top-level component families, 87 story files, and 13 MDX docs files. The latest static Storybook index contains 315 entries: 218 stories and 97 docs entries.
- Storybook BDD now includes breadth and route/form coverage expansion through:
  - `tests/e2e/features/storybook/components/breadth.feature`
  - `tests/e2e/features/storybook/forms/forms-coverage.feature`
  - `tests/e2e/features/storybook/routes/routes-coverage.feature`
- The six pattern/type approval paths are reviewed `app-bdd` exclusions in `tests/e2e/route-coverage.ts`; Storybook documents their isolated rendering states until deterministic authenticated backend fixtures are added.

## Recent Hardening Notes

- Global Storybook routing now uses a data-router decorator (`createMemoryRouter` + `RouterProvider`) in `.storybook/preview.ts`.
- `withPortalProviders` in `ClientApp/src/storybook/storybookHarness.tsx` no longer wraps stories with `MemoryRouter`.
- Story-level `MemoryRouter` wrappers were removed from affected stories to avoid nested-router conflicts.
- Footer modal assertions now use page-level text checks when content is portal-rendered outside `#storybook-root`.

For the next Storybook plus Playwright-BDD execution approach, see `docs/PLAYWRIGHT-STORYBOOK-BDD-IMPROVEMENT-PLAN.md`.

## Notes

- The coverage matrix is the source of truth for what is still missing before the UI can be called Storybook-complete.
- This baseline now includes shared route harnessing and the narrowed Storybook-complete route/state set.
- API-heavy and redirect-heavy flows still benefit from broader MSW state coverage or structural documentation where full browser simulation is not practical.

Current release gate position: `CLOSED_SUCCESS` for the narrowed Storybook migration-readiness baseline in this workspace snapshot. **Scope caveat:** API-heavy flows still require application BDD or reviewed exclusions. In particular, the pattern/type approval stories are component-level evidence and do not prove the full authenticated workflow.

This Storybook-specific result does not clear the repository-wide unit-coverage gate. As of 2026-06-28, `npm run test:unit:coverage` fails the configured 100% thresholds and is tracked separately as Priority 1 `COVERAGE-GATE-001`.
